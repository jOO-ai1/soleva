#!/bin/bash

# ====== Soleva E-commerce Platform - Production Configuration Validator ======
# This script validates the production configuration for completeness and security

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if env.production exists
if [ ! -f "env.production" ]; then
    error "env.production file not found"
    exit 1
fi

log "Validating Soleva E-commerce Platform Production Configuration..."

# Load environment variables (handle quoted values properly)
set -a
source env.production
set +a

# Validation counters
total_checks=0
passed_checks=0
warnings=0
errors=0

# Function to check if variable is set and not empty
check_var() {
    local var_name=$1
    local var_value=$2
    local is_critical=${3:-true}
    
    total_checks=$((total_checks + 1))
    
    if [ -z "$var_value" ]; then
        if [ "$is_critical" = true ]; then
            error "$var_name is not set or empty"
            errors=$((errors + 1))
        else
            warning "$var_name is not set (optional)"
            warnings=$((warnings + 1))
        fi
    else
        success "$var_name is configured"
        passed_checks=$((passed_checks + 1))
    fi
}

# Function to check if value contains placeholder
check_placeholder() {
    local var_name=$1
    local var_value=$2
    
    if [[ "$var_value" == *"YOUR_"* ]] || [[ "$var_value" == *"your-"* ]] || [[ "$var_value" == *"PLACEHOLDER"* ]]; then
        warning "$var_name contains placeholder value: $var_value"
        warnings=$((warnings + 1))
    fi
}

# Function to validate password strength
check_password_strength() {
    local var_name=$1
    local var_value=$2
    local min_length=${3:-8}
    
    if [ ${#var_value} -lt $min_length ]; then
        warning "$var_name is too short (minimum $min_length characters)"
        warnings=$((warnings + 1))
    elif [[ ! "$var_value" =~ [A-Z] ]] || [[ ! "$var_value" =~ [a-z] ]] || [[ ! "$var_value" =~ [0-9] ]]; then
        warning "$var_name should contain uppercase, lowercase, and numbers"
        warnings=$((warnings + 1))
    fi
}

# Function to validate URL format
check_url() {
    local var_name=$1
    local var_value=$2
    
    if [[ "$var_value" =~ ^https?:// ]]; then
        success "$var_name has valid URL format"
    else
        error "$var_name has invalid URL format: $var_value"
        errors=$((errors + 1))
    fi
}

# Function to validate email format
check_email() {
    local var_name=$1
    local var_value=$2
    
    if [[ "$var_value" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        success "$var_name has valid email format"
    else
        error "$var_name has invalid email format: $var_value"
        errors=$((errors + 1))
    fi
}

echo "=========================================="
echo "  CONFIGURATION VALIDATION REPORT"
echo "=========================================="
echo ""

# ====== CRITICAL CONFIGURATION ======
log "Checking critical configuration..."

# Application Settings
check_var "NODE_ENV" "$NODE_ENV"
check_var "DOMAIN" "$DOMAIN"
check_var "FRONTEND_URL" "$FRONTEND_URL"
check_var "BACKEND_URL" "$BACKEND_URL"
check_var "ADMIN_URL" "$ADMIN_URL"

# Database Configuration
check_var "POSTGRES_HOST" "$POSTGRES_HOST"
check_var "POSTGRES_PORT" "$POSTGRES_PORT"
check_var "POSTGRES_DB" "$POSTGRES_DB"
check_var "POSTGRES_USER" "$POSTGRES_USER"
check_var "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD"
check_var "DATABASE_URL" "$DATABASE_URL"

# Redis Configuration
check_var "REDIS_HOST" "$REDIS_HOST"
check_var "REDIS_PORT" "$REDIS_PORT"
check_var "REDIS_PASSWORD" "$REDIS_PASSWORD"
check_var "REDIS_URL" "$REDIS_URL"

# JWT Configuration
check_var "JWT_SECRET" "$JWT_SECRET"
check_var "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET"
check_var "JWT_EXPIRES_IN" "$JWT_EXPIRES_IN"
check_var "JWT_REFRESH_EXPIRES_IN" "$JWT_REFRESH_EXPIRES_IN"

# Admin Configuration
check_var "ADMIN_EMAIL" "$ADMIN_EMAIL"
check_var "ADMIN_PASSWORD" "$ADMIN_PASSWORD"
check_var "ADMIN_NAME" "$ADMIN_NAME"

# SMTP Configuration
check_var "SMTP_HOST" "$SMTP_HOST"
check_var "SMTP_PORT" "$SMTP_PORT"
check_var "SMTP_USER" "$SMTP_USER"
check_var "SMTP_PASS" "$SMTP_PASS"

echo ""

# ====== SECURITY VALIDATION ======
log "Validating security settings..."

# Password strength checks
check_password_strength "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD" 12
check_password_strength "REDIS_PASSWORD" "$REDIS_PASSWORD" 12
check_password_strength "ADMIN_PASSWORD" "$ADMIN_PASSWORD" 8
check_password_strength "SMTP_PASS" "$SMTP_PASS" 8

# JWT Secret length checks
if [ ${#JWT_SECRET} -ge 64 ]; then
    success "JWT_SECRET has sufficient length (${#JWT_SECRET} chars)"
else
    error "JWT_SECRET is too short (${#JWT_SECRET} chars, minimum 64)"
    errors=$((errors + 1))
fi

if [ ${#JWT_REFRESH_SECRET} -ge 64 ]; then
    success "JWT_REFRESH_SECRET has sufficient length (${#JWT_REFRESH_SECRET} chars)"
else
    error "JWT_REFRESH_SECRET is too short (${#JWT_REFRESH_SECRET} chars, minimum 64)"
    errors=$((errors + 1))
fi

echo ""

# ====== URL VALIDATION ======
log "Validating URL formats..."

check_url "FRONTEND_URL" "$FRONTEND_URL"
check_url "BACKEND_URL" "$BACKEND_URL"
check_url "ADMIN_URL" "$ADMIN_URL"
check_url "VITE_API_URL" "$VITE_API_URL"

echo ""

# ====== EMAIL VALIDATION ======
log "Validating email formats..."

check_email "ADMIN_EMAIL" "$ADMIN_EMAIL"
check_email "EMAIL_INFO" "$EMAIL_INFO"
check_email "EMAIL_SALES" "$EMAIL_SALES"
check_email "EMAIL_BUSINESS" "$EMAIL_BUSINESS"
check_email "EMAIL_SUPPORT" "$EMAIL_SUPPORT"
check_email "SMTP_USER" "$SMTP_USER"

echo ""

# ====== OPTIONAL CONFIGURATION ======
log "Checking optional configuration..."

# Social Login
check_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" false
check_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET" false
check_var "FACEBOOK_APP_ID" "$FACEBOOK_APP_ID" false
check_var "FACEBOOK_APP_SECRET" "$FACEBOOK_APP_SECRET" false

# Analytics
check_var "GA4_MEASUREMENT_ID" "$GA4_MEASUREMENT_ID" false
check_var "GTM_CONTAINER_ID" "$GTM_CONTAINER_ID" false
check_var "FACEBOOK_PIXEL_ID" "$FACEBOOK_PIXEL_ID" false

# Monitoring
check_var "SENTRY_DSN" "$SENTRY_DSN" false
check_var "UPTIME_WEBHOOK_URL" "$UPTIME_WEBHOOK_URL" false
check_var "SLACK_WEBHOOK_URL" "$SLACK_WEBHOOK_URL" false

# OpenAI
check_var "OPENAI_API_KEY" "$OPENAI_API_KEY" false

echo ""

# ====== PLACEHOLDER CHECK ======
log "Checking for placeholder values..."

check_placeholder "FACEBOOK_APP_ID" "$FACEBOOK_APP_ID"
check_placeholder "FACEBOOK_APP_SECRET" "$FACEBOOK_APP_SECRET"
check_placeholder "SENTRY_DSN" "$SENTRY_DSN"
check_placeholder "FACEBOOK_PIXEL_ID" "$FACEBOOK_PIXEL_ID"
check_placeholder "UPTIME_WEBHOOK_URL" "$UPTIME_WEBHOOK_URL"
check_placeholder "SLACK_WEBHOOK_URL" "$SLACK_WEBHOOK_URL"

echo ""

# ====== FEATURE FLAGS ======
log "Checking feature flags..."

features=(
    "ENABLE_CHAT_WIDGET"
    "ENABLE_SOCIAL_LOGIN"
    "ENABLE_ANALYTICS"
    "ENABLE_PAYMENT_PROOFS"
    "ENABLE_ADAPTIVE_MODE"
    "ENABLE_COD"
    "ENABLE_BANK_WALLET"
    "ENABLE_DIGITAL_WALLET"
)

for feature in "${features[@]}"; do
    if [ "${!feature}" = "true" ] || [ "${!feature}" = "false" ]; then
        success "$feature is properly configured: ${!feature}"
    else
        warning "$feature should be 'true' or 'false', current value: ${!feature}"
        warnings=$((warnings + 1))
    fi
done

echo ""

# ====== SUMMARY ======
echo "=========================================="
echo "  VALIDATION SUMMARY"
echo "=========================================="
echo ""
echo "Total Checks: $total_checks"
echo -e "${GREEN}Passed: $passed_checks${NC}"
echo -e "${YELLOW}Warnings: $warnings${NC}"
echo -e "${RED}Errors: $errors${NC}"
echo ""

if [ $errors -eq 0 ]; then
    if [ $warnings -eq 0 ]; then
        success "Configuration is perfect! Ready for production deployment."
        exit 0
    else
        warning "Configuration has $warnings warnings but no errors. Review warnings before deployment."
        exit 0
    fi
else
    error "Configuration has $errors errors. Please fix errors before deployment."
    exit 1
fi
