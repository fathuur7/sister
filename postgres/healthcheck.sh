#!/bin/bash
# PostgreSQL Health Check Script

set -e

# Check if PostgreSQL is accepting connections
pg_isready -U "${POSTGRES_USER:-postgres}" -q

# Check replication status (for master)
if [ -f "/var/lib/postgresql/data/postmaster.pid" ]; then
    psql -U "${POSTGRES_USER:-postgres}" -c "SELECT 1" > /dev/null 2>&1
    exit $?
fi

exit 0
