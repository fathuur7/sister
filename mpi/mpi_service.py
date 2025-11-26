"""
MPI-based Parallel Video Translation Service
Distributes video processing across multiple nodes for faster processing
"""

from mpi4py import MPI
import os
import sys
import json
from typing import List, Dict, Any
from pathlib import Path


class MPITranslationService:
    """
    Parallel video translation using MPI
    Distributes video segments across workers for concurrent processing
    """
    
    def __init__(self):
        self.comm = MPI.COMM_WORLD
        self.rank = self.comm.Get_rank()
        self.size = self.comm.Get_size()
        self.is_master = (self.rank == 0)
        
        print(f"[Rank {self.rank}] MPI Process initialized ({self.rank + 1}/{self.size})")
    
    def split_video_into_chunks(self, video_path: str, num_chunks: int) -> List[Dict[str, Any]]:
        """
        Split video into time-based chunks for parallel processing
        
        Args:
            video_path: Path to video file
            num_chunks: Number of chunks to split into
            
        Returns:
            List of chunk metadata (start_time, end_time, chunk_id)
        """
        from moviepy.editor import VideoFileClip
        
        video = VideoFileClip(video_path)
        duration = video.duration
        video.close()
        
        chunk_duration = duration / num_chunks
        chunks = []
        
        for i in range(num_chunks):
            start_time = i * chunk_duration
            end_time = min((i + 1) * chunk_duration, duration)
            
            chunks.append({
                'chunk_id': i,
                'start_time': start_time,
                'end_time': end_time,
                'video_path': video_path
            })
        
        return chunks
    
    def process_chunk(self, chunk: Dict[str, Any], whisper_model, target_language: str = None) -> Dict[str, Any]:
        """
        Process a single video chunk (transcription + translation)
        
        Args:
            chunk: Chunk metadata
            whisper_model: Whisper model instance
            target_language: Target language for translation
            
        Returns:
            Processed chunk with transcription and translation
        """
        from faster_whisper import WhisperModel
        from deep_translator import GoogleTranslator
        import subprocess
        
        chunk_id = chunk['chunk_id']
        start_time = chunk['start_time']
        end_time = chunk['end_time']
        video_path = chunk['video_path']
        
        print(f"[Rank {self.rank}] Processing chunk {chunk_id} ({start_time:.2f}s - {end_time:.2f}s)")
        
        # Extract audio chunk
        workspace = Path("/mpi/workspace")
        workspace.mkdir(parents=True, exist_ok=True)
        
        audio_chunk_path = workspace / f"chunk_{chunk_id}_rank_{self.rank}.wav"
        
        # Use ffmpeg to extract audio segment
        cmd = [
            'ffmpeg', '-i', video_path,
            '-ss', str(start_time),
            '-to', str(end_time),
            '-vn', '-acodec', 'pcm_s16le',
            '-ar', '16000', '-ac', '1',
            '-y', str(audio_chunk_path)
        ]
        
        subprocess.run(cmd, capture_output=True, check=True)
        
        # Transcribe audio chunk
        segments, info = whisper_model.transcribe(str(audio_chunk_path), beam_size=5)
        
        transcriptions = []
        for segment in segments:
            text = segment.text.strip()
            
            # Translate if target language specified
            translated_text = None
            if target_language:
                try:
                    translator = GoogleTranslator(source='auto', target=target_language)
                    translated_text = translator.translate(text)
                except Exception as e:
                    print(f"[Rank {self.rank}] Translation error: {e}")
                    translated_text = text
            
            transcriptions.append({
                'start': segment.start + start_time,  # Adjust to absolute time
                'end': segment.end + start_time,
                'text': text,
                'translated_text': translated_text
            })
        
        # Cleanup temporary audio file
        if audio_chunk_path.exists():
            audio_chunk_path.unlink()
        
        print(f"[Rank {self.rank}] Chunk {chunk_id} completed: {len(transcriptions)} segments")
        
        return {
            'chunk_id': chunk_id,
            'transcriptions': transcriptions,
            'language': info.language if hasattr(info, 'language') else 'unknown'
        }
    
    def parallel_process_video(self, video_path: str, target_language: str = None, 
                               whisper_model_name: str = "base") -> Dict[str, Any]:
        """
        Main method: Process video in parallel across all MPI workers
        
        Args:
            video_path: Path to video file
            target_language: Target language for translation
            whisper_model_name: Whisper model size
            
        Returns:
            Complete processing results
        """
        from faster_whisper import WhisperModel
        
        # Master distributes work
        if self.is_master:
            print(f"\n{'='*60}")
            print(f"MPI Parallel Video Processing")
            print(f"Workers: {self.size}")
            print(f"Video: {video_path}")
            print(f"Target Language: {target_language}")
            print(f"{'='*60}\n")
            
            # Split video into chunks (one per worker)
            chunks = self.split_video_into_chunks(video_path, self.size)
            print(f"[Master] Video split into {len(chunks)} chunks")
        else:
            chunks = None
        
        # Scatter chunks to all workers
        chunk = self.comm.scatter(chunks, root=0)
        
        # Each worker loads its own Whisper model
        print(f"[Rank {self.rank}] Loading Whisper model '{whisper_model_name}'...")
        whisper_model = WhisperModel(whisper_model_name, device="cpu", compute_type="int8")
        
        # Process assigned chunk
        result = self.process_chunk(chunk, whisper_model, target_language)
        
        # Gather results back to master
        all_results = self.comm.gather(result, root=0)
        
        # Master aggregates results
        if self.is_master:
            print(f"\n[Master] All chunks processed. Aggregating results...")
            
            # Sort by chunk_id and merge transcriptions
            all_results.sort(key=lambda x: x['chunk_id'])
            
            all_transcriptions = []
            for chunk_result in all_results:
                all_transcriptions.extend(chunk_result['transcriptions'])
            
            # Sort by start time
            all_transcriptions.sort(key=lambda x: x['start'])
            
            print(f"[Master] Total segments: {len(all_transcriptions)}")
            print(f"{'='*60}\n")
            
            return {
                'transcriptions': all_transcriptions,
                'language': all_results[0]['language'] if all_results else 'unknown',
                'total_segments': len(all_transcriptions),
                'workers_used': self.size
            }
        
        return None


def main():
    """
    Example usage of MPI Translation Service
    Run with: mpirun -np 3 -hostfile /etc/mpi/hostfile python mpi_service.py <video_path> <target_lang>
    """
    service = MPITranslationService()
    
    if service.is_master:
        if len(sys.argv) < 2:
            print("Usage: mpirun -np <num_workers> python mpi_service.py <video_path> [target_language]")
            sys.exit(1)
        
        video_path = sys.argv[1]
        target_language = sys.argv[2] if len(sys.argv) > 2 else None
        
        result = service.parallel_process_video(video_path, target_language)
        
        if result:
            # Save results
            output_path = Path("/mpi/workspace") / "mpi_result.json"
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            print(f"Results saved to: {output_path}")
    else:
        # Workers execute their part
        service.parallel_process_video(
            sys.argv[1] if len(sys.argv) > 1 else None,
            sys.argv[2] if len(sys.argv) > 2 else None
        )


if __name__ == "__main__":
    main()
