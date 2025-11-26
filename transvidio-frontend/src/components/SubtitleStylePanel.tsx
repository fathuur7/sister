import { Type, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface SubtitleStyle {
    fontFamily: string;
    fontSize: number;
    textColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    position: 'top' | 'bottom';
}

interface SubtitleStylePanelProps {
    style: SubtitleStyle;
    onStyleChange: (style: SubtitleStyle) => void;
}

const FONT_FAMILIES = [
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Courier", value: "Courier New, monospace" },
    { name: "Times New Roman", value: "Times New Roman, serif" },
    { name: "Comic Sans", value: "Comic Sans MS, cursive" },
    { name: "Impact", value: "Impact, fantasy" },
    { name: "Verdana", value: "Verdana, sans-serif" },
];

export const SubtitleStylePanel = ({ style, onStyleChange }: SubtitleStylePanelProps) => {
    const updateStyle = (updates: Partial<SubtitleStyle>) => {
        onStyleChange({ ...style, ...updates });
    };

    return (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
                <Palette className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Subtitle Styling</h3>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
                <Label htmlFor="font-family-select" className="text-xs">Font Family</Label>
                <Select value={style.fontFamily} onValueChange={(value) => updateStyle({ fontFamily: value })}>
                    <SelectTrigger id="font-family-select" className="h-9" aria-label="Select font family">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                                <span style={{ fontFamily: font.value }}>{font.name}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Font Size</Label>
                    <span className="text-xs text-muted-foreground">{style.fontSize}px</span>
                </div>
                <Slider
                    value={[style.fontSize]}
                    onValueChange={([value]) => updateStyle({ fontSize: value })}
                    min={12}
                    max={48}
                    step={1}
                    className="w-full"
                    aria-label="Font size"
                />
            </div>

            {/* Text Color */}
            <div className="space-y-2">
                <Label className="text-xs">Text Color</Label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={style.textColor}
                        onChange={(e) => updateStyle({ textColor: e.target.value })}
                        className="w-12 h-9 rounded border border-border cursor-pointer"
                        aria-label="Text color picker"
                    />
                    <input
                        type="text"
                        value={style.textColor}
                        onChange={(e) => updateStyle({ textColor: e.target.value })}
                        className="flex-1 h-9 px-3 bg-card border border-border rounded text-xs font-mono"
                        placeholder="#FFFFFF"
                        aria-label="Text color hex code"
                    />
                </div>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
                <Label className="text-xs">Background Color</Label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={style.backgroundColor}
                        onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                        className="w-12 h-9 rounded border border-border cursor-pointer"
                        aria-label="Background color picker"
                    />
                    <input
                        type="text"
                        value={style.backgroundColor}
                        onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                        className="flex-1 h-9 px-3 bg-card border border-border rounded text-xs font-mono"
                        placeholder="#000000"
                        aria-label="Background color hex code"
                    />
                </div>
            </div>

            {/* Background Opacity */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Background Opacity</Label>
                    <span className="text-xs text-muted-foreground">{Math.round(style.backgroundOpacity * 100)}%</span>
                </div>
                <Slider
                    value={[style.backgroundOpacity * 100]}
                    onValueChange={([value]) => updateStyle({ backgroundOpacity: value / 100 })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                    aria-label="Background opacity"
                />
            </div>

            {/* Position */}
            <div className="space-y-2">
                <Label className="text-xs">Position</Label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => updateStyle({ position: 'top' })}
                        className={`px-3 py-2 rounded text-xs font-medium transition-all ${style.position === 'top'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border hover:bg-accent'
                            }`}
                    >
                        Top
                    </button>
                    <button
                        onClick={() => updateStyle({ position: 'bottom' })}
                        className={`px-3 py-2 rounded text-xs font-medium transition-all ${style.position === 'bottom'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border hover:bg-accent'
                            }`}
                    >
                        Bottom
                    </button>
                </div>
            </div>
        </div>
    );
};
