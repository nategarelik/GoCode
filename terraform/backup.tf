# S3 Bucket for backups
resource "aws_s3_bucket" "backup" {
  bucket = "${local.name}-backup-${random_id.bucket_suffix.hex}"

  tags = merge(local.tags, {
    Name = "${local.name}-backup"
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "backup" {
  bucket = aws_s3_bucket.backup.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.backup.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    id     = "backup_lifecycle"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = var.backup_retention_days
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = var.backup_retention_days * 2
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "backup" {
  bucket = aws_s3_bucket.backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS Key for backup encryption
resource "aws_kms_key" "backup" {
  description             = "KMS key for backup encryption"
  deletion_window_in_days = 7

  tags = merge(local.tags, {
    Name = "${local.name}-backup-key"
  })
}

resource "aws_kms_alias" "backup" {
  name          = "alias/${local.name}-backup"
  target_key_id = aws_kms_key.backup.key_id
}

# IAM Role for backup operations
resource "aws_iam_role" "backup" {
  name = "${local.name}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["lambda.amazonaws.com", "backup.amazonaws.com"]
        }
      }
    ]
  })

  tags = local.tags
}

# IAM Policy for backup operations
resource "aws_iam_role_policy" "backup" {
  name = "${local.name}-backup-policy"
  role = aws_iam_role.backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backup.arn,
          "${aws_s3_bucket.backup.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = [aws_kms_key.backup.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots",
          "rds:CreateDBSnapshot",
          "rds:DeleteDBSnapshot",
          "rds:RestoreDBInstanceFromDBSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeSnapshots",
          "ec2:CreateSnapshot",
          "ec2:DeleteSnapshot",
          "ec2:DescribeVolumes"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# AWS Backup Vault
resource "aws_backup_vault" "main" {
  count = var.enable_backup ? 1 : 0
  
  name        = "${local.name}-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn

  tags = local.tags
}

# AWS Backup Plan
resource "aws_backup_plan" "main" {
  count = var.enable_backup ? 1 : 0
  
  name = "${local.name}-backup-plan"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = "cron(0 2 * * ? *)"  # Daily at 2 AM

    lifecycle {
      delete_after = var.backup_retention_days
    }

    recovery_point_tags = local.tags
  }

  rule {
    rule_name         = "weekly_backup"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = "cron(0 3 ? * SUN *)"  # Weekly on Sunday at 3 AM

    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }

    recovery_point_tags = merge(local.tags, {
      BackupType = "weekly"
    })
  }

  tags = local.tags
}

# AWS Backup Selection
resource "aws_backup_selection" "main" {
  count = var.enable_backup ? 1 : 0
  
  iam_role_arn = aws_iam_role.backup_service.arn
  name         = "${local.name}-backup-selection"
  plan_id      = aws_backup_plan.main[0].id

  resources = [
    aws_db_instance.main.arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.environment
    }
  }
}

# IAM Role for AWS Backup Service
resource "aws_iam_role" "backup_service" {
  name = "${local.name}-backup-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "backup_service" {
  role       = aws_iam_role.backup_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# Lambda function for custom backup operations
resource "aws_lambda_function" "backup" {
  filename         = "backup_function.zip"
  function_name    = "${local.name}-backup-function"
  role            = aws_iam_role.backup_lambda.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.backup_lambda.output_base64sha256
  runtime         = "python3.9"
  timeout         = 300

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.backup.bucket
      KMS_KEY_ID = aws_kms_key.backup.arn
      RDS_INSTANCE_ID = aws_db_instance.main.id
    }
  }

  tags = local.tags
}

# Lambda function code
data "archive_file" "backup_lambda" {
  type        = "zip"
  output_path = "backup_function.zip"
  
  source {
    content = templatefile("${path.module}/lambda/backup_function.py", {
      s3_bucket = aws_s3_bucket.backup.bucket
    })
    filename = "index.py"
  }
}

# IAM Role for backup Lambda
resource "aws_iam_role" "backup_lambda" {
  name = "${local.name}-backup-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "backup_lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.backup_lambda.name
}

resource "aws_iam_role_policy_attachment" "backup_lambda_vpc" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  role       = aws_iam_role.backup_lambda.name
}

resource "aws_iam_role_policy" "backup_lambda" {
  name = "${local.name}-backup-lambda-policy"
  role = aws_iam_role.backup_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backup.arn,
          "${aws_s3_bucket.backup.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = [aws_kms_key.backup.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots",
          "rds:CreateDBSnapshot"
        ]
        Resource = "*"
      }
    ]
  })
}

# EventBridge rule for scheduled backups
resource "aws_cloudwatch_event_rule" "backup_schedule" {
  name        = "${local.name}-backup-schedule"
  description = "Trigger backup function daily"
  schedule_expression = "cron(0 1 * * ? *)"  # Daily at 1 AM

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "backup_lambda" {
  rule      = aws_cloudwatch_event_rule.backup_schedule.name
  target_id = "BackupLambdaTarget"
  arn       = aws_lambda_function.backup.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.backup_schedule.arn
}