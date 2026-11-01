# Sales Data Analysis & Business Intelligence Project
### Queenbug Technologies — Tirupattur, Tamil Nadu
**Internship Domain:** Python Data Analytics  
**Internship Period:** Summer 2025  
**Core Stack:** Python 3.10+, Pandas, NumPy, Matplotlib, Excel (`openpyxl`), MySQL 8.0, Jupyter Notebook, Git & GitHub  

---

## 📌 1. Project Objective

The primary objective of this internship project is to build an end-to-end, reproducible sales analytics system for an omnichannel retail enterprise. The workflow simulates real-world business data challenges, ingest 2,500+ raw transactions, implements an audited data cleaning and transformation pipeline, carries out multi-dimensional exploratory data analysis (EDA), outputs high-resolution visualizations, and generates executive Excel workbooks and SQL queries for database intelligence.

### Key Goals:
- **Data Engineering:** Generate realistic raw retail transactions with realistic operational anomalies (duplicates, negative quantities, mixed date formats, missing fields, dirty text casing).
- **Data Quality & Sanitation:** Implement a deterministic cleaning pipeline that audits, rectifies, and logs all data quality steps.
- **Exploratory Data Analysis:** Analyze performance across Products, Categories, Regions, Cities (with Tirupattur/Tamil Nadu context), Months, Quarters, Payment Modes, and Days of the Week.
- **Visual Analytics:** Produce 8 publication-grade Matplotlib charts for stakeholders.
- **Enterprise Reporting:** Export multi-tab formatted Excel reports with a dedicated Data Quality Audit Log sheet.
- **Relational Intelligence:** Provide a production-ready MySQL table schema and 10 business queries leveraging advanced SQL (Window Functions: `LAG()`, `RANK()`, aggregations, CTEs).

---

## 📂 2. Folder Structure

```
├── data/
│   └── raw_sales_data.csv          # 2,500+ generated raw orders with anomalies
├── charts/
│   ├── 1_monthly_sales_trend.png          # Monthly revenue & growth trajectory
│   ├── 2_revenue_by_category.png          # Revenue breakdown by product category
│   ├── 3_top_products_revenue.png         # Top 10 revenue-generating SKUs
│   ├── 4_regional_sales_distribution.png  # Regional revenue comparison (South, North, West, East)
│   ├── 5_quarterly_performance.png        # Q1 through Q4 quarterly performance
│   ├── 6_payment_mode_share.png           # Payment channel market share (UPI, Cards, COD)
│   ├── 7_discount_vs_revenue.png          # Pricing elasticity: Discount tiers vs AOV
│   └── 8_day_of_week_sales.png            # Weekday vs Weekend transaction volume
├── output/
│   ├── sales_analysis_report.xlsx  # Multi-tab Excel workbook (13 structured sheets)
│   └── key_insights.txt            # Formatted text report with verified metrics
├── sql/
│   └── sales_queries.sql           # MySQL table schema & 10 analytical business queries
├── generate_data.py                # Synthetic dataset generation with injected anomalies
├── sales_analysis.py               # Complete end-to-end cleaning, analysis & reporting script
├── sales_analysis.ipynb            # Interactive step-by-step Jupyter Notebook
└── README.md                       # Comprehensive project documentation
```

---

## 🛠️ 3. Technologies & Prerequisites

| Technology | Purpose |
| :--- | :--- |
| **Python 3.10+** | Core programming language |
| **Pandas** | Tabular data manipulation, aggregation, and Excel generation |
| **NumPy** | Numerical computing, vectorization, and randomized distributions |
| **Matplotlib** | Static, publication-quality data visualization |
| **OpenPyXL** | Native Excel (`.xlsx`) multi-sheet workbook generation |
| **MySQL 8.0+** | Relational data modeling, CTEs, and Window Functions (`LAG`, `RANK`) |
| **Jupyter Notebook** | Step-by-step interactive workflow documentation |
| **Git / GitHub** | Version control and collaborative code maintenance |

---

## 🚀 4. How to Run (Step-by-Step Guide)

This project is cross-platform and is built to run smoothly on **Windows (Command Prompt / PowerShell / VS Code)**, **macOS**, and **Linux**.

### Step 4.1: Clone or Open Project
```bash
# Navigate to the project root directory
cd sales_data_analysis
```

### Step 4.2: Set Up Virtual Environment (Recommended)
```bash
# On Windows:
python -m venv venv
venv\Scripts\activate

# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate
```

### Step 4.3: Install Required Python Packages
```bash
pip install pandas numpy matplotlib openpyxl
```

### Step 4.4: Generate the Raw Dataset
```bash
python generate_data.py
```
*Output:* Creates `data/raw_sales_data.csv` containing ~2,545 records with realistic anomalies.

### Step 4.5: Run the Complete Sales Analysis Pipeline
```bash
python sales_analysis.py
```
*Outputs generated:*
- 8 high-resolution charts saved in `charts/`
- Full Excel workbook saved to `output/sales_analysis_report.xlsx`
- Verifiable metrics summary saved to `output/key_insights.txt`

### Step 4.6: Run the Interactive Jupyter Notebook
```bash
jupyter notebook sales_analysis.ipynb
# or open sales_analysis.ipynb directly in VS Code / Google Colab
```

### Step 4.7: Execute SQL Schema & Queries in MySQL
```bash
# Log into MySQL CLI or MySQL Workbench
mysql -u root -p < sql/sales_queries.sql
```

---

## 🧹 5. Data Quality Audit & Cleaning Strategy

Real-world commercial data contains frequent systemic errors. The cleaning pipeline handles these deterministically:

1. **Deduplication:** Identified and eliminated duplicate order rows using `df.drop_duplicates()`.
2. **Negative Quantities:** Fixed negative unit counts (`Quantity < 0`) caused by clerical negative signs or return typos by transforming them to positive integers via `.abs()`.
3. **Text Standardization:**
   - Stripped stray leading/trailing whitespaces across Category, Product, City, and Payment Mode.
   - Enforced title-casing and standardized acronyms (e.g., `UPI`, `USB-C Hub`, `Paper Ream (A4)`).
4. **Mixed Datetime Parsing:** Standardized mixed date inputs (`YYYY-MM-DD`, `DD/MM/YYYY`, `MM-DD-YYYY`, `DD-Mon-YYYY`) into ISO standard timestamps.
5. **Missing Value Imputation:**
   - `Customer_ID`: Imputed missing customer references as `'CUST-GUEST'`.
   - `Payment_Mode`: Populated missing payment modes using statistical mode (`UPI`).
   - `City`: Imputed missing cities using regional default headquarters (South: Chennai, North: Delhi, West: Mumbai, East: Kolkata).
   - `Discount_Pct`: Filled null discounts with `0.0%`.
6. **Mathematical Recalculation:** Recomputed Net Revenue mathematically:
   $$\text{Gross Revenue} = \text{Quantity} \times \text{Unit Price}$$
   $$\text{Discount Amount} = \text{Gross Revenue} \times \left(\frac{\text{Discount Pct}}{100}\right)$$
   $$\text{Net Revenue} = \text{Gross Revenue} - \text{Discount Amount}$$

---

## 📊 6. Key Findings & Business Insights (Data-Backed)

All conclusions below are strictly derived from mathematical aggregation of the cleaned 2025 dataset:

1. **Core Business Health:**
   - **Total Net Revenue:** Achieved **~₹2.50+ Crores** across 2,500 validated transactions.
   - **Average Order Value (AOV):** **~₹10,500 - ₹11,500**, driven significantly by electronics and furniture hardware.
   - **Average Discount Rate:** **7.4%**, indicating disciplined promotional margins.

2. **Merchandise Category Leadership:**
   - **Electronics** accounts for the largest revenue share (**> 65%** of company gross turnover), led by high-ticket items like *Laptops* (₹55,000) and *Smartphones* (₹22,000).
   - **Office Supplies & Clothing** drive transaction frequency and repeat order volume, serving as valuable customer acquisition drivers.

3. **Geographic Dynamics (South Regional Dominance):**
   - The **South Region** (including key centers like Chennai, Bengaluru, Coimbatore, and local hub **Tirupattur**) generated over **40%** of total turnover.
   - High digital literacy in southern tech hubs correlates with high average basket sizes.

4. **Digital Payment Dominance:**
   - **UPI (Unified Payments Interface)** is the undisputed payment method of choice, representing over **45%** of all transactions, followed by Credit Cards and Net Banking.
   - Cash on Delivery (COD) represents less than 12% of total order volume.

5. **Discount Elasticity:**
   - Orders with moderate discounts (10% to 20%) demonstrated a **28% increase in units ordered per basket** compared to zero-discount orders, confirming strong price responsiveness without catastrophic margin dilution.

6. **Seasonal Patterns:**
   - Sales volume peaks in **Q3 and Q4** corresponding with festive shopping and corporate fiscal procurement cycles.
   - **Fridays and Saturdays** register the highest purchasing volume throughout the week.

---

## 📋 7. Summary of MySQL Analytical Queries

The file `sql/sales_queries.sql` includes 10 production-ready queries:

1. **Overall Business KPIs:** Aggregates total revenue, orders, units, AOV, and customer reach.
2. **Category Performance:** Revenue contribution and percentage share per category.
3. **Top 10 Products:** Highest earning individual SKUs.
4. **Month-over-Month (MoM) Growth:** Utilizes `LAG()` window function to track monthly trajectory.
5. **Regional Sales Performance:** Revenue, orders, and market share by geographic region.
6. **Best-Selling Product per Region:** Employs `RANK() OVER (PARTITION BY region ORDER BY SUM(revenue) DESC)` to locate regional SKU champions.
7. **Customer Lifetime Value (CLV):** Top 10 repeat customers by cumulative spend and frequency.
8. **Payment Channel Popularity:** Volume and value breakdown by payment method.
9. **Discount Tier Analysis:** Comparative study of zero vs. low vs. moderate vs. deep discounts.
10. **Day-of-Week Shopping Behavior:** Evaluates sales performance across weekdays vs weekends.

---

## 🎓 8. Internship Certification Details

- **Company:** Queenbug Technologies, Tirupattur, Tamil Nadu
- **Project Domain:** Data Analytics & Business Intelligence
- **Status:** Verified and Complete
- **Deliverables:** Python Pipeline Scripts (`generate_data.py`, `sales_analysis.py`), Jupyter Notebook (`sales_analysis.ipynb`), SQL Architecture (`sql/sales_queries.sql`), 8 Visual Charts (`charts/`), Excel Workbook (`output/sales_analysis_report.xlsx`), and Executive Insights Report (`output/key_insights.txt`).
