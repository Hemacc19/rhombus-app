#!/usr/bin/env python
import os
import random
import pandas as pd
from datetime import datetime

def generate_sample_data(num_rows=1000, filename="customer_contacts.csv"):
    first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "David", "Emma", "Fiona", "George", "Hannah"]
    last_names = ["Doe", "Smith", "Brown", "Johnson", "Williams", "Jones", "Miller", "Davis", "Wilson", "Taylor"]
    domains = ["example.com", "domain.com", "website.org", "techcorp.io", "mail.net", "company.org"]

    print(f"Generating synthetic dataset with {num_rows:,} rows -> {filename}...")

    data = []
    for i in range(1, num_rows + 1):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        domain = random.choice(domains)
        email = f"{fn.lower()}.{ln.lower()}{random.randint(1, 99)}@{domain}"
        phone = f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}"
        ssn = f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}"
        card = f"{random.randint(4000, 4999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
        signup_date = f"{random.randint(2020, 2026)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"

        data.append({
            "ID": i,
            "Name": f"{fn} {ln}",
            "Email": email,
            "Phone": phone,
            "SSN": ssn,
            "CreditCard": card,
            "SignupDate": signup_date,
            "Notes": f"Customer contact via email {email} or phone {phone}."
        })

    df = pd.DataFrame(data)
    
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "storage_data")
    os.makedirs(output_dir, exist_ok=True)
    
    file_path = os.path.join(output_dir, filename)
    if filename.endswith(".csv"):
        df.to_csv(file_path, index=False)
    elif filename.endswith(".xlsx"):
        df.to_excel(file_path, index=False)

    print(f"Dataset saved successfully at: {file_path}")

if __name__ == "__main__":
    generate_sample_data(1000, "customer_contacts.csv")
    generate_sample_data(500, "enterprise_leads.xlsx")
    generate_sample_data(50000, "large_scale_dataset.csv")
