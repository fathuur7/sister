# TransVidio - Distributed Video Translation System

## 📖 Overview

TransVidio adalah sistem terjemahan video terdistribusi yang menggunakan arsitektur microservices untuk memproses video secara paralel. Sistem ini mengekstrak audio dari video, melakukan transkripsi menggunakan Whisper AI, dan menerjemahkan ke berbagai bahasa.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Cloudflare Tunnel                              │
│                    https://nadasaku.biz.id                               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NGINX Load Balancer                              │
│                    (Round-robin, Health checks)                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Backend 1  │     │  Backend 2  │     │  Frontend   │
    │  (FastAPI)  │     │  (FastAPI)  │     │  (React)    │
    └──────┬──────┘     └──────┬──────┘     └─────────────┘
           │                   │
           └─────────┬─────────┘
                     │
    ┌────────────────┼────────────────┐
    ▼                ▼                ▼
┌─────────┐    ┌─────────┐    ┌─────────────────┐
│ Redis   │    │ Postgres│    │   MPI Cluster   │
│ (Cache) │    │ (Master)│    │ (Master+Worker) │
└─────────┘    └────┬────┘    └─────────────────┘
                    │
                    ▼
             ┌───────────┐
             │  Postgres │
             │  (Slave)  │
             └───────────┘
```

---

## 🔧 Technology Stack

### Backend Services
| Component | Technology | Purpose |
|-----------|------------|---------|
| API Server | FastAPI | REST API untuk video processing |
| Transcription | Faster-Whisper | Speech-to-text AI model |
| Translation | Deep-Translator | Multi-language translation |
| Load Balancer | NGINX | Distribute requests ke multiple backends |

### Data Layer
| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | PostgreSQL | Menyimpan data user, video metadata |
| Cache | Redis | Job tracking, transcription caching |
| Replication | PostgreSQL Streaming | Master-Slave replication |

### Distributed Processing
| Component | Technology | Purpose |
|-----------|------------|---------|
| MPI Cluster | Open MPI + mpi4py | Parallel video processing |
| Container | Docker | Service containerization |
| Orchestration | Docker Compose | Multi-container management |

---

## 🚀 Components Detail

### 1. MPI (Message Passing Interface) Cluster

**Fungsi:** Memproses video secara paralel dengan membagi video menjadi chunks dan memprosesnya di multiple worker nodes.

```
┌───────────────────────────────────────────────────────────┐
│                     MPI CLUSTER                            │
│                                                            │
│  ┌──────────────┐    Scatter    ┌──────────────┐          │
│  │  MPI Master  │ ───────────── │ MPI Worker 1 │          │
│  │   (Rank 0)   │               │   (Rank 1)   │          │
│  │              │               └──────────────┘          │
│  │ • Split video│    Gather     ┌──────────────┐          │
│  │ • Aggregate  │ ◄──────────── │ MPI Worker N │          │
│  │   results    │               │   (Rank N)   │          │
│  └──────────────┘               └──────────────┘          │
└───────────────────────────────────────────────────────────┘
```

**Cara Kerja:**
1. **Master Node (Rank 0):** Membagi video menjadi N chunks berdasarkan durasi
2. **Scatter:** Mendistribusikan chunks ke semua workers
3. **Workers:** Setiap worker:
   - Extract audio dari chunk video
   - Transcribe menggunakan Whisper
   - Translate ke target language
4. **Gather:** Master mengumpulkan semua hasil
5. **Aggregate:** Menggabungkan transcriptions dan mengurutkan berdasarkan waktu

**Environment Variables:**
```env
MPI_ROLE=master|worker
MPI_MASTER_HOST=mpi-master
```

**Contoh Penggunaan:**
```bash
mpirun -np 3 -hostfile /etc/mpi/hostfile python mpi_service.py video.mp4 id
```

---

### 2. PostgreSQL Database Cluster

**Fungsi:** Menyimpan data aplikasi dengan arsitektur Master-Slave untuk high availability dan read scaling.

```
┌────────────────────────────────────────────────────────────┐
│                   POSTGRESQL CLUSTER                        │
│                                                             │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │ POSTGRES MASTER │         │ POSTGRES SLAVE  │           │
│  │    (Primary)    │  ──────▶│   (Replica)     │           │
│  │                 │ Streaming│                 │           │
│  │ • Write ops     │ Replication│ • Read ops   │           │
│  │ • DDL changes   │         │ • Backup        │           │
│  │ • Port: 5432    │         │ • Port: 5433    │           │
│  └─────────────────┘         └─────────────────┘           │
└────────────────────────────────────────────────────────────┘
```

**Tables:**
```sql
-- Videos table
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_language VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transcriptions table  
CREATE TABLE transcriptions (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id),
    language VARCHAR(10) NOT NULL,
    content TEXT,
    srt_file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Environment Variables:**
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=transvidio
POSTGRES_MASTER_HOST=postgres-master
POSTGRES_SLAVE_HOSTS=postgres-slave1
```

**Replication Configuration:**
- Streaming replication (synchronous/asynchronous)
- WAL (Write-Ahead Log) archiving
- Hot standby untuk read queries

---

### 3. Redis Cache & Job Manager

**Fungsi:** Caching hasil transcription dan tracking status job processing di across multiple backend instances.

```
┌────────────────────────────────────────────────────────────┐
│                     REDIS CACHE                             │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │              KEY-VALUE STORE                     │       │
│  │                                                  │       │
│  │  job:uuid-1234 ──▶ {status, progress, result}   │       │
│  │  transcription:hash ──▶ {segments, text}        │       │
│  │                                                  │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  Features:                                                  │
│  • TTL-based expiration (24h for jobs, 1h for cache)       │
│  • Shared storage across load-balanced backends             │
│  • In-memory for fast access                                │
└────────────────────────────────────────────────────────────┘
```

**Use Cases:**

1. **Job Tracking (across backends):**
```python
# Job structure in Redis
job:uuid-1234 = {
    "job_id": "uuid-1234",
    "status": "processing",  # pending/processing/completed/failed
    "progress": 45,
    "video_filename": "video.mp4",
    "created_at": "2024-01-01T00:00:00",
    "result": null
}
```

2. **Transcription Cache:**
```python
# Cache key: md5(video_path + language)
transcription:abc123 = {
    "text": "Full transcription...",
    "segments": [...],
    "language": "en"
}
```

**Environment Variables:**
```env
REDIS_HOST=redis-master
REDIS_PORT=6379
REDIS_PASSWORD=  # Empty for no password
```

**Kenapa Redis untuk Job Tracking?**
- **Problem:** Dengan load balancing, request pertama (create job) bisa ke backend1, tapi request kedua (check status) bisa ke backend2
- **Solution:** Simpan job di Redis (shared storage) bukan in-memory
- **Result:** Semua backend bisa akses job yang sama

---

## 📁 Project Structure

```
sister/
├── docker-compose.dev.yml     # Development environment
├── docker-compose.yml         # Production environment
├── .env.cluster               # Environment variables
│
├── translate-backend/         # FastAPI Backend
│   ├── app/
│   │   ├── main.py           # Application entry
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Helper functions
│   │   │   ├── job_manager.py    # Redis-based job tracking
│   │   │   └── functions.py      # Video processing
│   │   └── cache/            # Redis cache manager
│   └── Dockerfile
│
├── transvidio-frontend/       # React Frontend
│   ├── src/
│   │   ├── hooks/            # React hooks
│   │   └── components/       # UI components
│   └── Dockerfile
│
├── nginx/                     # Load Balancer
│   ├── nginx-dev.conf        # Development config
│   └── Dockerfile
│
├── postgres/                  # Database
│   ├── master/
│   │   └── init.sql          # Schema initialization
│   └── slave/
│
├── redis/                     # Cache
│   ├── redis-master.conf
│   └── redis-slave.conf
│
└── mpi/                       # Distributed Processing
    ├── mpi_service.py        # MPI translation service
    ├── requirements-mpi.txt
    └── Dockerfile
```

---

## 🚀 Cara Menjalankan Project

### Prerequisites
- Docker & Docker Compose
- 8GB+ RAM (untuk Whisper model)
- Cloudflared (untuk tunnel ke internet)
- Node.js 18+ (untuk frontend development)

---

### Step 1: Clone Repository

```bash
git clone <repo-url>
cd sister
```

---

### Step 2: Build Frontend (Production)

```bash
cd transvidio-frontend
npm install
npm run build
cd ..
```

---

### Step 3: Start Docker Services

```bash
# Start semua services (PostgreSQL, Redis, MPI, Backend, Nginx)
docker-compose -f docker-compose.dev.yml up -d

# Cek status containers
docker-compose -f docker-compose.dev.yml ps

# Pastikan semua container running
docker ps
```

**Expected Output:**
```
NAMES               STATUS
nginx-loadbalancer  Up
backend1            Up (healthy)
backend2            Up (healthy)
postgres-master     Up (healthy)
postgres-slave1     Up
redis-master        Up (healthy)
mpi-master          Up
mpi-worker1         Up
```

---

### Step 4: Aktifkan Cloudflare Tunnel

```bash
# Jalankan tunnel (pastikan config sudah ada di ~/.cloudflared/)
cloudflared tunnel run nadasaku
```

**Atau jalankan di background (Windows):**
```powershell
Start-Process cloudflared -ArgumentList "tunnel run nadasaku" -WindowStyle Hidden
```

**Atau sebagai Windows Service:**
```powershell
# Install sebagai service (sekali saja)
cloudflared service install

# Start service
cloudflared service start
```

---

### Step 5: Akses Aplikasi

| Service | URL |
|---------|-----|
| **Production (via Tunnel)** | https://nadasaku.biz.id |
| **Local Frontend** | http://localhost:8080 |
| **Local API** | http://localhost:8080/api |

---

### 🔄 Commands Lengkap

```bash
# ===== STARTING PROJECT =====

# 1. Build frontend
cd transvidio-frontend && npm run build && cd ..

# 2. Start Docker services
docker-compose -f docker-compose.dev.yml up -d

# 3. Start Cloudflare Tunnel
cloudflared tunnel run nadasaku


# ===== STOPPING PROJECT =====

# Stop semua containers
docker-compose -f docker-compose.dev.yml down

# Stop Cloudflare Tunnel
# (Ctrl+C jika running di terminal, atau:)
cloudflared service stop


# ===== RESTART SERVICES =====

# Restart backend saja
docker-compose -f docker-compose.dev.yml restart backend1 backend2

# Restart nginx
docker-compose -f docker-compose.dev.yml restart nginx

# Rebuild dan restart backend
docker-compose -f docker-compose.dev.yml up -d --build backend1 backend2


# ===== VIEW LOGS =====

# Semua logs
docker-compose -f docker-compose.dev.yml logs -f

# Backend logs saja
docker-compose -f docker-compose.dev.yml logs -f backend1 backend2

# Nginx logs
docker-compose -f docker-compose.dev.yml logs -f nginx


# ===== TROUBLESHOOTING =====

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Check Redis connection
docker exec redis-master redis-cli PING

# Check PostgreSQL
docker exec postgres-master psql -U postgres -d transvidio -c "SELECT 1"

# Check if backend connects to Redis
docker exec backend1 python -c "from app.utils.job_manager import job_manager; print('Redis:', job_manager._use_redis)"
```

---

### ⚠️ Troubleshooting

**Problem: Container exit dengan error**
```bash
# Lihat logs error
docker-compose -f docker-compose.dev.yml logs <container-name>

# Rebuild container
docker-compose -f docker-compose.dev.yml up -d --build <service-name>
```

**Problem: Frontend tidak update**
```bash
# Rebuild frontend dan restart nginx
cd transvidio-frontend && npm run build && cd ..
docker-compose -f docker-compose.dev.yml restart nginx
```

**Problem: Job status 404**
```bash
# Pastikan Redis terkoneksi
docker exec backend1 python -c "from app.utils.job_manager import job_manager; print('Redis:', job_manager._use_redis)"

# Jika False, restart backend
docker-compose -f docker-compose.dev.yml restart backend1 backend2
```

---

### Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| API | http://localhost:8080/api |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## 🔧 Configuration

### Environment Variables

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=transvidio

# Redis
REDIS_HOST=redis-master
REDIS_PORT=6379
REDIS_PASSWORD=

# MPI
MPI_ROLE=master
MPI_MASTER_HOST=mpi-master

# Whisper Model (tiny/base/small/medium/large)
WHISPER_MODEL=base
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/translate-video/` | Upload video for processing |
| GET | `/api/translate-video/status/{job_id}` | Check job status |
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | User authentication |
| POST | `/api/auth/register` | User registration |

---

## 🧪 Testing

```bash
# Test API
curl http://localhost:8080/api/health

# Test Redis connection
docker exec redis-master redis-cli PING

# Test PostgreSQL
docker exec postgres-master psql -U postgres -d transvidio -c "SELECT 1"

# Check MPI cluster
docker exec mpi-master mpirun --version
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.
