import time
import logging
from celery import shared_task
from django.core.cache import cache
from .models import Job, JobLog
from llm_engine.provider import llm_service

logger = logging.getLogger(__name__)

@shared_task
def execute_data_job(job_id: str):
    """
    Asynchronous Celery task for distributed data processing.
    Executes non-blocking LLM pattern generation, regex safety checks, 
    and PySpark partition transformation.
    """
    start_time = time.time()
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        logger.error(f"Celery task failed: Job {job_id} does not exist.")
        return

    def log_progress(progress_val: int, message: str):
        # Check cancellation signal stored in Redis
        if cache.get(f"cancel_job:{job_id}"):
            raise InterruptedError("Job execution cancelled by user request.")

        job.progress = progress_val
        job.save(update_fields=['progress', 'updated_at'])
        JobLog.objects.create(job=job, progress=progress_val, message=message)
        logger.info(f"Job {job_id} [{progress_val}%]: {message}")

    try:
        log_progress(5, "Task queued and picked up by Celery worker.")
        job.status = 'RUNNING'
        job.save(update_fields=['status'])

        # Step 1: LLM Pattern Generation & Validation
        log_progress(10, f"Translating natural language prompt: '{job.natural_language_prompt}'...")
        
        llm_result = llm_service.generate_regex_from_nl(
            prompt=job.natural_language_prompt,
            task_type=job.job_type
        )

        regex_pattern = llm_result.get("regex_pattern")
        replacement_val = job.replacement_value or llm_result.get("replacement_suggestion", "REDACTED")
        is_safe = llm_result.get("is_safe", False)
        is_valid = llm_result.get("is_valid", False)
        cached = llm_result.get("cached", False)
        provider = llm_result.get("provider_used", "unknown")

        job.generated_regex = regex_pattern
        if job.job_type != 'NL_REGEX_REPLACE' and replacement_val:
            job.replacement_value = replacement_val
        job.save(update_fields=['generated_regex', 'replacement_value'])

        if not is_valid or not is_safe:
            err_msg = llm_result.get("validation_error", "Generated regex failed safety checks.")
            log_progress(15, f"Validation Failed: {err_msg}")
            job.status = 'FAILED'
            job.error_message = f"Regex Safety Guard: {err_msg}"
            job.save(update_fields=['status', 'error_message'])
            return

        cache_str = " (Hit Redis Prompt Cache)" if cached else f" (Generated via {provider})"
        log_progress(20, f"Validated Regex Pattern: `{regex_pattern}`{cache_str}")

        # Step 2: PySpark Distributed Execution
        from spark_engine.transformations import SparkTransformationEngine
        spark_engine = SparkTransformationEngine()
        
        spark_result = spark_engine.process_job(
            file_key=job.s3_file_key,
            job_type=job.job_type,
            target_columns=job.target_columns,
            regex_pattern=regex_pattern,
            replacement_value=replacement_val,
            progress_callback=log_progress
        )

        # Step 3: Complete Job
        duration = round(time.time() - start_time, 2)
        job.status = 'SUCCESS'
        job.progress = 100
        job.total_rows = spark_result.get('total_rows', 0)
        job.partition_count = spark_result.get('partition_count', 0)
        job.output_s3_key = spark_result.get('output_s3_key', '')
        job.execution_time_seconds = duration
        job.save()

        JobLog.objects.create(
            job=job,
            progress=100,
            message=f"Job completed successfully in {duration}s! Processed {job.total_rows:,} rows across {job.partition_count} Spark partitions."
        )

    except InterruptedError as e:
        logger.warning(f"Job {job_id} was cancelled.")
        job.status = 'CANCELLED'
        job.error_message = str(e)
        job.save(update_fields=['status', 'error_message'])
        JobLog.objects.create(job=job, progress=job.progress, message=f"CANCELLED: {str(e)}")

    except Exception as exc:
        logger.error(f"Job {job_id} failed with exception: {exc}", exc_info=True)
        job.status = 'FAILED'
        job.error_message = str(exc)
        job.save(update_fields=['status', 'error_message'])
        JobLog.objects.create(job=job, progress=job.progress, message=f"ERROR: {str(exc)}")
        
        # Retry logic removed for local thread fallback
