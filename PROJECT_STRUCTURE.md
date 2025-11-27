# Project Structure - Sister Video Translation Cluster

```
sister/
│
├── 📄 .env.cluster                          # Environment variables untuk cluster
├── 📄 docker-compose.yml                    # Production cluster (13 containers)
├── 📄 docker-compose.dev.yml                # Development cluster (8 containers)
├── 📄 CLUSTER_SETUP.md                      # Comprehensive cluster documentation
├── 📄 README.md                             # Project README
│
├── 📁 postgres/                             # PostgreSQL Cluster Configuration
│   ├── 📁 master/
│   │   ├── Dockerfile                       # Master node image
│   │   ├── init.sql                         # Database initialization & schema
│   │   └── postgresql.conf                  # Master configuration (WAL, replication)
│   │
│   ├── 📁 slave/
│   │   ├── Dockerfile                       # Slave node image
│   │   └── setup-slave.sh                   # Streaming replication setup script
│   │
│   └── healthcheck.sh                       # PostgreSQL health check (optional)
│
├── 📁 redis/                                # Redis Cluster Configuration
│   ├── redis-master.conf                    # Master configuration
│   ├── redis-slave.conf                     # Slave configuration  
│   └── sentinel.conf                        # Sentinel for failover
│
├── 📁 mpi/                                  # MPI Parallel Processing Cluster
│   ├── Dockerfile                           # MPI node image (OpenMPI + Python)
│   ├── requirements-mpi.txt                 # Python dependencies (mpi4py, etc)
│   ├── ssh_config                           # SSH passwordless config
│   ├── hostfile                             # Production: 3 nodes
│   ├── hostfile-dev                         # Development: 2 nodes
│   ├── mpi_service.py                       # MPI parallel translation service
│   └── generate_keys.sh                     # SSH key generation script
│
├── 📁 nginx/                                # Nginx Load Balancer
│   ├── Dockerfile                           # Nginx image
│   ├── nginx.conf                           # Production config (3 backends)
│   └── nginx-dev.conf                       # Development config (2 backends)
│
├── 📁 translate-backend/                    # Backend Application
│   ├── Dockerfile                           # Backend image (updated for cluster)
│   ├── requirements.txt                     # Python dependencies (updated)
│   │
│   ├── 📁 app/
│   │   ├── main.py                          # FastAPI application
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── TranslationService.py        # Original translation service
│   │   │   └── MPITranslationService.py     # NEW: MPI-enabled service
│   │   │
│   │   ├── 📁 db/
│   │   │   └── connection_pool.py           # NEW: Master-slave DB routing
│   │   │
│   │   ├── 📁 cache/
│   │   │   └── redis_cache.py               # NEW: Distributed Redis cache
│   │   │
│   │   └── 📁 utils/
│   │       └── functions.py                 # Utility functions
│   │
│   ├── 📁 uploads/                          # Video uploads directory
│   └── 📁 output/                           # Processed outputs directory
│
└── 📁 transvidio-frontend/                  # Frontend Application (React/TypeScript)
    ├── Dockerfile
    ├── package.json
    └── src/
        └── ... (React components)
```

## 🔑 Key Files Explanation

### Cluster Orchestration
- **docker-compose.yml**: Full production setup dengan 13 containers
- **docker-compose.dev.yml**: Scaled-down untuk development (8 containers)
- **.env.cluster**: Semua environment variables (passwords, hosts, ports)

### PostgreSQL Cluster (Master-Slave Replication)
- **Master**: Write operations, streaming WAL logs
- **Slaves**: Read operations, automatic replication
- **init.sql**: Create database schema & replication user

### Redis Cluster (High Availability Caching)
- **Master**: Primary cache node
- **Slaves**: Replicate from master
- **Sentinel**: Monitor & automatic failover

### MPI Cluster (Parallel Processing)
- **Master**: Coordinate parallel jobs
- **Workers**: Execute distributed tasks
- **mpi_service.py**: Split videos & parallel transcription

### Nginx Load Balancer
- Round-robin distribution to backend instances
- Health checks & automatic failover
- Static file serving for processed videos

### Backend Integration
- **connection_pool.py**: Route writes to master, reads to slaves
- **redis_cache.py**: Replace file cache with distributed Redis
- **MPITranslationService.py**: Use MPI for videos > 60 seconds

## 📊 Container Mapping

### Production (docker-compose.yml)
```
1. postgres-master        → PostgreSQL master (port 5432)
2. postgres-slave1        → PostgreSQL slave  (port 5433)
3. postgres-slave2        → PostgreSQL slave  (port 5434)
4. redis-master           → Redis master (port 6379)
5. redis-slave1           → Redis slave (port 6380)
6. redis-slave2           → Redis slave (port 6381)
7. redis-sentinel1        → Redis Sentinel (port 26379)
8. mpi-master             → MPI coordinator
9. mpi-worker1            → MPI worker node 1
10. mpi-worker2           → MPI worker node 2
11. backend1              → Application server 1 (port 8000)
12. backend2              → Application server 2 (port 8000)
13. backend3              → Application server 3 (port 8000)
14. nginx                 → Load balancer (port 80)
```

### Development (docker-compose.dev.yml)
```
1. postgres-master        → PostgreSQL master
2. postgres-slave1        → PostgreSQL slave (1 only)
3. redis-master           → Redis (no slaves/sentinel)
4. mpi-master             → MPI coordinator
5. mpi-worker1            → MPI worker (1 only)
6. backend1               → Application server 1
7. backend2               → Application server 2
8. nginx                  → Load balancer
```

## 🚀 Deployment Commands

### Development (Recommended untuk testing)
```bash
cd c:\Users\kopis\Documents\sister
docker compose -f docker-compose.dev.yml up -d
```

### Production (Full cluster)
```bash
docker compose up -d
```

### Verify Cluster
```bash
docker compose ps                          # Check all containers
docker compose logs -f                     # Monitor logs
curl http://localhost/health               # Test load balancer
```

## 📝 Missing Files (Optional)
Jika ingin lengkap, bisa tambahkan:
- `.dockerignore` di setiap service
- `.gitignore` untuk project root
- `docker-compose.prod.yml` untuk production specifics
- `monitoring/` folder untuk Prometheus/Grafana

---

**Status**: ✅ All essential files created and ready for deployment!
