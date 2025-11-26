import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";
import { formatTime } from "@/utils/fileUtils";
import { SubtitleStyle } from "@/components/SubtitleStylePanel";

interface Subtitle {
    index: number;
    startTime: string;
    endTime: string;
    startSeconds: number;
    endSeconds: number;
    text: string;
}

interface VideoReviewPanelProps {
    videoUrl: string;
    subtitles: Subtitle[];
    currentTime: number;
    isPlaying: boolean;
    duration: number;
    subtitleStyle: SubtitleStyle;
    onTimeUpdate: () => void;
    onLoadedMetadata: () => void;
    onTogglePlay: () => void;
    onSeek: (time: number) => void;
    videoRef: React.RefObject<HTMLVideoElement>;
}

export const VideoReviewPanel = ({
    videoUrl,
    subtitles,
    currentTime,
    isPlaying,
    duration,
    subtitleStyle,
    onTimeUpdate,
    onLoadedMetadata,
    onTogglePlay,
    onSeek,
    videoRef,
}: VideoReviewPanelProps) => {
    const getCurrentSubtitle = () => {
        return subtitles.find(
            (sub) => currentTime >= sub.startSeconds && currentTime <= sub.endSeconds
        );
    };

    const currentSubtitle = getCurrentSubtitle();

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        onSeek(pos * duration);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold">
                    2
                </span>
                Review
            </h2>

            <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full"
                    onTimeUpdate={onTimeUpdate}
                    onLoadedMetadata={onLoadedMetadata}
                    onPlay={() => { }}
                    onPause={() => { }}
                />

                {/* Subtitle overlay */}
                {currentSubtitle && (
                    <div
                        className={`absolute left-0 right-0 flex justify-center px-4 ${subtitleStyle.position === 'top' ? 'top-20' : 'bottom-20'
                            }`}
                    >
                        <div
                            className="px-4 py-2 rounded-lg text-center max-w-3xl"
                            style={{
                                fontFamily: subtitleStyle.fontFamily,
                                fontSize: `${subtitleStyle.fontSize}px`,
                                color: subtitleStyle.textColor,
                                backgroundColor: `${subtitleStyle.backgroundColor}${Math.round(subtitleStyle.backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
                            }}
                        >
                            {currentSubtitle.text}
                        </div>
                    </div>
                )}

                {/* Video controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    {/* Progress bar */}
                    <div
                        className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onTogglePlay}
                                className="p-2 rounded-full transition hover:bg-white/20"
                                aria-label={isPlaying ? "Pause video" : "Play video"}
                            >
                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onSeek(Math.max(0, currentTime - 5))}
                                    className="p-2 rounded-full transition hover:bg-white/20 text-white/90 hover:text-white"
                                    title="Rewind 5s"
                                    aria-label="Rewind 5 seconds"
                                >
                                    <RotateCcw className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => onSeek(Math.min(duration, currentTime + 5))}
                                    className="p-2 rounded-full transition hover:bg-white/20 text-white/90 hover:text-white"
                                    title="Forward 5s"
                                    aria-label="Forward 5 seconds"
                                >
                                    <RotateCw className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <span className="text-sm font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Subtitle List */}
            {subtitles.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Subtitle Timeline</h3>
                    <div className="max-h-64 overflow-y-auto space-y-1 p-3 bg-muted/30 rounded-lg border border-border">
                        {subtitles.map((subtitle) => {
                            const isActive = currentTime >= subtitle.startSeconds && currentTime <= subtitle.endSeconds;
                            return (
                                <div
                                    key={subtitle.index}
                                    onClick={() => onSeek(subtitle.startSeconds)}
                                    className={`p-3 rounded-md cursor-pointer transition-all ${isActive
                                        ? "bg-blue-500 text-white shadow-md"
                                        : "bg-card hover:bg-accent border border-border"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className={`text-xs font-mono ${isActive ? "text-white" : "text-muted-foreground"}`}>
                                            {subtitle.startTime} → {subtitle.endTime}
                                        </span>
                                        <span className={`text-xs ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                                            #{subtitle.index}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${isActive ? "text-white font-medium" : "text-foreground"}`}>
                                        {subtitle.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        Click any subtitle to jump to that moment
                    </p>
                </div>
            )}
        </div>
    );
};
