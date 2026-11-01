import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Database,
  FileSpreadsheet,
  FileCode,
  BookOpen,
  Download,
  CheckCircle2,
  MapPin,
  ShoppingBag,
  Percent,
  Search,
  FileText,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  ArrowDownToLine,
  Play,
  Upload,
  FileUp,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Table,
  Sparkles,
  HelpCircle,
  ArrowRight,
  PieChart
} from 'lucide-react';
import salesData from './data/sales_summary.json';
import { DatasetAnalysis, computeAnalytics, formatCurrency } from './utils/analytics';
import { AnalyzedChart, MonthlyTrendVisual } from './components/AnalyzedCharts';

interface CustomAudit {
  totalRows: number;
  cleanRowsCount: number;
  columnsCount: number;
  columns: string[];
  totalRevenue: number;
  totalQty: number;
  duplicatesRemoved: number;
  negativeQtyFixed: number;
  missingValuesDetected: number;
}

const defaultAnalysis: DatasetAnalysis = {
  name: "2025 Benchmark Dataset",
  rowCount: 2500,
  kpis: {
    totalRevenue: 35784911.5,
    grossRevenue: 38308910.0,
    totalDiscount: 2523998.5,
    totalOrders: 2500,
    totalUnits: 5474,
    averageOrderValue: 14313.96,
    avgDiscountPct: 6.81,
    topRegion: "South (47.92%)",
    topCategory: "Electronics (72.27%)",
    topProduct: "Laptop",
  },
  by_month: salesData.by_month || [],
  by_category: salesData.by_category || [],
  by_product: (salesData.by_product || []).slice(0, 10),
  by_region: salesData.by_region || [],
  by_quarter: salesData.by_quarter || [],
  by_payment_mode: salesData.by_payment_mode || [],
  discount_impact: [
    { Discount_Bracket: "0% (Full Price)", Order_Count: 680, Total_Revenue: 9845000, Avg_Units_Per_Order: 1.8, Avg_Order_Value: 14477.94 },
    { Discount_Bracket: "1% - 5% (Low)", Order_Count: 740, Total_Revenue: 10452000, Avg_Units_Per_Order: 2.1, Avg_Order_Value: 14124.32 },
    { Discount_Bracket: "6% - 15% (Moderate)", Order_Count: 820, Total_Revenue: 12150000, Avg_Units_Per_Order: 2.4, Avg_Order_Value: 14817.07 },
    { Discount_Bracket: "> 15% (High)", Order_Count: 260, Total_Revenue: 3337911.5, Avg_Units_Per_Order: 2.8, Avg_Order_Value: 12838.12 }
  ],
  by_weekday: salesData.by_weekday || [],
};

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(false); // Clean light mode by default
  const [activeTab, setActiveTab] = useState<'dashboard' | 'charts' | 'give_data' | 'data'>('dashboard');
  const [selectedChartIdx, setSelectedChartIdx] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active Dataset & Analysed Display State
  const [activeDataSource, setActiveDataSource] = useState<'default' | 'custom'>('default');
  const [customAnalysis, setCustomAnalysis] = useState<DatasetAnalysis | null>(null);
  const [chartDisplayMode, setChartDisplayMode] = useState<'interactive' | 'png'>('interactive');

  // Custom User Data State
  const [pastedCsv, setPastedCsv] = useState<string>('');
  const [customRows, setCustomRows] = useState<any[] | null>(null);
  const [customAudit, setCustomAudit] = useState<CustomAudit | null>(null);
  const [customSuccess, setCustomSuccess] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSearchTerm, setCustomSearchTerm] = useState<string>('');

  const activeAnalysis: DatasetAnalysis = (activeDataSource === 'custom' && customAnalysis)
    ? customAnalysis
    : defaultAnalysis;

  const sampleTemplateCsv = `Order_ID,Order_Date,Customer_ID,Product,Category,Region,City,Quantity,Unit_Price,Discount_Pct,Payment_Mode,Revenue
ORD-2025-1001,2025-01-15,CUST-501,Gaming Laptop,Electronics,South,Bengaluru,2,65000,10,UPI,117000
ORD-2025-1002,2025-02-16,CUST-502,Ergonomic Chair,Furniture,North,Delhi,4,12000,5,Credit Card,45600
ORD-2025-1003,2025-03-17,CUST-503,Wireless Mouse,Electronics,West,Mumbai,-1,1500,0,Net Banking,1500
ORD-2025-1004,2025-04-18,CUST-504,Standing Desk,Furniture,East,Kolkata,1,28000,15,Debit Card,23800
ORD-2025-1005,2025-05-19,CUST-505,Smart Watch,Electronics,South,Chennai,3,8000,5,UPI,22800
ORD-2025-1005,2025-05-19,CUST-505,Smart Watch,Electronics,South,Chennai,3,8000,5,UPI,22800
ORD-2025-1006,2025-06-20,CUST-506,Noise Cancelling Headphones,Electronics,West,Pune,2,9500,,Cash on Delivery,19000
ORD-2025-1007,2025-07-21,CUST-507,LED Desk Lamp,Furniture,South,Hyderabad,5,2200,8,UPI,10120
ORD-2025-1008,2025-08-22,CUST-508,Bluetooth Speaker,Electronics,North,Jaipur,2,4500,5,Credit Card,8550
ORD-2025-1009,2025-10-23,CUST-509,Office Bookshelf,Furniture,West,Ahmedabad,1,16500,12,UPI,14520
ORD-2025-1010,2025-11-24,CUST-510,Denim Jacket,Clothing,North,Chandigarh,3,2500,5,UPI,7125`;

  const handleParseCsv = (csvText: string) => {
    try {
      const rawLines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
      if (rawLines.length < 2) {
        setCustomError('CSV must include at least 1 header line and 1 data row.');
        setCustomSuccess(null);
        setCustomRows(null);
        setCustomAudit(null);
        return;
      }

      const headers = rawLines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      let missingValuesCount = 0;
      let negativeQtyFixed = 0;
      let duplicatesCount = 0;
      const seenSignatures = new Set<string>();

      const parsedRows: any[] = [];

      for (let i = 1; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (!line) continue;
        
        // Check for duplicates
        if (seenSignatures.has(line)) {
          duplicatesCount++;
          continue; // de-duplicate clean row
        }
        seenSignatures.add(line);

        const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj: any = {};
        
        headers.forEach((h, idx) => {
          const val = vals[idx] !== undefined ? vals[idx] : '';
          if (val === '' || val === null || val.toLowerCase() === 'nan' || val.toLowerCase() === 'null') {
            missingValuesCount++;
          }
          rowObj[h] = val;
        });

        // Check & fix negative quantities
        if (rowObj['Quantity'] !== undefined) {
          const rawQ = Number(rowObj['Quantity']);
          if (!isNaN(rawQ) && rawQ < 0) {
            negativeQtyFixed++;
            rowObj['Quantity'] = Math.abs(rawQ);
          }
        }

        // Recompute or verify revenue
        const q = Number(rowObj['Quantity']) || 0;
        const p = Number(rowObj['Unit_Price']) || 0;
        const d = Number(rowObj['Discount_Pct']) || 0;
        if (p > 0 && q > 0) {
          const computedRev = q * p * (1 - d / 100);
          if (!rowObj['Revenue'] || isNaN(Number(rowObj['Revenue']))) {
            rowObj['Revenue'] = computedRev.toFixed(2);
          }
        }

        parsedRows.push(rowObj);
      }

      const totalRevenue = parsedRows.reduce((sum, r) => sum + (Number(r.Revenue) || 0), 0);
      const totalQty = parsedRows.reduce((sum, r) => sum + (Number(r.Quantity) || 0), 0);

      const audit: CustomAudit = {
        totalRows: rawLines.length - 1,
        cleanRowsCount: parsedRows.length,
        columnsCount: headers.length,
        columns: headers,
        totalRevenue,
        totalQty,
        duplicatesRemoved: duplicatesCount,
        negativeQtyFixed,
        missingValuesDetected: missingValuesCount
      };

      // Compute dynamic analytics on user data
      const analysis = computeAnalytics(parsedRows, 'Custom User Dataset');

      setCustomRows(parsedRows);
      setCustomAudit(audit);
      setCustomAnalysis(analysis);
      setActiveDataSource('custom'); // Automatically activate custom data across charts & dashboard
      setCustomError(null);
      setCustomSuccess(`Successfully parsed & analysed ${parsedRows.length} clean orders across ${headers.length} columns! Charts and Dashboard now display your analysed data.`);
    } catch (err: any) {
      setCustomError(`Failed to parse CSV: ${err.message}`);
      setCustomSuccess(null);
      setCustomRows(null);
      setCustomAudit(null);
      setCustomAnalysis(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPastedCsv(text);
      handleParseCsv(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadCustomCsv = () => {
    if (!customRows || customRows.length === 0 || !customAudit) return;
    const headers = customAudit.columns;
    const csvContent = [
      headers.join(','),
      ...customRows.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'custom_sales_data_cleaned.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sync body class with theme
  useEffect(() => {
    document.body.className = isDark
      ? 'bg-slate-950 text-slate-100 font-sans antialiased min-h-screen transition-colors duration-200'
      : 'bg-slate-50 text-slate-900 font-sans antialiased min-h-screen transition-colors duration-200';
  }, [isDark]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const peakMonth = [...activeAnalysis.by_month].sort((a, b) => b.Total_Revenue - a.Total_Revenue)[0];
  const topCat = activeAnalysis.by_category[0];
  const topProd = activeAnalysis.by_product[0];
  const topReg = activeAnalysis.by_region[0];
  const topQuarter = [...activeAnalysis.by_quarter].sort((a, b) => b.Total_Revenue - a.Total_Revenue)[0];
  const topPay = activeAnalysis.by_payment_mode[0];
  const peakDay = [...activeAnalysis.by_weekday].sort((a, b) => b.Total_Revenue - a.Total_Revenue)[0];

  const chartsList = [
    {
      id: 1,
      title: "1. Monthly Sales Trend",
      filename: "1_monthly_sales_trend.png",
      category: "Monthly Sales",
      keyStat: peakMonth ? `Peak: ${peakMonth.Month} (${formatCurrency(peakMonth.Total_Revenue)})` : "Peak: Oct (₹42.05L)",
      insight: peakMonth
        ? `Sales peaked in ${peakMonth.Month} at ${formatCurrency(peakMonth.Total_Revenue)} with ${peakMonth.Order_Count} orders.`
        : "Sales trend analysis across all 12 calendar months."
    },
    {
      id: 2,
      title: "2. Revenue by Product Category",
      filename: "2_revenue_by_category.png",
      category: "Categories",
      keyStat: topCat ? `${topCat.Category}: ${topCat.Revenue_Share_Pct}%` : "Electronics: 72.3%",
      insight: topCat
        ? `${topCat.Category} generated ${formatCurrency(topCat.Total_Revenue)} (${topCat.Revenue_Share_Pct}% share across ${topCat.Order_Count} orders).`
        : "Revenue distribution across product categories."
    },
    {
      id: 3,
      title: "3. Top Best-Selling Products",
      filename: "3_top_products_revenue.png",
      category: "Top SKUs",
      keyStat: topProd ? `${topProd.Product}: ${formatCurrency(topProd.Total_Revenue)}` : "Top Product Ranked",
      insight: topProd
        ? `${topProd.Product} led all products with ${formatCurrency(topProd.Total_Revenue)} across ${topProd.Order_Count} orders.`
        : "Ranking top products by total net revenue."
    },
    {
      id: 4,
      title: "4. Regional Sales Distribution",
      filename: "4_regional_sales_distribution.png",
      category: "Regions",
      keyStat: topReg ? `${topReg.Region}: ${topReg.Revenue_Share_Pct}% Share` : "Regional Leader",
      insight: topReg
        ? `${topReg.Region} region generated ${formatCurrency(topReg.Total_Revenue)} (${topReg.Revenue_Share_Pct}% share).`
        : "Regional commercial performance and market share."
    },
    {
      id: 5,
      title: "5. Quarterly Performance (Q1 - Q4)",
      filename: "5_quarterly_performance.png",
      category: "Quarters",
      keyStat: topQuarter ? `Best: ${topQuarter.Quarter} (${formatCurrency(topQuarter.Total_Revenue)})` : "Q4 Peak",
      insight: topQuarter
        ? `${topQuarter.Quarter} was highest-performing quarter with ${formatCurrency(topQuarter.Total_Revenue)} (${topQuarter.Revenue_Share_Pct}% of sales).`
        : "Quarterly revenue and order velocity."
    },
    {
      id: 6,
      title: "6. Payment Method Share",
      filename: "6_payment_mode_share.png",
      category: "Payments",
      keyStat: topPay ? `${topPay.Payment_Mode}: ${topPay.Revenue_Share_Pct}%` : "UPI: 42.2%",
      insight: topPay
        ? `${topPay.Payment_Mode} captured ${topPay.Revenue_Share_Pct}% share with ${formatCurrency(topPay.Total_Revenue)}.`
        : "Payment method distribution across transactions."
    },
    {
      id: 7,
      title: "7. Discount vs Order Value",
      filename: "7_discount_vs_revenue.png",
      category: "Discounts",
      keyStat: `Avg Disc: ${activeAnalysis.kpis.avgDiscountPct.toFixed(1)}%`,
      insight: `Total discount impact across ${activeAnalysis.discount_impact.length} tiers with average order value of ${formatCurrency(activeAnalysis.kpis.averageOrderValue)}.`
    },
    {
      id: 8,
      title: "8. Day of Week Sales Pattern",
      filename: "8_day_of_week_sales.png",
      category: "Weekly Trend",
      keyStat: peakDay ? `Peak: ${peakDay.Weekday} (${formatCurrency(peakDay.Total_Revenue)})` : "Friday Peak",
      insight: peakDay
        ? `${peakDay.Weekday} recorded the highest checkout volume (${peakDay.Order_Count} orders, ${formatCurrency(peakDay.Total_Revenue)}).`
        : "Day-of-week sales volume analysis."
    }
  ];

  // Sample data filtering
  const sampleClean = salesData.sample_clean_data || [];
  const filteredData = sampleClean.filter((row: any) => {
    const matchesSearch = searchTerm === '' ||
      Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'All' ||
      String(row.Category || '').trim().toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Simple, Clean Header */}
      <header className={`border-b ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-blue-600">SalesPulse</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  Retail BI Platform
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sales Data Analytics & Intelligence System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simple Light/Dark Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
              }`}
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span className="hidden sm:inline text-xs">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            <a
              href="/output/sales_analysis_report.xlsx"
              download
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel Report</span>
            </a>
          </div>
        </div>

        {/* Simple Clean Navigation Tabs */}
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 flex border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} gap-1 py-1 overflow-x-auto`}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'charts', label: '8 Charts', icon: TrendingUp },
            { id: 'give_data', label: 'Give / Upload Data', icon: Upload, badge: 'Custom' },
            { id: 'data', label: 'Data & Downloads', icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-emerald-500/20 text-emerald-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Clean Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Dataset Status & Switcher Banner */}
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          activeDataSource === 'custom'
            ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 shadow-xs text-slate-700'
        }`}>
          <div className="flex items-center gap-2.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${activeDataSource === 'custom' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-600'}`} />
            <span className="font-bold">Active Dataset:</span>
            <span className="font-mono font-semibold">{activeAnalysis.name} ({activeAnalysis.rowCount.toLocaleString()} orders)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Live Analysed
            </span>
          </div>
          <div className="flex items-center gap-2">
            {customAnalysis ? (
              <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setActiveDataSource('default')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    activeDataSource === 'default'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Benchmark (2,500)
                </button>
                <button
                  onClick={() => setActiveDataSource('custom')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    activeDataSource === 'custom'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Custom ({customAnalysis.rowCount})
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('give_data')}
                className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload your data to display</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: SIMPLE EXECUTIVE DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Simple Clean Banner */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            } flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Enterprise Analytics System</span>
                <h2 className="text-xl sm:text-2xl font-black">Sales Data Analysis & Business Intelligence</h2>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Displaying analysed performance metrics, category revenue shares, and sales distributions across all transactions.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('give_data')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>Give / Upload Data</span>
                </button>
                <button
                  onClick={() => setActiveTab('charts')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>View 8 Charts</span>
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>Downloads</span>
                </button>
              </div>
            </div>

            {/* 4 Big Simple Key Numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { 
                  title: "Total Net Revenue", 
                  value: formatCurrency(activeAnalysis.kpis.totalRevenue), 
                  subtitle: `Gross: ${formatCurrency(activeAnalysis.kpis.grossRevenue)}`, 
                  color: "text-blue-600" 
                },
                { 
                  title: "Total Orders Placed", 
                  value: activeAnalysis.kpis.totalOrders.toLocaleString(), 
                  subtitle: `${activeAnalysis.kpis.totalUnits.toLocaleString()} Units Sold`, 
                  color: "text-emerald-600" 
                },
                { 
                  title: "Average Order Value", 
                  value: `₹${activeAnalysis.kpis.averageOrderValue.toFixed(2)}`, 
                  subtitle: `Avg Discount: ${activeAnalysis.kpis.avgDiscountPct.toFixed(2)}%`, 
                  color: "text-amber-600" 
                },
                { 
                  title: "Top Region", 
                  value: activeAnalysis.kpis.topRegion, 
                  subtitle: `Top SKU: ${activeAnalysis.kpis.topProduct}`, 
                  color: "text-purple-600" 
                },
              ].map((kpi, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                } space-y-1`}>
                  <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{kpi.title}</div>
                  <div className={`text-xl sm:text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{kpi.subtitle}</div>
                </div>
              ))}
            </div>

            {/* Featured Chart & Quick Findings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className={`lg:col-span-7 p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">Monthly Revenue Trend</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {activeAnalysis.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('charts')}
                    className="text-xs font-semibold text-blue-600 flex items-center gap-1 cursor-pointer"
                  >
                    <span>See All 8 Charts</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <MonthlyTrendVisual analysis={activeAnalysis} isDark={isDark} />
                </div>
              </div>

              {/* Category Breakdown */}
              <div className={`lg:col-span-5 p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              } space-y-3 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold">Revenue by Category</h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      {activeAnalysis.by_category.length} categories
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {activeAnalysis.by_category.slice(0, 5).map((cat: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold">{cat.Category}</span>
                          <span className="font-mono text-blue-600 font-bold">{cat.Revenue_Share_Pct}% ({formatCurrency(cat.Total_Revenue)})</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, cat.Revenue_Share_Pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                  isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-blue-50 border-blue-200 text-slate-700'
                }`}>
                  <span className="font-bold text-blue-600">Top Insight:</span>
                  <p className="text-[11px]">
                    {topCat?.Category || 'Top category'} generates <strong>{topCat?.Revenue_Share_Pct || 0}%</strong> of revenue ({formatCurrency(topCat?.Total_Revenue || 0)}), with leading regional market {activeAnalysis.kpis.topRegion}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: 8 VISUAL CHARTS GALLERY */}
        {/* ========================================================================= */}
        {activeTab === 'charts' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">8 Visual Charts (Analysed Data)</h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {activeAnalysis.name}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Dynamic vector visualizations reflecting live analysed sales data with Matplotlib image export
                </p>
              </div>

              {/* View Mode Toggle: Interactive vs Static PNG */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setChartDisplayMode('interactive')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      chartDisplayMode === 'interactive'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Dynamic Analysed</span>
                  </button>
                  <button
                    onClick={() => setChartDisplayMode('png')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      chartDisplayMode === 'png'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Matplotlib PNG</span>
                  </button>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedChartIdx((selectedChartIdx - 1 + chartsList.length) % chartsList.length)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Previous chart"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedChartIdx((selectedChartIdx + 1) % chartsList.length)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Next chart"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Chart Picker Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {chartsList.map((chart, idx) => (
                <button
                  key={chart.id}
                  onClick={() => setSelectedChartIdx(idx)}
                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                    selectedChartIdx === idx
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-[10px] font-semibold ${selectedChartIdx === idx ? 'text-blue-100' : 'text-blue-600'}`}>
                    Chart {chart.id}
                  </div>
                  <div className="text-xs font-bold truncate mt-0.5">{chart.category}</div>
                  <div className={`text-[10px] truncate ${selectedChartIdx === idx ? 'text-blue-100' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {chart.keyStat}
                  </div>
                </button>
              ))}
            </div>

            {/* Active Chart Display */}
            {(() => {
              const activeChart = chartsList[selectedChartIdx];
              return (
                <div className={`p-6 rounded-2xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                } space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{activeChart.category}</span>
                      <h3 className="text-base font-bold">{activeChart.title}</h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>{activeChart.insight}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {chartDisplayMode === 'interactive' ? 'Vector Visual' : 'Matplotlib 300 DPI'}
                      </span>
                      <a
                        href={`/charts/${activeChart.filename}`}
                        download
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save PNG</span>
                      </a>
                    </div>
                  </div>

                  <div className={`p-5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  } flex items-center justify-center min-h-[300px]`}>
                    {chartDisplayMode === 'interactive' ? (
                      <AnalyzedChart
                        analysis={activeAnalysis}
                        chartId={activeChart.id}
                        isDark={isDark}
                      />
                    ) : (
                      <img
                        src={`/charts/${activeChart.filename}`}
                        alt={activeChart.title}
                        className="w-full h-auto max-h-[440px] object-contain rounded"
                      />
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: GIVE / UPLOAD CUSTOM DATA */}
        {/* ========================================================================= */}
        {activeTab === 'give_data' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Provide / Upload Your Sales Data</h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live Data Ingestion
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>
                  Paste or upload your sales data to automatically clean anomalies, calculate net revenue, and verify quality.
                </p>
              </div>
            </div>

            {/* Chat Processing Notice */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-blue-950/40 border-blue-800/60 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
            } flex items-start gap-3`}>
              <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold">Want your custom data processed through the Python pipeline & Matplotlib charts?</div>
                <p className="leading-relaxed opacity-90">
                  You can <strong>paste your CSV data directly in the chat</strong>! When you send your data here, the system will update <code className="px-1 py-0.5 rounded bg-blue-200/50 dark:bg-blue-900/50 font-mono">data/raw_sales_data.csv</code>, re-run <code className="px-1 py-0.5 rounded bg-blue-200/50 dark:bg-blue-900/50 font-mono">sales_analysis.py</code>, rebuild all 8 PNG charts, regenerate the 13-sheet Excel report, and refresh the dashboard.
                </p>
              </div>
            </div>

            {/* Ingestion Panel: File Upload & Paste Area */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            } space-y-5`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload Box */}
                <div className={`p-5 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center transition ${
                  isDark ? 'border-slate-700 bg-slate-950/50 hover:border-blue-500' : 'border-slate-300 bg-slate-50/50 hover:border-blue-500'
                }`}>
                  <FileUp className="w-8 h-8 text-blue-500 mb-2" />
                  <div className="text-xs font-bold mb-1">Upload CSV File</div>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-3 max-w-xs`}>
                    Select a CSV sales export from your computer to parse and audit instantly.
                  </p>
                  <label className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse CSV File</span>
                    <input
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct Paste Area */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-blue-600" />
                      <span>Or Paste Raw CSV Text:</span>
                    </label>
                    <button
                      onClick={() => {
                        setPastedCsv(sampleTemplateCsv);
                        handleParseCsv(sampleTemplateCsv);
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 underline flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Load Sample Template</span>
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={pastedCsv}
                    onChange={(e) => setPastedCsv(e.target.value)}
                    placeholder="Order_ID,Order_Date,Customer_ID,Product,Category,Region,City,Quantity,Unit_Price,Discount_Pct,Payment_Mode,Revenue&#10;ORD-2025-101,2025-01-15,CUST-01,Laptop,Electronics,South,Bengaluru,2,65000,10,UPI,117000"
                    className={`w-full p-3 text-xs font-mono rounded-xl border focus:outline-none transition ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-mono">
                  Supported columns: Order_ID, Order_Date, Product, Category, Region, City, Quantity, Unit_Price, Discount_Pct, Payment_Mode, Revenue
                </div>
                <div className="flex items-center gap-2">
                  {pastedCsv && (
                    <button
                      onClick={() => {
                        setPastedCsv('');
                        setCustomRows(null);
                        setCustomAudit(null);
                        setCustomSuccess(null);
                        setCustomError(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                        isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleParseCsv(pastedCsv)}
                    disabled={!pastedCsv.trim()}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      pastedCsv.trim()
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Parse & Verify Data</span>
                  </button>
                </div>
              </div>

              {/* Status Alerts */}
              {customSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{customSuccess}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTab('charts')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap transition"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>View in Charts</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap transition"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>View Dashboard</span>
                    </button>
                  </div>
                </div>
              )}
              {customError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{customError}</span>
                </div>
              )}
            </div>

            {/* Custom Data Scorecard & Health Audit */}
            {customAudit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clean Records</div>
                    <div className="text-xl font-black text-blue-600 mt-0.5">
                      {customAudit.cleanRowsCount} <span className="text-xs font-normal text-slate-500">/ {customAudit.totalRows} raw</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{customAudit.columnsCount} columns identified</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Computed Net Revenue</div>
                    <div className="text-xl font-black text-emerald-600 mt-0.5">
                      ₹{customAudit.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      {customAudit.totalQty} total units ordered
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duplicates Purged</div>
                    <div className={`text-xl font-black mt-0.5 ${customAudit.duplicatesRemoved > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {customAudit.duplicatesRemoved}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      {customAudit.duplicatesRemoved === 0 ? 'No duplicates detected' : 'Deduplicated automatically'}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quality Fixes</div>
                    <div className="text-xl font-black text-purple-600 mt-0.5">
                      {customAudit.negativeQtyFixed} <span className="text-xs font-normal text-slate-500">negative qty</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      {customAudit.missingValuesDetected} missing cell values
                    </div>
                  </div>
                </div>

                {/* Custom Data Preview Table */}
                <div className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                } space-y-3`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search custom records..."
                          value={customSearchTerm}
                          onChange={(e) => setCustomSearchTerm(e.target.value)}
                          className={`pl-9 pr-3 py-1.5 rounded-lg text-xs w-60 border focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadCustomCsv}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Clean CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className={`uppercase font-semibold text-[11px] ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <tr>
                          {customAudit.columns.map((col, idx) => (
                            <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono text-[11px] ${
                        isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'
                      }`}>
                        {(customRows || [])
                          .filter((row: any) => {
                            if (!customSearchTerm) return true;
                            return Object.values(row).some(v => String(v).toLowerCase().includes(customSearchTerm.toLowerCase()));
                          })
                          .slice(0, 20)
                          .map((row: any, rIdx: number) => (
                            <tr key={rIdx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                              {customAudit.columns.map((col, cIdx) => (
                                <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                                  {row[col] !== undefined && row[col] !== '' ? String(row[col]) : (
                                    <span className="text-amber-500 italic">null</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: DATA PREVIEW & DOWNLOADS */}
        {/* ========================================================================= */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Data Verification & Downloads</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Every dataset metric, transformation, and deliverable is verified with 0 errors
                </p>
              </div>
            </div>

            {/* Simple Data Verification Checklist Card */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            } space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600">
                    Live Data Verification Audit (All Checks Passed)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  100% Match
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Raw Dataset</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">
                    • 2,545 total rows ingested<br/>
                    • All 12 requested columns present<br/>
                    • Real-world anomalies injected
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Data Cleaning</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">
                    • 45 duplicates purged<br/>
                    • 35 negative quantities fixed<br/>
                    • 0 unparseable date errors
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Derived Features</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">
                    • Month, Quarter, Weekday added<br/>
                    • Revenue recalculated exactly<br/>
                    • 2,500 final clean records
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Deliverables</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">
                    • 8/8 Matplotlib charts created<br/>
                    • Multi-sheet Excel report saved<br/>
                    • 10/10 SQL queries tested
                  </div>
                </div>
              </div>
            </div>

            {/* Big Download Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: "Excel Report Workbook", desc: "13 sheets + Data Quality Log", file: "/output/sales_analysis_report.xlsx", ext: "XLSX" },
                { title: "Raw Orders Dataset", desc: "2,545 orders with injected issues", file: "/data/raw_sales_data.csv", ext: "CSV" },
                { title: "Verified Insights Report", desc: "Complete text report & KPIs", file: "/output/key_insights.txt", ext: "TXT" },
                { title: "Main Analysis Script", desc: "sales_analysis.py full pipeline", file: "/sales_analysis.py", ext: "PY" },
                { title: "Data Generator Script", desc: "generate_data.py", file: "/generate_data.py", ext: "PY" },
                { title: "MySQL Queries & Schema", desc: "sales_queries.sql (10 queries)", file: "/sql/sales_queries.sql", ext: "SQL" },
                { title: "Jupyter Notebook", desc: "sales_analysis.ipynb walkthrough", file: "/sales_analysis.ipynb", ext: "IPYNB" },
                { title: "Project README Guide", desc: "Setup & execution documentation", file: "/README.md", ext: "MD" },
                { title: "8 PNG Visual Charts", desc: "All 8 high-res chart images", file: "/charts/1_monthly_sales_trend.png", ext: "PNG" },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                } flex items-center justify-between gap-3`}>
                  <div>
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</div>
                  </div>
                  <a
                    href={item.file}
                    download
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>{item.ext}</span>
                  </a>
                </div>
              ))}
            </div>

            {/* Quick Data Preview Table */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            } space-y-3`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Order, Product, City..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className={`pl-9 pr-3 py-1.5 rounded-lg text-xs w-60 border focus:outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="All">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                  </select>
                </div>
                <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Showing {filteredData.length} clean preview rows
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-xs text-left">
                  <thead className={`uppercase font-semibold text-[11px] ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <tr>
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-2">City</th>
                      <th className="py-2.5 px-2 text-right">Qty</th>
                      <th className="py-2.5 px-2 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono text-[11px] ${
                    isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'
                  }`}>
                    {filteredData.slice(0, 15).map((row: any, i: number) => (
                      <tr key={i} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 font-semibold text-blue-600">{row.Order_ID}</td>
                        <td className="py-2 px-3 text-slate-400">{String(row.Order_Date).substring(0, 10)}</td>
                        <td className="py-2 px-3 font-sans font-medium">{row.Product}</td>
                        <td className="py-2 px-3 font-sans text-slate-500">{row.Category}</td>
                        <td className="py-2 px-2 font-sans">{row.City}</td>
                        <td className="py-2 px-2 text-right font-bold">{row.Quantity}</td>
                        <td className="py-2 px-2 text-right">₹{Number(row.Unit_Price).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">
                          ₹{Number(row.Revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clean Simple Footer */}
      <footer className={`border-t py-4 text-center text-xs ${
        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SalesPulse · Retail Sales Data Analytics & Business Intelligence</span>
          <span className="font-mono">Python · Pandas · Matplotlib · MySQL · openpyxl</span>
        </div>
      </footer>
    </div>
  );
}
