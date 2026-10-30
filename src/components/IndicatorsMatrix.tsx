import React from 'react';
import { ComputedCandle, IndicatorSettings, PerformanceSummary } from '../utils/indicators';
import { Activity, Gauge, TrendingUp, Compass, Sliders, CheckCircle2 } from 'lucide-react';

interface IndicatorsMatrixProps {
  candles: ComputedCandle[];
  settings: IndicatorSettings;
  summary: PerformanceSummary | null;
  darkMode: boolean;
}

export const IndicatorsMatrix: React.FC<IndicatorsMatrixProps> = ({
  candles,
  settings,
  summary,
  darkMode
}) => {
  if (!candles || candles.length === 0 || !summary) return null;

  const last = candles[candles.length - 1];

  return (
    <div className="space-y-6">
      {/* 4-Card Indicator Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Simple Moving Averages */}
        <div
          className={`p-4 rounded-xl border transition-colors ${
            darkMode ? 'bg-[#111827] border-neutral-800' : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
              SMA Dual Horizon
            </span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 space-y-2 text-xs font-mono tabular-nums">
            <div className="flex justify-between">
              <span className="text-neutral-500">SMA({settings.smaFastPeriod}):</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                ${last.smaFast?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">SMA({settings.smaSlowPeriod}):</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                ${last.smaSlow?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800/60 flex justify-between items-center">
              <span className="text-[11px] text-neutral-400">Alignment</span>
              <span
                className={`font-semibold text-xs ${
                  last.smaFast && last.smaSlow && last.smaFast > last.smaSlow
                    ? 'text-emerald-500'
                    : 'text-rose-500'
                }`}
              >
                {last.smaFast && last.smaSlow && last.smaFast > last.smaSlow
                  ? 'Bullish (Fast > Slow)'
                  : 'Bearish (Fast < Slow)'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Exponential Moving Averages */}
        <div
          className={`p-4 rounded-xl border transition-colors ${
            darkMode ? 'bg-[#111827] border-neutral-800' : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-semibold text-purple-500 uppercase tracking-wider">
              EMA Reactive Trend
            </span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3 space-y-2 text-xs font-mono tabular-nums">
            <div className="flex justify-between">
              <span className="text-neutral-500">EMA({settings.emaFastPeriod}):</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                ${last.emaFast?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">EMA({settings.emaSlowPeriod}):</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                ${last.emaSlow?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800/60 flex justify-between items-center">
              <span className="text-[11px] text-neutral-400">Spread</span>
              <span className="font-semibold text-xs text-neutral-600 dark:text-neutral-300">
                {last.emaFast && last.emaSlow
                  ? `$${(last.emaFast - last.emaSlow).toFixed(2)}`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Relative Strength Index (RSI) */}
        <div
          className={`p-4 rounded-xl border transition-colors ${
            darkMode ? 'bg-[#111827] border-neutral-800' : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-semibold text-violet-500 uppercase tracking-wider">
              RSI Momentum ({settings.rsiPeriod})
            </span>
            <Gauge className="w-4 h-4 text-violet-500" />
          </div>
          <div className="mt-3 space-y-2 text-xs font-mono tabular-nums">
            <div className="flex justify-between">
              <span className="text-neutral-500">Current Level:</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {last.rsi?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Condition:</span>
              <span
                className={`font-semibold ${
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
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800/60 flex justify-between items-center">
              <span className="text-[11px] text-neutral-400">Bands</span>
              <span className="text-[11px] text-neutral-400">30 Oversold / 70 Overbought</span>
            </div>
          </div>
        </div>

        {/* Card 4: Bollinger Volatility Channel */}
        <div
          className={`p-4 rounded-xl border transition-colors ${
            darkMode ? 'bg-[#111827] border-neutral-800' : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-semibold text-sky-500 uppercase tracking-wider">
              Bollinger Bands (20, 2σ)
            </span>
            <Compass className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-3 space-y-2 text-xs font-mono tabular-nums">
            <div className="flex justify-between">
              <span className="text-neutral-500">Upper Band:</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                ${last.bollingerUpper?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Middle Band:</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                ${last.bollingerMiddle?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800/60 flex justify-between items-center">
              <span className="text-neutral-500">Lower Band:</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                ${last.bollingerLower?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Technical Guide Section */}
      <div
        className={`p-5 rounded-xl border transition-colors ${
          darkMode ? 'bg-[#111827] border-neutral-800' : 'bg-white border-neutral-200'
        }`}
      >
        <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-3">
          Indicator Formulas &amp; Signal Interpretation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <h4 className="font-bold text-neutral-900 dark:text-white">SMA (Simple Moving Average)</h4>
            <p className="leading-relaxed">
              Arithmetical average of price closes over <em>N</em> sessions. Identifies primary macro support/resistance and trend direction.
            </p>
            <div className="text-[11px] font-mono text-neutral-500 pt-1">
              SMA = (P₁ + P₂ + ... + Pₙ) / n
            </div>
          </div>

          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <h4 className="font-bold text-neutral-900 dark:text-white">EMA (Exponential Moving Average)</h4>
            <p className="leading-relaxed">
              Applies higher weighting to recent prices, reacting faster to sudden volatility swings and crossovers.
            </p>
            <div className="text-[11px] font-mono text-neutral-500 pt-1">
              k = 2 / (n + 1) · EMA = (P - EMA_prev) × k + EMA_prev
            </div>
          </div>

          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <h4 className="font-bold text-neutral-900 dark:text-white">RSI (Relative Strength Index)</h4>
            <p className="leading-relaxed">
              Oscillator measuring velocity and magnitude of directional price movements. Readings &gt;70 indicate overbought conditions; &lt;30 oversold.
            </p>
            <div className="text-[11px] font-mono text-neutral-500 pt-1">
              RSI = 100 - [100 / (1 + AvgGain / AvgLoss)]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
