-- ============================================
-- PostgreSQL Master Initialization Script
-- ============================================

-- Create replication user (idempotent)
DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'replicator') THEN
        CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator';
    END IF;
END
$$;

-- Create application database (skip if already exists)
SELECT 'CREATE DATABASE transvidio'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'transvidio')\gexec

-- Connect to application database
\c transvidio;

-- Create application tables (example schema)
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    video_url TEXT,
    original_srt_url TEXT,
    translated_srt_url TEXT,
    target_language VARCHAR(10),
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transcriptions (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_transcriptions_video_id ON transcriptions(video_id);

-- Grant permissions for replication
GRANT CONNECT ON DATABASE transvidio TO replicator;

-- Configure pg_hba.conf for replication (done via environment in Docker)
-- This allows slave nodes to connect for streaming replication
