import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const useVideoUpload = () => {
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (file) => {
        if (file && file.type.startsWith("video/")) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
        } else {
            toast({
                variant: "destructive",
                title: "Format File Salah",
                description: "File harus berupa video",
            });
        }
    };

    const handleDrag = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(type === "enter" || type === "over");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileChange(file);
    };

    return {
        videoFile,
        videoUrl,
        dragActive,
        handleFileChange,
        handleDrag,
        handleDrop,
        setVideoFile
    };
};

const useSubtitleEditor = (initialSubtitles = []) => {
    const [subtitles, setSubtitles] = useState(initialSubtitles);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editText, setEditText] = useState("");
    const { toast } = useToast();

    const handleEditSubtitle = (index, text) => {
        setEditingIndex(index);
        setEditText(text);
    };

    const handleSaveEdit = () => {
        if (editingIndex !== null) {
            const newSubtitles = [...subtitles];
            newSubtitles[editingIndex].text = editText;
            setSubtitles(newSubtitles);
            setEditingIndex(null);
            setEditText("");
            toast({
                title: "Berhasil",
                description: "Subtitle berhasil diupdate",
            });
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditText("");
    };

    return {
        subtitles,
        setSubtitles,
        editingIndex,
        editText,
        setEditText,
        handleEditSubtitle,
        handleSaveEdit,
        handleCancelEdit
    };
};

const useVideoPlayer = (videoRef) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

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

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * duration;
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    return {
        currentTime,
        duration,
        isPlaying,
        setIsPlaying,
        togglePlayPause,
        handleTimeUpdate,
        handleLoadedMetadata,
        handleSeek
    };
};

const useVideoProcessing = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [results, setResults] = useState(null);
    const [progress, setProgress] = useState(0);
    const { toast } = useToast();

    const processVideo = async (videoFile, targetLanguage) => {
        setError("");
        setResults(null);
        setProgress(0);

        if (!targetLanguage) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Pilih bahasa tujuan terlebih dahulu",
            });
            return null;
        }

        if (!videoFile) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Pilih video terlebih dahulu",
            });
            return null;
        }

        setIsProcessing(true);

        try {
            // 1. Upload Video & Start Job
            const formData = new FormData();
            formData.append("video_file", videoFile);
            formData.append("target_language", targetLanguage);

            const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

            const response = await fetch(`${BASE_URL}/translate-video/`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Gagal memulai proses video");
            }

            const initData = await response.json();
            const jobId = initData.job_id;

            toast({
                title: "Upload Berhasil",
                description: "Video sedang diproses di background...",
            });

            // 2. Poll Status
            const pollInterval = 2000; // 2 seconds

            const checkStatus = async () => {
                const statusResponse = await fetch(`${BASE_URL}/translate-video/status/${jobId}`);

                if (!statusResponse.ok) {
                    throw new Error("Gagal mengecek status job");
                }

                const statusData = await statusResponse.json();

                // Update progress
                setProgress(statusData.progress || 0);

                if (statusData.status === "completed") {
                    setResults(statusData.result);
                    setIsProcessing(false);
                    setProgress(100);
                    toast({
                        title: "Selesai!",
                        description: "Video berhasil diproses.",
                    });
                    return statusData.result;
                } else if (statusData.status === "failed") {
                    throw new Error(statusData.error || "Proses gagal");
                } else {
                    // Still processing, wait and check again
                    return new Promise(resolve => setTimeout(() => resolve(checkStatus()), pollInterval));
                }
            };

            return await checkStatus();

        } catch (err) {
            const errorMsg = err.message || "Terjadi kesalahan saat memproses video";
            setError(errorMsg);
            toast({
                title: "Error Sistem",
                description: errorMsg,
                variant: "destructive",

            });
            setIsProcessing(false);
            setProgress(0);
            return null;
        }
    };

    return { isProcessing, error, results, progress, processVideo };
};

export { useVideoUpload, useSubtitleEditor, useVideoPlayer, useVideoProcessing };
