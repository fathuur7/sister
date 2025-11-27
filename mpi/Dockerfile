FROM python:3.11-slim

# Install system dependencies including build tools for PyAV
RUN apt-get update && apt-get install -y \
    build-essential \
    gfortran \
    libopenmpi-dev \
    openmpi-bin \
    openmpi-common \
    openssh-server \
    openssh-client \
    ffmpeg \
    pkg-config \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH for passwordless communication
RUN mkdir -p /var/run/sshd
RUN echo 'root:mpicluster' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# SSH login fix (prevent user being kicked off after exec)
RUN sed -i 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' /etc/pam.d/sshd

# Create MPI directories
RUN mkdir -p /mpi/workspace /etc/mpi /root/.ssh
WORKDIR /mpi

# Copy SSH configuration
COPY ssh_config /root/.ssh/config
RUN chmod 600 /root/.ssh/config

# Install Python MPI and ML libraries
COPY requirements-mpi.txt /mpi/requirements-mpi.txt
RUN pip install --no-cache-dir -r requirements-mpi.txt

# Expose SSH port
EXPOSE 22

# Start SSH service
CMD ["/usr/sbin/sshd", "-D"]
