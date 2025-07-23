#!/bin/bash

# Comprehensive Security Scanning Script for ClaudeCodeUI
# Performs vulnerability scanning, compliance checks, and security audits

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
SCAN_RESULTS_DIR="$PROJECT_ROOT/security/scan-results"
COMPLIANCE_DIR="$PROJECT_ROOT/security/compliance"
POLICIES_DIR="$PROJECT_ROOT/security/policies"
REPORT_DIR="$PROJECT_ROOT/security/reports"

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

Comprehensive security scanning and compliance automation

OPTIONS:
    -a, --all                Run all security scans
    -v, --vulnerabilities    Run vulnerability scanning
    -s, --secrets           Run secret detection
    -c, --compliance        Run compliance checks
    -d, --dependencies      Run dependency scanning
    -i, --image IMAGE       Scan Docker image
    -k, --kubernetes        Scan Kubernetes manifests
    -r, --report            Generate security report
    -f, --format FORMAT     Report format (json, html, sarif) [default: html]
    -o, --output DIR        Output directory [default: ./security/reports]
    --fail-on-critical      Fail on critical vulnerabilities
    --fail-on-high          Fail on high severity issues
    -h, --help              Show this help message

EXAMPLES:
    $0 --all                        # Run all security scans
    $0 -v -s -c                     # Run specific scans
    $0 -i claudecodeui:latest       # Scan Docker image
    $0 -k --fail-on-critical        # Scan K8s manifests, fail on critical

EOF
}

# Create directories
setup_directories() {
    mkdir -p "$SCAN_RESULTS_DIR" "$COMPLIANCE_DIR" "$POLICIES_DIR" "$REPORT_DIR"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check for required tools
    command -v trivy >/dev/null 2>&1 || missing_tools+=("trivy")
    command -v git >/dev/null 2>&1 || missing_tools+=("git")
    command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Install missing tools:"
        for tool in "${missing_tools[@]}"; do
            case $tool in
                trivy)
                    log_info "  Trivy: https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
                    ;;
                *)
                    log_info "  $tool: Please install and ensure it's in PATH"
                    ;;
            esac
        done
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Vulnerability scanning
scan_vulnerabilities() {
    log_info "Running vulnerability scanning..."
    
    local output_file="$SCAN_RESULTS_DIR/vulnerabilities.json"
    local sarif_file="$SCAN_RESULTS_DIR/vulnerabilities.sarif"
    
    # Filesystem scan
    log_info "Scanning filesystem for vulnerabilities..."
    trivy fs \
        --format json \
        --output "$output_file" \
        --security-checks vuln,secret,config \
        --severity LOW,MEDIUM,HIGH,CRITICAL \
        "$PROJECT_ROOT" || true
    
    # SARIF format for GitHub integration
    trivy fs \
        --format sarif \
        --output "$sarif_file" \
        --security-checks vuln,secret,config \
        --severity HIGH,CRITICAL \
        "$PROJECT_ROOT" || true
    
    log_success "Vulnerability scanning completed"
    
    # Check for critical vulnerabilities
    if [[ "${FAIL_ON_CRITICAL:-false}" == "true" ]]; then
        local critical_count
        critical_count=$(jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL") | length' "$output_file" 2>/dev/null | wc -l || echo "0")
        if [[ "$critical_count" -gt 0 ]]; then
            log_error "Found $critical_count critical vulnerabilities"
            return 1
        fi
    fi
    
    if [[ "${FAIL_ON_HIGH:-false}" == "true" ]]; then
        local high_count
        high_count=$(jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL") | length' "$output_file" 2>/dev/null | wc -l || echo "0")
        if [[ "$high_count" -gt 0 ]]; then
            log_error "Found $high_count high/critical vulnerabilities"
            return 1
        fi
    fi
}

# Secret detection
scan_secrets() {
    log_info "Running secret detection..."
    
    local output_file="$SCAN_RESULTS_DIR/secrets.json"
    
    # Use Trivy for secret scanning
    trivy fs \
        --format json \
        --output "$output_file" \
        --security-checks secret \
        --severity LOW,MEDIUM,HIGH,CRITICAL \
        "$PROJECT_ROOT" || true
    
    # Use git-secrets if available
    if command -v git-secrets >/dev/null 2>&1; then
        log_info "Running git-secrets scan..."
        git-secrets --scan "$PROJECT_ROOT" > "$SCAN_RESULTS_DIR/git-secrets.log" 2>&1 || true
    fi
    
    # Use truffleHog if available
    if command -v trufflehog >/dev/null 2>&1; then
        log_info "Running TruffleHog scan..."
        trufflehog filesystem "$PROJECT_ROOT" \
            --json \
            --no-update > "$SCAN_RESULTS_DIR/trufflehog.json" 2>/dev/null || true
    fi
    
    log_success "Secret detection completed"
}

# Dependency scanning
scan_dependencies() {
    log_info "Running dependency scanning..."
    
    local output_file="$SCAN_RESULTS_DIR/dependencies.json"
    
    # NPM audit
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        log_info "Running NPM audit..."
        cd "$PROJECT_ROOT"
        npm audit --json > "$SCAN_RESULTS_DIR/npm-audit.json" 2>/dev/null || true
        
        # Check for high severity issues
        if [[ "${FAIL_ON_HIGH:-false}" == "true" ]]; then
            local high_vulns
            high_vulns=$(jq '.vulnerabilities | to_entries[] | select(.value.severity == "high" or .value.severity == "critical") | length' "$SCAN_RESULTS_DIR/npm-audit.json" 2>/dev/null || echo "0")
            if [[ "$high_vulns" -gt 0 ]]; then
                log_error "Found high/critical dependency vulnerabilities"
                return 1
            fi
        fi
    fi
    
    # Use Trivy for dependency scanning
    trivy fs \
        --format json \
        --output "$output_file" \
        --security-checks vuln \
        --severity LOW,MEDIUM,HIGH,CRITICAL \
        "$PROJECT_ROOT" || true
    
    log_success "Dependency scanning completed"
}

# Docker image scanning
scan_docker_image() {
    local image="$1"
    
    log_info "Scanning Docker image: $image"
    
    local output_file="$SCAN_RESULTS_DIR/docker-$(echo "$image" | tr '/:' '-').json"
    local sarif_file="$SCAN_RESULTS_DIR/docker-$(echo "$image" | tr '/:' '-').sarif"
    
    # Scan image with Trivy
    trivy image \
        --format json \
        --output "$output_file" \
        --security-checks vuln,secret,config \
        --severity LOW,MEDIUM,HIGH,CRITICAL \
        "$image" || true
    
    # SARIF format
    trivy image \
        --format sarif \
        --output "$sarif_file" \
        --security-checks vuln,secret,config \
        --severity HIGH,CRITICAL \
        "$image" || true
    
    log_success "Docker image scanning completed"
    
    # Check for critical vulnerabilities
    if [[ "${FAIL_ON_CRITICAL:-false}" == "true" ]]; then
        local critical_count
        critical_count=$(jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL") | length' "$output_file" 2>/dev/null | wc -l || echo "0")
        if [[ "$critical_count" -gt 0 ]]; then
            log_error "Found $critical_count critical vulnerabilities in image"
            return 1
        fi
    fi
}

# Kubernetes manifest scanning
scan_kubernetes() {
    log_info "Scanning Kubernetes manifests..."
    
    local k8s_dir="$PROJECT_ROOT/k8s"
    local output_file="$SCAN_RESULTS_DIR/kubernetes.json"
    
    if [[ -d "$k8s_dir" ]]; then
        # Use Trivy for K8s manifest scanning
        trivy config \
            --format json \
            --output "$output_file" \
            --severity LOW,MEDIUM,HIGH,CRITICAL \
            "$k8s_dir" || true
        
        # Use kubesec if available
        if command -v kubesec >/dev/null 2>&1; then
            log_info "Running kubesec scan..."
            find "$k8s_dir" -name "*.yaml" -o -name "*.yml" | while read -r file; do
                local filename
                filename=$(basename "$file" .yaml)
                filename=$(basename "$filename" .yml)
                kubesec scan "$file" > "$SCAN_RESULTS_DIR/kubesec-$filename.json" 2>/dev/null || true
            done
        fi
        
        log_success "Kubernetes manifest scanning completed"
    else
        log_warning "Kubernetes directory not found: $k8s_dir"
    fi
}

# Compliance checks
run_compliance_checks() {
    log_info "Running compliance checks..."
    
    # CIS benchmarks
    check_cis_compliance
    
    # OWASP compliance
    check_owasp_compliance
    
    # Security best practices
    check_security_practices
    
    log_success "Compliance checks completed"
}

# CIS compliance checks
check_cis_compliance() {
    log_info "Checking CIS compliance..."
    
    local compliance_file="$COMPLIANCE_DIR/cis-compliance.json"
    local results=()
    
    # Check for hardcoded secrets
    if grep -r "password\|secret\|key" "$PROJECT_ROOT" --include="*.js" --include="*.ts" --include="*.json" >/dev/null 2>&1; then
        results+=('{"check": "CIS-1.1", "status": "FAIL", "description": "Hardcoded credentials found"}')
    else
        results+=('{"check": "CIS-1.1", "status": "PASS", "description": "No hardcoded credentials"}')
    fi
    
    # Check for HTTPS enforcement
    if grep -r "https" "$PROJECT_ROOT/k8s" >/dev/null 2>&1; then
        results+=('{"check": "CIS-1.2", "status": "PASS", "description": "HTTPS enforcement configured"}')
    else
        results+=('{"check": "CIS-1.2", "status": "WARN", "description": "HTTPS enforcement not verified"}')
    fi
    
    # Check for security contexts
    if grep -r "securityContext" "$PROJECT_ROOT/k8s" >/dev/null 2>&1; then
        results+=('{"check": "CIS-1.3", "status": "PASS", "description": "Security contexts configured"}')
    else
        results+=('{"check": "CIS-1.3", "status": "FAIL", "description": "Security contexts missing"}')
    fi
    
    # Write results
    printf '[%s]\n' "$(IFS=','; echo "${results[*]}")" > "$compliance_file"
}

# OWASP compliance checks
check_owasp_compliance() {
    log_info "Checking OWASP compliance..."
    
    local compliance_file="$COMPLIANCE_DIR/owasp-compliance.json"
    local results=()
    
    # A01: Broken Access Control
    if grep -r "authentication\|authorization" "$PROJECT_ROOT/server" >/dev/null 2>&1; then
        results+=('{"check": "OWASP-A01", "status": "PASS", "description": "Access control mechanisms found"}')
    else
        results+=('{"check": "OWASP-A01", "status": "WARN", "description": "Access control not verified"}')
    fi
    
    # A02: Cryptographic Failures
    if grep -r "bcrypt\|crypto\|encryption" "$PROJECT_ROOT" >/dev/null 2>&1; then
        results+=('{"check": "OWASP-A02", "status": "PASS", "description": "Cryptographic controls found"}')
    else
        results+=('{"check": "OWASP-A02", "status": "WARN", "description": "Cryptographic controls not verified"}')
    fi
    
    # A03: Injection
    if grep -r "sanitize\|validate\|escape" "$PROJECT_ROOT" >/dev/null 2>&1; then
        results+=('{"check": "OWASP-A03", "status": "PASS", "description": "Input validation found"}')
    else
        results+=('{"check": "OWASP-A03", "status": "WARN", "description": "Input validation not verified"}')
    fi
    
    # Write results
    printf '[%s]\n' "$(IFS=','; echo "${results[*]}")" > "$compliance_file"
}

# Security best practices
check_security_practices() {
    log_info "Checking security best practices..."
    
    local compliance_file="$COMPLIANCE_DIR/security-practices.json"
    local results=()
    
    # Check for non-root user
    if grep -r "runAsNonRoot.*true" "$PROJECT_ROOT/k8s" >/dev/null 2>&1; then
        results+=('{"check": "SEC-1", "status": "PASS", "description": "Non-root user configured"}')
    else
        results+=('{"check": "SEC-1", "status": "FAIL", "description": "Root user detected"}')
    fi
    
    # Check for read-only filesystem
    if grep -r "readOnlyRootFilesystem.*true" "$PROJECT_ROOT/k8s" >/dev/null 2>&1; then
        results+=('{"check": "SEC-2", "status": "PASS", "description": "Read-only filesystem configured"}')
    else
        results+=('{"check": "SEC-2", "status": "WARN", "description": "Read-only filesystem not configured"}')
    fi
    
    # Check for resource limits
    if grep -r "limits:" "$PROJECT_ROOT/k8s" >/dev/null 2>&1; then
        results+=('{"check": "SEC-3", "status": "PASS", "description": "Resource limits configured"}')
    else
        results+=('{"check": "SEC-3", "status": "FAIL", "description": "Resource limits missing"}')
    fi
    
    # Write results
    printf '[%s]\n' "$(IFS=','; echo "${results[*]}")" > "$compliance_file"
}

# Generate security report
generate_report() {
    log_info "Generating security report..."
    
    local report_file="$REPORT_DIR/security-report.html"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>ClaudeCodeUI Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .pass { color: green; }
        .warn { color: orange; }
        .fail { color: red; }
        .critical { color: red; font-weight: bold; }
        .high { color: red; }
        .medium { color: orange; }
        .low { color: blue; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ClaudeCodeUI Security Report</h1>
        <p>Generated: $timestamp</p>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <p>Comprehensive security assessment of ClaudeCodeUI application and infrastructure.</p>
    </div>
    
    <div class="section">
        <h2>Vulnerability Summary</h2>
        <table>
            <tr><th>Severity</th><th>Count</th><th>Status</th></tr>
EOF

    # Add vulnerability counts if available
    if [[ -f "$SCAN_RESULTS_DIR/vulnerabilities.json" ]]; then
        local critical_count medium_count low_count
        critical_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "$SCAN_RESULTS_DIR/vulnerabilities.json" 2>/dev/null || echo "0")
        high_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH")] | length' "$SCAN_RESULTS_DIR/vulnerabilities.json" 2>/dev/null || echo "0")
        medium_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "MEDIUM")] | length' "$SCAN_RESULTS_DIR/vulnerabilities.json" 2>/dev/null || echo "0")
        low_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "LOW")] | length' "$SCAN_RESULTS_DIR/vulnerabilities.json" 2>/dev/null || echo "0")
        
        cat >> "$report_file" << EOF
            <tr><td class="critical">Critical</td><td>$critical_count</td><td>$([ "$critical_count" -eq 0 ] && echo "✓" || echo "✗")</td></tr>
            <tr><td class="high">High</td><td>$high_count</td><td>$([ "$high_count" -eq 0 ] && echo "✓" || echo "✗")</td></tr>
            <tr><td class="medium">Medium</td><td>$medium_count</td><td>$([ "$medium_count" -eq 0 ] && echo "✓" || echo "✗")</td></tr>
            <tr><td class="low">Low</td><td>$low_count</td><td>$([ "$low_count" -eq 0 ] && echo "✓" || echo "✗")</td></tr>
EOF
    fi
    
    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Compliance Status</h2>
        <h3>CIS Compliance</h3>
        <table>
            <tr><th>Check</th><th>Status</th><th>Description</th></tr>
EOF

    # Add CIS compliance results
    if [[ -f "$COMPLIANCE_DIR/cis-compliance.json" ]]; then
        jq -r '.[] | "<tr><td>\(.check)</td><td class=\"\(.status | ascii_downcase)\">\(.status)</td><td>\(.description)</td></tr>"' "$COMPLIANCE_DIR/cis-compliance.json" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF
        </table>
        
        <h3>OWASP Top 10 Compliance</h3>
        <table>
            <tr><th>Check</th><th>Status</th><th>Description</th></tr>
EOF

    # Add OWASP compliance results
    if [[ -f "$COMPLIANCE_DIR/owasp-compliance.json" ]]; then
        jq -r '.[] | "<tr><td>\(.check)</td><td class=\"\(.status | ascii_downcase)\">\(.status)</td><td>\(.description)</td></tr>"' "$COMPLIANCE_DIR/owasp-compliance.json" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Address all critical and high severity vulnerabilities immediately</li>
            <li>Implement security headers and HTTPS enforcement</li>
            <li>Regular dependency updates and security monitoring</li>
            <li>Implement comprehensive logging and monitoring</li>
            <li>Regular security assessments and penetration testing</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Scan Details</h2>
        <p>Detailed scan results are available in the following files:</p>
        <ul>
            <li>Vulnerabilities: <code>$SCAN_RESULTS_DIR/vulnerabilities.json</code></li>
            <li>Secrets: <code>$SCAN_RESULTS_DIR/secrets.json</code></li>
            <li>Dependencies: <code>$SCAN_RESULTS_DIR/dependencies.json</code></li>
            <li>Kubernetes: <code>$SCAN_RESULTS_DIR/kubernetes.json</code></li>
        </ul>
    </div>
</body>
</html>
EOF

    log_success "Security report generated: $report_file"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--all)
                RUN_ALL=true
                shift
                ;;
            -v|--vulnerabilities)
                RUN_VULNS=true
                shift
                ;;
            -s|--secrets)
                RUN_SECRETS=true
                shift
                ;;
            -c|--compliance)
                RUN_COMPLIANCE=true
                shift
                ;;
            -d|--dependencies)
                RUN_DEPS=true
                shift
                ;;
            -i|--image)
                DOCKER_IMAGE="$2"
                shift 2
                ;;
            -k|--kubernetes)
                RUN_K8S=true
                shift
                ;;
            -r|--report)
                GENERATE_REPORT=true
                shift
                ;;
            -f|--format)
                REPORT_FORMAT="$2"
                shift 2
                ;;
            -o|--output)
                REPORT_DIR="$2"
                shift 2
                ;;
            --fail-on-critical)
                FAIL_ON_CRITICAL=true
                shift
                ;;
            --fail-on-high)
                FAIL_ON_HIGH=true
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
    RUN_ALL="${RUN_ALL:-false}"
    RUN_VULNS="${RUN_VULNS:-false}"
    RUN_SECRETS="${RUN_SECRETS:-false}"
    RUN_COMPLIANCE="${RUN_COMPLIANCE:-false}"
    RUN_DEPS="${RUN_DEPS:-false}"
    RUN_K8S="${RUN_K8S:-false}"
    GENERATE_REPORT="${GENERATE_REPORT:-false}"
    REPORT_FORMAT="${REPORT_FORMAT:-html}"
    FAIL_ON_CRITICAL="${FAIL_ON_CRITICAL:-false}"
    FAIL_ON_HIGH="${FAIL_ON_HIGH:-false}"
    
    # If --all is specified, enable all scans
    if [[ "$RUN_ALL" == "true" ]]; then
        RUN_VULNS=true
        RUN_SECRETS=true
        RUN_COMPLIANCE=true
        RUN_DEPS=true
        RUN_K8S=true
        GENERATE_REPORT=true
    fi
}

# Main function
main() {
    parse_args "$@"
    
    log_info "ClaudeCodeUI Security Scanner"
    log_info "============================="
    
    setup_directories
    check_prerequisites
    
    local scan_failed=false
    
    # Run selected scans
    if [[ "$RUN_VULNS" == "true" ]]; then
        scan_vulnerabilities || scan_failed=true
    fi
    
    if [[ "$RUN_SECRETS" == "true" ]]; then
        scan_secrets || scan_failed=true
    fi
    
    if [[ "$RUN_DEPS" == "true" ]]; then
        scan_dependencies || scan_failed=true
    fi
    
    if [[ -n "${DOCKER_IMAGE:-}" ]]; then
        scan_docker_image "$DOCKER_IMAGE" || scan_failed=true
    fi
    
    if [[ "$RUN_K8S" == "true" ]]; then
        scan_kubernetes || scan_failed=true
    fi
    
    if [[ "$RUN_COMPLIANCE" == "true" ]]; then
        run_compliance_checks || scan_failed=true
    fi
    
    if [[ "$GENERATE_REPORT" == "true" ]]; then
        generate_report
    fi
    
    if [[ "$scan_failed" == "true" ]]; then
        log_error "Security scans failed with critical issues"
        exit 1
    else
        log_success "Security scanning completed successfully"
    fi
}

# Execute main function
main "$@"