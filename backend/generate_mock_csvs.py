import os
import random

# Create storage directory if it doesn't exist
storage_dir = os.path.join(os.path.dirname(__file__), 'storage_data')
os.makedirs(storage_dir, exist_ok=True)

# Generate 10 CSV files
for i in range(1, 11):
    file_path = os.path.join(storage_dir, f'customer_data_batch_{i}.csv')
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("ID,Name,Email,Phone,SSN,Transaction_Amount\n")
        for j in range(1, 101):
            user_id = (i - 1) * 100 + j
            name = f"Customer_{user_id}"
            email = f"customer_{user_id}@example.com"
            phone = f"(555) {random.randint(100, 999)}-{random.randint(1000, 9999)}"
            ssn = f"{random.randint(100,999)}-{random.randint(10,99)}-{random.randint(1000,9999)}"
            amount = round(random.uniform(10.0, 5000.0), 2)
            f.write(f"{user_id},{name},{email},{phone},{ssn},${amount}\n")

print(f"Successfully generated 10 mock CSV datasets in {storage_dir}")
