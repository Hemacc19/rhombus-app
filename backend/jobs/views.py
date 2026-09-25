import threading
import logging
from django.core.cache import cache
from rest_framework import status, views
from rest_framework.response import Response
from .models import Job
from .serializers import JobSerializer, JobSubmitRequestSerializer
from .tasks import execute_data_job
from storage.s3_service import s3_service
from llm_engine.regex_validator import RegexValidator
from llm_engine.provider import llm_service

logger = logging.getLogger(__name__)

class APIRootView(views.APIView):
    """API Root Index Endpoint listing all available REST routes."""
    def get(self, request):
        return Response({
            "platform": "Rhombus StreamEngine API",
            "version": "1.0.0",
            "status": "online",
            "database": "MySQL (rhombus_db)",
            "endpoints": {
                "files": "/api/files/",
                "file_preview": "/api/files/preview/?file_key=<file_key>",
                "job_submit": "/api/jobs/submit/",
                "job_detail": "/api/jobs/<job_id>/",
                "job_results": "/api/jobs/<job_id>/results/",
                "job_cancel": "/api/jobs/<job_id>/cancel/",
                "validate_regex": "/api/llm/validate-regex/?pattern=<regex>",
                "llm_preview": "/api/llm/preview/",
                "swagger_ui": "/api/swagger/"
            }
        })

class FileListView(views.APIView):
    """List available CSV/Excel datasets from Amazon S3 / MinIO storage."""
    def get(self, request):
        files = s3_service.list_files()
        return Response({"files": files, "count": len(files)})

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

class FilePreviewView(views.APIView):
    """Returns paginated preview rows and headers for a specified dataset file."""
    @extend_schema(
        parameters=[
            OpenApiParameter(name='file_key', description='S3 key or local filename of the dataset', required=True, type=OpenApiTypes.STR),
            OpenApiParameter(name='page', description='Page number', required=False, type=OpenApiTypes.INT, default=1),
            OpenApiParameter(name='limit', description='Number of rows per page', required=False, type=OpenApiTypes.INT, default=20),
        ]
    )
    def get(self, request):
        file_key = request.query_params.get('file_key')
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))

        if not file_key:
            return Response({"error": "Query param 'file_key' is required."}, status=status.HTTP_400_BAD_REQUEST)

        preview_data = s3_service.get_file_preview(file_key, limit=limit, page=page)
        return Response(preview_data)

class JobSubmitView(views.APIView):
    """
    Asynchronously submits a data processing job.
    Returns immediately with a unique job ID (non-blocking).
    Supports automatic background thread execution if Celery worker is offline.
    """
    def post(self, request):
        serializer = JobSubmitRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        
        job = Job.objects.create(
            job_type=data.get('job_type', 'NL_REGEX_REPLACE'),
            s3_file_key=data['s3_file_key'],
            natural_language_prompt=data['natural_language_prompt'],
            replacement_value=data.get('replacement_value', 'REDACTED'),
            target_columns=data['target_columns'],
            status='QUEUED',
            progress=0
        )

        from django.conf import settings
        if 'localhost' in settings.REDIS_URL:
            # Graceful fallback to background threading for local dev without Redis
            logger.info(f"Local dev detected. Executing job {job.id} in background thread.")
            threading.Thread(target=execute_data_job, args=(str(job.id),), daemon=True).start()
        else:
            try:
                # Attempt to dispatch to Celery (Redis) for distributed processing in Docker
                execute_data_job.delay(str(job.id))
                logger.info(f"Dispatched job {job.id} to Celery worker queue.")
            except Exception as e:
                logger.warning(f"Celery worker unreachable: {e}. Executing job {job.id} in background thread.")
                threading.Thread(target=execute_data_job, args=(str(job.id),), daemon=True).start()

        return Response({
            "message": "Job submitted successfully.",
            "job_id": str(job.id),
            "status": job.status,
            "progress": job.progress,
            "created_at": job.created_at
        }, status=status.HTTP_201_CREATED)

class JobDetailView(views.APIView):
    """Fetch job status, progress, logs, and generated regex."""
    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({"error": f"Job {job_id} not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobSerializer(job)
        return Response(serializer.data)

class JobResultsView(views.APIView):
    """Fetch paginated results of a completed job."""
    @extend_schema(
        parameters=[
            OpenApiParameter(name='page', description='Page number', required=False, type=OpenApiTypes.INT, default=1),
            OpenApiParameter(name='limit', description='Number of rows per page', required=False, type=OpenApiTypes.INT, default=20),
        ]
    )
    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({"error": f"Job {job_id} not found."}, status=status.HTTP_404_NOT_FOUND)

        if job.status != 'SUCCESS':
            return Response({
                "error": f"Job is currently in '{job.status}' status. Results are only available when status is SUCCESS.",
                "job_status": job.status,
                "progress": job.progress
            }, status=status.HTTP_400_BAD_REQUEST)

        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 20))

        results_data = s3_service.get_file_preview(job.output_s3_key, limit=limit, page=page)
        results_data['job_id'] = str(job.id)
        results_data['execution_time_seconds'] = job.execution_time_seconds
        if job.total_rows > 0:
            results_data['total_rows'] = job.total_rows
        results_data['partition_count'] = job.partition_count
        results_data['generated_regex'] = job.generated_regex
        results_data['target_columns'] = job.target_columns

        return Response(results_data)

class JobCancelView(views.APIView):
    """Cancel an ongoing or queued job."""
    def post(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({"error": f"Job {job_id} not found."}, status=status.HTTP_404_NOT_FOUND)

        if job.status in ['SUCCESS', 'FAILED', 'CANCELLED']:
            return Response({"message": f"Job is already in terminal state: {job.status}"})

        cache.set(f"cancel_job:{job_id}", True, timeout=3600)
        job.status = 'CANCELLED'
        job.save(update_fields=['status'])

        return Response({"message": f"Cancellation request sent for job {job_id}."})

class ValidateRegexView(views.APIView):
    """Live regex safety & ReDoS validation API endpoint for UI preview."""
    @extend_schema(
        parameters=[
            OpenApiParameter(name='pattern', description='Regex pattern to validate', required=True, type=OpenApiTypes.STR),
        ]
    )
    def get(self, request):
        pattern = request.query_params.get('pattern', '')
        validation = RegexValidator.validate_pattern(pattern)
        return Response(validation)

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

class LLMPreviewView(views.APIView):
    """Pre-generate regex pattern for UI preview before submitting job."""
    @extend_schema(
        request=inline_serializer(
            name='LLMPreviewRequest',
            fields={
                'prompt': serializers.CharField(help_text='Natural language prompt to convert to regex'),
                'job_type': serializers.CharField(default='NL_REGEX_REPLACE', help_text='Type of job, e.g., NL_REGEX_REPLACE, ENTITY_EXTRACTION'),
            }
        )
    )
    def post(self, request):
        prompt = request.data.get('prompt', '')
        job_type = request.data.get('job_type', 'NL_REGEX_REPLACE')
        if not prompt:
            return Response({"error": "Prompt required"}, status=status.HTTP_400_BAD_REQUEST)

        result = llm_service.generate_regex_from_nl(prompt, task_type=job_type)
        return Response(result)
