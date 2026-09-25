from rest_framework import serializers
from .models import Job, JobLog

class JobLogSerializer(serializers.ModelSerializer):
    timestamp_formatted = serializers.SerializerMethodField()

    class Meta:
        model = JobLog
        fields = ['id', 'timestamp', 'timestamp_formatted', 'progress', 'message']

    def get_timestamp_formatted(self, obj):
        return obj.timestamp.strftime("%H:%M:%S")

class JobSerializer(serializers.ModelSerializer):
    logs = JobLogSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id',
            'job_type',
            'job_type_display',
            'status',
            'status_display',
            'progress',
            's3_file_key',
            'natural_language_prompt',
            'generated_regex',
            'replacement_value',
            'target_columns',
            'total_rows',
            'partition_count',
            'execution_time_seconds',
            'error_message',
            'output_s3_key',
            'created_at',
            'updated_at',
            'logs'
        ]

class JobSubmitRequestSerializer(serializers.Serializer):
    s3_file_key = serializers.CharField(required=True)
    natural_language_prompt = serializers.CharField(required=True)
    target_columns = serializers.ListField(child=serializers.CharField(), required=True)
    replacement_value = serializers.CharField(required=False, default='REDACTED', allow_blank=True)
    job_type = serializers.ChoiceField(
        choices=Job.JOB_TYPE_CHOICES,
        required=False,
        default='NL_REGEX_REPLACE'
    )
