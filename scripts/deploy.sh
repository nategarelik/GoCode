#!/bin/bash

# Comprehensive Deployment Script for ClaudeCodeUI
# Supports multiple environments and deployment strategies

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default configuration
DEFAULT_ENVIRONMENT="staging"
DEFAULT_STRATEGY="blue-green"
DEFAULT_REGISTRY="localhost:5000"
DEFAULT_NAMESPACE="claudecodeui"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug() { [[ "${DEBUG:-false}" == "true" ]] && echo -e "${PURPLE}[DEBUG]${NC} $1"; }

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Comprehensive deployment script for ClaudeCodeUI

OPTIONS:
    -e, --environment ENV       Target environment (staging, production) [default: $DEFAULT_ENVIRONMENT]
    -s, --strategy STRATEGY     Deployment strategy (blue-green, rolling, recreate) [default: $DEFAULT_STRATEGY]
    -r, --registry REGISTRY     Container registry [default: $DEFAULT_REGISTRY]
    -t, --tag TAG              Image tag [default: auto-generated]
    -n, --namespace NAMESPACE   Kubernetes namespace [default: $DEFAULT_NAMESPACE]
    -c, --config CONFIG_FILE    Configuration file path
    -b, --build                Build Docker image before deployment
    -p, --push                 Push image to registry
    -d, --dry-run              Perform a dry run without making changes
    -f, --force                Force deployment without confirmations
    -v, --verbose              Enable verbose output
    -h, --help                 Show this help message

DEPLOYMENT STRATEGIES:
    blue-green      Zero-downtime deployment using blue-green strategy
    rolling         Rolling update deployment (default Kubernetes)
    recreate        Recreate all pods at once

ENVIRONMENTS:
    staging         Staging environment with reduced resources
    production      Production environment with full resources and monitoring

EXAMPLES:
    $0 -e staging -b -p                    # Build, push and deploy to staging
    $0 -e production -s blue-green -t v1.0.0  # Deploy specific tag to production
    $0 --dry-run -e production             # Dry run for production
    $0 -e staging --force                  # Force deploy to staging without prompts

EOF
}

# Load configuration
load_config() {
    local config_file="${CONFIG_FILE:-$PROJECT_ROOT/config/deploy-$ENVIRONMENT.env}"
    
    if [[ -f "$config_file" ]]; then
        log_info "Loading configuration from: $config_file"
        # shellcheck source=/dev/null
        source "$config_file"
    else
        log_warning "Configuration file not found: $config_file"
        log_info "Using default configuration"
    fi
    
    # Set defaults if not configured
    REGISTRY="${REGISTRY:-$DEFAULT_REGISTRY}"
    NAMESPACE="${NAMESPACE:-$DEFAULT_NAMESPACE-$ENVIRONMENT}"
    IMAGE_NAME="${IMAGE_NAME:-claudecodeui}"
    DEPLOYMENT_TIMEOUT="${DEPLOYMENT_TIMEOUT:-600}"
    HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
    
    # Environment-specific defaults
    case "$ENVIRONMENT" in
        production)
            REPLICAS="${REPLICAS:-3}"
            RESOURCE_REQUESTS_CPU="${RESOURCE_REQUESTS_CPU:-500m}"
            RESOURCE_REQUESTS_MEMORY="${RESOURCE_REQUESTS_MEMORY:-1Gi}"
            RESOURCE_LIMITS_CPU="${RESOURCE_LIMITS_CPU:-2000m}"
            RESOURCE_LIMITS_MEMORY="${RESOURCE_LIMITS_MEMORY:-2Gi}"
            ;;
        staging)
            REPLICAS="${REPLICAS:-2}"
            RESOURCE_REQUESTS_CPU="${RESOURCE_REQUESTS_CPU:-250m}"
            RESOURCE_REQUESTS_MEMORY="${RESOURCE_REQUESTS_MEMORY:-512Mi}"
            RESOURCE_LIMITS_CPU="${RESOURCE_LIMITS_CPU:-1000m}"
            RESOURCE_LIMITS_MEMORY="${RESOURCE_LIMITS_MEMORY:-1Gi}"
            ;;
        *)
            REPLICAS="${REPLICAS:-1}"
            RESOURCE_REQUESTS_CPU="${RESOURCE_REQUESTS_CPU:-100m}"
            RESOURCE_REQUESTS_MEMORY="${RESOURCE_REQUESTS_MEMORY:-256Mi}"
            RESOURCE_LIMITS_CPU="${RESOURCE_LIMITS_CPU:-500m}"
            RESOURCE_LIMITS_MEMORY="${RESOURCE_LIMITS_MEMORY:-512Mi}"
            ;;
    esac
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--strategy)
                STRATEGY="$2"
                shift 2
                ;;
            -r|--registry)
                REGISTRY="$2"
                shift 2
                ;;
            -t|--tag)
                TAG="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -b|--build)
                BUILD=true
                shift
                ;;
            -p|--push)
                PUSH=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                DEBUG=true
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
    STRATEGY="${STRATEGY:-$DEFAULT_STRATEGY}"
    BUILD="${BUILD:-false}"
    PUSH="${PUSH:-false}"
    DRY_RUN="${DRY_RUN:-false}"
    FORCE="${FORCE:-false}"
    VERBOSE="${VERBOSE:-false}"
}

# Validate prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check Kubernetes connection
    if ! kubectl cluster-info >/dev/null 2>&1; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check Docker daemon
    if [[ "$BUILD" == "true" ]] && ! docker info >/dev/null 2>&1; then
        log_error "Cannot connect to Docker daemon"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Generate image tag
generate_tag() {
    if [[ -n "${TAG:-}" ]]; then
        echo "$TAG"
        return
    fi
    
    local git_hash=""
    local git_branch=""
    local timestamp=$(date +%Y%m%d-%H%M%S)
    
    if command -v git >/dev/null 2>&1 && [[ -d "$PROJECT_ROOT/.git" ]]; then
        git_hash=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo "")
        git_branch=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    fi
    
    if [[ -n "$git_hash" ]]; then
        if [[ "$git_branch" == "main" || "$git_branch" == "master" ]]; then
            echo "$ENVIRONMENT-$git_hash-$timestamp"
        else
            echo "$ENVIRONMENT-${git_branch//\//-}-$git_hash-$timestamp"
        fi
    else
        echo "$ENVIRONMENT-$timestamp"
    fi
}

# Build Docker image
build_image() {
    local tag="$1"
    local full_image="$REGISTRY/$IMAGE_NAME:$tag"
    
    log_info "Building Docker image: $full_image"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would build image: $full_image"
        return 0
    fi
    
    # Build with buildx for multi-platform support
    docker buildx build \
        --platform linux/amd64 \
        --tag "$full_image" \
        --file "$PROJECT_ROOT/Dockerfile" \
        --progress=plain \
        "$PROJECT_ROOT" || {
        log_error "Failed to build Docker image"
        exit 1
    }
    
    log_success "Docker image built successfully: $full_image"
}

# Push Docker image
push_image() {
    local tag="$1"
    local full_image="$REGISTRY/$IMAGE_NAME:$tag"
    
    log_info "Pushing Docker image: $full_image"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would push image: $full_image"
        return 0
    fi
    
    docker push "$full_image" || {
        log_error "Failed to push Docker image"
        exit 1
    }
    
    log_success "Docker image pushed successfully: $full_image"
}

# Create or update namespace
setup_namespace() {
    log_info "Setting up namespace: $NAMESPACE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create/update namespace: $NAMESPACE"
        return 0
    fi
    
    # Apply namespace configuration
    kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: $NAMESPACE
  labels:
    name: $NAMESPACE
    environment: $ENVIRONMENT
    app.kubernetes.io/name: claudecodeui
    app.kubernetes.io/component: namespace
EOF

    log_success "Namespace $NAMESPACE is ready"
}

# Deploy using blue-green strategy
deploy_blue_green() {
    local tag="$1"
    local full_image="$REGISTRY/$IMAGE_NAME:$tag"
    
    log_info "Deploying using blue-green strategy"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy using blue-green strategy"
        return 0
    fi
    
    # Use the blue-green deployment script
    "$SCRIPT_DIR/blue-green-deploy.sh" \
        --image "$tag" \
        --namespace "$NAMESPACE" \
        ${FORCE:+--force} \
        ${VERBOSE:+--verbose}
}

# Deploy using rolling update strategy
deploy_rolling() {
    local tag="$1"
    local full_image="$REGISTRY/$IMAGE_NAME:$tag"
    
    log_info "Deploying using rolling update strategy"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy using rolling update strategy"
        return 0
    fi
    
    # Update deployment image
    kubectl set image deployment/claudecodeui-blue \
        claudecodeui="$full_image" \
        -n "$NAMESPACE" || {
        log_error "Failed to update deployment image"
        exit 1
    }
    
    # Wait for rollout to complete
    kubectl rollout status deployment/claudecodeui-blue \
        -n "$NAMESPACE" \
        --timeout="${DEPLOYMENT_TIMEOUT}s" || {
        log_error "Deployment rollout failed"
        exit 1
    }
    
    log_success "Rolling deployment completed successfully"
}

# Deploy using recreate strategy
deploy_recreate() {
    local tag="$1"
    local full_image="$REGISTRY/$IMAGE_NAME:$tag"
    
    log_info "Deploying using recreate strategy"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy using recreate strategy"
        return 0
    fi
    
    # Scale down deployment
    kubectl scale deployment/claudecodeui-blue --replicas=0 -n "$NAMESPACE"
    
    # Wait for pods to terminate
    kubectl wait --for=delete pod -l app.kubernetes.io/name=claudecodeui -n "$NAMESPACE" --timeout=60s
    
    # Update image
    kubectl set image deployment/claudecodeui-blue \
        claudecodeui="$full_image" \
        -n "$NAMESPACE"
    
    # Scale up deployment
    kubectl scale deployment/claudecodeui-blue --replicas="$REPLICAS" -n "$NAMESPACE"
    
    # Wait for deployment to be ready
    kubectl wait --for=condition=available \
        deployment/claudecodeui-blue \
        -n "$NAMESPACE" \
        --timeout="${DEPLOYMENT_TIMEOUT}s" || {
        log_error "Deployment failed to become available"
        exit 1
    }
    
    log_success "Recreate deployment completed successfully"
}

# Perform post-deployment verification
verify_deployment() {
    local tag="$1"
    
    log_info "Verifying deployment..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would verify deployment"
        return 0
    fi
    
    # Check deployment status
    local ready_replicas
    ready_replicas=$(kubectl get deployment claudecodeui-blue -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    
    if [[ "$ready_replicas" -eq "$REPLICAS" ]]; then
        log_success "All $REPLICAS replicas are ready"
    else
        log_error "Only $ready_replicas out of $REPLICAS replicas are ready"
        return 1
    fi
    
    # Check pod status
    local pod_status
    pod_status=$(kubectl get pods -l app.kubernetes.io/name=claudecodeui -n "$NAMESPACE" -o jsonpath='{.items[*].status.phase}')
    
    for status in $pod_status; do
        if [[ "$status" != "Running" ]]; then
            log_error "Found pod with status: $status"
            return 1
        fi
    done
    
    log_success "All pods are running"
    
    # Verify image tag
    local deployed_image
    deployed_image=$(kubectl get deployment claudecodeui-blue -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}')
    
    if [[ "$deployed_image" == "$REGISTRY/$IMAGE_NAME:$tag" ]]; then
        log_success "Correct image deployed: $deployed_image"
    else
        log_error "Image mismatch. Expected: $REGISTRY/$IMAGE_NAME:$tag, Got: $deployed_image"
        return 1
    fi
    
    log_success "Deployment verification completed successfully"
}

# Display deployment summary
show_summary() {
    local tag="$1"
    local start_time="$2"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    cat << EOF

================================================================
ClaudeCodeUI Deployment Summary
================================================================
Environment:     $ENVIRONMENT
Strategy:        $STRATEGY
Namespace:       $NAMESPACE
Image:           $REGISTRY/$IMAGE_NAME:$tag
Replicas:        $REPLICAS
Duration:        ${duration}s
Timestamp:       $(date '+%Y-%m-%d %H:%M:%S')
================================================================

Next Steps:
- Monitor application health: kubectl get pods -n $NAMESPACE
- Check logs: kubectl logs -l app.kubernetes.io/name=claudecodeui -n $NAMESPACE
- Access application: kubectl port-forward svc/claudecodeui-service 8080:80 -n $NAMESPACE

================================================================

EOF
}

# Confirmation prompt
confirm_deployment() {
    if [[ "$FORCE" == "true" || "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    echo
    log_warning "About to deploy to $ENVIRONMENT environment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Strategy: $STRATEGY"
    log_info "Namespace: $NAMESPACE"
    log_info "Image: $REGISTRY/$IMAGE_NAME:${TAG:-auto-generated}"
    echo
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    parse_args "$@"
    load_config
    
    log_info "ClaudeCodeUI Deployment Tool"
    log_info "============================="
    log_info "Environment: $ENVIRONMENT"
    log_info "Strategy: $STRATEGY"
    log_info "Registry: $REGISTRY"
    
    check_prerequisites
    
    # Generate tag if not provided
    local tag
    tag=$(generate_tag)
    log_info "Image tag: $tag"
    
    confirm_deployment
    
    # Build image if requested
    if [[ "$BUILD" == "true" ]]; then
        build_image "$tag"
    fi
    
    # Push image if requested
    if [[ "$PUSH" == "true" ]]; then
        push_image "$tag"
    fi
    
    # Setup namespace
    setup_namespace
    
    # Deploy based on strategy
    case "$STRATEGY" in
        blue-green)
            deploy_blue_green "$tag"
            ;;
        rolling)
            deploy_rolling "$tag"
            ;;
        recreate)
            deploy_recreate "$tag"
            ;;
        *)
            log_error "Unknown deployment strategy: $STRATEGY"
            exit 1
            ;;
    esac
    
    # Verify deployment
    if [[ "$DRY_RUN" != "true" ]]; then
        verify_deployment "$tag"
    fi
    
    # Show summary
    show_summary "$tag" "$start_time"
    
    log_success "Deployment completed successfully!"
}

# Execute main function
main "$@"