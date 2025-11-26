import React from "react";
import { Upload, FileVideo, CheckCircle2 } from "lucide-react";
import { formatFileSize } from "@/utils/fileUtils";

export const FileUploadZone = ({ videoFile, dragActive, onFileChange, onDrag, onDrop }) => (
  <div
    onDragEnter={(e) => onDrag(e, "enter")}
    onDragLeave={(e) => onDrag(e, "leave")}
    onDragOver={(e) => onDrag(e, "over")}
    onDrop={onDrop}
    className={`relative border-2 border-dashed rounded-xl transition-all ${
      dragActive
        ? "border-ring bg-card/60"
        : "border-border dark:border-border hover:border-ring"
    }`}>
    <input
      type="file"
      accept="video/*"
      onChange={(e) => onFileChange(e.target.files?.[0])}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    />
    
    {!videoFile ? (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-card/40 flex items-center justify-center mb-4">
          <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-ring" />
        </div>
        <p className="text-sm sm:text-base font-medium text-card-foreground mb-1 text-center">
          Drag & drop video atau klik untuk browse
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          MP4, MOV, AVI, WebM (Max 500MB)
        </p>
      </div>
    ) : (
      <div className="flex items-center space-x-3 sm:space-x-4 py-4 sm:py-6 px-4 sm:px-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-card/30 flex items-center justify-center flex-shrink-0">
          <FileVideo className="h-6 w-6 sm:h-7 sm:w-7 text-ring" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium text-card-foreground truncate">
            {videoFile.name}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {formatFileSize(videoFile.size)}
          </p>
        </div>
        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
      </div>
    )}
  </div>
);