import React, { useState } from 'react';
import { PerformanceSummary, ComputedCandle } from '../utils/indicators';
import { X, Copy, Check, Printer, FileText, ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  companyName: string;
  currency: string;
  summary: PerformanceSummary | null;
  candles: ComputedCandle[];
  darkMode: boolean;
}

export const AnalysisReportModal: React.FC<AnalysisReportModalProps> = ({
  isOpen,
  onClose,
  ticker,
  companyName,
  currency,
  summary,
  candles,
  darkMode
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !summary) return null;

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const generateMarkdown = () => {
    return `# Technical Stock Analysis Report: ${ticker} (${companyName})
**Generated Date:** ${reportDate}
**Evaluation Window:** ${firstCandle?.date} to ${lastCandle?.date} (${summary.daysCount} sessions)
**Last Traded Price:** $${summary.endPrice.toFixed(2)} ${currency}

## 1. Executive Performance Summary
- **Period Return:** ${summary.changePercent >= 0 ? '+' : ''}${summary.changePercent.toFixed(2)}% (${summary.changeValue >= 0 ? '+' : ''}$${summary.changeValue.toFixed(2)})
- **High / Low Range:** $${summary.periodLow.toFixed(2)} - $${summary.periodHigh.toFixed(2)}
- **Average Daily Volume:** ${(summary.avgVolume / 1000000).toFixed(2)}M shares
- **Annualized Volatility:** ${summary.volatility.toFixed(1)}%
- **Maximum Drawdown:** -${summary.maxDrawdown.toFixed(1)}%

## 2. Technical Trend & Moving Average Structure
- **Overall Trend Classification:** ${summary.trendSignal}
- **Moving Average Signal:** ${summary.smaCrossSignal}
- **SMA Fast:** ${lastCandle?.smaFast ? `$${lastCandle.smaFast.toFixed(2)}` : 'N/A'}
- **SMA Slow:** ${lastCandle?.smaSlow ? `$${lastCandle.smaSlow.toFixed(2)}` : 'N/A'}
- **EMA Fast:** ${lastCandle?.emaFast ? `$${lastCandle.emaFast.toFixed(2)}` : 'N/A'}
- **EMA Slow:** ${lastCandle?.emaSlow ? `$${lastCandle.emaSlow.toFixed(2)}` : 'N/A'}

## 3. Momentum & Oscillator Diagnostic
- **RSI (14):** ${summary.currentRSI !== undefined ? summary.currentRSI.toFixed(2) : 'N/A'}
- **RSI Evaluation:** ${summary.rsiCondition} (${
      summary.currentRSI && summary.currentRSI > 70
        ? 'Price is trading in overbought territory; caution advised for new long entries.'
        : summary.currentRSI && summary.currentRSI < 30
        ? 'Price is oversold; potential mean reversion or bounce candidate.'
        : 'RSI momentum is in a neutral balanced regime.'
    })

## 4. Key Support & Resistance Pivot Levels
- **Resistance Level 2 (R2):** $${summary.resistanceLevels[1]?.toFixed(2)}
- **Resistance Level 1 (R1):** $${summary.resistanceLevels[0]?.toFixed(2)}
- **Current Price:** $${summary.endPrice.toFixed(2)}
- **Support Level 1 (S1):** $${summary.supportLevels[0]?.toFixed(2)}
- **Support Level 2 (S2):** $${summary.supportLevels[1]?.toFixed(2)}

---
*Report generated via Stock Analysis Dashboard. Technical indicators are mathematical models and do not constitute financial advice.*`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-colors ${
          darkMode ? 'bg-[#0F172A] border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Stock Technical Analysis Report: {ticker}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {companyName} · Generated on {reportDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                darkMode
                  ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                  : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Markdown'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm">
          {/* Executive Summary Card */}
          <div
            className={`p-4 rounded-xl border ${
              darkMode ? 'bg-neutral-900/70 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <span className="text-xs text-neutral-500 uppercase tracking-wider block">
                  Last Traded Price
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums">
                  ${summary.endPrice.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-500 uppercase tracking-wider block">
                  Cumulative Return
                </span>
                <span
                  className={`text-xl font-bold font-mono tabular-nums ${
                    summary.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {summary.changePercent >= 0 ? '+' : ''}
                  {summary.changePercent.toFixed(2)}% (${summary.changeValue.toFixed(2)})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs">
              <div>
                <span className="text-neutral-500 block">Period Range</span>
                <span className="font-mono tabular-nums font-semibold">
                  ${summary.periodLow.toFixed(2)} - ${summary.periodHigh.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Avg Daily Vol</span>
                <span className="font-mono tabular-nums font-semibold">
                  {(summary.avgVolume / 1000000).toFixed(2)}M
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Ann. Volatility</span>
                <span className="font-mono tabular-nums font-semibold">
                  {summary.volatility.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Max Drawdown</span>
                <span className="font-mono tabular-nums font-semibold text-rose-500">
                  -{summary.maxDrawdown.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Trend & Moving Averages */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              1. Moving Average Structure &amp; Trend Stance
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-xs">
              The asset is exhibiting a <strong className="font-semibold">{summary.trendSignal}</strong> posture based
              on multiple moving average alignment. Signal reading shows:{' '}
              <strong className="font-semibold text-sky-500">{summary.smaCrossSignal}</strong>.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="text-amber-500 text-[11px] block">Fast SMA</span>
                <span className="font-bold">${lastCandle?.smaFast?.toFixed(2) ?? 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="text-blue-500 text-[11px] block">Slow SMA</span>
                <span className="font-bold">${lastCandle?.smaSlow?.toFixed(2) ?? 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="text-purple-500 text-[11px] block">Fast EMA</span>
                <span className="font-bold">${lastCandle?.emaFast?.toFixed(2) ?? 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <span className="text-pink-500 text-[11px] block">Slow EMA</span>
                <span className="font-bold">${lastCandle?.emaSlow?.toFixed(2) ?? 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Relative Strength Index (RSI) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              2. Momentum Oscillator (RSI-14)
            </h4>
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Current RSI Reading
                </span>
                <span className="text-sm font-bold font-mono text-purple-500">
                  {summary.currentRSI !== undefined ? summary.currentRSI.toFixed(2) : 'N/A'} (
                  {summary.rsiCondition})
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {summary.currentRSI && summary.currentRSI >= 70
                  ? 'Overbought Warning: The Relative Strength Index is above 70, reflecting significant buying exhaustion and elevated risk of pullback or mean-reverting consolidation.'
                  : summary.currentRSI && summary.currentRSI <= 30
                  ? 'Oversold Condition: The RSI is currently below 30, signaling heavy short-term distribution and potential for an oversold bounce or capitulation low.'
                  : 'Neutral Momentum: RSI is oscillating comfortably within the 30–70 channel, indicating stable trend continuation without immediate exhaustion signals.'}
              </p>
            </div>
          </div>

          {/* Section 3: Support & Resistance Pivot Levels */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              3. Key Technical Pivot Boundaries
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20">
                <span className="text-rose-500 text-[11px] block">Resistance 2 (R2)</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  ${summary.resistanceLevels[1]?.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20">
                <span className="text-rose-500 text-[11px] block">Resistance 1 (R1)</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  ${summary.resistanceLevels[0]?.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/30 dark:bg-emerald-950/20">
                <span className="text-emerald-500 text-[11px] block">Support 1 (S1)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ${summary.supportLevels[0]?.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/30 dark:bg-emerald-950/20">
                <span className="text-emerald-500 text-[11px] block">Support 2 (S2)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ${summary.supportLevels[1]?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <span>Formula: Wilder RSI(14) · SMA(20/50) · Standard Floor Pivots</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
