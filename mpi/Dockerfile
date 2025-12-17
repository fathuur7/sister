# Kembali ke image standar python:3.11-slim (Debian 12 Bookworm)
# Image ini lebih kompatibel dengan binary wheels modern
FROM python:3.11-slim

# Install system dependencies
# Tambahkan libav*-dev untuk memungkinkan build av dari source jika binary wheel tidak tersedia
RUN apt-get update && apt-get install -y \
    build-essential \
    gfortran \
    libopenmpi-dev \
    openmpi-bin \
    openmpi-common \
    openssh-server \
    openssh-client \
    ffmpeg \
    git \
    pkg-config \
    # Library tambahan untuk mendukung binary wheels
    libgomp1 \
    # FFmpeg dev libraries untuk build PyAV dari source
    libavcodec-dev \
    libavformat-dev \
    libavdevice-dev \
    libswscale-dev \
    libswresample-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH for passwordless communication
RUN mkdir -p /var/run/sshd
RUN echo 'root:mpicluster' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# SSH login fix
RUN sed -i 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' /etc/pam.d/sshd

# Create MPI directories
RUN mkdir -p /mpi/workspace /etc/mpi /root/.ssh
WORKDIR /mpi

# Copy SSH configuration
COPY ssh_config /root/.ssh/config
RUN chmod 600 /root/.ssh/config

# Copy requirements
COPY requirements-mpi.txt /mpi/requirements-mpi.txt

# Install Python libraries
# 1. Upgrade pip dan wheel agar bisa mendeteksi binary wheels dengan benar
# 2. Force install 'av' dari binary wheel untuk menghindari kompilasi ulang yang error
# 3. Install sisa requirements dengan timeout tinggi untuk koneksi lambat
RUN pip install --no-cache-dir --upgrade pip wheel setuptools && \
    pip install --no-cache-dir --default-timeout=1000 -r requirements-mpi.txt

# Expose SSH port
EXPOSE 22

# Start SSH service
CMD ["/usr/sbin/sshd", "-D"]