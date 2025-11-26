const timeToSeconds = (time) => {
  const [hours, minutes, seconds] = time.split(':');
  const [secs, millis] = seconds.split(',');
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs) + parseInt(millis) / 1000;
};

const secondsToTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
};

const parseSRT = (srtContent) => {
  if (!srtContent) return [];
  
  const blocks = srtContent.trim().split('\n\n');
  return blocks.map(block => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;
    
    const index = parseInt(lines[0]);
    const timecode = lines[1];
    const text = lines.slice(2).join('\n');
    const [start, end] = timecode.split(' --> ');
    
    return {
      index,
      start,
      end,
      startSeconds: timeToSeconds(start),
      endSeconds: timeToSeconds(end),
      text
    };
  }).filter(Boolean);
};

const generateSRT = (subtitles) => {
  return subtitles.map(sub => 
    `${sub.index}\n${sub.start} --> ${sub.end}\n${sub.text}`
  ).join('\n\n');
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};


export { parseSRT, generateSRT, formatFileSize, formatTime };