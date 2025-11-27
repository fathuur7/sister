FROM postgres:15-alpine

# Install necessary tools
RUN apk add --no-cache bash

# Copy initialization script
COPY init.sql /docker-entrypoint-initdb.d/

# Copy PostgreSQL configuration
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Expose PostgreSQL port
EXPOSE 5432

# Use custom postgresql.conf
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
