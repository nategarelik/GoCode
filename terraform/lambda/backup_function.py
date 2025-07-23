import json
import boto3
import datetime
import os
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda function to perform automated backups of ClaudeCodeUI data
    """
    
    # Initialize AWS clients
    rds_client = boto3.client('rds')
    s3_client = boto3.client('s3')
    
    # Environment variables
    s3_bucket = os.environ['S3_BUCKET']
    kms_key_id = os.environ['KMS_KEY_ID']
    rds_instance_id = os.environ['RDS_INSTANCE_ID']
    
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    
    try:
        # Create RDS snapshot
        snapshot_id = f"{rds_instance_id}-backup-{timestamp}"
        
        logger.info(f"Creating RDS snapshot: {snapshot_id}")
        
        rds_response = rds_client.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=rds_instance_id,
            Tags=[
                {'Key': 'Name', 'Value': snapshot_id},
                {'Key': 'Environment', 'Value': 'production'},
                {'Key': 'BackupType', 'Value': 'automated'},
                {'Key': 'CreatedBy', 'Value': 'lambda-backup-function'}
            ]
        )
        
        logger.info(f"RDS snapshot created successfully: {snapshot_id}")
        
        # Create backup metadata
        backup_metadata = {
            'timestamp': timestamp,
            'rds_snapshot_id': snapshot_id,
            'rds_instance_id': rds_instance_id,
            'backup_type': 'automated',
            'retention_days': 30,
            'created_by': 'lambda-backup-function'
        }
        
        # Upload metadata to S3
        metadata_key = f"backups/{timestamp}/metadata.json"
        
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=metadata_key,
            Body=json.dumps(backup_metadata, indent=2),
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=kms_key_id,
            ContentType='application/json'
        )
        
        logger.info(f"Backup metadata uploaded to S3: s3://{s3_bucket}/{metadata_key}")
        
        # Clean up old snapshots (keep last 30 days)
        cleanup_old_snapshots(rds_client, rds_instance_id)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Backup completed successfully',
                'snapshot_id': snapshot_id,
                'metadata_location': f"s3://{s3_bucket}/{metadata_key}"
            })
        }
        
    except Exception as e:
        logger.error(f"Backup failed: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Backup failed',
                'error': str(e)
            })
        }

def cleanup_old_snapshots(rds_client, rds_instance_id, retention_days=30):
    """
    Clean up old automated snapshots older than retention_days
    """
    try:
        # Calculate cutoff date
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=retention_days)
        
        # List all snapshots for this instance
        response = rds_client.describe_db_snapshots(
            DBInstanceIdentifier=rds_instance_id,
            SnapshotType='manual'
        )
        
        snapshots_deleted = 0
        
        for snapshot in response['DBSnapshots']:
            # Check if this is an automated backup snapshot
            if snapshot['DBSnapshotIdentifier'].endswith('-backup-'):
                snapshot_date = snapshot['SnapshotCreateTime'].replace(tzinfo=None)
                
                if snapshot_date < cutoff_date:
                    logger.info(f"Deleting old snapshot: {snapshot['DBSnapshotIdentifier']}")
                    
                    rds_client.delete_db_snapshot(
                        DBSnapshotIdentifier=snapshot['DBSnapshotIdentifier']
                    )
                    
                    snapshots_deleted += 1
        
        if snapshots_deleted > 0:
            logger.info(f"Cleaned up {snapshots_deleted} old snapshots")
        else:
            logger.info("No old snapshots to clean up")
            
    except Exception as e:
        logger.warning(f"Failed to clean up old snapshots: {str(e)}")

def restore_from_backup(snapshot_id, new_instance_id):
    """
    Restore RDS instance from snapshot
    """
    rds_client = boto3.client('rds')
    
    try:
        logger.info(f"Restoring RDS instance from snapshot: {snapshot_id}")
        
        response = rds_client.restore_db_instance_from_db_snapshot(
            DBInstanceIdentifier=new_instance_id,
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceClass='db.t3.micro',  # Adjust as needed
            PubliclyAccessible=False,
            MultiAZ=False,
            StorageType='gp2',
            Tags=[
                {'Key': 'Name', 'Value': new_instance_id},
                {'Key': 'Environment', 'Value': 'production'},
                {'Key': 'RestoredFrom', 'Value': snapshot_id},
                {'Key': 'CreatedBy', 'Value': 'lambda-restore-function'}
            ]
        )
        
        logger.info(f"Restore initiated for instance: {new_instance_id}")
        return response
        
    except Exception as e:
        logger.error(f"Restore failed: {str(e)}")
        raise