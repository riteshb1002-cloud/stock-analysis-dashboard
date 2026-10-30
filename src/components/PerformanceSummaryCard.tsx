import React from 'react';
import { PerformanceSummary } from '../utils/indicators';
import { TrendingUp, TrendingDown, Activity, ShieldAlert, BarChart3, Target } from 'lucide-react';

interface PerformanceSummaryCardProps {
  summary: PerformanceSummary | null;
  ticker: string;
  companyName: string;
  currency: string;
  darkMode: boolean;
}

export const PerformanceSummaryCard: React.FC<PerformanceSummaryCardProps> = ({
  summary,
  ticker,
  companyName,
  currency,
  darkMode
}) => {
  if (!summary) return null;

  const isPositive = summary.changeValue >= 0;
  const priceRange = summary.periodHigh - summary.periodLow;
  const currentPosPercent =
    priceRange > 0
      ? Math.max(0, Math.min(100, ((summary.endPrice - summary.periodLow) / priceRange) * 100))
      : 50;

  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        darkMode ? 'bg-[#111827] border-neutral-800' : 'bg-white border-neutral-200'
      }`}
    >
      {/* Header with Title and Unboxed Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-2">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Performance Summary &amp; Indicator Signals
          </h2>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span>{ticker}</span>
            <span aria-hidden="true">·</span>
            <span>{companyName}</span>
            <span aria-hidden="true">·</span>
            <span>{summary.daysCount} trading sessions</span>
          </div>
        </div>

        {/* Quick Trend Indicator Badge (Interactive Tabular State) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-neutral-500">Trend:</span>
            <span
              className={`font-semibold ${
                summary.trendSignal.includes('Bullish')
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : summary.trendSignal.includes('Bearish')
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {summary.trendSignal}
            </span>
          </div>

          <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">|</span>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-neutral-500">Signal:</span>
            <span
              className={`font-semibold ${
                summary.smaCrossSignal.includes('Golden') || summary.smaCrossSignal.includes('Bullish')
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : summary.smaCrossSignal.includes('Death') || summary.smaCrossSignal.includes('Bearish')
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {summary.smaCrossSignal}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
        {/* Metric 1: Period Return */}
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Period Return
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-lg font-bold font-mono tabular-nums ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {summary.changePercent.toFixed(2)}%
            </span>
            <span className="text-xs font-mono text-neutral-500">
              ({isPositive ? '+' : ''}${summary.changeValue.toFixed(2)})
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 block mt-0.5">
            ${summary.startPrice.toFixed(2)} → ${summary.endPrice.toFixed(2)}
          </span>
        </div>

        {/* Metric 2: Period Range */}
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Period Range
          </span>
          <div className="text-base font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            ${summary.periodLow.toFixed(2)} - ${summary.periodHigh.toFixed(2)}
          </div>
          {/* Visual Mini Slider of current price position */}
          <div className="mt-1.5 w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${currentPosPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Average Daily Volume */}
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Avg Daily Volume
          </span>
          <div className="text-base font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {(summary.avgVolume / 1000000).toFixed(2)}M
          </div>
          <span className="text-[11px] text-neutral-400 block mt-0.5">
            Total: {(summary.totalVolume / 1000000000).toFixed(2)}B shares
          </span>
        </div>

        {/* Metric 4: Annualized Volatility */}
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Volatility (Ann.)
          </span>
          <div className="text-base font-semibold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {summary.volatility.toFixed(1)}%
          </div>
          <span className="text-[11px] text-neutral-400 block mt-0.5">
            Max Drawdown: -{summary.maxDrawdown.toFixed(1)}%
          </span>
        </div>

        {/* Metric 5: RSI Momentum State */}
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            RSI Indicator
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold font-mono tabular-nums text-purple-500">
              {summary.currentRSI !== undefined ? summary.currentRSI.toFixed(1) : 'N/A'}
            </span>
            <span
              className={`text-xs font-semibold ${
                summary.rsiCondition === 'Overbought'
                  ? 'text-rose-500'
                  : summary.rsiCondition === 'Oversold'
                  ? 'text-emerald-500'
                  : 'text-neutral-500'
              }`}
            >
              {summary.rsiCondition}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 block mt-0.5">
            Thresholds: 30 / 70
          </span>
        </div>

        {/* Metric 6: Support & Resistance */}
        <div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
            Pivot Key Levels
          </span>
          <div className="text-xs font-mono tabular-nums space-y-0.5 text-neutral-700 dark:text-neutral-300">
            <div className="flex justify-between">
              <span className="text-rose-500">R1:</span>
              <span>${summary.resistanceLevels[0]?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-500">S1:</span>
              <span>${summary.supportLevels[0]?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
