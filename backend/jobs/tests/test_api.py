import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from jobs.models import Job

@pytest.mark.django_db
def test_job_submit_returns_immediately():
    client = APIClient()
    url = reverse('job-submit')
    payload = {
        "s3_file_key": "sample_contacts.csv",
        "natural_language_prompt": "find email addresses and replace with REDACTED",
        "target_columns": ["Email"],
        "replacement_value": "REDACTED",
        "job_type": "NL_REGEX_REPLACE"
    }

    # API call must return immediately with 201 Created and job_id
    response = client.post(url, payload, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert "job_id" in response.data
    assert response.data["status"] == "QUEUED"

    job = Job.objects.get(id=response.data["job_id"])
    assert str(job.id) == response.data["job_id"]
    assert job.s3_file_key == "sample_contacts.csv"

@pytest.mark.django_db
def test_file_list_endpoint():
    client = APIClient()
    url = reverse('file-list')
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert "files" in response.data
