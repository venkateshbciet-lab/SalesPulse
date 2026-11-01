-- ==============================================================================
-- QUEENBUG TECHNOLOGIES - TIRUPATTUR
-- Summer Internship: Sales Data Analysis & Business Intelligence
-- File: sales_queries.sql
-- Database Engine: MySQL 8.0+
-- Description: Table schema, indexes, and 10 analytical SQL queries.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DATABASE & SCHEMA CREATION
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS queenbug_retail_db;
USE queenbug_retail_db;

DROP TABLE IF EXISTS sales_orders;

CREATE TABLE sales_orders (
    order_id VARCHAR(30) NOT NULL PRIMARY KEY,
    order_date DATE NOT NULL,
    customer_id VARCHAR(30) NOT NULL,
    product VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_pct DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(50) NOT NULL,
    gross_revenue DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    revenue DECIMAL(12, 2) NOT NULL,
    order_month VARCHAR(10),
    quarter VARCHAR(5),
    weekday VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_date (order_date),
    INDEX idx_category (category),
    INDEX idx_region (region),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 2. TEN (10) BUSINESS ANALYTICAL QUERIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- QUERY 1: Overall Business KPIs (Executive Dashboard)
-- Objective: Calculate high-level financial metrics across the entire 2025 dataset.
-- ------------------------------------------------------------------------------
SELECT 
    COUNT(order_id) AS total_orders,
    SUM(quantity) AS total_units_sold,
    ROUND(SUM(gross_revenue), 2) AS gross_revenue_inr,
    ROUND(SUM(discount_amount), 2) AS total_discount_given_inr,
    ROUND(SUM(revenue), 2) AS total_net_revenue_inr,
    ROUND(AVG(revenue), 2) AS average_order_value_inr,
    ROUND(AVG(discount_pct), 2) AS avg_discount_pct,
    COUNT(DISTINCT customer_id) AS total_unique_customers
FROM sales_orders;


-- ------------------------------------------------------------------------------
-- QUERY 2: Revenue & Units Sold by Product Category
-- Objective: Evaluate revenue share and volume contribution across merchandise categories.
-- ------------------------------------------------------------------------------
SELECT 
    category,
    COUNT(order_id) AS order_count,
    SUM(quantity) AS units_sold,
    ROUND(SUM(revenue), 2) AS total_revenue_inr,
    ROUND(AVG(revenue), 2) AS avg_order_value_inr,
    ROUND((SUM(revenue) / (SELECT SUM(revenue) FROM sales_orders) * 100), 2) AS revenue_share_pct
FROM sales_orders
GROUP BY category
ORDER BY total_revenue_inr DESC;


-- ------------------------------------------------------------------------------
-- QUERY 3: Top 10 Revenue-Generating Products
-- Objective: Identify highest performing individual SKUs to inform inventory stocking.
-- ------------------------------------------------------------------------------
SELECT 
    product,
    category,
    COUNT(order_id) AS total_orders,
    SUM(quantity) AS total_units_sold,
    ROUND(AVG(unit_price), 2) AS avg_unit_price_inr,
    ROUND(SUM(revenue), 2) AS total_net_revenue_inr,
    ROUND((SUM(revenue) / (SELECT SUM(revenue) FROM sales_orders) * 100), 2) AS contribution_to_total_pct
FROM sales_orders
GROUP BY product, category
ORDER BY total_net_revenue_inr DESC
LIMIT 10;


-- ------------------------------------------------------------------------------
-- QUERY 4: Monthly Revenue Trend and Month-over-Month (MoM) Growth
-- Technique: Window Function LAG() to calculate relative growth from previous month.
-- ------------------------------------------------------------------------------
WITH monthly_sales AS (
    SELECT 
        DATE_FORMAT(order_date, '%Y-%m') AS year_month,
        COUNT(order_id) AS order_count,
        SUM(quantity) AS units_sold,
        ROUND(SUM(revenue), 2) AS current_month_revenue
    FROM sales_orders
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT 
    year_month,
    order_count,
    units_sold,
    current_month_revenue,
    LAG(current_month_revenue, 1) OVER (ORDER BY year_month) AS previous_month_revenue,
    ROUND(
        (current_month_revenue - LAG(current_month_revenue, 1) OVER (ORDER BY year_month)) 
        / LAG(current_month_revenue, 1) OVER (ORDER BY year_month) * 100, 
        2
    ) AS mom_growth_rate_pct
FROM monthly_sales
ORDER BY year_month ASC;


-- ------------------------------------------------------------------------------
-- QUERY 5: Regional Sales Performance & Geography Breakdown
-- Objective: Compare geographic markets (South, North, West, East) by throughput & AOV.
-- ------------------------------------------------------------------------------
SELECT 
    region,
    COUNT(order_id) AS total_orders,
    SUM(quantity) AS total_units_sold,
    ROUND(SUM(revenue), 2) AS total_revenue_inr,
    ROUND(AVG(revenue), 2) AS avg_order_value_inr,
    ROUND((SUM(revenue) / (SELECT SUM(revenue) FROM sales_orders) * 100), 2) AS regional_share_pct
FROM sales_orders
GROUP BY region
ORDER BY total_revenue_inr DESC;


-- ------------------------------------------------------------------------------
-- QUERY 6: Best-Selling Product in Each Region
-- Technique: Window Function RANK() partitioned by region to locate top SKU.
-- ------------------------------------------------------------------------------
WITH regional_product_ranking AS (
    SELECT 
        region,
        product,
        category,
        SUM(quantity) AS units_sold,
        ROUND(SUM(revenue), 2) AS product_revenue_inr,
        RANK() OVER (PARTITION BY region ORDER BY SUM(revenue) DESC) AS rank_in_region
    FROM sales_orders
    GROUP BY region, product, category
)
SELECT 
    region,
    rank_in_region,
    product,
    category,
    units_sold,
    product_revenue_inr
FROM regional_product_ranking
WHERE rank_in_region = 1
ORDER BY product_revenue_inr DESC;


-- ------------------------------------------------------------------------------
-- QUERY 7: Top 10 Most Valuable Customers (Customer Lifetime Value)
-- Objective: Identify high-spending repeat buyers (excluding guest accounts).
-- ------------------------------------------------------------------------------
SELECT 
    customer_id,
    COUNT(order_id) AS order_frequency,
    SUM(quantity) AS total_units_bought,
    ROUND(SUM(revenue), 2) AS total_spend_inr,
    ROUND(AVG(revenue), 2) AS avg_spend_per_order_inr,
    MIN(order_date) AS first_order_date,
    MAX(order_date) AS most_recent_order_date
FROM sales_orders
WHERE customer_id != 'CUST-GUEST'
GROUP BY customer_id
ORDER BY total_spend_inr DESC
LIMIT 10;


-- ------------------------------------------------------------------------------
-- QUERY 8: Payment Mode Popularity & Revenue Contribution
-- Objective: Discover digital payment preferences (UPI, Credit Card, COD, etc.).
-- ------------------------------------------------------------------------------
SELECT 
    payment_mode,
    COUNT(order_id) AS transactions_count,
    ROUND((COUNT(order_id) / (SELECT COUNT(*) FROM sales_orders) * 100), 2) AS transaction_share_pct,
    ROUND(SUM(revenue), 2) AS total_revenue_inr,
    ROUND(AVG(revenue), 2) AS avg_ticket_size_inr,
    ROUND((SUM(revenue) / (SELECT SUM(revenue) FROM sales_orders) * 100), 2) AS revenue_share_pct
FROM sales_orders
GROUP BY payment_mode
ORDER BY total_revenue_inr DESC;


-- ------------------------------------------------------------------------------
-- QUERY 9: Impact of Discount Tiers on Sales Volume and Average Revenue
-- Objective: Analyze how discounting depth influences order volume versus revenue yield.
-- ------------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN discount_pct = 0.00 THEN 'No Discount (0%)'
        WHEN discount_pct <= 10.00 THEN 'Low Discount (1% - 10%)'
        WHEN discount_pct <= 20.00 THEN 'Moderate Discount (11% - 20%)'
        ELSE 'Deep Discount (> 20%)'
    END AS discount_tier,
    COUNT(order_id) AS total_orders,
    SUM(quantity) AS total_units_sold,
    ROUND(AVG(quantity), 2) AS avg_units_per_order,
    ROUND(SUM(revenue), 2) AS total_tier_revenue_inr,
    ROUND(AVG(revenue), 2) AS avg_order_value_inr,
    ROUND(SUM(discount_amount), 2) AS total_discount_granted_inr
FROM sales_orders
GROUP BY discount_tier
ORDER BY total_tier_revenue_inr DESC;


-- ------------------------------------------------------------------------------
-- QUERY 10: Day-of-Week Sales Performance (Weekday vs. Weekend)
-- Objective: Uncover consumer shopping cycle patterns throughout the week.
-- ------------------------------------------------------------------------------
SELECT 
    DAYNAME(order_date) AS day_of_week,
    DAYOFWEEK(order_date) AS day_index,
    CASE 
        WHEN DAYOFWEEK(order_date) IN (1, 7) THEN 'Weekend'
        ELSE 'Weekday'
    END AS day_type,
    COUNT(order_id) AS total_orders,
    SUM(quantity) AS total_units_sold,
    ROUND(SUM(revenue), 2) AS total_revenue_inr,
    ROUND(AVG(revenue), 2) AS avg_order_value_inr,
    ROUND((SUM(revenue) / (SELECT SUM(revenue) FROM sales_orders) * 100), 2) AS revenue_share_pct
FROM sales_orders
GROUP BY day_of_week, day_index, day_type
ORDER BY total_revenue_inr DESC;
