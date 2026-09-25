# Rhombus Enterprise Engine

A full-stack, distributed **Natural Language to Regex Data Processing Platform** built to transform, extract, and redact millions of rows of data across PySpark partitions using intelligent LLM-generated patterns.

## 🚀 Features

* **NL-to-Regex Engine:** Type what you want to do in plain English (e.g., "mask all phone numbers"). The backend LLM translates it into optimized Java Regex for PySpark execution.
* **PySpark Distributed Execution:** Bypasses standard pandas row-by-row iteration in favor of highly optimized PySpark `DataFrame.withColumn()` operations for massive datasets.
* **Smart Entity Extractor:** Acts as a data organizer, isolating specific entities (like domain names from emails or zip codes from addresses) and creating pristine new columns for analytics.
* **PII Redaction Suite:** A one-click, context-aware masking tool designed for Security Officers to safely anonymize SSNs, Credit Cards, and sensitive data into compliant formats (e.g., `XXX-XX-1234`).
* **ReDoS AST Guard:** Automatically tests generated Regex patterns against a Catastrophic Backtracking (ReDoS) engine to ensure malicious prompts cannot crash the distributed cluster.
* **Environment-Aware Job Queueing:** Integrates with Celery & Redis for asynchronous distributed queueing in Dockerized environments, while intelligently falling back to native Python Background Threading for seamless local development.

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS, Lucide React (Icons), Vite
* **Backend:** Django, Django REST Framework (DRF), Celery
* **Data Processing:** PySpark 3.5, Pandas
* **Storage:** S3/MinIO compatible (with automatic Local Storage fallback)
* **LLM Integration:** Extensible provider architecture (Ollama / OpenAI / Anthropic)

## 💻 Local Setup & Installation

### 1. Backend Setup
Navigate to the backend directory and install the Python dependencies.
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

Run the Django migrations and start the server:
```bash
python manage.py migrate
python manage.py runserver
```
*(Note: If you do not have a local Redis server running, the platform will automatically detect this and run asynchronous tasks in a background thread instead of Celery, ensuring zero setup friction).*

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and start the development server.
```bash
cd frontend
npm install
npm run dev
```

### 3. Usage
Open your browser and navigate to `http://localhost:5173`. 
The platform will automatically launch in an unauthorized locked state. Click the **Login Portal** button to authenticate and access the Enterprise Dashboard.

**Login Credentials:**
* **Email:** `hema@rhombusai.com`
* **Password:** `rhombus` (or click the "AI Evaluator" tab for quick access without a password)

## 📁 Architecture Overview
* `backend/spark_engine/`: Contains the singleton SparkSession and distributed transformation logic.
* `backend/llm_engine/`: Manages the prompt-to-regex generation, validation, and prompt caching.
* `backend/jobs/`: Handles Celery task queueing, database state, and job tracking.
* `frontend/src/components/`: Modular React components including the Live Cluster Health Monitor, ReDoS testing sandbox, and data visualization tables.

### ⚡ Partitioning & Parallelism Strategy
To handle massive datasets efficiently, PySpark dynamic partitioning is implemented. The partition count is calculated as `num_partitions = max(2, min(64, total_rows // 50,000))`. This ensures:
1. Small files aren't unnecessarily fragmented (minimum 2 partitions).
2. Large files scale automatically, adding a new partition for roughly every 50,000 rows.
3. Resource exhaustion is prevented by capping at 64 partitions to avoid overloading standard worker nodes.

## 🚀 Deliverables & Demo

* **Live Deployment URL:** [https://rhombus-app.onrender.com]
* **Demo Video:** [https://drive.google.com/file/d/12Zwws1GBYi_S3-rMNRVVigSo2IwKaqjV/view?usp=drive_link]

## 🛡️ Security & Compliance
This platform was built with strict data privacy in mind. Features like the PII Redaction Suite are non-destructive when required, isolating changes dynamically so original raw data is preserved while generating compliant datasets for data science and third-party analysis.
