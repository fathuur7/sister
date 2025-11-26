import { Upload } from "lucide-react";
import { FileUploadZone } from "./FileUploadZone";

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "id", name: "Indonesian" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
];

interface UploadPanelProps {
    videoFile: File | null;
    dragActive: boolean;
    selectedLanguage: string;
    isProcessing: boolean;
    progress: number;
    onFileChange: (file: File) => void;
    onDrag: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onLanguageChange: (language: string) => void;
    onProcess: () => void;
}

export const UploadPanel = ({
    videoFile,
    dragActive,
    selectedLanguage,
    isProcessing,
    progress,
    onFileChange,
    onDrag,
    onDrop,
    onLanguageChange,
    onProcess,
}: UploadPanelProps) => {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold">
                    1
                </span>
                Upload & Configure
            </h2>

            {/* File Upload */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Video File</label>
                <FileUploadZone
                    onFileChange={onFileChange}
                    onDrag={onDrag}
                    onDrop={onDrop}
                    dragActive={dragActive}
                    videoFile={videoFile}
                />
                {videoFile && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Selected: {videoFile.name}
                    </p>
                )}
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
                <label
                    htmlFor="language-select"
                    className="text-sm font-semibold text-foreground"
                >
                    Target Language
                </label>
                <select
                    id="language-select"
                    value={selectedLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value="">Select language...</option>
                    {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Process Button */}
            <button
                onClick={onProcess}
                disabled={!videoFile || !selectedLanguage || isProcessing}
                className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
                <Upload className="h-5 w-5" />
                <span>{isProcessing ? "Processing..." : "Process Video"}</span>
            </button>

            {/* Progress Bar */}
            {isProcessing && (
                <div className="space-y-2">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                        {progress}% complete
                    </p>
                </div>
            )}
        </div>
    );
};
