import React from "react";
import { Play, Pause } from "lucide-react";
import { formatTime } from "@/utils/fileUtils";

export const VideoPlayer = ({ videoRef, videoUrl, currentSubtitle, playerProps }) => (
  <div className="relative bg-black rounded-xl overflow-hidden">
    <video
      ref={videoRef}
      src={videoUrl}
      className="w-full"
      onTimeUpdate={playerProps.handleTimeUpdate}
      onLoadedMetadata={playerProps.handleLoadedMetadata}
      onPlay={() => playerProps.setIsPlaying(true)}
      onPause={() => playerProps.setIsPlaying(false)}
    />
    
    {currentSubtitle && (
      <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4">
        <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-center max-w-3xl">
          {currentSubtitle.text}
        </div>
      </div>
    )}

    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
      <div 
        className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer"
        onClick={playerProps.handleSeek}
      >
        <div 
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${(playerProps.currentTime / playerProps.duration) * 100}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-white">
        <button
          onClick={playerProps.togglePlayPause}
          className="p-2 rounded-full transition hover:shadow-glow"
        >
          {playerProps.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>
        
        <span className="text-sm">
          {formatTime(playerProps.currentTime)} / {formatTime(playerProps.duration)}
        </span>
      </div>
    </div>
  </div>
);