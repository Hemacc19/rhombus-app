import uuid
from django.db import models

class Job(models.Model):
    JOB_TYPE_CHOICES = [
        ('NL_REGEX_REPLACE', 'Natural Language Regex Replace'),
        ('ENTITY_EXTRACTION', 'Smart Entity Extraction'),
        ('PII_MASKING', 'Context-Aware PII Masking'),
    ]

    STATUS_CHOICES = [
        ('QUEUED', 'Queued'),
        ('RUNNING', 'Running'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_type = models.CharField(max_length=32, choices=JOB_TYPE_CHOICES, default='NL_REGEX_REPLACE')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='QUEUED')
    progress = models.IntegerField(default=0)
    
    s3_file_key = models.CharField(max_length=255)
    natural_language_prompt = models.TextField()
    generated_regex = models.TextField(blank=True, null=True)
    replacement_value = models.CharField(max_length=255, blank=True, null=True, default='REDACTED')
    target_columns = models.JSONField(default=list)

    total_rows = models.IntegerField(default=0)
    partition_count = models.IntegerField(default=0)
    execution_time_seconds = models.FloatField(default=0.0)
    
    error_message = models.TextField(blank=True, null=True)
    output_s3_key = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Job {self.id} [{self.job_type}] - {self.status} ({self.progress}%)"

class JobLog(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    progress = models.IntegerField(default=0)
    message = models.CharField(max_length=512)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"[{self.timestamp.strftime('%H:%M:%S')}] Job {self.job.id} ({self.progress}%): {self.message}"
