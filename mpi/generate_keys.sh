#!/bin/bash
# ============================================
# MPI SSH Key Generation Script
# Run this on the MPI master node
# ============================================

set -e

echo "Generating SSH keys for MPI cluster..."

# Generate SSH key pair (no passphrase)
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    echo "SSH key generated successfully"
else
    echo "SSH key already exists"
fi

# Add to authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

echo "SSH keys configured for passwordless access"
