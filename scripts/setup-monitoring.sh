#!/bin/bash

# Setup monitoring and health checks for Soleva E-commerce Platform

set -e

PROJECT_NAME="solevaeg"
LOG_DIR="/opt/$PROJECT_NAME/logs"
SCRIPT_DIR="/opt/$PROJECT_NAME/scripts"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[MONITORING] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

log "Setting up monitoring and health checks..."

# Create monitoring directories
sudo mkdir -p $LOG_DIR/{nginx,app,system}
sudo mkdir -p $SCRIPT_DIR
sudo chown -R $USER:$USER /opt/$PROJECT_NAME

# Create health check script
cat > $SCRIPT_DIR/health-check.sh << 'EOF'
#!/bin/bash

# Health check script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
LOG_FILE="/opt/$PROJECT_NAME/logs/system/health-check.log"
ALERT_WEBHOOK="${UPTIME_WEBHOOK_URL:-}"

# Timestamp function
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Logging function
log() {
    echo "[$(timestamp)] $1" | tee -a $LOG_FILE
}

# Alert function
alert() {
    local message="$1"
    local severity="${2:-warning}"
    
    log "ALERT [$severity]: $message"
    
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 Soleva Alert [$severity]: $message\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
            --max-time 10 --silent || true
    fi
}

# Check service health
check_service() {
    local service_name="$1"
    local health_url="$2"
    
    if curl -f --max-time 10 --silent "$health_url" > /dev/null 2>&1; then
        log "✓ $service_name is healthy"
        return 0
    else
        alert "$service_name is unhealthy (URL: $health_url)" "critical"
        return 1
    fi
}

# Check Docker container
check_container() {
    local container_name="$1"
    
    if docker ps --format "table {{.Names}}" | grep -q "^$container_name$"; then
        log "✓ Container $container_name is running"
        return 0
    else
        alert "Container $container_name is not running" "critical"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local threshold=85
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -lt "$threshold" ]; then
        log "✓ Disk usage: ${usage}%"
        return 0
    else
        alert "High disk usage: ${usage}% (threshold: ${threshold}%)" "warning"
        return 1
    fi
}

# Check memory usage
check_memory() {
    local threshold=90
    local usage=$(free | awk '/^Mem:/{printf("%.0f", $3/$2 * 100)}')
    
    if [ "$usage" -lt "$threshold" ]; then
        log "✓ Memory usage: ${usage}%"
        return 0
    else
        alert "High memory usage: ${usage}% (threshold: ${threshold}%)" "warning"
        return 1
    fi
}

# Check SSL certificate expiry
check_ssl_expiry() {
    local domain="$1"
    local days_threshold=30
    
    if command -v openssl &> /dev/null; then
        local expiry_date=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        
        if [ -n "$expiry_date" ]; then
            local expiry_epoch=$(date -d "$expiry_date" +%s)
            local current_epoch=$(date +%s)
            local days_remaining=$(( (expiry_epoch - current_epoch) / 86400 ))
            
            if [ "$days_remaining" -gt "$days_threshold" ]; then
                log "✓ SSL certificate expires in $days_remaining days"
                return 0
            else
                alert "SSL certificate expires in $days_remaining days (threshold: $days_threshold)" "warning"
                return 1
            fi
        else
            alert "Could not check SSL certificate for $domain" "warning"
            return 1
        fi
    else
        log "OpenSSL not available, skipping SSL check"
        return 0
    fi
}

# Main health check
log "Starting health check..."

# Check Docker containers
check_container "solevaeg-frontend"
check_container "solevaeg-backend" 
check_container "solevaeg-postgres"
check_container "solevaeg-redis"
check_container "solevaeg-nginx"

# Check service endpoints
check_service "Frontend" "http://localhost:5173/health"
check_service "Backend" "http://localhost:3001/health"
check_service "Admin Panel" "http://localhost:3002/health"

# Check system resources
check_disk_space
check_memory

# Check SSL certificate (if in production)
if [ "$NODE_ENV" = "production" ]; then
    check_ssl_expiry "solevaeg.com"
fi

log "Health check completed"
EOF

chmod +x $SCRIPT_DIR/health-check.sh

# Create log rotation configuration
cat > /tmp/solevaeg-logrotate << EOF
$LOG_DIR/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 www-data www-data
    postrotate
        docker kill -s USR1 solevaeg-nginx 2>/dev/null || true
    endscript
}

$LOG_DIR/app/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 $USER $USER
}

$LOG_DIR/system/*.log {
    weekly
    missingok
    rotate 8
    compress
    notifempty
    create 644 $USER $USER
}
EOF

sudo mv /tmp/solevaeg-logrotate /etc/logrotate.d/solevaeg

# Create system monitoring script
cat > $SCRIPT_DIR/system-monitor.sh << 'EOF'
#!/bin/bash

# System monitoring script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
LOG_FILE="/opt/$PROJECT_NAME/logs/system/system-monitor.log"
METRICS_FILE="/opt/$PROJECT_NAME/logs/system/metrics.json"

# Timestamp function
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Collect system metrics
collect_metrics() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    local memory_usage=$(free | awk '/^Mem:/{printf("%.1f", $3/$2 * 100)}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    local load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    # Docker container stats
    local frontend_status=$(docker inspect -f '{{.State.Status}}' solevaeg-frontend 2>/dev/null || echo "not_found")
    local backend_status=$(docker inspect -f '{{.State.Status}}' solevaeg-backend 2>/dev/null || echo "not_found")
    local db_status=$(docker inspect -f '{{.State.Status}}' solevaeg-postgres 2>/dev/null || echo "not_found")
    local redis_status=$(docker inspect -f '{{.State.Status}}' solevaeg-redis 2>/dev/null || echo "not_found")
    local nginx_status=$(docker inspect -f '{{.State.Status}}' solevaeg-nginx 2>/dev/null || echo "not_found")
    
    # Create metrics JSON
    cat > $METRICS_FILE << METRICS_EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "system": {
        "cpu_usage": $cpu_usage,
        "memory_usage": $memory_usage,
        "disk_usage": $disk_usage,
        "load_average": $load_average
    },
    "containers": {
        "frontend": "$frontend_status",
        "backend": "$backend_status",
        "database": "$db_status",
        "redis": "$redis_status",
        "nginx": "$nginx_status"
    }
}
METRICS_EOF
    
    echo "[$(timestamp)] Metrics collected" >> $LOG_FILE
}

# Main execution
collect_metrics
EOF

chmod +x $SCRIPT_DIR/system-monitor.sh

# Create uptime monitoring script
cat > $SCRIPT_DIR/uptime-monitor.sh << 'EOF'
#!/bin/bash

# Uptime monitoring script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
LOG_FILE="/opt/$PROJECT_NAME/logs/system/uptime-monitor.log"
ALERT_WEBHOOK="${UPTIME_WEBHOOK_URL:-}"

# Services to monitor
declare -A SERVICES=(
    ["Frontend"]="https://solevaeg.com"
    ["API"]="https://api.solevaeg.com/health"
    ["Admin"]="https://admin.solevaeg.com"
)

# Timestamp function
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Alert function
alert() {
    local service="$1"
    local message="$2"
    
    echo "[$(timestamp)] ALERT: $service - $message" >> $LOG_FILE
    
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 Soleva Uptime Alert: $service - $message\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
            --max-time 10 --silent || true
    fi
}

# Check service uptime
check_uptime() {
    local service_name="$1"
    local service_url="$2"
    
    local start_time=$(date +%s%N)
    local http_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time 30 "$service_url" || echo "000")
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    if [[ "$http_code" =~ ^[23][0-9][0-9]$ ]]; then
        echo "[$(timestamp)] ✓ $service_name (${response_time}ms) - HTTP $http_code" >> $LOG_FILE
    else
        alert "$service_name" "Service down - HTTP $http_code (Response time: ${response_time}ms)"
    fi
}

# Main execution
for service in "${!SERVICES[@]}"; do
    check_uptime "$service" "${SERVICES[$service]}"
done
EOF

chmod +x $SCRIPT_DIR/uptime-monitor.sh

# Create performance monitoring script
cat > $SCRIPT_DIR/performance-monitor.sh << 'EOF'
#!/bin/bash

# Performance monitoring script for Soleva platform
set -e

PROJECT_NAME="solevaeg"
LOG_FILE="/opt/$PROJECT_NAME/logs/system/performance-monitor.log"

# Timestamp function
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Monitor database performance
monitor_database() {
    local db_stats=$(docker exec solevaeg-postgres psql -U solevaeg_user -d solevaeg_prod -t -c "
        SELECT 
            'connections', numbackends,
            'queries_per_sec', xact_commit + xact_rollback,
            'cache_hit_ratio', ROUND(blks_hit::numeric / (blks_hit + blks_read) * 100, 2)
        FROM pg_stat_database 
        WHERE datname = 'solevaeg_prod';
    " 2>/dev/null || echo "DB check failed")
    
    echo "[$(timestamp)] Database stats: $db_stats" >> $LOG_FILE
}

# Monitor Redis performance
monitor_redis() {
    local redis_info=$(docker exec solevaeg-redis redis-cli info stats 2>/dev/null | grep -E "total_commands_processed|used_memory_human" || echo "Redis check failed")
    
    echo "[$(timestamp)] Redis stats: $redis_info" >> $LOG_FILE
}

# Monitor application logs for errors
monitor_app_errors() {
    local error_count=$(docker logs solevaeg-backend --since="5m" 2>&1 | grep -i error | wc -l || echo "0")
    
    if [ "$error_count" -gt 10 ]; then
        echo "[$(timestamp)] WARNING: High error count in backend logs: $error_count" >> $LOG_FILE
    else
        echo "[$(timestamp)] Backend error count: $error_count" >> $LOG_FILE
    fi
}

# Main execution
monitor_database
monitor_redis
monitor_app_errors
EOF

chmod +x $SCRIPT_DIR/performance-monitor.sh

# Setup cron jobs for monitoring
log "Setting up monitoring cron jobs..."

# Create monitoring crontab
cat > /tmp/monitoring-cron << EOF
# Soleva Platform Monitoring Cron Jobs

# Health check every 5 minutes
*/5 * * * * $SCRIPT_DIR/health-check.sh

# System metrics every minute
* * * * * $SCRIPT_DIR/system-monitor.sh

# Uptime monitoring every 2 minutes
*/2 * * * * $SCRIPT_DIR/uptime-monitor.sh

# Performance monitoring every 10 minutes
*/10 * * * * $SCRIPT_DIR/performance-monitor.sh

# Daily summary report at 8 AM
0 8 * * * docker exec solevaeg-backend npm run analytics:daily-summary
EOF

# Install cron jobs
(crontab -l 2>/dev/null || echo "") | cat - /tmp/monitoring-cron | crontab -
rm /tmp/monitoring-cron

# Create monitoring dashboard script
cat > $SCRIPT_DIR/monitoring-dashboard.sh << 'EOF'
#!/bin/bash

# Simple monitoring dashboard for Soleva platform
set -e

PROJECT_NAME="solevaeg"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Soleva Monitoring Dashboard   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# System status
echo -e "${BLUE}System Status:${NC}"
echo "  Uptime: $(uptime -p)"
echo "  Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "  Memory: $(free -h | awk '/^Mem:/{printf "%s/%s (%.1f%%)", $3, $2, $3/$2*100}')"
echo "  Disk: $(df -h / | tail -1 | awk '{printf "%s/%s (%s)", $3, $2, $5}')"
echo ""

# Docker containers
echo -e "${BLUE}Container Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep solevaeg || echo "  No containers found"
echo ""

# Recent logs
echo -e "${BLUE}Recent Health Check:${NC}"
tail -5 /opt/$PROJECT_NAME/logs/system/health-check.log 2>/dev/null || echo "  No health check logs found"
echo ""

# Service endpoints
echo -e "${BLUE}Service Health:${NC}"
services=("https://solevaeg.com" "https://api.solevaeg.com/health" "https://admin.solevaeg.com")
for service in "${services[@]}"; do
    if curl -f --max-time 5 --silent "$service" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $service"
    else
        echo -e "  ${RED}✗${NC} $service"
    fi
done
EOF

chmod +x $SCRIPT_DIR/monitoring-dashboard.sh

# Create monitoring summary script
cat > $SCRIPT_DIR/monitoring-summary.sh << 'EOF'
#!/bin/bash

# Generate monitoring summary for Soleva platform
set -e

PROJECT_NAME="solevaeg"
SUMMARY_FILE="/opt/$PROJECT_NAME/logs/system/daily-summary.txt"

# Generate summary
cat > $SUMMARY_FILE << SUMMARY_EOF
Soleva Platform Daily Summary - $(date '+%Y-%m-%d')
================================================

System Status:
- Uptime: $(uptime -p)
- Load Average: $(uptime | awk -F'load average:' '{print $2}')
- Memory Usage: $(free | awk '/^Mem:/{printf "%.1f%%", $3/$2*100}')
- Disk Usage: $(df / | tail -1 | awk '{print $5}')

Container Status:
$(docker ps --format "- {{.Names}}: {{.Status}}" | grep solevaeg)

Recent Alerts (last 24 hours):
$(grep "ALERT" /opt/$PROJECT_NAME/logs/system/health-check.log | tail -10 || echo "No alerts")

Performance Metrics:
$(tail -5 /opt/$PROJECT_NAME/logs/system/performance-monitor.log || echo "No performance data")

SUMMARY_EOF

echo "Daily summary generated: $SUMMARY_FILE"
EOF

chmod +x $SCRIPT_DIR/monitoring-summary.sh

log "✓ Monitoring setup completed!"
log "✓ Health checks will run every 5 minutes"
log "✓ System metrics collected every minute"
log "✓ Uptime monitoring every 2 minutes"
log "✓ Performance monitoring every 10 minutes"
log ""
log "Monitoring commands:"
log "  Dashboard: $SCRIPT_DIR/monitoring-dashboard.sh"
log "  Manual health check: $SCRIPT_DIR/health-check.sh"
log "  Daily summary: $SCRIPT_DIR/monitoring-summary.sh"
log ""
log "Log locations:"
log "  Health: $LOG_DIR/system/health-check.log"
log "  Metrics: $LOG_DIR/system/metrics.json"
log "  Uptime: $LOG_DIR/system/uptime-monitor.log"
log "  Performance: $LOG_DIR/system/performance-monitor.log"
