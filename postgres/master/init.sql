-- ============================================
-- PostgreSQL Master Initialization Script
-- Distributed Database with Fragmentation & Aggregation
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

-- ============================================
-- 1. HORIZONTAL FRAGMENTATION (Partitioning by Date)
-- Data dipartisi berdasarkan bulan untuk distribusi
-- ============================================

-- Main videos table with RANGE partitioning by created_at
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL,
    filename VARCHAR(255) NOT NULL,
    video_url TEXT,
    original_srt_url TEXT,
    translated_srt_url TEXT,
    target_language VARCHAR(10),
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partition untuk data historis (sebelum 2025)
CREATE TABLE IF NOT EXISTS videos_archive PARTITION OF videos
    FOR VALUES FROM (MINVALUE) TO ('2025-01-01');

-- Partition untuk Q1 2025 (Jan-Mar)
CREATE TABLE IF NOT EXISTS videos_2025_q1 PARTITION OF videos
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

-- Partition untuk Q2 2025 (Apr-Jun)
CREATE TABLE IF NOT EXISTS videos_2025_q2 PARTITION OF videos
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

-- Partition untuk Q3 2025 (Jul-Sep)
CREATE TABLE IF NOT EXISTS videos_2025_q3 PARTITION OF videos
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');

-- Partition untuk Q4 2025 (Oct-Dec)
CREATE TABLE IF NOT EXISTS videos_2025_q4 PARTITION OF videos
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Default partition untuk data masa depan
CREATE TABLE IF NOT EXISTS videos_future PARTITION OF videos
    FOR VALUES FROM ('2026-01-01') TO (MAXVALUE);


-- ============================================
-- 2. VERTICAL FRAGMENTATION (Separate Tables)
-- Data dipisah berdasarkan frekuensi akses
-- ============================================

-- Tabel metadata video (frequently accessed)
CREATE TABLE IF NOT EXISTS video_metadata (
    video_id INTEGER PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    target_language VARCHAR(10),
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel URL video (less frequently accessed, larger data)
CREATE TABLE IF NOT EXISTS video_urls (
    video_id INTEGER PRIMARY KEY,
    video_url TEXT,
    original_srt_url TEXT,
    translated_srt_url TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel transcriptions
CREATE TABLE IF NOT EXISTS transcriptions (
    id SERIAL PRIMARY KEY,
    video_id INTEGER NOT NULL,
    segment_index INTEGER NOT NULL,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 3. AGGREGATION VIEWS (Data Agregasi)
-- View untuk mengagregasi data dari berbagai tabel
-- ============================================

-- View: Statistik video per bahasa
CREATE OR REPLACE VIEW video_stats_by_language AS
SELECT 
    target_language,
    COUNT(*) as total_videos,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    MIN(created_at) as first_video,
    MAX(created_at) as last_video
FROM videos
GROUP BY target_language;

-- View: Statistik video per bulan (agregasi temporal)
CREATE OR REPLACE VIEW video_stats_monthly AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_videos,
    COUNT(DISTINCT target_language) as languages_used,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM videos
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- View: Gabungan metadata + URLs (integrasi vertikal)
CREATE OR REPLACE VIEW video_complete AS
SELECT 
    m.video_id,
    m.filename,
    m.target_language,
    m.status,
    m.created_at,
    u.video_url,
    u.original_srt_url,
    u.translated_srt_url,
    u.updated_at
FROM video_metadata m
LEFT JOIN video_urls u ON m.video_id = u.video_id;

-- View: Statistik transcription per video
CREATE OR REPLACE VIEW transcription_stats AS
SELECT 
    video_id,
    COUNT(*) as total_segments,
    SUM(end_time - start_time) as total_duration_seconds,
    AVG(LENGTH(original_text)) as avg_text_length,
    COUNT(CASE WHEN translated_text IS NOT NULL THEN 1 END) as translated_segments
FROM transcriptions
GROUP BY video_id;


-- ============================================
-- 4. MATERIALIZED VIEW (Cached Aggregation)
-- Data agregasi yang di-cache untuk performa
-- ============================================

-- Materialized view: Dashboard statistik keseluruhan
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    COUNT(*) as total_videos,
    COUNT(DISTINCT target_language) as total_languages,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_videos,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_videos,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as videos_last_7_days,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as videos_last_30_days
FROM videos;

-- Index pada materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats ON dashboard_stats (total_videos);

-- Function untuk refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 5. INDEXES for Distributed Queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_language ON videos(target_language);
CREATE INDEX IF NOT EXISTS idx_transcriptions_video_id ON transcriptions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_metadata_status ON video_metadata(status);


-- ============================================
-- 6. REPLICATION PERMISSIONS
-- ============================================

GRANT CONNECT ON DATABASE transvidio TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;

-- ============================================
-- NOTES:
-- - Horizontal Fragmentation: videos dipartisi per quarter
-- - Vertical Fragmentation: video_metadata + video_urls terpisah
-- - Agregasi: views untuk statistik
-- - Replikasi: streaming replication ke postgres-slave1
-- ============================================
