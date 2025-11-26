import React, { useRef, useState, lazy, Suspense } from "react";
import { Play, X, Lock, ExternalLink, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LANGUAGES } from "@/constants/languages";
import { FileUploadZone } from "@/components/FileUploadZone";
import useAuth from "@/hooks/use-auth";
import { useVideoProcessing } from "@/hooks/use-vidio";
import { parseSRT, generateSRT } from "@/utils/fileUtils";

// Lazy load komponen berat
const VideoPlayer = lazy(() =>
  import("@/components/VideoPlayer").then((mod) => ({
    default: ((mod as any).default ?? (mod as any).VideoPlayer) as any,
  }))
);
const SubtitleList = lazy(() =>
  import("@/components/SubtitleList").then((mod) => ({
    default: ((mod as any).default ?? (mod as any).SubtitleList) as any,
  }))
);

const LazyVideoPlayer: any = VideoPlayer as any;
const LazySubtitleList: any = SubtitleList as any;

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    <span className="ml-3 text-card-foreground">Memuat komponen...</span>
  </div>
);

// Simple Button component
const SimpleButton = ({ onClick, variant, size, children, className = "" }) => {
  const baseClass = "px-4 py-2 rounded-lg font-medium transition-all";
  const variantClass = variant === "outline"
    ? "border border-border bg-transparent hover:bg-accent"
    : "bg-primary text-primary-foreground hover:bg-primary/90";

  return (
    <button
      onClick={onClick}
      className={`${baseClass} ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
};

export default function VideoUploadForm() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { processVideo } = useVideoProcessing();
  const videoRef = useRef(null);

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Video upload state
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Subtitle state
  const [subtitles, setSubtitles] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Cloudinary URLs state - TAMBAHAN BARU
  const [cloudinaryUrls, setCloudinaryUrls] = useState({
    video: null,
    srtOriginal: null,
    srtTranslated: null
  });

  // Video player state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  // Video player handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  // Handle file change
  const handleFileChange = (file) => {
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setError(null);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setError(null);
    }
  };

  // Handle process - UPDATED dengan Cloudinary URLs
  const handleProcess = async () => {
    if (!videoFile) {
      toast({
        title: "Video Belum Dipilih",
        description: "Silakan pilih video terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLanguage) {
      toast({
        title: "Bahasa Belum Dipilih",
        description: "Silakan pilih bahasa tujuan terjemahan",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = await processVideo(videoFile, selectedLanguage);

      if (data && data.translated_srt) {
        const parsed = parseSRT(data.translated_srt);
        setSubtitles(parsed);

        // Simpan Cloudinary URLs - TAMBAHAN BARU
        setCloudinaryUrls({
          video: data.cloudinary_video_url,
          srtOriginal: data.cloudinary_srt_original_url,
          srtTranslated: data.cloudinary_srt_translated_url
        });

        setShowPreview(true);

        toast({
          title: "Berhasil",
          description: "Video berhasil diproses dan diupload ke cloud!",
        });
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memproses video");
      toast({
        title: "Error",
        description: err.message || "Terjadi kesalahan saat memproses video",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSrt = () => {
    try {
      const srtText = generateSRT(subtitles);
      const blob = new Blob([srtText], { type: 'text/srt' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subtitle_${selectedLanguage}.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "File SRT berhasil diunduh",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Gagal mengunduh file SRT",
        variant: "destructive",
      });
    }
  };

  // TAMBAHAN: Handler untuk download dari Cloudinary
  const handleDownloadFromCloudinary = (url, filename) => {
    if (!url) {
      toast({
        title: "Error",
        description: "URL tidak tersedia",
        variant: "destructive",
      });
      return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Berhasil",
      description: "File berhasil diunduh dari cloud",
    });
  };

  const getCurrentSubtitle = () => {
    return subtitles.find(
      sub => currentTime >= sub.startSeconds && currentTime <= sub.endSeconds
    );
  };

  // Subtitle editor handlers
  const handleEditSubtitle = (index) => {
    setEditingIndex(index);
    setEditText(subtitles[index].text);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updated = [...subtitles];
      updated[editingIndex].text = editText;
      setSubtitles(updated);
      setEditingIndex(null);
      setEditText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText("");
  };

  // Player props
  const playerProps = {
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    duration,
    handleTimeUpdate,
    handleLoadedMetadata,
    togglePlayPause,
    handleSeek
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-3 text-card-foreground">Memuat...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-card dark:bg-card rounded-2xl shadow-xl border border-border dark:border-border overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {!showPreview ? (
            <>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-card-foreground">
                  Pilih Video
                </label>
                <FileUploadZone
                  videoFile={videoFile}
                  dragActive={dragActive}
                  onFileChange={handleFileChange}
                  onDrag={handleDrag}
                  onDrop={handleDrop}
                />
              </div>

              <div className="space-y-4">
                <label htmlFor="target-language" className="block text-sm font-medium text-card-foreground">
                  Bahasa Tujuan
                </label>
                <select
                  id="target-language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base border border-border dark:border-border rounded-xl bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                >
                  <option value="">Pilih bahasa terjemahan</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleProcess}
                disabled={isProcessing || !videoFile || !selectedLanguage}
                className="w-full px-4 py-3 sm:py-4 bg-yellow-500 dark:bg-yellow-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-yellow-600 dark:hover:bg-yellow-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="text-gray-900 dark:text-white">
                      Proses Video
                    </span>
                  </>
                )}
              </button>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm sm:text-base p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  {error}
                </div>
              )}
            </>
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-card-foreground">
                    Preview & Edit Subtitle
                  </h2>
                  <SimpleButton
                    onClick={() => setShowPreview(false)}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Kembali
                  </SimpleButton>
                </div>

                {/* TAMBAHAN BARU: Cloudinary URLs Panel
                {(cloudinaryUrls.video || cloudinaryUrls.srtOriginal || cloudinaryUrls.srtTranslated) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      File Tersimpan di Cloud
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      {cloudinaryUrls.video && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2">
                          <span className="text-card-foreground">Video Original</span>
                          <button
                            onClick={() => handleDownloadFromCloudinary(cloudinaryUrls.video, 'video_original.mp4')}
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </button>
                        </div>
                      )}
                      
                      {cloudinaryUrls.srtOriginal && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2">
                          <span className="text-card-foreground">Subtitle Original</span>
                          <button
                            onClick={() => handleDownloadFromCloudinary(cloudinaryUrls.srtOriginal, 'subtitle_original.srt')}
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </button>
                        </div>
                      )}
                      
                      {cloudinaryUrls.srtTranslated && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2">
                          <span className="text-card-foreground">Subtitle Terjemahan ({selectedLanguage.toUpperCase()})</span>
                          <button
                            onClick={() => handleDownloadFromCloudinary(cloudinaryUrls.srtTranslated, `subtitle_${selectedLanguage}.srt`)}
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )} */}

                <LazyVideoPlayer
                  videoRef={videoRef}
                  videoUrl={videoUrl}
                  currentSubtitle={getCurrentSubtitle()}
                  playerProps={playerProps}
                />

                <LazySubtitleList
                  subtitles={subtitles}
                  currentTime={currentTime}
                  editingIndex={editingIndex}
                  editText={editText}
                  setEditText={setEditText}
                  onEdit={handleEditSubtitle}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  onDownload={handleDownloadSrt}
                />
              </div>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}