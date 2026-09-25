import os
import time
import logging
import pandas as pd
from django.conf import settings
from storage.s3_service import s3_service
from .session import get_spark_session
from pyspark.sql import functions as F

logger = logging.getLogger(__name__)

class SparkTransformationEngine:
    def __init__(self):
        self.spark = get_spark_session()

    def process_job(
        self,
        file_key: str,
        job_type: str,
        target_columns: list,
        regex_pattern: str,
        replacement_value: str,
        progress_callback=None
    ) -> dict:
        """
        Main execution entry point for PySpark distributed transformation tasks.
        """
        start_time = time.time()

        if progress_callback:
            progress_callback(30, "Reading dataset into PySpark DataFrame...")

        # 1. Load data into PySpark DataFrame
        df, file_type = self._load_dataframe(file_key)
        original_cols = df.columns

        # Filter target_columns to those that exist in df
        valid_target_cols = [c for c in target_columns if c in original_cols] if target_columns else original_cols

        if progress_callback:
            progress_callback(45, "Distributing dataset across Spark worker nodes...")

        # Implement dynamic partitioning as per requirements
        total_rows = df.count()
        num_partitions = max(2, min(64, total_rows // 50000))
        df = df.repartition(num_partitions)

        if progress_callback:
            progress_callback(60, f"Executing distributed '{job_type}' across {num_partitions} partitions...")

        # 3. Apply Distributed Transformation
        transformed_df = df
        modified_cells_estimate = 0

        if job_type == 'NL_REGEX_REPLACE':
            for col_name in valid_target_cols:
                transformed_df = transformed_df.withColumn(
                    col_name,
                    F.regexp_replace(F.col(col_name).cast("string"), regex_pattern, replacement_value)
                )

        elif job_type == 'ENTITY_EXTRACTION':
            for col_name in valid_target_cols:
                transformed_df = transformed_df.withColumn(
                    col_name,
                    F.regexp_extract(F.col(col_name).cast("string"), regex_pattern, 0)
                )

        elif job_type == 'PII_MASKING':
            for col_name in valid_target_cols:
                transformed_df = transformed_df.withColumn(
                    col_name,
                    F.regexp_replace(F.col(col_name).cast("string"), regex_pattern, replacement_value)
                )

        if progress_callback:
            progress_callback(80, "Persisting transformed results...")

        # 4. Save Output to S3 / Local storage
        out_filename = f"processed_{int(time.time())}_{os.path.basename(file_key)}"
        output_key = self._save_spark_df(transformed_df, out_filename)

        execution_duration = round(time.time() - start_time, 2)

        if progress_callback:
            progress_callback(95, "Generating result preview and performance metrics...")

        # Return stats
        return {
            "total_rows": total_rows,
            "partition_count": num_partitions,
            "target_columns": valid_target_cols,
            "output_s3_key": out_filename,
            "execution_time_seconds": execution_duration,
            "columns": transformed_df.columns
        }

    def _load_dataframe(self, file_key: str):
        """Loads CSV or Excel file into PySpark DataFrame."""
        file_path = os.path.join(settings.LOCAL_STORAGE_DIR, file_key)

        if file_key.endswith('.csv'):
            if os.path.exists(file_path):
                spark_df = self.spark.read.option("header", "true").csv(file_path)
            else:
                pdf = s3_service.load_dataframe(file_key)
                if pdf is None:
                    raise FileNotFoundError(f"Cannot load file '{file_key}'")
                spark_df = self.spark.createDataFrame(pdf.astype(str))
            return spark_df, 'csv'

        elif file_key.endswith(('.xlsx', '.xls')):
            pdf = s3_service.load_dataframe(file_key)
            if pdf is None:
                raise FileNotFoundError(f"Cannot load Excel file '{file_key}'")
            spark_df = self.spark.createDataFrame(pdf.astype(str))
            return spark_df, 'excel'

        else:
            raise ValueError(f"Unsupported format for file {file_key}")

    def _save_spark_df(self, spark_df, output_filename: str) -> str:
        """Saves PySpark DataFrame to local storage / S3 natively or via Pandas fallback."""
        import tempfile
        import glob
        import shutil
        import io
        
        # Check if we are on Windows without Hadoop (winutils.exe). If so, native Spark save will crash.
        is_windows = os.name == 'nt'
        has_hadoop = bool(os.environ.get('HADOOP_HOME'))
        
        if is_windows and not has_hadoop:
            # Fallback to Pandas serialization (slower but safe on Windows without winutils)
            pandas_df = spark_df.toPandas()
            csv_bytes = pandas_df.to_csv(index=False).encode('utf-8')
            s3_service.upload_file_bytes(output_filename, csv_bytes)
            return output_filename
            
        # Native Spark save for Linux/Mac/Docker (Massively faster with parallel write)
        try:
            temp_dir = os.path.join(settings.LOCAL_STORAGE_DIR, f"temp_{output_filename}")
            
            # Remove coalesce(1) to unlock full distributed parallel write speed!
            # Write without headers so we can concatenate part files instantly.
            spark_df.write.mode("overwrite").option("header", "false").csv(temp_dir)
            
            part_files = glob.glob(os.path.join(temp_dir, "*.csv"))
            if not part_files:
                raise FileNotFoundError("Spark native CSV writer failed to generate output.")
                
            # Rapid byte-level concatenation of all partitions
            buffer = io.BytesIO()
            # Write the header manually
            header_line = ",".join(spark_df.columns) + "\n"
            buffer.write(header_line.encode('utf-8'))
            
            for part_file in part_files:
                with open(part_file, "rb") as f:
                    shutil.copyfileobj(f, buffer)
                    
            csv_bytes = buffer.getvalue()
            s3_service.upload_file_bytes(output_filename, csv_bytes)
            
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
            
        return output_filename
