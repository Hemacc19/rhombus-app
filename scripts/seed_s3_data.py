#!/usr/bin/env python
import os
import sys
import time
import boto3

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from generate_large_dataset import generate_sample_data

S3_ENDPOINT = os.environ.get("S3_ENDPOINT_URL", "http://minio:9000")
ACCESS_KEY = os.environ.get("S3_ACCESS_KEY_ID", "minioadmin")
SECRET_KEY = os.environ.get("S3_SECRET_ACCESS_KEY", "minioadmin")
BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "rhombus-datasets")

def seed_s3():
    print(f"Connecting to S3 endpoint: {S3_ENDPOINT}...")
    s3 = boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name='us-east-1'
    )

    # Wait for S3/MinIO to become ready
    max_retries = 15
    for attempt in range(max_retries):
        try:
            buckets = [b['Name'] for b in s3.list_buckets().get('Buckets', [])]
            if BUCKET_NAME not in buckets:
                s3.create_bucket(Bucket=BUCKET_NAME)
                print(f"Created S3 bucket: '{BUCKET_NAME}'")
            break
        except Exception as e:
            print(f"S3 not ready yet (attempt {attempt+1}/{max_retries}): {e}")
            time.sleep(2)

    # Generate local files first
    generate_sample_data(1000, "customer_contacts.csv")
    generate_sample_data(500, "enterprise_leads.xlsx")
    generate_sample_data(25000, "large_scale_dataset.csv")

    storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "storage_data")
    
    for fname in os.listdir(storage_dir):
        if fname.endswith(('.csv', '.xlsx', '.xls')) and not fname.startswith('processed_'):
            fpath = os.path.join(storage_dir, fname)
            with open(fpath, 'rb') as f:
                s3.put_object(Bucket=BUCKET_NAME, Key=fname, Body=f.read())
            print(f"Uploaded {fname} to s3://{BUCKET_NAME}/{fname}")

    print("S3 seeding completed successfully!")

if __name__ == "__main__":
    seed_s3()
