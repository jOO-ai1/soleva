#!/bin/bash

# Script to remove default.conf from Nginx container
# This prevents conflicts with our custom production.conf

echo "🔧 Removing default.conf from Nginx container..."

# Remove the default.conf file from the container
docker exec solevaeg-nginx rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || echo "Container not running or file already removed"

echo "✅ Default.conf removal completed"
