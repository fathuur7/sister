FROM postgres:15-alpine

# Install necessary tools
RUN apk add --no-cache bash

# Copy entrypoint script for slave setup
COPY setup-slave.sh /docker-entrypoint-initdb.d/setup-slave.sh
RUN chmod +x /docker-entrypoint-initdb.d/setup-slave.sh

# Expose PostgreSQL port
EXPOSE 5432
