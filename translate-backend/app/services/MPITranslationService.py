"""
MPI-Enabled Translation Service
Integrates MPI parallel processing with existing translation service
"""

import os
import subprocess
import json
from typing import Optional, Dict, Any
from pathlib import Path


class MPITranslationService:
    """
    Wrapper service to execute video translation using MPI cluster
    Falls back to regular processing if MPI is not available
    """
    
    def __init__(self):
        self.mpi_enabled = self._check_mpi_available()
        self.mpi_master_host = os.getenv('MPI_MASTER_HOST', 'mpi-master')
        self.mpi_hostfile = '/etc/mpi/hostfile'
        self.mpi_script = '/mpi/mpi_service.py'
        self.workspace = Path('/mpi/workspace')
        
        if self.mpi_enabled:
            print("✅ MPI cluster available - parallel processing enabled")
        else:
            print("⚠️  MPI not available - using single-node processing")
    
    def _check_mpi_available(self) -> bool:
        """Check if MPI is available"""
        try:
            result = subprocess.run(
                ['which', 'mpirun'],
                capture_output=True,
                timeout=5
            )
            return result.returncode == 0
        except Exception:
            return False
    
    def process_video_parallel(
        self, 
        video_path: str, 
        target_language: Optional[str] = None,
        num_workers: int = 3,
        whisper_model: str = "base"
    ) -> Optional[Dict[str, Any]]:
        """
        Process video using MPI parallel processing
        
        Args:
            video_path: Path to video file
            target_language: Target language for translation
            num_workers: Number of MPI workers to use
            whisper_model: Whisper model size
            
        Returns:
            Processing results or None if MPI fails
        """
        if not self.mpi_enabled:
            print("MPI not available, cannot use parallel processing")
            return None
        
        try:
            # Ensure workspace exists
            self.workspace.mkdir(parents=True, exist_ok=True)
            
            # Copy video to shared workspace if not already there
            video_path_obj = Path(video_path)
            if not str(video_path).startswith(str(self.workspace)):
                workspace_video = self.workspace / video_path_obj.name
                if not workspace_video.exists():
                    import shutil
                    shutil.copy(video_path, workspace_video)
                video_path = str(workspace_video)
            
            # Build MPI command
            cmd = [
                'mpirun',
                '-np', str(num_workers),
                '-hostfile', self.mpi_hostfile,
                '--allow-run-as-root',  # Required in Docker
                'python3', self.mpi_script,
                video_path
            ]
            
            if target_language:
                cmd.append(target_language)
            
            print(f"🚀 Launching MPI parallel processing:")
            print(f"   Workers: {num_workers}")
            print(f"   Video: {video_path}")
            print(f"   Command: {' '.join(cmd)}")
            
            # Execute MPI command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10 minutes timeout
            )
            
            if result.returncode != 0:
                print(f"❌ MPI processing failed:")
                print(f"   stdout: {result.stdout}")
                print(f"   stderr: {result.stderr}")
                return None
            
            # Read results
            result_file = self.workspace / 'mpi_result.json'
            if result_file.exists():
                with open(result_file, 'r', encoding='utf-8') as f:
                    mpi_result = json.load(f)
                
                print(f"✅ MPI processing completed:")
                print(f"   Total segments: {mpi_result.get('total_segments', 0)}")
                print(f"   Workers used: {mpi_result.get('workers_used', 0)}")
                
                return mpi_result
            else:
                print("❌ MPI result file not found")
                return None
        
        except subprocess.TimeoutExpired:
            print("❌ MPI processing timed out")
            return None
        except Exception as e:
            print(f"❌ MPI processing error: {e}")
            return None
    
    def should_use_mpi(self, video_path: str) -> bool:
        """
        Determine if MPI should be used based on video duration
        
        Args:
            video_path: Path to video file
            
        Returns:
            True if video is long enough to benefit from MPI
        """
        if not self.mpi_enabled:
            return False
        
        try:
            from moviepy.editor import VideoFileClip
            video = VideoFileClip(video_path)
            duration = video.duration
            video.close()
            
            # Use MPI for videos longer than 60 seconds
            return duration > 60
        except Exception as e:
            print(f"Could not determine video duration: {e}")
            return False


# Global MPI service instance
mpi_service = MPITranslationService()
