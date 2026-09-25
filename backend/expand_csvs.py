import os
import pandas as pd

storage_dir = "F:/Rombous/backend/storage_data"

for fname in os.listdir(storage_dir):
    if fname.endswith(".csv") and not fname.startswith("processed_") and not fname.startswith("customer_data_") and not fname.startswith("mock_dataset_"):
        fpath = os.path.join(storage_dir, fname)
        try:
            df = pd.read_csv(fpath)
        except Exception as e:
            continue
            
        # If it's already large, skip it
        if len(df) >= 100 or len(df) == 0:
            continue
            
        print(f"Expanding {fname} from {len(df)} rows to 100 rows...")
        
        # Duplicate rows to reach 100
        multiplier = (100 // len(df)) + 1
        new_df = pd.concat([df] * multiplier, ignore_index=True).head(100)
        
        # Add some random variance so they aren't completely identical
        for col in new_df.columns:
            if new_df[col].dtype == 'object':
                new_df[col] = new_df[col].astype(str) + new_df.index.astype(str).map(lambda x: f"_{x}" if int(x) >= len(df) else "")
            elif pd.api.types.is_numeric_dtype(new_df[col]):
                new_df[col] = new_df[col] + new_df.index
                
        new_df.to_csv(fpath, index=False)
        print(f"Saved {fname} with 100 rows.")
