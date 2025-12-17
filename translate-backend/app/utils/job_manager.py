"""
Job manager untuk tracking status background tasks.
Menggunakan Redis untuk shared storage across multiple backend instances.
"""
import os
import json
import uuid
import redis
from datetime import datetime
from typing import Dict, Optional
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobManager:
    """Redis-based job manager untuk tracking background tasks across multiple backends."""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(JobManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.redis_host = os.getenv('REDIS_HOST', 'redis-master')
        self.redis_port = int(os.getenv('REDIS_PORT', '6379'))
        redis_password = os.getenv('REDIS_PASSWORD', '')
        self.redis_password = redis_password if redis_password else None  # Empty string = no password
        self.job_prefix = "job:"
        self.job_ttl = 3600 * 24  # 24 hours
        
        try:
            self.client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                password=self.redis_password,
                decode_responses=True,
                socket_connect_timeout=5
            )
            self.client.ping()
            print(f"✅ JobManager connected to Redis: {self.redis_host}:{self.redis_port}")
            self._use_redis = True
        except Exception as e:
            print(f"⚠️ Redis connection failed, using in-memory fallback: {e}")
            self._use_redis = False
            self._jobs: Dict[str, dict] = {}
        
        self._initialized = True
    
    def _make_key(self, job_id: str) -> str:
        return f"{self.job_prefix}{job_id}"
    
    def create_job(self, video_filename: str, target_language: Optional[str] = None) -> str:
        """Buat job baru dan return job_id."""
        job_id = str(uuid.uuid4())
        job_data = {
            "job_id": job_id,
            "status": JobStatus.PENDING.value,
            "video_filename": video_filename,
            "target_language": target_language,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "progress": 0,
            "message": "Job created, waiting to start...",
            "result": None,
            "error": None
        }
        
        if self._use_redis:
            try:
                key = self._make_key(job_id)
                self.client.setex(key, self.job_ttl, json.dumps(job_data))
            except Exception as e:
                print(f"Redis error creating job: {e}")
                self._jobs[job_id] = job_data
        else:
            self._jobs[job_id] = job_data
            
        return job_id
    
    def update_job(self, job_id: str, status: Optional[JobStatus] = None, 
                   progress: Optional[int] = None, message: Optional[str] = None,
                   result: Optional[dict] = None, error: Optional[str] = None) -> bool:
        """Update job status, progress, atau result."""
        job = self.get_job(job_id)
        if not job:
            return False
        
        if status:
            job["status"] = status.value if isinstance(status, JobStatus) else status
        if progress is not None:
            job["progress"] = progress
        if message:
            job["message"] = message
        if result:
            job["result"] = result
        if error:
            job["error"] = error
            
        job["updated_at"] = datetime.utcnow().isoformat()
        
        if self._use_redis:
            try:
                key = self._make_key(job_id)
                self.client.setex(key, self.job_ttl, json.dumps(job))
            except Exception as e:
                print(f"Redis error updating job: {e}")
                return False
        else:
            self._jobs[job_id] = job
            
        return True
    
    def get_job(self, job_id: str) -> Optional[dict]:
        """Dapatkan informasi job berdasarkan job_id."""
        if self._use_redis:
            try:
                key = self._make_key(job_id)
                data = self.client.get(key)
                if data:
                    return json.loads(data)
                return None
            except Exception as e:
                print(f"Redis error getting job: {e}")
                return self._jobs.get(job_id) if hasattr(self, '_jobs') else None
        else:
            return self._jobs.get(job_id)
    
    def delete_job(self, job_id: str) -> bool:
        """Hapus job."""
        if self._use_redis:
            try:
                key = self._make_key(job_id)
                return self.client.delete(key) > 0
            except Exception as e:
                print(f"Redis error deleting job: {e}")
                return False
        else:
            if job_id in self._jobs:
                del self._jobs[job_id]
                return True
            return False
    
    def get_all_jobs(self) -> list:
        """Dapatkan semua jobs (untuk debugging/admin)."""
        if self._use_redis:
            try:
                jobs = []
                for key in self.client.scan_iter(f"{self.job_prefix}*"):
                    data = self.client.get(key)
                    if data:
                        jobs.append(json.loads(data))
                return jobs
            except Exception as e:
                print(f"Redis error getting all jobs: {e}")
                return []
        else:
            return list(self._jobs.values())


# Singleton instance
job_manager = JobManager()
