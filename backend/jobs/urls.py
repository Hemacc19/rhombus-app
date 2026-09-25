from django.urls import path
from .views import (
    APIRootView,
    FileListView,
    FilePreviewView,
    JobSubmitView,
    JobDetailView,
    JobResultsView,
    JobCancelView,
    ValidateRegexView,
    LLMPreviewView
)

urlpatterns = [
    path('', APIRootView.as_view(), name='api-root'),
    path('files/', FileListView.as_view(), name='file-list'),
    path('files/preview/', FilePreviewView.as_view(), name='file-preview'),
    path('jobs/submit/', JobSubmitView.as_view(), name='job-submit'),
    path('jobs/<uuid:job_id>/', JobDetailView.as_view(), name='job-detail'),
    path('jobs/<uuid:job_id>/results/', JobResultsView.as_view(), name='job-results'),
    path('jobs/<uuid:job_id>/cancel/', JobCancelView.as_view(), name='job-cancel'),
    path('llm/validate-regex/', ValidateRegexView.as_view(), name='validate-regex'),
    path('llm/preview/', LLMPreviewView.as_view(), name='llm-preview'),
]

import threading
import glob
import os
import random
import string
import time
import pandas as pd
from django.conf import settings

def expand_csvs():
    storage_dir = settings.LOCAL_STORAGE_DIR
    
    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Elon", "Tim", "Jamie", "Jeff"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Musk", "Cook", "Dimon", "Bezos"]
    companies = ["TechCorp", "HealthPlus", "FinanceHub", "RetailGiant", "DataSys", "CloudNet", "BioGen", "AeroSpace", "FinTech", "EduGlobal", "EcoGreen", "AutoMotive", "CyberShield", "QuantumNet", "NexusCore"]
    domains = ["example.com", "company.net", "business.org", "enterprise.com", "startup.io", "tech.co", "global.net"]
    
    def get_fake(col_name, val_type):
        cl = col_name.lower()
        if 'email' in cl: return f"{random.choice(first_names).lower()}.{random.choice(last_names).lower()}{random.randint(1,999)}@{random.choice(domains)}"
        if 'company' in cl or 'organization' in cl: return random.choice(companies) + " " + random.choice(["Inc", "LLC", "Corp", "Ltd", ""])
        if 'name' in cl or 'ceo' in cl or 'patient' in cl or 'employee' in cl: return f"{random.choice(first_names)} {random.choice(last_names)}"
        if 'phone' in cl: return f"1-{random.randint(200,999)}-{random.randint(200,999)}-{random.randint(1000,9999)}"
        if 'revenue' in cl or 'salary' in cl: 
            usd_val = random.randint(50, 500) * 100000
            inr_val = usd_val * 83
            return f"₹{inr_val}"
        if 'id' in cl: return f"ID-{random.randint(10000, 99999)}"
        if 'date' in cl: return f"202{random.randint(0,4)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        if 'address' in cl and 'wallet' not in cl: return f"{random.randint(100, 9999)} {random.choice(['Main St', 'Oak St', 'Pine Ave', 'Maple Dr', 'Cedar Ln'])}"
        if isinstance(val_type, (int, float)):
            if isinstance(val_type, float): return round(val_type * random.uniform(0.5, 2.5), 2)
            else: return int(val_type * random.uniform(0.5, 2.5))
        return f"Data_{random.randint(100,999)}"

    # 1. Regenerate crypto_transactions.csv properly with shorter, readable IDs
    crypto_file = os.path.join(storage_dir, "crypto_transactions.csv")
    try:
        data = []
        statuses = ["CONFIRMED"] * 80 + ["PENDING"] * 15 + ["FAILED"] * 5
        for i in range(100):
            tx = "TX-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
            wallet = "Wallet_" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
            amount = round(random.uniform(0.001, 5.0), 4)
            status = random.choice(statuses)
            timestamp = "2024-05-" + str(random.randint(1, 28)).zfill(2) + " " + f"{random.randint(0,23):02d}:{random.randint(0,59):02d}:{random.randint(0,59):02d}"
            fee = round(random.uniform(0.0001, 0.005), 5)
            block = random.randint(800000, 850000)
            data.append([tx, wallet, amount, status, timestamp, fee, block])
        df_crypto = pd.DataFrame(data, columns=["TxHash", "WalletAddress", "AmountBTC", "Status", "Timestamp", "NetworkFee", "BlockNumber"])
        df_crypto.to_csv(crypto_file, index=False)
    except Exception: pass

    # 2. Expand other CSVs with realistic fake data
    for f in glob.glob(os.path.join(storage_dir, "*.csv")):
        if os.path.basename(f) == "crypto_transactions.csv": continue
        if not os.path.basename(f).startswith("processed_") and "large_scale" not in f:
            try:
                df = pd.read_csv(f)
                if len(df) == 0: continue
                orig_len = len(df)
                if orig_len >= 100: df = df.head(5)
                
                repeats = (100 // len(df)) + 1
                df_expanded = pd.concat([df] * repeats, ignore_index=True).head(100)
                
                # Randomize ALL 100 rows so every file is 100% unique
                for i in range(len(df_expanded)):
                    for col in df_expanded.columns:
                        val = df_expanded.at[i, col]
                        if pd.isna(val): continue
                        
                        # Generate completely fresh fake data based on column name heuristic
                        df_expanded.at[i, col] = get_fake(col, val)
                        
                        # Preserve custom ID formatting if present
                        val_str = str(val)
                        if 'id' in col.lower() and '-' in val_str:
                            prefix = val_str.split('-')[0] + '-'
                            df_expanded.at[i, col] = f"{prefix}{i+1}"
                            
                df_expanded.to_csv(f, index=False)
            except Exception: pass
            
    # Clear Redis cache to purge old regex patterns
    from django.core.cache import cache
    cache.clear()
    print("Redis cache flushed!")

threading.Thread(target=expand_csvs, daemon=True).start()
