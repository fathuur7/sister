import { Download, Save } from "lucide-react";
import { useState } from "react";
import { SubtitleStylePanel, SubtitleStyle } from "@/components/SubtitleStylePanel";

interface Subtitle {
    index: number;
    startTime: string;
    endTime: string;
    startSeconds: number;
    endSeconds: number;
    text: string;
}

interface TranslationPanelProps {
    subtitles: Subtitle[];
    currentTime: number;
    selectedLanguage: string;
    subtitleStyle: SubtitleStyle;
    onDownload: () => void;
    onSubtitleUpdate: (index: number, newText: string) => void;
    onStyleChange: (style: SubtitleStyle) => void;
}

export const TranslationPanel = ({
    subtitles,
    currentTime,
    selectedLanguage,
    subtitleStyle,
    onDownload,
    onSubtitleUpdate,
    onStyleChange,
}: TranslationPanelProps) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState("");

    const getCurrentSubtitle = () => {
        return subtitles.find(
            (sub) => currentTime >= sub.startSeconds && currentTime <= sub.endSeconds
        );
    };

    const currentSubtitle = getCurrentSubtitle();

    const handleEdit = (index: number, text: string) => {
        setEditingIndex(index);
        setEditText(text);
    };

    const handleSave = () => {
        if (editingIndex !== null) {
            onSubtitleUpdate(editingIndex, editText);
        }
        setEditingIndex(null);
        setEditText("");
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white text-sm font-bold">
                    3
                </span>
                Translate
            </h2>

            {/* Source Text */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                        Source (Auto-detected)
                    </h3>
                </div>
                <div className="bg-muted border border-border rounded-lg p-4 min-h-[120px] max-h-[200px] overflow-y-auto">
                    {currentSubtitle ? (
                        <p className="text-sm text-foreground leading-relaxed">
                            {currentSubtitle.text}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            Select a subtitle from the timeline to view source text
                        </p>
                    )}
                </div>
            </div>

            {/* Translation Text */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                        Translation ({selectedLanguage ? selectedLanguage.toUpperCase() : "None"})
                    </h3>
                    <div className="flex items-center text-xs text-muted-foreground">
                        <span>
                            {currentSubtitle?.text.length || 0} / 500 characters
                        </span>
                    </div>
                </div>
                <textarea
                    value={currentSubtitle?.text || ""}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Translation will appear here..."
                    className="w-full bg-card border border-border rounded-lg p-4 min-h-[120px] max-h-[200px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                />
            </div>

            {/* Subtitle Styling Controls */}
            <SubtitleStylePanel
                style={subtitleStyle}
                onStyleChange={onStyleChange}
            />

            {/* All Translations List */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">All Segments</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subtitles.length > 0 ? (
                        subtitles.map((sub, index) => (
                            <div
                                key={sub.index}
                                className={`p-3 rounded-lg border transition-all ${currentTime >= sub.startSeconds && currentTime <= sub.endSeconds
                                    ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500"
                                    : "bg-muted border-border hover:border-yellow-500"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="text-xs font-mono text-muted-foreground">
                                        {sub.startTime}
                                    </span>
                                    <button
                                        onClick={() => handleEdit(index, sub.text)}
                                        className="text-xs text-yellow-600 hover:text-yellow-700 font-medium"
                                    >
                                        Edit
                                    </button>
                                </div>
                                {editingIndex === index ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full text-sm bg-card border border-border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                                            rows={2}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSave}
                                                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingIndex(null)}
                                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground text-xs rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-foreground">{sub.text}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8 italic">
                            No subtitles available yet. Upload and process a video to see translations.
                        </p>
                    )}
                </div>
            </div>

            {/* Download Button */}
            <button
                onClick={onDownload}
                disabled={subtitles.length === 0}
                className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
                <Download className="h-5 w-5" />
                <span>Download SRT</span>
            </button>
        </div>
    );
};
