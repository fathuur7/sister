#!/bin/bash
# ============================================
# PostgreSQL Slave Setup Script
# Sets up streaming replication from master
# ============================================

set -e

echo "Starting PostgreSQL Slave setup..."

# Wait for master to be ready
until PGPASSWORD=$POSTGRES_REPLICATION_PASSWORD psql -h "$POSTGRES_MASTER_HOST" -U "$POSTGRES_REPLICATION_USER" -c '\q' 2>/dev/null; do
  echo "Waiting for master to be ready..."
  sleep 2
done

echo "Master is ready. Setting up replication..."

# Remove existing data directory
rm -rf /var/lib/postgresql/data/*

# Create base backup from master
PGPASSWORD=$POSTGRES_REPLICATION_PASSWORD pg_basebackup \
    -h $POSTGRES_MASTER_HOST \
    -D /var/lib/postgresql/data \
    -U $POSTGRES_REPLICATION_USER \
    -v \
    -P \
    -W \
    -R

echo "Base backup completed. Configuring standby..."

# Create standby.signal (indicates this is a replica)
touch /var/lib/postgresql/data/standby.signal

# Configure recovery settings in postgresql.auto.conf
cat >> /var/lib/postgresql/data/postgresql.auto.conf <<EOF
primary_conninfo = 'host=$POSTGRES_MASTER_HOST port=5432 user=$POSTGRES_REPLICATION_USER password=$POSTGRES_REPLICATION_PASSWORD'
hot_standby = on
EOF

echo "PostgreSQL Slave setup completed!"
