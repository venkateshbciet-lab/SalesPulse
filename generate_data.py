"""
Generate Synthetic Sales Dataset for Internship Project
Organization: Queenbug Technologies, Tirupattur
Internship Domain: Python Data Analytics
Author: Data Analytics Intern
Year: 2025

Description:
This script generates a realistic raw sales dataset with ~2,500 orders across 2025.
To simulate real-world data collection issues, it deliberately injects:
1. Exact duplicate rows
2. Negative quantities (simulating clerical entry errors or uncategorized returns)
3. Missing values (NaNs in Customer_ID, Payment_Mode, City, Discount_Pct)
4. Inconsistent text formatting (leading/trailing whitespace, mixed case)
5. Mixed date formats (ISO, DD/MM/YYYY, MM-DD-YYYY, DD-Mon-YYYY)

Output:
Saves to 'data/raw_sales_data.csv'
"""

import os
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd


def generate_sales_data(target_orders: int = 2500, random_seed: int = 42) -> pd.DataFrame:
    """Generates synthetic raw sales data with real-world anomalies."""
    np.random.seed(random_seed)
    random.seed(random_seed)

    # 1. Master product catalog with standard categories and unit prices (INR)
    catalog = {
        "Electronics": [
            ("Laptop", 55000),
            ("Smartphone", 22000),
            ("Wireless Headphones", 2800),
            ("Smartwatch", 3500),
            ("Bluetooth Speaker", 1800),
            ("USB-C Hub", 1200),
        ],
        "Furniture": [
            ("Ergonomic Chair", 7500),
            ("Study Desk", 11500),
            ("Bookshelf", 4200),
            ("Office Lamp", 1400),
            ("Filing Cabinet", 5200),
        ],
        "Office Supplies": [
            ("Paper Ream A4", 350),
            ("Gel Pen Pack", 160),
            ("Whiteboard Marker Set", 220),
            ("Desk Organizer", 650),
            ("Stapler Set", 280),
        ],
        "Clothing": [
            ("Cotton Shirt", 1200),
            ("Formal Trousers", 1600),
            ("Casual T-Shirt", 550),
            ("Winter Jacket", 3200),
            ("Denim Jeans", 1850),
        ],
        "Home & Kitchen": [
            ("Electric Kettle", 1450),
            ("Air Fryer", 5600),
            ("Mixer Grinder", 3700),
            ("Water Purifier", 8900),
            ("Stainless Steel Cookware", 2400),
        ],
    }

    # Regional geography (focus on Indian market with Tirupattur/TN context)
    region_city_map = {
        "South": ["Chennai", "Bengaluru", "Coimbatore", "Tirupattur", "Madurai", "Hyderabad"],
        "North": ["Delhi", "Jaipur", "Lucknow", "Chandigarh"],
        "West": ["Mumbai", "Pune", "Ahmedabad"],
        "East": ["Kolkata", "Bhubaneswar", "Patna"],
    }

    regions = list(region_city_map.keys())
    payment_modes = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Cash on Delivery"]
    discounts = [0.0, 5.0, 10.0, 15.0, 20.0, 25.0]

    # Generate customer pool (~400 unique customers for repeat purchase analysis)
    customer_pool = [f"CUST-{str(i).zfill(4)}" for i in range(101, 501)]

    # Flatten catalog for weighted selection
    all_items = []
    category_weights = {
        "Electronics": 0.30,
        "Furniture": 0.15,
        "Office Supplies": 0.20,
        "Clothing": 0.20,
        "Home & Kitchen": 0.15,
    }

    categories = list(catalog.keys())
    cat_probs = [category_weights[c] for c in categories]

    # 2. Build individual orders
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2025, 12, 31)
    date_range_days = (end_date - start_date).days

    rows = []
    for i in range(1, target_orders + 1):
        order_id = f"ORD-2025-{str(i).zfill(5)}"

        # Random order date in 2025
        random_day = random.randint(0, date_range_days)
        order_date_dt = start_date + timedelta(days=random_day)

        # Select category, product, price
        chosen_cat = np.random.choice(categories, p=cat_probs)
        prod_tuple = random.choice(catalog[chosen_cat])
        product_name, unit_price = prod_tuple

        # Customer selection (skewed so top customers have repeat orders)
        customer_id = random.choice(customer_pool)

        # Region & City
        chosen_region = np.random.choice(regions, p=[0.42, 0.26, 0.20, 0.12])
        chosen_city = random.choice(region_city_map[chosen_region])

        # Quantity (mostly 1 to 5, occasionally up to 12)
        quantity = int(np.random.choice([1, 2, 3, 4, 5, 8, 10], p=[0.45, 0.25, 0.15, 0.07, 0.05, 0.02, 0.01]))

        # Discount
        discount_pct = float(np.random.choice(discounts, p=[0.35, 0.25, 0.20, 0.10, 0.07, 0.03]))

        # Payment mode (UPI is dominant in Indian digital commerce)
        payment_mode = np.random.choice(
            payment_modes, p=[0.45, 0.22, 0.12, 0.11, 0.10]
        )

        # Base revenue formula: Qty * Unit_Price * (1 - Discount/100)
        revenue = round(quantity * unit_price * (1.0 - (discount_pct / 100.0)), 2)

        # Store clean record first
        rows.append({
            "Order_ID": order_id,
            "Order_Date_Raw": order_date_dt,
            "Customer_ID": customer_id,
            "Product": product_name,
            "Category": chosen_cat,
            "Region": chosen_region,
            "City": chosen_city,
            "Quantity": quantity,
            "Unit_Price": unit_price,
            "Discount_Pct": discount_pct,
            "Payment_Mode": payment_mode,
            "Revenue": revenue,
        })

    df = pd.DataFrame(rows)

    # 3. Inject realistic data anomalies for cleaning practice

    # Anomaly A: Inconsistent text case and stray spaces
    # Example: "  electronics ", "Electronics", "LAPTOP", " study desk "
    def dirty_text(val: str, p: float = 0.15) -> str:
        if random.random() > p or pd.isna(val):
            return val
        choice = random.choice(["upper", "lower", "spaces_lead", "spaces_trail", "spaces_both"])
        if choice == "upper":
            return val.upper()
        elif choice == "lower":
            return val.lower()
        elif choice == "spaces_lead":
            return f"  {val}"
        elif choice == "spaces_trail":
            return f"{val}   "
        else:
            return f"  {val} "

    df["Category"] = df["Category"].apply(dirty_text)
    df["Product"] = df["Product"].apply(dirty_text)
    df["City"] = df["City"].apply(dirty_text)
    df["Payment_Mode"] = df["Payment_Mode"].apply(dirty_text)

    # Anomaly B: Mixed Date Formats
    # Simulate data arriving from multiple branch systems/POS terminals
    def format_date_mixed(dt: datetime) -> str:
        r = random.random()
        if r < 0.50:
            return dt.strftime("%Y-%m-%d")        # 2025-08-14 (Standard ISO)
        elif r < 0.75:
            return dt.strftime("%d/%m/%Y")        # 14/08/2025 (British/Indian common)
        elif r < 0.90:
            return dt.strftime("%m-%d-%Y")        # 08-14-2025 (US style)
        else:
            return dt.strftime("%d-%b-%Y")        # 14-Aug-2025 (Abbreviated month)

    df["Order_Date"] = df["Order_Date_Raw"].apply(format_date_mixed)
    df.drop(columns=["Order_Date_Raw"], inplace=True)

    # Reorder columns so Order_Date is second
    cols = [
        "Order_ID", "Order_Date", "Customer_ID", "Product", "Category",
        "Region", "City", "Quantity", "Unit_Price", "Discount_Pct",
        "Payment_Mode", "Revenue"
    ]
    df = df[cols]

    # Anomaly C: Negative Quantities (e.g. returns entered with negative signs or typing errors)
    neg_indices = np.random.choice(df.index, size=35, replace=False)
    for idx in neg_indices:
        current_q = df.loc[idx, "Quantity"]
        df.loc[idx, "Quantity"] = -abs(current_q if current_q != 0 else 1)

    # Anomaly D: Missing values (NaNs) across different fields
    # 25 missing Customer_IDs
    nan_cust = np.random.choice(df.index, size=28, replace=False)
    df.loc[nan_cust, "Customer_ID"] = np.nan

    # 40 missing Payment_Modes
    nan_pmt = np.random.choice(df.index, size=42, replace=False)
    df.loc[nan_pmt, "Payment_Mode"] = np.nan

    # 30 missing Cities
    nan_city = np.random.choice(df.index, size=32, replace=False)
    df.loc[nan_city, "City"] = np.nan

    # 25 missing Discount_Pct
    nan_disc = np.random.choice(df.index, size=26, replace=False)
    df.loc[nan_disc, "Discount_Pct"] = np.nan

    # Anomaly E: Duplicate rows (exact duplicate rows appended)
    dup_indices = np.random.choice(df.index, size=45, replace=False)
    duplicates = df.loc[dup_indices].copy()

    # Concatenate and shuffle slightly
    df = pd.concat([df, duplicates], ignore_index=True)

    return df


def main():
    print("=" * 65)
    print("Queenbug Technologies - Sales Data Generator")
    print("Internship Project: Retail Sales Analytics (2025)")
    print("=" * 65)

    # Ensure data directory exists
    output_dir = os.path.join(".", "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "raw_sales_data.csv")

    print(f"Generating synthetic sales orders...")
    df = generate_sales_data(target_orders=2500, random_seed=42)

    df.to_csv(output_path, index=False)
    print(f"Successfully generated {len(df)} raw records (including anomalies & duplicates).")
    print(f"File saved to: {output_path}")

    # Display preview summary of injected anomalies
    print("\n[Injected Data Quality Anomalies Summary]")
    print(f"- Total Rows: {len(df)}")
    print(f"- Duplicate Rows: {df.duplicated().sum()}")
    print(f"- Negative Quantities: {(df['Quantity'] < 0).sum()}")
    print(f"- Missing Customer IDs: {df['Customer_ID'].isna().sum()}")
    print(f"- Missing Payment Modes: {df['Payment_Mode'].isna().sum()}")
    print(f"- Missing Cities: {df['City'].isna().sum()}")
    print(f"- Missing Discount %: {df['Discount_Pct'].isna().sum()}")
    print("=" * 65)


if __name__ == "__main__":
    main()
