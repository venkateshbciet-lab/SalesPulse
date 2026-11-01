import React from 'react';
import { DatasetAnalysis, formatCurrency } from '../utils/analytics';
import { TrendingUp, BarChart3, PieChart, ShoppingBag, MapPin, Calendar, CreditCard, Percent } from 'lucide-react';

interface Props {
  analysis: DatasetAnalysis;
  chartId: number;
  isDark: boolean;
}

export const AnalyzedChart: React.FC<Props> = ({ analysis, chartId, isDark }) => {
  switch (chartId) {
    case 1:
      return <MonthlyTrendVisual analysis={analysis} isDark={isDark} />;
    case 2:
      return <CategoryVisual analysis={analysis} isDark={isDark} />;
    case 3:
      return <TopProductsVisual analysis={analysis} isDark={isDark} />;
    case 4:
      return <RegionalVisual analysis={analysis} isDark={isDark} />;
    case 5:
      return <QuarterlyVisual analysis={analysis} isDark={isDark} />;
    case 6:
      return <PaymentModeVisual analysis={analysis} isDark={isDark} />;
    case 7:
      return <DiscountImpactVisual analysis={analysis} isDark={isDark} />;
    case 8:
      return <DayOfWeekVisual analysis={analysis} isDark={isDark} />;
    default:
      return <MonthlyTrendVisual analysis={analysis} isDark={isDark} />;
  }
};

// 1. Monthly Trend Visual
export const MonthlyTrendVisual: React.FC<{ analysis: DatasetAnalysis; isDark: boolean }> = ({ analysis, isDark }) => {
  const data = analysis.by_month;
  const maxRev = Math.max(...data.map(d => d.Total_Revenue), 1);
  const peak = [...data].sort((a, b) => b.Total_Revenue - a.Total_Revenue)[0];

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-600">Peak Month:</span>
          <span className="font-semibold">{peak?.Month} ({formatCurrency(peak?.Total_Revenue || 0)})</span>
        </div>
        <div className="text-slate-500 font-mono text-[11px]">
          Annual Revenue: {formatCurrency(analysis.kpis.totalRevenue)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[580px] h-64 flex items-end gap-2.5 pt-8 pb-4 px-2 border-b border-slate-200 dark:border-slate-800">
          {data.map((item, idx) => {
            const heightPct = Math.max(8, Math.round((item.Total_Revenue / maxRev) * 100));
            const isPeak = item.Month === peak?.Month;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Value tooltip on hover & above peak */}
                <div className={`text-[10px] font-mono font-bold mb-1.5 transition whitespace-nowrap ${
                  isPeak ? 'text-amber-500 font-extrabold' : 'text-slate-500 group-hover:text-blue-500'
                }`}>
                  {formatCurrency(item.Total_Revenue)}
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-md transition-all duration-300 relative group-hover:brightness-110 ${
                    isPeak 
                      ? 'bg-amber-500 shadow-sm' 
                      : isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isPeak && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                      Peak
                    </span>
                  )}
                </div>

                {/* X-axis label */}
                <div className="mt-2 text-xs font-semibold text-slate-500">
                  {item.Month}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {item.Order_Count} ord
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 2. Category Breakdown Visual
export const CategoryVisual: React.FC<{ analysis: DatasetAnalysis; isDark: boolean }> = ({ analysis, isDark }) => {
  const data = analysis.by_category;
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500', 'bg-purple-600', 'bg-rose-500', 'bg-indigo-500'];

  return (
    <div className="w-full space-y-4">
      {/* Top Distribution Bar */}
      <div className="w-full h-4 rounded-full overflow-hidden flex shadow-xs">
        {data.map((cat, i) => (
          <div
            key={i}
            style={{ width: `${cat.Revenue_Share_Pct}%` }}
            className={`${colors[i % colors.length]} transition-all`}
            title={`${cat.Category}: ${cat.Revenue_Share_Pct}%`}
          />
        ))}
      </div>

      <div className="space-y-3 pt-2">
        {data.map((cat, i) => (
          <div key={i} className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          } flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
              <div>
                <span className="text-xs font-bold">{cat.Category}</span>
                <span className="text-[11px] text-slate-400 ml-2">({cat.Order_Count} orders · {cat.Units_Sold} units)</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-bold text-blue-600">{formatCurrency(cat.Total_Revenue)}</span>
                <span className="text-[11px] text-slate-500 block font-mono">{cat.Revenue_Share_Pct}% of Total</span>
              </div>
              <div className="w-24 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, cat.Revenue_Share_Pct)}%` }}
                  className={`h-full ${colors[i % colors.length]} rounded-full`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Top 10 Best-Selling Products Visual
export const TopProductsVisual: React.FC<{ analysis: DatasetAnalysis; isDark: boolean }> = ({ analysis, isDark }) => {
  const data = analysis.by_product;
  const maxRev = Math.max(...data.map(d => d.Total_Revenue), 1);

  return (
    <div className="w-full space-y-3">
      {data.map((prod, i) => {
        const widthPct = Math.max(5, Math.round((prod.Total_Revenue / maxRev) * 100));
        return (
          <div key={i} className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <span className="w-5 text-slate-400 font-mono text-[11px]">#{i + 1}</span>
                <span className="font-bold">{prod.Product}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {prod.Category}
                </span>
              </div>
              <div className="font-mono font-bold text-blue-600">
                {formatCurrency(prod.Total_Revenue)}
                <span className="text-slate-400 font-normal ml-1">({prod.Revenue_Share_Pct}%)</span>
              </div>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div
                style={{ width: `${widthPct}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 4. Regional Sales Visual
export const RegionalVisual: React.FC<{ analysis: DatasetAnalysis; isDark: boolean }> = ({ analysis, isDark }) => {
  const data = analysis.by_region;

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
      {data.map((reg, i) => (
        <div key={i} className={`p-4 rounded-xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        } space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-sm">{reg.Region} Region</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {reg.Revenue_Share_Pct}% Share
            </span>
          </div>

          <div className="text-xl font-black text-emerald-600 font-mono">
            {formatCurrency(reg.Total_Revenue)}
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-200/60 dark:border-slate-800 pt-2">
            <span>{reg.Order_Count} Total Orders</span>
            <span>{reg.Units_Sold} Units Sold</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// 5. Quarterly Performance Visual
export const QuarterlyVisual: React.FC<{ analysis: DatasetAnalysis; isDark: boolean }> = ({ analysis, isDark }) => {
  const data = analysis.by_quarter;
  const maxRev = Math.max(...data.map(d => d.Total_Revenue), 1);

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
      {data.map((q, i) => {
        const heightPct = Math.max(15, Math.round((q.Total_Revenue / maxRev) * 100));
        return (
          <div key={i} className={`p-4 rounded-xl border text-center flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="text-sm font-black text-blue-600 uppercase">{q.Quarter}</div>
              <div className="text-xs font-bold mt-1 font-mono">{formatCurrency(q.Total_Revenue)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{q.Revenue_Share_Pct}% Share</div>
            </div>

            <div className="h-28 flex items-end justify-center my-3">
              <div
                style={{ height: `${heightPct}%` }}
                className="w-12 bg-blue-600 hover:bg-blue-500 rounded-t-md transition-all shadow-xs"
              />
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              {q.Order_Count} Orders · {q.Units_Sold} Units
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 6. Payment Mode Share Visual
export const PaymentModeVisual: React.FC<{ analysis: DatasetAnalysis; isDark: boolean }> = ({ analysis, isDark }) => {
  const data = analysis.by_payment_mode;

  return (
    <div className="w-full space-y-3">
      {data.map((pm, i) => (
        <div key={i} className={`p-3.5 rounded-xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        } space-y-1.5`}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-bold">{pm.Payment_Mode}</span>
              <span className="text-[11px] text-slate-400 font-mono">({pm.Order_Count} transactions)</span>
            </div>
            <div className="font-mono font-bold text-emerald-600">
              {formatCurrency(pm.Total_Revenue)} ({pm.Revenue_Share_Pct}%)
            </div>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              style={{ width: `${pm.Revenue_Share_Pct}%` }}
              className="h-full bg-emerald-600 rounded-full transition-all"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// 7. Discount Impact Visual
export const DiscountImpactVisual: React.FC<{ analysis: DatasetAnalysis; isDark: boolean }> = ({ analysis, isDark }) => {
  const data = analysis.discount_impact;

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {data.map((tier, i) => (
        <div key={i} className={`p-4 rounded-xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        } space-y-2`}>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
            <Percent className="w-3.5 h-3.5" />
            <span>{tier.Discount_Bracket}</span>
          </div>

          <div className="text-lg font-black font-mono">
            {formatCurrency(tier.Total_Revenue)}
          </div>

          <div className="text-[11px] text-slate-500 space-y-0.5 border-t border-slate-200/60 dark:border-slate-800 pt-2 font-mono">
            <div>Orders: <strong>{tier.Order_Count}</strong></div>
            <div>Avg Units/Order: <strong>{tier.Avg_Units_Per_Order}</strong></div>
            <div>AOV: <strong>{formatCurrency(tier.Avg_Order_Value)}</strong></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 8. Day of Week Sales Visual
export const DayOfWeekVisual: React.FC<{ analysis: DatasetAnalysis; isDark: boolean }> = ({ analysis, isDark }) => {
  const data = analysis.by_weekday;
  const maxRev = Math.max(...data.map(d => d.Total_Revenue), 1);
  const peak = [...data].sort((a, b) => b.Total_Revenue - a.Total_Revenue)[0];

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-blue-600">Peak Shopping Day: <strong className="text-slate-800 dark:text-slate-200">{peak?.Weekday} ({formatCurrency(peak?.Total_Revenue || 0)})</strong></span>
        <span className="text-slate-400 font-mono text-[11px]">7-Day Cycle</span>
      </div>

      <div className="grid grid-cols-7 gap-2 h-56 pt-6 pb-2 items-end border-b border-slate-200 dark:border-slate-800">
        {data.map((day, i) => {
          const heightPct = Math.max(12, Math.round((day.Total_Revenue / maxRev) * 100));
          const isPeak = day.Weekday === peak?.Weekday;
          return (
            <div key={i} className="flex flex-col items-center h-full justify-end group">
              <span className={`text-[10px] font-mono mb-1 font-bold ${isPeak ? 'text-amber-500' : 'text-slate-500'}`}>
                {formatCurrency(day.Total_Revenue)}
              </span>
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t transition-all ${
                  isPeak ? 'bg-amber-500' : isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              />
              <span className="text-[11px] font-semibold mt-1.5 text-slate-500">
                {day.Weekday.substring(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
