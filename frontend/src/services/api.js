import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchS3Files = async () => {
  const response = await api.get('/files/');
  return response.data;
};

export const fetchFilePreview = async (fileKey, page = 1, limit = 20) => {
  const response = await api.get('/files/preview/', {
    params: { file_key: fileKey, page, limit },
  });
  return response.data;
};

export const submitJob = async (payload) => {
  const response = await api.post('/jobs/submit/', payload);
  return response.data;
};

export const fetchJobStatus = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/`);
  return response.data;
};

export const fetchJobResults = async (jobId, page = 1, limit = 20) => {
  const response = await api.get(`/jobs/${jobId}/results/`, {
    params: { page, limit },
  });
  return response.data;
};

export const cancelJob = async (jobId) => {
  const response = await api.post(`/jobs/${jobId}/cancel/`);
  return response.data;
};

export const validateRegex = async (pattern) => {
  const response = await api.get('/llm/validate-regex/', {
    params: { pattern },
  });
  return response.data;
};

export const previewLLM = async (prompt, jobType = 'NL_REGEX_REPLACE') => {
  const response = await api.post('/llm/preview/', {
    prompt,
    job_type: jobType,
  });
  return response.data;
};
