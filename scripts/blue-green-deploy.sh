#!/bin/bash

# Blue-Green Deployment Script for ClaudeCodeUI
# This script implements automated blue-green deployment with health checks and rollback

set -euo pipefail

# Configuration
NAMESPACE="claudecodeui"
APP_NAME="claudecodeui"
HEALTH_CHECK_URL="/health"
HEALTH_CHECK_TIMEOUT=300
HEALTH_CHECK_INTERVAL=10
ROLLBACK_TIMEOUT=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Blue-Green Deployment Script for ClaudeCodeUI

OPTIONS:
    -i, --image IMAGE_TAG       Docker image tag to deploy (required)
    -n, --namespace NAMESPACE   Kubernetes namespace (default: claudecodeui)
    -d, --dry-run              Perform a dry run without making changes
    -f, --force                Force deployment without health checks
    -r, --rollback             Rollback to previous deployment
    -h, --help                 Show this help message

EXAMPLES:
    $0 -i v1.2.0                    # Deploy version v1.2.0
    $0 -i latest --dry-run          # Dry run with latest image
    $0 --rollback                   # Rollback to previous version
    $0 -i v1.2.0 --force           # Force deployment without health checks

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -i|--image)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -r|--rollback)
                ROLLBACK=true
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

    # Validate required arguments
    if [[ "${ROLLBACK:-false}" == "false" && -z "${IMAGE_TAG:-}" ]]; then
        log_error "Image tag is required when not performing rollback"
        usage
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi

    # Check if deployments exist
    if ! kubectl get deployment "$APP_NAME-blue" -n "$NAMESPACE" &> /dev/null || \
       ! kubectl get deployment "$APP_NAME-green" -n "$NAMESPACE" &> /dev/null; then
        log_error "Blue or Green deployment not found in namespace '$NAMESPACE'"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Get current active deployment slot
get_active_slot() {
    local service_selector
    service_selector=$(kubectl get service "$APP_NAME-service" -n "$NAMESPACE" -o jsonpath='{.spec.selector.deployment\.claudecodeui\.io/slot}' 2>/dev/null || echo "")
    
    if [[ "$service_selector" == "blue" ]]; then
        echo "blue"
    elif [[ "$service_selector" == "green" ]]; then
        echo "green"
    else
        log_warning "Cannot determine active slot, defaulting to blue"
        echo "blue"
    fi
}

# Get inactive deployment slot
get_inactive_slot() {
    local active_slot="$1"
    if [[ "$active_slot" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Wait for deployment to be ready
wait_for_deployment() {
    local deployment="$1"
    local timeout="$2"
    
    log_info "Waiting for deployment $deployment to be ready..."
    
    if kubectl wait --for=condition=available --timeout="${timeout}s" deployment/"$deployment" -n "$NAMESPACE"; then
        log_success "Deployment $deployment is ready"
        return 0
    else
        log_error "Deployment $deployment failed to become ready within ${timeout}s"
        return 1
    fi
}

# Perform health check
health_check() {
    local slot="$1"
    local service="$APP_NAME-${slot}-service"
    local start_time=$(date +%s)
    local end_time=$((start_time + HEALTH_CHECK_TIMEOUT))
    
    log_info "Performing health check for $slot slot..."
    
    # Port forward to the service for health check
    kubectl port-forward "service/$service" 8080:3008 -n "$NAMESPACE" &> /dev/null &
    local port_forward_pid=$!
    
    # Give port-forward time to establish
    sleep 5
    
    while [[ $(date +%s) -lt $end_time ]]; do
        if curl -f -s "http://localhost:8080$HEALTH_CHECK_URL" &> /dev/null; then
            kill $port_forward_pid 2>/dev/null || true
            log_success "Health check passed for $slot slot"
            return 0
        fi
        
        log_info "Health check failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    kill $port_forward_pid 2>/dev/null || true
    log_error "Health check failed for $slot slot after ${HEALTH_CHECK_TIMEOUT}s"
    return 1
}

# Switch traffic to new deployment
switch_traffic() {
    local new_slot="$1"
    
    log_info "Switching traffic to $new_slot slot..."
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would switch traffic to $new_slot slot"
        return 0
    fi
    
    # Update service selector to point to new slot
    kubectl patch service "$APP_NAME-service" -n "$NAMESPACE" \
        -p '{"spec":{"selector":{"deployment.claudecodeui.io/slot":"'$new_slot'"}}}' || {
        log_error "Failed to switch traffic to $new_slot slot"
        return 1
    }
    
    log_success "Traffic switched to $new_slot slot"
}

# Scale down old deployment
scale_down_old() {
    local old_slot="$1"
    
    log_info "Scaling down $old_slot deployment..."
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would scale down $old_slot deployment"
        return 0
    fi
    
    kubectl scale deployment "$APP_NAME-$old_slot" --replicas=0 -n "$NAMESPACE" || {
        log_warning "Failed to scale down $old_slot deployment"
        return 1
    }
    
    log_success "$old_slot deployment scaled down"
}

# Rollback deployment
rollback_deployment() {
    log_info "Starting rollback process..."
    
    local current_slot
    current_slot=$(get_active_slot)
    local previous_slot
    previous_slot=$(get_inactive_slot "$current_slot")
    
    log_info "Current active slot: $current_slot"
    log_info "Rolling back to slot: $previous_slot"
    
    # Check if previous deployment exists and has pods
    local previous_replicas
    previous_replicas=$(kubectl get deployment "$APP_NAME-$previous_slot" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    
    if [[ "$previous_replicas" == "0" ]]; then
        log_info "Scaling up $previous_slot deployment for rollback..."
        kubectl scale deployment "$APP_NAME-$previous_slot" --replicas=3 -n "$NAMESPACE" || {
            log_error "Failed to scale up $previous_slot deployment"
            exit 1
        }
        
        if ! wait_for_deployment "$APP_NAME-$previous_slot" 300; then
            log_error "Failed to bring up $previous_slot deployment"
            exit 1
        fi
    fi
    
    # Perform health check on previous deployment
    if [[ "${FORCE:-false}" != "true" ]]; then
        if ! health_check "$previous_slot"; then
            log_error "Health check failed for $previous_slot deployment"
            exit 1
        fi
    fi
    
    # Switch traffic back
    if ! switch_traffic "$previous_slot"; then
        log_error "Failed to switch traffic during rollback"
        exit 1
    fi
    
    # Scale down current deployment
    scale_down_old "$current_slot"
    
    log_success "Rollback completed successfully"
}

# Deploy new version
deploy_new_version() {
    local image_tag="$1"
    
    log_info "Starting deployment of image tag: $image_tag"
    
    local active_slot
    active_slot=$(get_active_slot)
    local inactive_slot
    inactive_slot=$(get_inactive_slot "$active_slot")
    
    log_info "Current active slot: $active_slot"
    log_info "Deploying to inactive slot: $inactive_slot"
    
    # Update inactive deployment with new image
    log_info "Updating $inactive_slot deployment with new image..."
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would update $inactive_slot deployment with image: $image_tag"
        log_info "[DRY RUN] Would scale up $inactive_slot deployment"
        log_info "[DRY RUN] Would perform health checks"
        log_info "[DRY RUN] Would switch traffic to $inactive_slot"
        log_info "[DRY RUN] Would scale down $active_slot deployment"
        log_success "[DRY RUN] Deployment simulation completed"
        return 0
    fi
    
    # Set new image
    kubectl set image deployment/"$APP_NAME-$inactive_slot" \
        "$APP_NAME=claudecodeui:$image_tag" \
        -n "$NAMESPACE" || {
        log_error "Failed to update image for $inactive_slot deployment"
        exit 1
    }
    
    # Scale up inactive deployment
    kubectl scale deployment "$APP_NAME-$inactive_slot" --replicas=3 -n "$NAMESPACE" || {
        log_error "Failed to scale up $inactive_slot deployment"
        exit 1
    }
    
    # Wait for deployment to be ready
    if ! wait_for_deployment "$APP_NAME-$inactive_slot" 300; then
        log_error "New deployment failed to become ready"
        log_info "Cleaning up failed deployment..."
        kubectl scale deployment "$APP_NAME-$inactive_slot" --replicas=0 -n "$NAMESPACE" || true
        exit 1
    fi
    
    # Perform health check
    if [[ "${FORCE:-false}" != "true" ]]; then
        if ! health_check "$inactive_slot"; then
            log_error "Health check failed for new deployment"
            log_info "Cleaning up failed deployment..."
            kubectl scale deployment "$APP_NAME-$inactive_slot" --replicas=0 -n "$NAMESPACE" || true
            exit 1
        fi
    fi
    
    # Switch traffic to new deployment
    if ! switch_traffic "$inactive_slot"; then
        log_error "Failed to switch traffic to new deployment"
        log_info "Rolling back..."
        kubectl scale deployment "$APP_NAME-$inactive_slot" --replicas=0 -n "$NAMESPACE" || true
        exit 1
    fi
    
    # Wait a bit before scaling down old deployment
    log_info "Waiting 30 seconds before scaling down old deployment..."
    sleep 30
    
    # Scale down old deployment
    scale_down_old "$active_slot"
    
    log_success "Deployment completed successfully"
    log_info "New active slot: $inactive_slot"
    log_info "Image deployed: claudecodeui:$image_tag"
}

# Create deployment summary
create_deployment_summary() {
    local operation="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat << EOF

===============================================
ClaudeCodeUI Deployment Summary
===============================================
Operation: $operation
Timestamp: $timestamp
Namespace: $NAMESPACE
Active Slot: $(get_active_slot)
${IMAGE_TAG:+Image Tag: $IMAGE_TAG}
===============================================

EOF
}

# Main function
main() {
    parse_args "$@"
    
    log_info "ClaudeCodeUI Blue-Green Deployment Tool"
    log_info "======================================="
    
    check_prerequisites
    
    if [[ "${ROLLBACK:-false}" == "true" ]]; then
        create_deployment_summary "Rollback"
        rollback_deployment
    else
        create_deployment_summary "Deploy"
        deploy_new_version "$IMAGE_TAG"
    fi
    
    log_success "Operation completed successfully!"
}

# Execute main function with all arguments
main "$@"