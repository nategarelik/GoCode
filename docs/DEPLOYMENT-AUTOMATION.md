# ClaudeCodeUI Production Deployment Automation

Comprehensive enterprise-grade deployment automation with security, scalability, and reliability.

## 🏗️ Architecture Overview

### Infrastructure Components

- **Kubernetes Cluster**: EKS with blue-green deployment strategy
- **Container Registry**: ECR with image scanning and lifecycle policies
- **Database**: RDS MySQL with automated backups and read replicas
- **Storage**: EBS volumes with encryption and automated snapshots
- **Networking**: VPC with private subnets and security groups
- **Monitoring**: Prometheus, Grafana, and AlertManager stack
- **Security**: Automated scanning, compliance checks, and secret management

### Deployment Strategy

**Blue-Green Deployment**:
- Zero-downtime deployments
- Instant rollback capability
- Health check validation
- Traffic switching automation

**Infrastructure as Code**:
- Terraform for cloud resources
- Kubernetes manifests for application deployment
- Helm charts for monitoring stack
- GitOps workflow with automated CI/CD

## 🚀 Quick Start

### 1. Infrastructure Deployment

```bash
# Clone the repository
git clone <repository-url>
cd claudecodeui

# Deploy infrastructure
cd terraform
terraform init
terraform plan -var-file="production.tfvars"
terraform apply

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name claudecodeui-production
```

### 2. Application Deployment

```bash
# Setup secrets
./scripts/setup-secrets.sh -e production -c

# Deploy application
./scripts/deploy.sh \
  --environment production \
  --strategy blue-green \
  --build \
  --push \
  --tag v1.0.0
```

### 3. Monitoring Setup

```bash
# Deploy monitoring stack
kubectl apply -f k8s/monitoring/

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n claudecodeui
```

## 📦 Components

### 1. Kubernetes Manifests (`k8s/`)

**Core Components**:
- `namespace.yaml` - Namespace and resource quotas
- `secrets.yaml` - Secret templates and configurations
- `configmap.yaml` - Application and nginx configuration
- `blue-green-deployment.yaml` - Blue/green deployment manifests
- `services.yaml` - Service definitions and load balancers
- `storage.yaml` - Persistent volume claims and storage classes
- `rbac.yaml` - Service accounts and role bindings
- `hpa.yaml` - Horizontal pod autoscaling

**Monitoring Stack** (`k8s/monitoring/`):
- `prometheus.yaml` - Prometheus server with alerting rules
- `grafana.yaml` - Grafana dashboards and datasources
- `alertmanager.yaml` - Alert routing and notifications

### 2. Infrastructure as Code (`terraform/`)

**Core Infrastructure**:
- `main.tf` - Provider configuration and main resources
- `vpc.tf` - VPC, subnets, and networking
- `eks.tf` - EKS cluster and node groups
- `rds.tf` - Database instance and configuration
- `ecr.tf` - Container registry and policies
- `backup.tf` - Backup and disaster recovery
- `variables.tf` - Input variables and validation
- `outputs.tf` - Resource outputs and metadata

### 3. Deployment Scripts (`scripts/`)

**Core Scripts**:
- `deploy.sh` - Main deployment orchestration
- `blue-green-deploy.sh` - Blue-green deployment automation
- `setup-secrets.sh` - Secrets management and rotation

### 4. Security & Compliance (`security/`)

**Security Components**:
- `security-scan.sh` - Comprehensive security scanning
- `policies/security-policy.yaml` - Security policies and standards

### 5. CI/CD Pipelines

**GitHub Actions** (`.github/workflows/ci-cd.yml`):
- Security scanning and vulnerability assessment
- Code quality checks and testing
- Container image building and scanning
- Automated deployment to staging/production
- Rollback capabilities and notifications

**GitLab CI** (`.gitlab-ci.yml`):
- Parallel pipeline execution
- Comprehensive security testing
- Manual deployment gates
- Environment-specific configurations

## 🔧 Configuration

### Environment Configuration

**Staging** (`config/deploy-staging.env`):
- Reduced resource allocation
- Debug logging enabled
- Relaxed security policies for testing

**Production** (`config/deploy-production.env`):
- Full resource allocation
- Production logging levels
- Strict security and compliance

### Infrastructure Variables

**Core Variables** (`terraform/variables.tf`):
```hcl
variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "cluster_version" {
  description = "Kubernetes cluster version"
  type        = string
  default     = "1.28"
}
```

**Environment-Specific** (`terraform/production.tfvars`):
```hcl
environment = "production"
aws_region = "us-west-2"
cluster_version = "1.28"
node_instance_types = ["t3.large", "t3.xlarge"]
min_size = 3
max_size = 10
desired_size = 3
enable_monitoring = true
enable_backup = true
backup_retention_days = 30
```

## 🔐 Security Features

### Automated Security Scanning

**Container Security**:
- Trivy vulnerability scanning
- Base image security assessment
- Runtime security monitoring

**Code Security**:
- SAST (Static Application Security Testing)
- Dependency vulnerability scanning
- Secret detection and prevention

**Infrastructure Security**:
- Kubernetes manifest security scanning
- Terraform security validation
- Network policy enforcement

### Compliance Automation

**Standards Compliance**:
- CIS Kubernetes Benchmark
- OWASP Top 10 validation
- SOC 2 compliance checks

**Security Policies**:
- Network segmentation
- Pod security standards
- RBAC enforcement
- Encryption at rest and in transit

### Secrets Management

**Features**:
- Kubernetes secrets with encryption
- Secret rotation automation
- Backup and restore capabilities
- Integration with AWS Secrets Manager

**Usage**:
```bash
# Create secrets
./scripts/setup-secrets.sh -e production -c

# Rotate secrets
./scripts/setup-secrets.sh -e production -r

# Backup secrets
./scripts/setup-secrets.sh -b secrets-backup.enc

# Validate secrets
./scripts/setup-secrets.sh -v
```

## 📊 Monitoring & Alerting

### Metrics Collection

**Application Metrics**:
- Request rate and latency
- Error rates and status codes
- WebSocket connections
- Resource utilization

**Infrastructure Metrics**:
- Kubernetes cluster health
- Node resource utilization
- Pod lifecycle events
- Storage and network metrics

### Alerting Rules

**Critical Alerts**:
- Application downtime
- High error rates (>5%)
- Resource exhaustion
- Security incidents

**Warning Alerts**:
- High response times (>2s)
- Resource pressure
- Deployment issues
- Performance degradation

### Dashboards

**ClaudeCodeUI Dashboard**:
- Application performance overview
- User activity metrics
- System health indicators
- Deployment status

**Infrastructure Dashboard**:
- Cluster resource utilization
- Node health and performance
- Storage and network metrics
- Security and compliance status

## 🔄 CI/CD Pipeline

### Pipeline Stages

1. **Security Scan**: Vulnerability and secret detection
2. **Quality Check**: Linting, formatting, and code quality
3. **Testing**: Unit, integration, and E2E tests
4. **Build**: Container image creation and optimization
5. **Security Validation**: Container and manifest scanning
6. **Deployment**: Automated staging and production deployment
7. **Verification**: Health checks and smoke tests

### Deployment Flow

**Staging Deployment**:
- Triggered on `develop` branch
- Automated deployment with comprehensive testing
- Performance and security validation

**Production Deployment**:
- Triggered on version tags (`v*`)
- Manual approval gate
- Blue-green deployment with rollback capability
- Comprehensive health validation

### Rollback Procedures

**Automated Rollback**:
- Health check failures trigger automatic rollback
- Database backup restoration if needed
- Traffic restoration to previous version

**Manual Rollback**:
```bash
# Rollback via script
./scripts/blue-green-deploy.sh --rollback

# Rollback via CI/CD
# Use manual workflow trigger with rollback option
```

## 🚨 Backup & Disaster Recovery

### Backup Strategy

**Database Backups**:
- Automated daily snapshots
- Point-in-time recovery
- Cross-region replication
- 30-day retention policy

**Application Backups**:
- Configuration backup
- Secret backup with encryption
- Persistent volume snapshots
- Infrastructure state backup

### Recovery Procedures

**Application Recovery**:
1. Restore from latest backup
2. Validate data integrity
3. Restart services in correct order
4. Verify system functionality

**Infrastructure Recovery**:
1. Terraform state restoration
2. Kubernetes cluster recreation
3. Application redeployment
4. Data restoration and validation

## 📋 Operational Procedures

### Deployment Checklist

**Pre-Deployment**:
- [ ] Security scan passed
- [ ] All tests passing
- [ ] Backup created
- [ ] Monitoring configured
- [ ] Rollback plan prepared

**Deployment**:
- [ ] Blue-green deployment initiated
- [ ] Health checks validated
- [ ] Traffic switched successfully
- [ ] Old version scaled down
- [ ] Monitoring verified

**Post-Deployment**:
- [ ] Application functioning correctly
- [ ] Metrics collection active
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified

### Troubleshooting Guide

**Common Issues**:

1. **Deployment Failures**:
   - Check pod logs: `kubectl logs -l app.kubernetes.io/name=claudecodeui`
   - Verify resource availability
   - Check image pull permissions

2. **Performance Issues**:
   - Monitor resource utilization
   - Check database connections
   - Verify network connectivity

3. **Security Alerts**:
   - Review security scan results
   - Check for unauthorized access
   - Validate certificate expiration

### Maintenance Tasks

**Daily**:
- Monitor system health
- Review security alerts
- Check backup completion

**Weekly**:
- Update dependencies
- Review performance metrics
- Security scan validation

**Monthly**:
- Rotate secrets
- Update base images
- Review and update documentation

## 🔗 Integration Points

### External Services

**AWS Services**:
- EKS for Kubernetes orchestration
- RDS for database management
- ECR for container registry
- S3 for backup storage
- CloudWatch for logging

**Third-Party Services**:
- Slack for notifications
- Email for alerting
- External monitoring services
- Security scanning tools

### API Integration

**Monitoring APIs**:
- Prometheus metrics endpoint
- Grafana dashboard API
- AlertManager webhook integration

**Deployment APIs**:
- Kubernetes API for deployment
- Docker registry API for images
- Git webhook integration

## 📚 Documentation

### Additional Resources

- [Security Policy](security/policies/security-policy.yaml)
- [Terraform Documentation](terraform/README.md)
- [Monitoring Setup](k8s/monitoring/README.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

### Support

For deployment issues or questions:
1. Check the troubleshooting guide
2. Review monitoring dashboards
3. Contact the DevOps team
4. Create a support ticket

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Maintained by**: DevOps Team