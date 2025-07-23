#!/bin/bash

# Secrets Management Setup Script for ClaudeCodeUI
# Creates and manages Kubernetes secrets for production deployment

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default configuration
DEFAULT_NAMESPACE="claudecodeui"
DEFAULT_ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Setup and manage Kubernetes secrets for ClaudeCodeUI

OPTIONS:
    -e, --environment ENV       Target environment (staging, production) [default: $DEFAULT_ENVIRONMENT]
    -n, --namespace NAMESPACE   Kubernetes namespace [default: $DEFAULT_NAMESPACE]
    -c, --create               Create new secrets
    -u, --update               Update existing secrets
    -r, --rotate               Rotate all secrets
    -l, --list                 List all secrets
    -d, --delete               Delete secrets (use with caution)
    -v, --validate             Validate secret configuration
    -b, --backup               Backup secrets to encrypted file
    --restore FILE             Restore secrets from backup file
    --dry-run                  Show what would be done without making changes
    -h, --help                 Show this help message

SECRET TYPES:
    application     Application-specific secrets (JWT, session keys)
    database        Database credentials and connection strings
    external        External service API keys and tokens
    tls             TLS certificates and keys
    monitoring      Monitoring and alerting credentials

EXAMPLES:
    $0 -e production -c                 # Create all secrets for production
    $0 -n staging -u                    # Update secrets in staging namespace
    $0 --rotate --environment production # Rotate all production secrets
    $0 --backup production-secrets.enc  # Backup secrets to encrypted file

EOF
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v openssl >/dev/null 2>&1 || missing_tools+=("openssl")
    command -v base64 >/dev/null 2>&1 || missing_tools+=("base64")
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check Kubernetes connection
    if ! kubectl cluster-info >/dev/null 2>&1; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        log_warning "Namespace '$NAMESPACE' does not exist"
        if [[ "${DRY_RUN:-false}" == "false" ]]; then
            read -p "Create namespace? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kubectl create namespace "$NAMESPACE"
                log_success "Created namespace: $NAMESPACE"
            else
                log_error "Namespace required for operation"
                exit 1
            fi
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Generate secure random string
generate_secret() {
    local length="${1:-32}"
    openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
}

# Generate JWT secret
generate_jwt_secret() {
    openssl rand -hex 32
}

# Generate encryption key
generate_encryption_key() {
    openssl rand -base64 32
}

# Create application secrets
create_application_secrets() {
    log_info "Creating application secrets..."
    
    local jwt_secret session_secret encryption_key api_key
    jwt_secret=$(generate_jwt_secret)
    session_secret=$(generate_secret 64)
    encryption_key=$(generate_encryption_key)
    api_key=$(generate_secret 48)
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would create claudecodeui-secrets with application keys"
        return 0
    fi
    
    # Create or update the secret
    kubectl create secret generic claudecodeui-secrets \
        --namespace="$NAMESPACE" \
        --from-literal=JWT_SECRET="$jwt_secret" \
        --from-literal=SESSION_SECRET="$session_secret" \
        --from-literal=ENCRYPTION_KEY="$encryption_key" \
        --from-literal=API_KEY="$api_key" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Application secrets created/updated"
}

# Create database secrets
create_database_secrets() {
    log_info "Creating database secrets..."
    
    # Get database credentials from AWS Secrets Manager or generate
    local db_password
    if command -v aws >/dev/null 2>&1; then
        # Try to get from AWS Secrets Manager
        db_password=$(aws secretsmanager get-secret-value \
            --secret-id "claudecodeui-db-credentials" \
            --query 'SecretString' \
            --output text 2>/dev/null | jq -r '.password' 2>/dev/null || generate_secret 32)
    else
        db_password=$(generate_secret 32)
    fi
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would create claudecodeui-db-secrets"
        return 0
    fi
    
    kubectl create secret generic claudecodeui-db-secrets \
        --namespace="$NAMESPACE" \
        --from-literal=DB_PASSWORD="$db_password" \
        --from-literal=DB_HOST="${DB_HOST:-claudecodeui-db}" \
        --from-literal=DB_PORT="${DB_PORT:-3306}" \
        --from-literal=DB_NAME="${DB_NAME:-claudecodeui}" \
        --from-literal=DB_USER="${DB_USER:-admin}" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Database secrets created/updated"
}

# Create external service secrets
create_external_secrets() {
    log_info "Creating external service secrets..."
    
    # Placeholder for external service credentials
    local slack_webhook="${SLACK_WEBHOOK_URL:-}"
    local smtp_password="${SMTP_PASSWORD:-}"
    local monitoring_token="${MONITORING_TOKEN:-$(generate_secret 32)}"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would create claudecodeui-external-secrets"
        return 0
    fi
    
    kubectl create secret generic claudecodeui-external-secrets \
        --namespace="$NAMESPACE" \
        --from-literal=SLACK_WEBHOOK_URL="$slack_webhook" \
        --from-literal=SMTP_PASSWORD="$smtp_password" \
        --from-literal=MONITORING_TOKEN="$monitoring_token" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "External service secrets created/updated"
}

# Create TLS secrets
create_tls_secrets() {
    log_info "Creating TLS secrets..."
    
    local cert_file="${TLS_CERT_FILE:-}"
    local key_file="${TLS_KEY_FILE:-}"
    
    if [[ -z "$cert_file" || -z "$key_file" ]]; then
        log_warning "TLS certificate files not provided, generating self-signed certificate"
        
        # Generate self-signed certificate
        local temp_dir
        temp_dir=$(mktemp -d)
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$temp_dir/tls.key" \
            -out "$temp_dir/tls.crt" \
            -subj "/C=US/ST=CA/L=San Francisco/O=ClaudeCodeUI/CN=claudecodeui.local" \
            -extensions v3_req \
            -config <(cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = CA
L = San Francisco
O = ClaudeCodeUI
CN = claudecodeui.local

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = claudecodeui.local
DNS.2 = *.claudecodeui.local
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF
)
        
        cert_file="$temp_dir/tls.crt"
        key_file="$temp_dir/tls.key"
    fi
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would create claudecodeui-tls secret"
        return 0
    fi
    
    kubectl create secret tls claudecodeui-tls \
        --namespace="$NAMESPACE" \
        --cert="$cert_file" \
        --key="$key_file" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Cleanup temporary files
    if [[ "$cert_file" == *"/tmp/"* ]]; then
        rm -rf "$(dirname "$cert_file")"
    fi
    
    log_success "TLS secrets created/updated"
}

# Create monitoring secrets
create_monitoring_secrets() {
    log_info "Creating monitoring secrets..."
    
    local grafana_admin_password="${GRAFANA_ADMIN_PASSWORD:-$(generate_secret 16)}"
    local prometheus_token="${PROMETHEUS_TOKEN:-$(generate_secret 32)}"
    local alertmanager_webhook="${ALERTMANAGER_WEBHOOK:-}"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would create claudecodeui-monitoring-secrets"
        return 0
    fi
    
    kubectl create secret generic claudecodeui-monitoring-secrets \
        --namespace="$NAMESPACE" \
        --from-literal=GRAFANA_ADMIN_PASSWORD="$grafana_admin_password" \
        --from-literal=PROMETHEUS_TOKEN="$prometheus_token" \
        --from-literal=ALERTMANAGER_WEBHOOK="$alertmanager_webhook" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Monitoring secrets created/updated"
}

# List all secrets
list_secrets() {
    log_info "Listing secrets in namespace: $NAMESPACE"
    
    kubectl get secrets -n "$NAMESPACE" -o custom-columns="NAME:.metadata.name,TYPE:.type,AGE:.metadata.creationTimestamp" | grep -E "(claudecodeui|NAME)"
}

# Validate secrets
validate_secrets() {
    log_info "Validating secrets configuration..."
    
    local required_secrets=(
        "claudecodeui-secrets"
        "claudecodeui-db-secrets"
        "claudecodeui-tls"
    )
    
    local missing_secrets=()
    
    for secret in "${required_secrets[@]}"; do
        if ! kubectl get secret "$secret" -n "$NAMESPACE" >/dev/null 2>&1; then
            missing_secrets+=("$secret")
        fi
    done
    
    if [[ ${#missing_secrets[@]} -gt 0 ]]; then
        log_error "Missing required secrets: ${missing_secrets[*]}"
        return 1
    fi
    
    # Validate secret content
    log_info "Validating secret content..."
    
    # Check JWT secret length
    local jwt_secret_length
    jwt_secret_length=$(kubectl get secret claudecodeui-secrets -n "$NAMESPACE" -o jsonpath='{.data.JWT_SECRET}' | base64 -d | wc -c)
    if [[ "$jwt_secret_length" -lt 32 ]]; then
        log_error "JWT secret is too short (${jwt_secret_length} chars, minimum 32)"
        return 1
    fi
    
    # Check TLS certificate validity
    if ! kubectl get secret claudecodeui-tls -n "$NAMESPACE" -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -text >/dev/null 2>&1; then
        log_error "TLS certificate is invalid"
        return 1
    fi
    
    log_success "All secrets are valid"
}

# Backup secrets
backup_secrets() {
    local backup_file="$1"
    
    log_info "Backing up secrets to: $backup_file"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would backup secrets to $backup_file"
        return 0
    fi
    
    # Create backup directory
    local backup_dir
    backup_dir=$(dirname "$backup_file")
    mkdir -p "$backup_dir"
    
    # Export all claudecodeui secrets
    kubectl get secrets -n "$NAMESPACE" -l app.kubernetes.io/name=claudecodeui -o yaml > "${backup_file}.tmp"
    
    # Encrypt the backup
    local password
    echo "Enter encryption password for backup:"
    read -s password
    echo "Confirm password:"
    read -s password_confirm
    
    if [[ "$password" != "$password_confirm" ]]; then
        log_error "Passwords do not match"
        rm -f "${backup_file}.tmp"
        return 1
    fi
    
    openssl enc -aes-256-cbc -salt -in "${backup_file}.tmp" -out "$backup_file" -pass pass:"$password"
    rm -f "${backup_file}.tmp"
    
    log_success "Secrets backed up to: $backup_file"
}

# Restore secrets
restore_secrets() {
    local backup_file="$1"
    
    log_info "Restoring secrets from: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would restore secrets from $backup_file"
        return 0
    fi
    
    # Decrypt the backup
    local password
    echo "Enter decryption password:"
    read -s password
    
    if ! openssl enc -aes-256-cbc -d -in "$backup_file" -out "${backup_file}.tmp" -pass pass:"$password"; then
        log_error "Failed to decrypt backup file"
        return 1
    fi
    
    # Apply the secrets
    kubectl apply -f "${backup_file}.tmp"
    rm -f "${backup_file}.tmp"
    
    log_success "Secrets restored from: $backup_file"
}

# Rotate secrets
rotate_secrets() {
    log_info "Rotating all secrets..."
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would rotate all secrets"
        return 0
    fi
    
    # Backup current secrets
    local backup_file="$PROJECT_ROOT/secrets-backup-$(date +%Y%m%d-%H%M%S).enc"
    backup_secrets "$backup_file"
    
    # Create new secrets
    create_application_secrets
    create_database_secrets
    create_external_secrets
    create_monitoring_secrets
    
    log_success "All secrets rotated successfully"
    log_info "Backup saved to: $backup_file"
}

# Delete secrets
delete_secrets() {
    log_warning "This will delete ALL ClaudeCodeUI secrets in namespace: $NAMESPACE"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would delete all claudecodeui secrets"
        return 0
    fi
    
    read -p "Are you sure? Type 'DELETE' to confirm: " confirm
    if [[ "$confirm" != "DELETE" ]]; then
        log_info "Operation cancelled"
        return 0
    fi
    
    # Delete all claudecodeui secrets
    kubectl delete secrets -n "$NAMESPACE" -l app.kubernetes.io/name=claudecodeui 2>/dev/null || true
    kubectl delete secret claudecodeui-secrets -n "$NAMESPACE" 2>/dev/null || true
    kubectl delete secret claudecodeui-db-secrets -n "$NAMESPACE" 2>/dev/null || true
    kubectl delete secret claudecodeui-external-secrets -n "$NAMESPACE" 2>/dev/null || true
    kubectl delete secret claudecodeui-tls -n "$NAMESPACE" 2>/dev/null || true
    kubectl delete secret claudecodeui-monitoring-secrets -n "$NAMESPACE" 2>/dev/null || true
    
    log_success "All secrets deleted"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -c|--create)
                CREATE=true
                shift
                ;;
            -u|--update)
                UPDATE=true
                shift
                ;;
            -r|--rotate)
                ROTATE=true
                shift
                ;;
            -l|--list)
                LIST=true
                shift
                ;;
            -d|--delete)
                DELETE=true
                shift
                ;;
            -v|--validate)
                VALIDATE=true
                shift
                ;;
            -b|--backup)
                BACKUP=true
                BACKUP_FILE="$2"
                shift 2
                ;;
            --restore)
                RESTORE=true
                RESTORE_FILE="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Set defaults
    ENVIRONMENT="${ENVIRONMENT:-$DEFAULT_ENVIRONMENT}"
    NAMESPACE="${NAMESPACE:-$DEFAULT_NAMESPACE-$ENVIRONMENT}"
    CREATE="${CREATE:-false}"
    UPDATE="${UPDATE:-false}"
    ROTATE="${ROTATE:-false}"
    LIST="${LIST:-false}"
    DELETE="${DELETE:-false}"
    VALIDATE="${VALIDATE:-false}"
    BACKUP="${BACKUP:-false}"
    RESTORE="${RESTORE:-false}"
    DRY_RUN="${DRY_RUN:-false}"
}

# Main function
main() {
    parse_args "$@"
    
    log_info "ClaudeCodeUI Secrets Management"
    log_info "=============================="
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace: $NAMESPACE"
    
    check_prerequisites
    
    # Execute requested operations
    if [[ "$LIST" == "true" ]]; then
        list_secrets
    fi
    
    if [[ "$VALIDATE" == "true" ]]; then
        validate_secrets
    fi
    
    if [[ "$CREATE" == "true" || "$UPDATE" == "true" ]]; then
        create_application_secrets
        create_database_secrets
        create_external_secrets
        create_tls_secrets
        create_monitoring_secrets
    fi
    
    if [[ "$ROTATE" == "true" ]]; then
        rotate_secrets
    fi
    
    if [[ "$BACKUP" == "true" ]]; then
        backup_secrets "$BACKUP_FILE"
    fi
    
    if [[ "$RESTORE" == "true" ]]; then
        restore_secrets "$RESTORE_FILE"
    fi
    
    if [[ "$DELETE" == "true" ]]; then
        delete_secrets
    fi
    
    log_success "Secrets management completed successfully!"
}

# Execute main function
main "$@"