#!/bin/bash

# Setup automated backups for Soleva E-commerce Platform

set -e

PROJECT_NAME="solevaeg"
BACKUP_DIR="/opt/$PROJECT_NAME/backups"
SCRIPT_DIR="/opt/$PROJECT_NAME/scripts"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[BACKUP] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

log "Setting up automated backup system..."

# Create backup directories
sudo mkdir -p $BACKUP_DIR/{database,uploads,config,logs}
sudo chown -R $USER:$USER /opt/$PROJECT_NAME

# Create database backup script
cat > $SCRIPT_DIR/backup-database.sh << 'EOF'
#!/bin/bash

# Database backup script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
BACKUP_DIR="/opt/$PROJECT_NAME/backups/database"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Timestamp
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/solevaeg_db_$TIMESTAMP.sql"
ENCRYPTED_FILE="$BACKUP_FILE.enc"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $BACKUP_DIR/backup.log
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a $BACKUP_DIR/backup.log
    exit 1
}

log "Starting database backup..."

# Create database dump
if docker exec solevaeg-postgres pg_dump -U solevaeg_user -d solevaeg_prod > "$BACKUP_FILE"; then
    log "✓ Database dump created: $BACKUP_FILE"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Database backup size: $SIZE"
    
    # Encrypt backup if encryption key is provided
    if [ -n "$ENCRYPTION_KEY" ]; then
        if openssl enc -aes-256-cbc -salt -in "$BACKUP_FILE" -out "$ENCRYPTED_FILE" -pass pass:"$ENCRYPTION_KEY"; then
            log "✓ Database backup encrypted"
            rm "$BACKUP_FILE"  # Remove unencrypted file
            BACKUP_FILE="$ENCRYPTED_FILE"
        else
            error "Failed to encrypt database backup"
        fi
    fi
    
    # Compress backup
    if gzip "$BACKUP_FILE"; then
        BACKUP_FILE="$BACKUP_FILE.gz"
        log "✓ Database backup compressed"
    else
        warning "Failed to compress database backup"
    fi
    
    # Upload to S3 if configured
    if [ -n "$BACKUP_S3_BUCKET" ] && command -v aws &> /dev/null; then
        if aws s3 cp "$BACKUP_FILE" "s3://$BACKUP_S3_BUCKET/database/$(basename $BACKUP_FILE)"; then
            log "✓ Database backup uploaded to S3"
        else
            warning "Failed to upload database backup to S3"
        fi
    fi
    
    log "✓ Database backup completed successfully"
else
    error "Failed to create database dump"
fi

# Clean up old backups
log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "solevaeg_db_*.sql*" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Clean up old S3 backups if configured
if [ -n "$BACKUP_S3_BUCKET" ] && command -v aws &> /dev/null; then
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" '+%Y-%m-%d')
    aws s3 ls "s3://$BACKUP_S3_BUCKET/database/" | awk '$1 < "'$CUTOFF_DATE'" {print $4}' | while read file; do
        if [ -n "$file" ]; then
            aws s3 rm "s3://$BACKUP_S3_BUCKET/database/$file"
            log "Deleted old S3 backup: $file"
        fi
    done
fi

log "Database backup process completed"
EOF

chmod +x $SCRIPT_DIR/backup-database.sh

# Create uploads backup script
cat > $SCRIPT_DIR/backup-uploads.sh << 'EOF'
#!/bin/bash

# Uploads backup script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
BACKUP_DIR="/opt/$PROJECT_NAME/backups/uploads"
UPLOADS_DIR="/opt/$PROJECT_NAME/data/uploads"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Timestamp
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/solevaeg_uploads_$TIMESTAMP.tar.gz"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $BACKUP_DIR/backup.log
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a $BACKUP_DIR/backup.log
    exit 1
}

log "Starting uploads backup..."

# Check if uploads directory exists
if [ ! -d "$UPLOADS_DIR" ]; then
    warning "Uploads directory not found: $UPLOADS_DIR"
    exit 0
fi

# Create uploads backup
if tar -czf "$BACKUP_FILE" -C "$(dirname $UPLOADS_DIR)" "$(basename $UPLOADS_DIR)"; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✓ Uploads backup created: $BACKUP_FILE ($SIZE)"
    
    # Upload to S3 if configured
    if [ -n "$BACKUP_S3_BUCKET" ] && command -v aws &> /dev/null; then
        if aws s3 cp "$BACKUP_FILE" "s3://$BACKUP_S3_BUCKET/uploads/$(basename $BACKUP_FILE)"; then
            log "✓ Uploads backup uploaded to S3"
        else
            warning "Failed to upload uploads backup to S3"
        fi
    fi
    
    log "✓ Uploads backup completed successfully"
else
    error "Failed to create uploads backup"
fi

# Clean up old backups
log "Cleaning up old uploads backups (retention: $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "solevaeg_uploads_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

log "Uploads backup process completed"
EOF

chmod +x $SCRIPT_DIR/backup-uploads.sh

# Create configuration backup script
cat > $SCRIPT_DIR/backup-config.sh << 'EOF'
#!/bin/bash

# Configuration backup script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
BACKUP_DIR="/opt/$PROJECT_NAME/backups/config"
CONFIG_DIR="/opt/$PROJECT_NAME"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Timestamp
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/solevaeg_config_$TIMESTAMP.tar.gz"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $BACKUP_DIR/backup.log
}

log "Starting configuration backup..."

# Create temporary directory for config files
TEMP_DIR=$(mktemp -d)
CONFIG_BACKUP_DIR="$TEMP_DIR/solevaeg-config"
mkdir -p "$CONFIG_BACKUP_DIR"

# Copy configuration files (excluding sensitive data)
cp docker compose.yml "$CONFIG_BACKUP_DIR/" 2>/dev/null || true
cp -r docker/ "$CONFIG_BACKUP_DIR/" 2>/dev/null || true
cp Makefile "$CONFIG_BACKUP_DIR/" 2>/dev/null || true
cp -r scripts/ "$CONFIG_BACKUP_DIR/" 2>/dev/null || true

# Copy environment template (not actual .env)
cp env.production "$CONFIG_BACKUP_DIR/env.example" 2>/dev/null || true

# Create backup archive
if tar -czf "$BACKUP_FILE" -C "$TEMP_DIR" "solevaeg-config"; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✓ Configuration backup created: $BACKUP_FILE ($SIZE)"
    
    # Upload to S3 if configured
    if [ -n "$BACKUP_S3_BUCKET" ] && command -v aws &> /dev/null; then
        if aws s3 cp "$BACKUP_FILE" "s3://$BACKUP_S3_BUCKET/config/$(basename $BACKUP_FILE)"; then
            log "✓ Configuration backup uploaded to S3"
        else
            warning "Failed to upload configuration backup to S3"
        fi
    fi
    
    log "✓ Configuration backup completed successfully"
else
    error "Failed to create configuration backup"
fi

# Clean up
rm -rf "$TEMP_DIR"

# Clean up old backups
find $BACKUP_DIR -name "solevaeg_config_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

log "Configuration backup process completed"
EOF

chmod +x $SCRIPT_DIR/backup-config.sh

# Create full backup script
cat > $SCRIPT_DIR/backup-full.sh << 'EOF'
#!/bin/bash

# Full backup script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
SCRIPT_DIR="/opt/$PROJECT_NAME/scripts"
BACKUP_DIR="/opt/$PROJECT_NAME/backups"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $BACKUP_DIR/full-backup.log
}

log "Starting full backup process..."

# Run all backup scripts
$SCRIPT_DIR/backup-database.sh
$SCRIPT_DIR/backup-uploads.sh
$SCRIPT_DIR/backup-config.sh

# Create backup summary
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
SUMMARY_FILE="$BACKUP_DIR/backup-summary-$TIMESTAMP.txt"

cat > "$SUMMARY_FILE" << SUMMARY_EOF
Soleva Platform Backup Summary
==============================
Date: $(date)
Backup ID: $TIMESTAMP

Database Backup:
$(ls -la $BACKUP_DIR/database/solevaeg_db_$TIMESTAMP* 2>/dev/null || echo "No database backup found")

Uploads Backup:
$(ls -la $BACKUP_DIR/uploads/solevaeg_uploads_$TIMESTAMP* 2>/dev/null || echo "No uploads backup found")

Configuration Backup:
$(ls -la $BACKUP_DIR/config/solevaeg_config_$TIMESTAMP* 2>/dev/null || echo "No config backup found")

Total Backup Size:
$(du -sh $BACKUP_DIR | cut -f1)

Disk Space:
$(df -h $BACKUP_DIR | tail -1)
SUMMARY_EOF

log "✓ Full backup completed successfully"
log "Backup summary: $SUMMARY_FILE"
EOF

chmod +x $SCRIPT_DIR/backup-full.sh

# Create restore script
cat > $SCRIPT_DIR/restore-backup.sh << 'EOF'
#!/bin/bash

# Restore backup script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
BACKUP_DIR="/opt/$PROJECT_NAME/backups"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[RESTORE] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Usage function
usage() {
    echo "Usage: $0 [database|uploads|config] [backup_file]"
    echo ""
    echo "Examples:"
    echo "  $0 database solevaeg_db_20240101_120000.sql.enc.gz"
    echo "  $0 uploads solevaeg_uploads_20240101_120000.tar.gz"
    echo "  $0 config solevaeg_config_20240101_120000.tar.gz"
    echo ""
    echo "Available backups:"
    echo "Database:"
    ls -1 $BACKUP_DIR/database/ 2>/dev/null | head -5 || echo "  No database backups found"
    echo "Uploads:"
    ls -1 $BACKUP_DIR/uploads/ 2>/dev/null | head -5 || echo "  No uploads backups found"
    echo "Config:"
    ls -1 $BACKUP_DIR/config/ 2>/dev/null | head -5 || echo "  No config backups found"
    exit 1
}

# Check parameters
if [ $# -ne 2 ]; then
    usage
fi

BACKUP_TYPE="$1"
BACKUP_FILE="$2"

case "$BACKUP_TYPE" in
    "database")
        BACKUP_PATH="$BACKUP_DIR/database/$BACKUP_FILE"
        ;;
    "uploads")
        BACKUP_PATH="$BACKUP_DIR/uploads/$BACKUP_FILE"
        ;;
    "config")
        BACKUP_PATH="$BACKUP_DIR/config/$BACKUP_FILE"
        ;;
    *)
        error "Invalid backup type: $BACKUP_TYPE"
        ;;
esac

# Check if backup file exists
if [ ! -f "$BACKUP_PATH" ]; then
    error "Backup file not found: $BACKUP_PATH"
fi

log "Starting restore process..."
log "Backup type: $BACKUP_TYPE"
log "Backup file: $BACKUP_FILE"

# Confirm restore
echo ""
warning "This will restore $BACKUP_TYPE from backup: $BACKUP_FILE"
warning "This action cannot be undone!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
fi

# Restore based on type
case "$BACKUP_TYPE" in
    "database")
        log "Restoring database..."
        
        # Create temporary file for processing
        TEMP_FILE=$(mktemp)
        
        # Handle compressed file
        if [[ "$BACKUP_FILE" == *.gz ]]; then
            gunzip -c "$BACKUP_PATH" > "$TEMP_FILE"
        else
            cp "$BACKUP_PATH" "$TEMP_FILE"
        fi
        
        # Handle encrypted file
        if [[ "$BACKUP_FILE" == *.enc* ]]; then
            if [ -z "$ENCRYPTION_KEY" ]; then
                error "Backup is encrypted but no encryption key provided"
            fi
            
            DECRYPTED_FILE=$(mktemp)
            if openssl enc -aes-256-cbc -d -in "$TEMP_FILE" -out "$DECRYPTED_FILE" -pass pass:"$ENCRYPTION_KEY"; then
                mv "$DECRYPTED_FILE" "$TEMP_FILE"
                log "✓ Backup decrypted"
            else
                error "Failed to decrypt backup"
            fi
        fi
        
        # Stop backend to prevent connections
        docker compose stop backend
        
        # Restore database
        if docker exec -i solevaeg-postgres psql -U solevaeg_user -d solevaeg_prod < "$TEMP_FILE"; then
            log "✓ Database restored successfully"
        else
            error "Failed to restore database"
        fi
        
        # Start backend
        docker compose start backend
        
        # Clean up
        rm "$TEMP_FILE"
        ;;
        
    "uploads")
        log "Restoring uploads..."
        
        # Stop services that might be using uploads
        docker compose stop backend frontend
        
        # Backup current uploads
        CURRENT_BACKUP="/tmp/current_uploads_$(date +%s).tar.gz"
        if [ -d "/opt/$PROJECT_NAME/data/uploads" ]; then
            tar -czf "$CURRENT_BACKUP" -C "/opt/$PROJECT_NAME/data" uploads
            log "Current uploads backed up to: $CURRENT_BACKUP"
        fi
        
        # Remove current uploads
        rm -rf "/opt/$PROJECT_NAME/data/uploads"
        
        # Extract backup
        if tar -xzf "$BACKUP_PATH" -C "/opt/$PROJECT_NAME/data"; then
            log "✓ Uploads restored successfully"
        else
            error "Failed to restore uploads"
        fi
        
        # Fix permissions
        chown -R $USER:$USER "/opt/$PROJECT_NAME/data/uploads"
        
        # Start services
        docker compose start backend frontend
        ;;
        
    "config")
        log "Restoring configuration..."
        
        # Create temporary directory
        TEMP_DIR=$(mktemp -d)
        
        # Extract backup
        if tar -xzf "$BACKUP_PATH" -C "$TEMP_DIR"; then
            log "✓ Configuration backup extracted"
            
            # Show what will be restored
            echo ""
            log "Configuration files to restore:"
            find "$TEMP_DIR" -type f | sed 's|'$TEMP_DIR'/||' | sort
            echo ""
            
            read -p "Proceed with configuration restore? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                # Copy files (be careful not to overwrite .env)
                cp -r "$TEMP_DIR"/solevaeg-config/* "/opt/$PROJECT_NAME/" 2>/dev/null || true
                log "✓ Configuration restored successfully"
                warning "Please review configuration files and restart services if needed"
            else
                log "Configuration restore cancelled"
            fi
        else
            error "Failed to extract configuration backup"
        fi
        
        # Clean up
        rm -rf "$TEMP_DIR"
        ;;
esac

log "Restore process completed"
EOF

chmod +x $SCRIPT_DIR/restore-backup.sh

# Create backup verification script
cat > $SCRIPT_DIR/verify-backup.sh << 'EOF'
#!/bin/bash

# Backup verification script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
BACKUP_DIR="/opt/$PROJECT_NAME/backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[VERIFY] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

log "Starting backup verification..."

# Check backup directories
for dir in database uploads config; do
    backup_path="$BACKUP_DIR/$dir"
    if [ -d "$backup_path" ]; then
        file_count=$(ls -1 "$backup_path" | wc -l)
        latest_backup=$(ls -t "$backup_path" | head -1)
        log "✓ $dir backups: $file_count files, latest: $latest_backup"
    else
        warning "Backup directory not found: $backup_path"
    fi
done

# Check backup sizes
log "Backup sizes:"
du -sh $BACKUP_DIR/* 2>/dev/null || warning "No backup directories found"

# Check disk space
log "Disk space:"
df -h $BACKUP_DIR | tail -1

# Test latest database backup
latest_db_backup=$(ls -t $BACKUP_DIR/database/ 2>/dev/null | head -1)
if [ -n "$latest_db_backup" ]; then
    log "Testing latest database backup: $latest_db_backup"
    
    # Basic file integrity check
    backup_file="$BACKUP_DIR/database/$latest_db_backup"
    if file "$backup_file" | grep -q "gzip"; then
        if gunzip -t "$backup_file" 2>/dev/null; then
            log "✓ Database backup file integrity OK"
        else
            error "Database backup file is corrupted"
        fi
    else
        log "Database backup is not compressed, skipping integrity check"
    fi
else
    warning "No database backups found"
fi

log "Backup verification completed"
EOF

chmod +x $SCRIPT_DIR/verify-backup.sh

# Setup backup cron jobs
log "Setting up backup cron jobs..."

# Create backup crontab
cat > /tmp/backup-cron << EOF
# Soleva Platform Backup Cron Jobs

# Daily database backup at 2 AM
0 2 * * * $SCRIPT_DIR/backup-database.sh

# Weekly uploads backup on Sunday at 3 AM
0 3 * * 0 $SCRIPT_DIR/backup-uploads.sh

# Weekly configuration backup on Sunday at 4 AM
0 4 * * 0 $SCRIPT_DIR/backup-config.sh

# Monthly full backup on 1st day at 1 AM
0 1 1 * * $SCRIPT_DIR/backup-full.sh

# Daily backup verification at 6 AM
0 6 * * * $SCRIPT_DIR/verify-backup.sh
EOF

# Install backup cron jobs
(crontab -l 2>/dev/null || echo "") | cat - /tmp/backup-cron | crontab -
rm /tmp/backup-cron

# Create backup status script
cat > $SCRIPT_DIR/backup-status.sh << 'EOF'
#!/bin/bash

# Backup status script for Soleva platform

PROJECT_NAME="solevaeg"
BACKUP_DIR="/opt/$PROJECT_NAME/backups"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Soleva Backup Status         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# Backup summary
echo -e "${BLUE}Backup Summary:${NC}"
for type in database uploads config; do
    backup_path="$BACKUP_DIR/$type"
    if [ -d "$backup_path" ]; then
        count=$(ls -1 "$backup_path" 2>/dev/null | wc -l)
        latest=$(ls -t "$backup_path" 2>/dev/null | head -1)
        size=$(du -sh "$backup_path" 2>/dev/null | cut -f1)
        echo "  $type: $count backups, latest: $latest, size: $size"
    else
        echo "  $type: No backups found"
    fi
done
echo ""

# Recent backup activity
echo -e "${BLUE}Recent Backup Activity:${NC}"
for log_file in $BACKUP_DIR/*/backup.log; do
    if [ -f "$log_file" ]; then
        echo "$(basename $(dirname $log_file)):"
        tail -3 "$log_file" | sed 's/^/  /'
    fi
done
echo ""

# Disk usage
echo -e "${BLUE}Disk Usage:${NC}"
df -h $BACKUP_DIR
echo ""

# Backup schedule
echo -e "${BLUE}Backup Schedule:${NC}"
echo "  Database: Daily at 2:00 AM"
echo "  Uploads: Weekly (Sunday) at 3:00 AM"
echo "  Config: Weekly (Sunday) at 4:00 AM"
echo "  Full: Monthly (1st) at 1:00 AM"
echo "  Verification: Daily at 6:00 AM"
EOF

chmod +x $SCRIPT_DIR/backup-status.sh

log "✓ Backup system setup completed!"
log ""
log "Backup commands:"
log "  Full backup: $SCRIPT_DIR/backup-full.sh"
log "  Database only: $SCRIPT_DIR/backup-database.sh"
log "  Uploads only: $SCRIPT_DIR/backup-uploads.sh"
log "  Config only: $SCRIPT_DIR/backup-config.sh"
log "  Restore: $SCRIPT_DIR/restore-backup.sh [type] [file]"
log "  Verify: $SCRIPT_DIR/verify-backup.sh"
log "  Status: $SCRIPT_DIR/backup-status.sh"
log ""
log "Backup schedule:"
log "  ✓ Daily database backup at 2:00 AM"
log "  ✓ Weekly uploads backup (Sunday) at 3:00 AM"  
log "  ✓ Weekly config backup (Sunday) at 4:00 AM"
log "  ✓ Monthly full backup (1st) at 1:00 AM"
log "  ✓ Daily verification at 6:00 AM"
log ""
log "Backup locations:"
log "  Database: $BACKUP_DIR/database/"
log "  Uploads: $BACKUP_DIR/uploads/"
log "  Config: $BACKUP_DIR/config/"
