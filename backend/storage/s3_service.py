import os
import socket
import boto3
from botocore.config import Config
import pandas as pd
from io import BytesIO
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class S3StorageService:
    def __init__(self):
        self.endpoint_url = settings.S3_ENDPOINT_URL
        self.access_key = settings.S3_ACCESS_KEY_ID
        self.secret_key = settings.S3_SECRET_ACCESS_KEY
        self.bucket_name = settings.S3_BUCKET_NAME
        self.region = settings.AWS_REGION
        self.use_fallback = settings.USE_LOCAL_STORAGE_FALLBACK
        self.local_dir = settings.LOCAL_STORAGE_DIR

        os.makedirs(self.local_dir, exist_ok=True)
        self.s3_client = self._get_s3_client()

    def _is_endpoint_reachable(self):
        """Quickly check if the S3 endpoint URL is reachable with 0.3s timeout."""
        if not self.endpoint_url:
            return False
        try:
            url_parts = self.endpoint_url.replace('http://', '').replace('https://', '').split(':')
            host = url_parts[0]
            port = int(url_parts[1]) if len(url_parts) > 1 else 80
            s = socket.create_connection((host, port), timeout=0.3)
            s.close()
            return True
        except Exception:
            return False

    def _get_s3_client(self):
        if not self._is_endpoint_reachable():
            logger.info("S3 Endpoint unreachable. Operating in Local Fast Storage Mode.")
            return None
        try:
            boto_config = Config(
                connect_timeout=2,
                read_timeout=2,
                retries={'max_attempts': 0}
            )
            client = boto3.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
                config=boto_config
            )
            return client
        except Exception as e:
            logger.warning(f"Could not connect to S3/MinIO: {e}. Falling back to local storage directory.")
            return None

    def ensure_bucket_exists(self):
        if not self.s3_client:
            return False
        try:
            buckets = [b['Name'] for b in self.s3_client.list_buckets().get('Buckets', [])]
            if self.bucket_name not in buckets:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
                logger.info(f"Created S3 bucket '{self.bucket_name}'")
            return True
        except Exception as e:
            logger.warning(f"Error checking S3 bucket: {e}")
            return False

    def list_files(self):
        """List CSV and Excel files available in S3 bucket or local fallback directory."""
        files = []
        if self.s3_client:
            try:
                if self.ensure_bucket_exists():
                    response = self.s3_client.list_objects_v2(Bucket=self.bucket_name)
                    if 'Contents' in response:
                        for item in response['Contents']:
                            key = item['Key']
                            if key.endswith(('.csv', '.xlsx', '.xls')) and not key.startswith('processed_') and not key.startswith('mock_dataset_') and not key.startswith('customer_data_batch_') and not key.startswith('temp_'):
                                files.append({
                                    'key': key,
                                    'size': item['Size'],
                                    'size_formatted': self._format_size(item['Size']),
                                    'last_modified': item['LastModified'].isoformat(),
                                    'source': 's3'
                                })
            except Exception as e:
                logger.error(f"S3 list_files error: {e}")

        if not files and os.path.exists(self.local_dir):
            for filename in os.listdir(self.local_dir):
                path = os.path.join(self.local_dir, filename)
                if os.path.isfile(path) and filename.endswith(('.csv', '.xlsx', '.xls')) and not filename.startswith('processed_') and not filename.startswith('mock_dataset_') and not filename.startswith('customer_data_batch_') and not filename.startswith('temp_'):
                    stat = os.stat(path)
                    files.append({
                        'key': filename,
                        'size': stat.st_size,
                        'size_formatted': self._format_size(stat.st_size),
                        'last_modified': pd.Timestamp(stat.st_mtime, unit='s').isoformat(),
                        'source': 'local_storage'
                    })

        return files

    def get_file_preview(self, file_key, limit=50, page=1):
        """Preview dataset headers and rows with dynamic pagination across the full file."""
        df = self.load_dataframe(file_key)
        if df is None:
            return {'columns': [], 'rows': [], 'total_rows': 0, 'page': page, 'total_pages': 0}

        total_rows = len(df)
        
        # If limit is 0 or negative, return all rows
        if limit <= 0:
            limit = total_rows or 1
            page = 1

        total_pages = (total_rows + limit - 1) // limit if limit > 0 else 1
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit

        paginated_df = df.iloc[start_idx:end_idx].fillna('')
        
        return {
            'columns': list(df.columns),
            'rows': paginated_df.to_dict(orient='records'),
            'total_rows': total_rows,
            'page': page,
            'limit': limit,
            'total_pages': max(1, total_pages)
        }

    def load_dataframe(self, file_key, max_rows=None):
        """Loads a file from S3 or local storage into a Pandas DataFrame."""
        try:
            content_bytes = None
            if self.s3_client:
                try:
                    obj = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_key)
                    content_bytes = obj['Body'].read()
                except Exception:
                    pass

            if content_bytes is None:
                local_path = os.path.join(self.local_dir, file_key)
                if os.path.exists(local_path):
                    with open(local_path, 'rb') as f:
                        content_bytes = f.read()

            if content_bytes is None:
                raise FileNotFoundError(f"File '{file_key}' not found in S3 or local storage.")

            buffer = BytesIO(content_bytes)
            if file_key.endswith('.csv'):
                df = pd.read_csv(buffer, nrows=max_rows)
            elif file_key.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(buffer, nrows=max_rows)
            else:
                raise ValueError("Unsupported file format")

            # Drop any 'Unnamed: 0' index columns that pandas automatically adds
            df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
            return df

        except Exception as e:
            logger.error(f"Error loading dataframe for {file_key}: {e}")
            return None

    def upload_file_bytes(self, file_key, content_bytes):
        """Upload file bytes to S3 or save to local storage."""
        s3_success = False
        if self.s3_client:
            try:
                self.ensure_bucket_exists()
                self.s3_client.put_object(Bucket=self.bucket_name, Key=file_key, Body=content_bytes)
                s3_success = True
            except Exception as e:
                logger.error(f"Failed to upload to S3: {e}")

        local_path = os.path.join(self.local_dir, file_key)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, 'wb') as f:
            f.write(content_bytes)

        return f"s3://{self.bucket_name}/{file_key}" if s3_success else local_path

    def _format_size(self, bytes_num):
        for unit in ['B', 'KB', 'MB', 'GB']:
            if abs(bytes_num) < 1024.0:
                return f"{bytes_num:3.1f} {unit}"
            bytes_num /= 1024.0
        return f"{bytes_num:.1f} TB"

s3_service = S3StorageService()
