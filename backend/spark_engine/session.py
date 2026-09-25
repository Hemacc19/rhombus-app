import os
import sys
import logging
from django.conf import settings
from pyspark.sql import SparkSession

logger = logging.getLogger(__name__)

_spark_session = None

def get_spark_session():
    """
    Returns a singleton PySpark SparkSession configured for distributed data processing
    with optional Amazon S3 / MinIO integration.
    """
    global _spark_session
    if _spark_session is not None and not _spark_session._jsc.sc().isStopped():
        return _spark_session

    logger.info("Initializing PySpark Session for Rhombus Data Platform...")
    
    # Fix for Windows local execution: "Python worker failed to connect back"
    os.environ['PYSPARK_PYTHON'] = sys.executable
    os.environ['PYSPARK_DRIVER_PYTHON'] = sys.executable
    
    # Fix for Windows IPv6/localhost binding issues preventing worker connection
    os.environ['SPARK_LOCAL_IP'] = '127.0.0.1'
    os.environ['SPARK_LOCAL_HOSTNAME'] = '127.0.0.1'
    
    master = getattr(settings, 'SPARK_MASTER', 'local[*]')
    app_name = getattr(settings, 'SPARK_APP_NAME', 'Rhombus-Distributed-Processor')
    s3_endpoint = getattr(settings, 'S3_ENDPOINT_URL', 'http://localhost:9000')
    access_key = getattr(settings, 'S3_ACCESS_KEY_ID', 'minioadmin')
    secret_key = getattr(settings, 'S3_SECRET_ACCESS_KEY', 'minioadmin')

    builder = SparkSession.builder \
        .appName(app_name) \
        .master(master) \
        .config("spark.driver.memory", "2g") \
        .config("spark.executor.memory", "2g") \
        .config("spark.sql.shuffle.partitions", "8") \
        .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
        .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

    # Add S3A filesystem configurations for MinIO / S3
    if s3_endpoint:
        builder = builder \
            .config("spark.hadoop.fs.s3a.endpoint", s3_endpoint) \
            .config("spark.hadoop.fs.s3a.access.key", access_key) \
            .config("spark.hadoop.fs.s3a.secret.key", secret_key) \
            .config("spark.hadoop.fs.s3a.path.style.access", "true") \
            .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")

    _spark_session = builder.getOrCreate()
    logger.info("PySpark Session successfully initialized!")
    return _spark_session
