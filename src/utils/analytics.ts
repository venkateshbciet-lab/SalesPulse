export interface DatasetAnalysis {
  name: string;
  rowCount: number;
  kpis: {
    totalRevenue: number;
    grossRevenue: number;
    totalDiscount: number;
    totalOrders: number;
    totalUnits: number;
    averageOrderValue: number;
    avgDiscountPct: number;
    topRegion: string;
    topCategory: string;
    topProduct: string;
  };
  by_month: Array<{
    Month: string;
    Month_Num: number;
    Total_Revenue: number;
    Units_Sold: number;
    Order_Count: number;
    Avg_Order_Value: number;
    MoM_Growth_Pct: number | null;
  }>;
  by_category: Array<{
    Category: string;
    Total_Revenue: number;
    Units_Sold: number;
    Order_Count: number;
    Revenue_Share_Pct: number;
    Avg_Order_Value: number;
  }>;
  by_product: Array<{
    Product: string;
    Category: string;
    Total_Revenue: number;
    Units_Sold: number;
    Order_Count: number;
    Revenue_Share_Pct: number;
  }>;
  by_region: Array<{
    Region: string;
    Total_Revenue: number;
    Units_Sold: number;
    Order_Count: number;
    Revenue_Share_Pct: number;
  }>;
  by_quarter: Array<{
    Quarter: string;
    Total_Revenue: number;
    Units_Sold: number;
    Order_Count: number;
    Revenue_Share_Pct: number;
  }>;
  by_payment_mode: Array<{
    Payment_Mode: string;
    Total_Revenue: number;
    Order_Count: number;
    Revenue_Share_Pct: number;
  }>;
  discount_impact: Array<{
    Discount_Bracket: string;
    Order_Count: number;
    Total_Revenue: number;
    Avg_Units_Per_Order: number;
    Avg_Order_Value: number;
  }>;
  by_weekday: Array<{
    Weekday: string;
    Total_Revenue: number;
    Order_Count: number;
    Revenue_Share_Pct: number;
  }>;
}

export const parseDateParts = (dateStr: any) => {
  if (!dateStr) return { month: 'Jan', monthNum: 1, quarter: 'Q1', weekday: 'Monday', year: 2025 };
  const s = String(dateStr).trim();
  let d = new Date(s);
  
  if (isNaN(d.getTime())) {
    const parts = s.split(/[\/\-\.]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        if (isNaN(d.getTime())) {
          d = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
        }
      } else if (parts[0].length === 4) {
        d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
      }
    }
  }

  if (isNaN(d.getTime())) {
    return { month: 'Jan', monthNum: 1, quarter: 'Q1', weekday: 'Monday', year: 2025 };
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const m = d.getMonth();
  const q = m < 3 ? 'Q1' : m < 6 ? 'Q2' : m < 9 ? 'Q3' : 'Q4';

  return {
    month: monthNames[m],
    monthNum: m + 1,
    quarter: q,
    weekday: weekdayNames[d.getDay()],
    year: d.getFullYear()
  };
};

export const computeAnalytics = (rows: any[], datasetName = 'Custom Provided Dataset'): DatasetAnalysis => {
  let totalRevenue = 0;
  let grossRevenue = 0;
  let totalUnits = 0;
  let discountPctSum = 0;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthMap: Record<string, { num: number; rev: number; units: number; orders: number }> = {};
  monthNames.forEach((m, idx) => {
    monthMap[m] = { num: idx + 1, rev: 0, units: 0, orders: 0 };
  });

  const catMap: Record<string, { rev: number; units: number; orders: number }> = {};
  const prodMap: Record<string, { cat: string; rev: number; units: number; orders: number }> = {};
  const regMap: Record<string, { rev: number; units: number; orders: number }> = {};
  const qMap: Record<string, { rev: number; units: number; orders: number }> = {
    Q1: { rev: 0, units: 0, orders: 0 },
    Q2: { rev: 0, units: 0, orders: 0 },
    Q3: { rev: 0, units: 0, orders: 0 },
    Q4: { rev: 0, units: 0, orders: 0 },
  };
  const payMap: Record<string, { rev: number; orders: number }> = {};
  const discMap: Record<string, { rev: number; orders: number; units: number }> = {
    '0% (No Discount)': { rev: 0, orders: 0, units: 0 },
    '1% - 5% (Low)': { rev: 0, orders: 0, units: 0 },
    '6% - 15% (Moderate)': { rev: 0, orders: 0, units: 0 },
    '> 15% (High)': { rev: 0, orders: 0, units: 0 },
  };
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekMap: Record<string, { rev: number; orders: number }> = {};
  weekdays.forEach(w => { weekMap[w] = { rev: 0, orders: 0 }; });

  rows.forEach((r) => {
    const qty = Math.abs(Number(r.Quantity) || 1);
    const price = Number(r.Unit_Price) || 0;
    const disc = Number(r.Discount_Pct) || 0;
    let rev = Number(r.Revenue);
    if (isNaN(rev) || rev <= 0) {
      rev = price > 0 ? qty * price * (1 - disc / 100) : 0;
    }
    const gross = price > 0 ? qty * price : rev;

    totalRevenue += rev;
    grossRevenue += gross;
    totalUnits += qty;
    discountPctSum += disc;

    // Date Breakdown
    const dateInfo = parseDateParts(r.Order_Date);
    const m = dateInfo.month;
    if (monthMap[m]) {
      monthMap[m].rev += rev;
      monthMap[m].units += qty;
      monthMap[m].orders += 1;
    }

    // Category
    const cat = String(r.Category || 'Other').trim() || 'Other';
    if (!catMap[cat]) catMap[cat] = { rev: 0, units: 0, orders: 0 };
    catMap[cat].rev += rev;
    catMap[cat].units += qty;
    catMap[cat].orders += 1;

    // Product
    const prod = String(r.Product || 'Product').trim() || 'Product';
    if (!prodMap[prod]) prodMap[prod] = { cat, rev: 0, units: 0, orders: 0 };
    prodMap[prod].rev += rev;
    prodMap[prod].units += qty;
    prodMap[prod].orders += 1;

    // Region
    const reg = String(r.Region || 'General').trim() || 'General';
    if (!regMap[reg]) regMap[reg] = { rev: 0, units: 0, orders: 0 };
    regMap[reg].rev += rev;
    regMap[reg].units += qty;
    regMap[reg].orders += 1;

    // Quarter
    const q = dateInfo.quarter || 'Q1';
    if (qMap[q]) {
      qMap[q].rev += rev;
      qMap[q].units += qty;
      qMap[q].orders += 1;
    }

    // Payment Mode
    const pay = String(r.Payment_Mode || 'Other').trim() || 'Other';
    if (!payMap[pay]) payMap[pay] = { rev: 0, orders: 0 };
    payMap[pay].rev += rev;
    payMap[pay].orders += 1;

    // Discount bracket
    let bracket = '0% (No Discount)';
    if (disc > 15) bracket = '> 15% (High)';
    else if (disc >= 6) bracket = '6% - 15% (Moderate)';
    else if (disc > 0) bracket = '1% - 5% (Low)';
    discMap[bracket].rev += rev;
    discMap[bracket].orders += 1;
    discMap[bracket].units += qty;

    // Weekday
    const w = dateInfo.weekday || 'Monday';
    if (weekMap[w]) {
      weekMap[w].rev += rev;
      weekMap[w].orders += 1;
    }
  });

  const totalOrders = rows.length || 1;
  const aov = totalRevenue / totalOrders;
  const avgDiscount = discountPctSum / totalOrders;

  // by_category
  const by_category = Object.entries(catMap)
    .map(([Category, d]) => ({
      Category,
      Total_Revenue: d.rev,
      Units_Sold: d.units,
      Order_Count: d.orders,
      Revenue_Share_Pct: totalRevenue > 0 ? Number(((d.rev / totalRevenue) * 100).toFixed(2)) : 0,
      Avg_Order_Value: d.orders > 0 ? d.rev / d.orders : 0,
    }))
    .sort((a, b) => b.Total_Revenue - a.Total_Revenue);

  // by_product
  const by_product = Object.entries(prodMap)
    .map(([Product, d]) => ({
      Product,
      Category: d.cat,
      Total_Revenue: d.rev,
      Units_Sold: d.units,
      Order_Count: d.orders,
      Revenue_Share_Pct: totalRevenue > 0 ? Number(((d.rev / totalRevenue) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.Total_Revenue - a.Total_Revenue)
    .slice(0, 10);

  // by_region
  const by_region = Object.entries(regMap)
    .map(([Region, d]) => ({
      Region,
      Total_Revenue: d.rev,
      Units_Sold: d.units,
      Order_Count: d.orders,
      Revenue_Share_Pct: totalRevenue > 0 ? Number(((d.rev / totalRevenue) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.Total_Revenue - a.Total_Revenue);

  // by_month
  const by_month = monthNames.map((m, idx) => {
    const d = monthMap[m] || { num: idx + 1, rev: 0, units: 0, orders: 0 };
    return {
      Month: m,
      Month_Num: idx + 1,
      Total_Revenue: d.rev,
      Units_Sold: d.units,
      Order_Count: d.orders,
      Avg_Order_Value: d.orders > 0 ? d.rev / d.orders : 0,
      MoM_Growth_Pct: null as number | null,
    };
  });
  for (let i = 1; i < by_month.length; i++) {
    const prev = by_month[i - 1].Total_Revenue;
    const curr = by_month[i].Total_Revenue;
    if (prev > 0) {
      by_month[i].MoM_Growth_Pct = Number((((curr - prev) / prev) * 100).toFixed(2));
    }
  }

  // by_quarter
  const by_quarter = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
    const d = qMap[q];
    return {
      Quarter: q,
      Total_Revenue: d.rev,
      Units_Sold: d.units,
      Order_Count: d.orders,
      Revenue_Share_Pct: totalRevenue > 0 ? Number(((d.rev / totalRevenue) * 100).toFixed(2)) : 0,
    };
  });

  // by_payment_mode
  const by_payment_mode = Object.entries(payMap)
    .map(([Payment_Mode, d]) => ({
      Payment_Mode,
      Total_Revenue: d.rev,
      Order_Count: d.orders,
      Revenue_Share_Pct: totalRevenue > 0 ? Number(((d.rev / totalRevenue) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.Total_Revenue - a.Total_Revenue);

  // discount_impact
  const discount_impact = Object.entries(discMap).map(([Discount_Bracket, d]) => ({
    Discount_Bracket,
    Order_Count: d.orders,
    Total_Revenue: d.rev,
    Avg_Units_Per_Order: d.orders > 0 ? Number((d.units / d.orders).toFixed(1)) : 0,
    Avg_Order_Value: d.orders > 0 ? d.rev / d.orders : 0,
  }));

  // by_weekday
  const by_weekday = weekdays.map((w) => {
    const d = weekMap[w] || { rev: 0, orders: 0 };
    return {
      Weekday: w,
      Total_Revenue: d.rev,
      Order_Count: d.orders,
      Revenue_Share_Pct: totalRevenue > 0 ? Number(((d.rev / totalRevenue) * 100).toFixed(2)) : 0,
    };
  });

  return {
    name: datasetName,
    rowCount: rows.length,
    kpis: {
      totalRevenue,
      grossRevenue,
      totalDiscount: Math.max(0, grossRevenue - totalRevenue),
      totalOrders: rows.length,
      totalUnits,
      averageOrderValue: aov,
      avgDiscountPct: avgDiscount,
      topRegion: by_region[0] ? `${by_region[0].Region} (${by_region[0].Revenue_Share_Pct}%)` : 'N/A',
      topCategory: by_category[0] ? `${by_category[0].Category} (${by_category[0].Revenue_Share_Pct}%)` : 'N/A',
      topProduct: by_product[0] ? `${by_product[0].Product}` : 'N/A',
    },
    by_month,
    by_category,
    by_product,
    by_region,
    by_quarter,
    by_payment_mode,
    discount_impact,
    by_weekday,
  };
};

export const formatCurrency = (val: number): string => {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return `₹${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};
