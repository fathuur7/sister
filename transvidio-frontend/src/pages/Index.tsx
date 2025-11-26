import { Navbar } from "@/components/Navbar";
import { UploadPanel } from "@/components/UploadPanel";
import { VideoReviewPanel } from "@/components/VideoReviewPanel";
import { TranslationPanel } from "@/components/TranslationPanel";
import { SubtitleStyle } from "@/components/SubtitleStylePanel";

import { useToast } from "@/components/ui/use-toast";
import { parseSRT, generateSRT } from "@/utils/fileUtils";
import { useState, useRef } from "react";
import { useVideoProcessing } from "@/hooks/use-vidio";

const Index = () => {
  const { processVideo, progress } = useVideoProcessing();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subtitles, setSubtitles] = useState([]);

  // Video player state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  // Subtitle style state
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontFamily: "Arial, sans-serif",
    fontSize: 24,
    textColor: "#FFFFFF",
    backgroundColor: "#000000",
    backgroundOpacity: 0.75,
    position: "bottom",
  });

  // Handle file change
  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  // Handle process
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

    try {
      const data = await processVideo(videoFile, selectedLanguage);

      if (data && data.translated_srt) {
        const parsed = parseSRT(data.translated_srt);
        setSubtitles(parsed);

        toast({
          title: "Berhasil",
          description: "Video berhasil diproses!",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Terjadi kesalahan saat memproses video",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownloadSrt = () => {
    try {
      const srtText = generateSRT(subtitles);
      const blob = new Blob([srtText], { type: "text/srt" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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

  // Handle subtitle update
  const handleSubtitleUpdate = (index: number, newText: string) => {
    const updatedSubtitles = subtitles.map((sub, i) =>
      i === index ? { ...sub, text: newText } : sub
    );
    setSubtitles(updatedSubtitles);

    toast({
      title: "Berhasil",
      description: "Subtitle berhasil diupdate",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-6 py-6">
        <div className="max-w-[1800px] mx-auto">
          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_350px] gap-6">
            {/* Left Column - Upload & Configure */}
            <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-6">
              <UploadPanel
                videoFile={videoFile}
                dragActive={dragActive}
                selectedLanguage={selectedLanguage}
                isProcessing={isProcessing}
                progress={progress}
                onFileChange={handleFileChange}
                onDrag={handleDrag}
                onDrop={handleDrop}
                onLanguageChange={setSelectedLanguage}
                onProcess={handleProcess}
              />
            </div>

            {/* Center Column - Video Review */}
            <div className="bg-card border border-border rounded-xl p-6">
              {videoUrl ? (
                <VideoReviewPanel
                  videoUrl={videoUrl}
                  subtitles={subtitles}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  duration={duration}
                  subtitleStyle={subtitleStyle}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTogglePlay={togglePlayPause}
                  onSeek={handleSeek}
                  videoRef={videoRef}
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <p>Upload a video to begin</p>
                </div>
              )}
            </div>

            {/* Right Column - Translation */}
            <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-6">
              <TranslationPanel
                subtitles={subtitles}
                currentTime={currentTime}
                selectedLanguage={selectedLanguage}
                subtitleStyle={subtitleStyle}
                onDownload={handleDownloadSrt}
                onSubtitleUpdate={handleSubtitleUpdate}
                onStyleChange={setSubtitleStyle}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-4 px-4">
        <div className="container mx-auto text-center text-xs text-muted-foreground">
          <p>© 2025 TransVidio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;