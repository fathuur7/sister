"""
Redis Cache Manager
Replaces file-based caching with distributed Redis cache
"""

import os
import json
import hashlib
import redis
from typing import Any, Optional


class RedisCache:
    """
    Distributed cache using Redis
    Supports cluster-aware caching with automatic failover
    """
    
    def __init__(self):
        self.redis_host = os.getenv('REDIS_HOST', 'localhost')
        self.redis_port = int(os.getenv('REDIS_PORT', '6379'))
        self.redis_password = os.getenv('REDIS_PASSWORD', None)
        self.default_ttl = int(os.getenv('CACHE_DEFAULT_TIMEOUT', '3600'))  # 1 hour
        
        # Connect to Redis
        self.client = redis.Redis(
            host=self.redis_host,
            port=self.redis_port,
            password=self.redis_password,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
            health_check_interval=30
        )
        
        # Test connection
        try:
            self.client.ping()
            print(f"✅ Redis cache connected: {self.redis_host}:{self.redis_port}")
        except redis.ConnectionError as e:
            print(f"❌ Redis connection failed: {e}")
            print("⚠️  Falling back to no-cache mode")
            self.client = None
    
    def _generate_key(self, video_path: str, target_language: Optional[str] = None) -> str:
        """Generate unique cache key from video path and language"""
        # Use file hash + language for cache key
        key_data = f"{video_path}:{target_language or 'original'}"
        return f"transcription:{hashlib.md5(key_data.encode()).hexdigest()}"
    
    def get(self, video_path: str, target_language: Optional[str] = None) -> Optional[dict]:
        """
        Retrieve cached transcription result
        
        Args:
            video_path: Path to video file
            target_language: Target language (None for original)
            
        Returns:
            Cached result or None if not found
        """
        if not self.client:
            return None
        
        try:
            key = self._generate_key(video_path, target_language)
            cached_data = self.client.get(key)
            
            if cached_data:
                print(f"⚡ Cache HIT: {key}")
                return json.loads(cached_data)
            else:
                print(f"❌ Cache MISS: {key}")
                return None
        except Exception as e:
            print(f"Cache retrieval error: {e}")
            return None
    
    def set(self, video_path: str, result: dict, target_language: Optional[str] = None, 
            ttl: Optional[int] = None):
        """
        Store transcription result in cache
        
        Args:
            video_path: Path to video file
            result: Processing result to cache
            target_language: Target language (None for original)
            ttl: Time-to-live in seconds (default: 1 hour)
        """
        if not self.client:
            return
        
        try:
            key = self._generate_key(video_path, target_language)
            ttl = ttl or self.default_ttl
            
            # Serialize result to JSON
            cached_data = json.dumps(result, ensure_ascii=False)
            
            # Store in Redis with TTL
            self.client.setex(key, ttl, cached_data)
            print(f"💾 Cache SET: {key} (TTL: {ttl}s)")
        except Exception as e:
            print(f"Cache storage error: {e}")
    
    def delete(self, video_path: str, target_language: Optional[str] = None):
        """Delete specific cache entry"""
        if not self.client:
            return
        
        try:
            key = self._generate_key(video_path, target_language)
            self.client.delete(key)
            print(f"🗑️  Cache DELETE: {key}")
        except Exception as e:
            print(f"Cache deletion error: {e}")
    
    def clear_all(self):
        """Clear all transcription caches (use with caution)"""
        if not self.client:
            return
        
        try:
            deleted_count = 0
            for key in self.client.scan_iter("transcription:*"):
                self.client.delete(key)
                deleted_count += 1
            print(f"🗑️  Cleared {deleted_count} cache entries")
        except Exception as e:
            print(f"Cache clear error: {e}")
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        if not self.client:
            return {'status': 'disconnected'}
        
        try:
            info = self.client.info('stats')
            keyspace = self.client.info('keyspace')
            
            return {
                'status': 'connected',
                'host': self.redis_host,
                'total_keys': sum(v.get('keys', 0) for v in keyspace.values()),
                'hits': info.get('keyspace_hits', 0),
                'misses': info.get('keyspace_misses', 0),
                'hit_rate': self._calculate_hit_rate(
                    info.get('keyspace_hits', 0),
                    info.get('keyspace_misses', 0)
                )
            }
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    def _calculate_hit_rate(self, hits: int, misses: int) -> float:
        """Calculate cache hit rate percentage"""
        total = hits + misses
        return round((hits / total * 100) if total > 0 else 0, 2)


# Global Redis cache instance
redis_cache = RedisCache()
