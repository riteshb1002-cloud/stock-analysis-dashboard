import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Sliders,
  Download,
  Camera,
  FileText,
  Moon,
  Sun,
  TrendingUp,
  BarChart2,
  Check
} from 'lucide-react';
import { IndicatorSettings } from '../utils/indicators';

interface SidebarFiltersProps {
  currentTicker: string;
  onSelectTicker: (ticker: string) => void;
  presetRange: string;
  onSelectPresetRange: (range: string) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  chartType: 'candlestick' | 'line';
  onChangeChartType: (type: 'candlestick' | 'line') => void;
  settings: IndicatorSettings;
  onUpdateSettings: (newSettings: IndicatorSettings) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onExportCSV: () => void;
  onTakeScreenshot: () => void;
  onOpenReport: () => void;
  isCapturing?: boolean;
}

const POPULAR_TICKERS = [
  'AAPL',
  'NVDA',
  'MSFT',
  'GOOGL',
  'AMZN',
  'TSLA',
  'META',
  'AMD',
  'SPY',
  'QQQ'
];

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  currentTicker,
  onSelectTicker,
  presetRange,
  onSelectPresetRange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  chartType,
  onChangeChartType,
  settings,
  onUpdateSettings,
  darkMode,
  onToggleDarkMode,
  onExportCSV,
  onTakeScreenshot,
  onOpenReport,
  isCapturing
}) => {
  const [tickerInput, setTickerInput] = useState(currentTicker);
  const [startDate, setStartDate] = useState(customStartDate);
  const [endDate, setEndDate] = useState(customEndDate);
  const [useCustomDates, setUseCustomDates] = useState(false);

  const handleTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tickerInput.trim().toUpperCase();
    if (clean) {
      onSelectTicker(clean);
    }
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      setUseCustomDates(true);
      onCustomDateChange(startDate, endDate);
    }
  };

  return (
    <aside
      className={`w-full lg:w-72 shrink-0 border-r transition-colors flex flex-col p-4 gap-6 ${
        darkMode ? 'bg-[#0F172A] border-neutral-800 text-neutral-200' : 'bg-white border-neutral-200 text-neutral-800'
      }`}
    >
      {/* 1. Ticker Input & Popular Quick Selector */}
      <div className="space-y-3">
        <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 block">
          Stock Ticker
        </label>
        <form onSubmit={handleTickerSubmit} className="relative">
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
            placeholder="Search symbol (e.g. AAPL, NVDA)"
            className={`w-full pl-9 pr-14 py-2 text-sm rounded-lg border font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
              darkMode
                ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400'
            }`}
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            className="absolute right-1 top-1 px-2.5 py-1 text-xs font-semibold rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors"
          >
            Go
          </button>
        </form>

        {/* Popular Tickers Bar */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {POPULAR_TICKERS.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => {
                setTickerInput(sym);
                onSelectTicker(sym);
              }}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                currentTicker === sym
                  ? 'bg-sky-600 text-white font-bold'
                  : darkMode
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Chart Type Selector (Candlestick vs Line) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 block">
          Chart Display
        </label>
        <div
          className={`flex p-1 rounded-lg border ${
            darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
          }`}
        >
          <button
            type="button"
            onClick={() => onChangeChartType('candlestick')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              chartType === 'candlestick'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Candlestick
          </button>
          <button
            type="button"
            onClick={() => onChangeChartType('line')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              chartType === 'line'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Line Graph
          </button>
        </div>
      </div>

      {/* 3. Date Range Filter & Custom Date Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
            Date Range Filter
          </label>
        </div>

        {/* Preset Range Buttons */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: '1w', label: '1W' },
            { id: '1mo', label: '1M' },
            { id: '3mo', label: '3M' },
            { id: '6mo', label: '6M' },
            { id: '1y', label: '1Y' },
            { id: '5y', label: '5Y' },
            { id: 'max', label: 'Max' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setUseCustomDates(false);
                onSelectPresetRange(item.id);
              }}
              className={`py-1 text-xs font-medium rounded transition-colors text-center ${
                !useCustomDates && presetRange === item.id
                  ? 'bg-sky-600 text-white font-semibold'
                  : darkMode
                  ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Picker */}
        <div
          className={`p-3 rounded-lg border text-xs space-y-2 ${
            darkMode ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span>Custom Date Range</span>
          </div>

          <div className="space-y-1.5">
            <div>
              <span className="text-[11px] text-neutral-400 block mb-0.5">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-2 py-1 text-xs rounded border font-mono ${
                  darkMode
                    ? 'bg-neutral-800 border-neutral-700 text-white'
                    : 'bg-white border-neutral-300 text-neutral-800'
                }`}
              />
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block mb-0.5">End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-2 py-1 text-xs rounded border font-mono ${
                  darkMode
                    ? 'bg-neutral-800 border-neutral-700 text-white'
                    : 'bg-white border-neutral-300 text-neutral-800'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCustomDates}
              className="w-full mt-1 py-1.5 px-3 text-xs font-semibold rounded bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 text-white transition-colors"
            >
              Apply Custom Range
            </button>
          </div>
        </div>
      </div>

      {/* 4. Indicator Settings (SMA, EMA, RSI, Bollinger) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
            Indicators
          </label>
          <Sliders className="w-3.5 h-3.5 text-neutral-400" />
        </div>

        <div className="space-y-2 text-xs">
          {/* SMA Fast Toggle & Period */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showSmaFast}
                onChange={(e) => onUpdateSettings({ ...settings, showSmaFast: e.target.checked })}
                className="rounded text-amber-500 focus:ring-0"
              />
              <span className="text-amber-500 font-medium">SMA Fast</span>
            </label>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-neutral-400 text-[11px]">Period:</span>
              <input
                type="number"
                min="2"
                max="200"
                value={settings.smaFastPeriod}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    smaFastPeriod: parseInt(e.target.value, 10) || 20
                  })
                }
                className={`w-12 px-1 py-0.5 text-right rounded border text-xs font-mono ${
                  darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300'
                }`}
              />
            </div>
          </div>

          {/* SMA Slow Toggle & Period */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showSmaSlow}
                onChange={(e) => onUpdateSettings({ ...settings, showSmaSlow: e.target.checked })}
                className="rounded text-blue-500 focus:ring-0"
              />
              <span className="text-blue-500 font-medium">SMA Slow</span>
            </label>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-neutral-400 text-[11px]">Period:</span>
              <input
                type="number"
                min="5"
                max="300"
                value={settings.smaSlowPeriod}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    smaSlowPeriod: parseInt(e.target.value, 10) || 50
                  })
                }
                className={`w-12 px-1 py-0.5 text-right rounded border text-xs font-mono ${
                  darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300'
                }`}
              />
            </div>
          </div>

          {/* EMA Fast Toggle & Period */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showEmaFast}
                onChange={(e) => onUpdateSettings({ ...settings, showEmaFast: e.target.checked })}
                className="rounded text-purple-500 focus:ring-0"
              />
              <span className="text-purple-500 font-medium">EMA Fast</span>
            </label>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-neutral-400 text-[11px]">Period:</span>
              <input
                type="number"
                min="2"
                max="100"
                value={settings.emaFastPeriod}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    emaFastPeriod: parseInt(e.target.value, 10) || 12
                  })
                }
                className={`w-12 px-1 py-0.5 text-right rounded border text-xs font-mono ${
                  darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300'
                }`}
              />
            </div>
          </div>

          {/* EMA Slow Toggle & Period */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showEmaSlow}
                onChange={(e) => onUpdateSettings({ ...settings, showEmaSlow: e.target.checked })}
                className="rounded text-pink-500 focus:ring-0"
              />
              <span className="text-pink-500 font-medium">EMA Slow</span>
            </label>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-neutral-400 text-[11px]">Period:</span>
              <input
                type="number"
                min="5"
                max="200"
                value={settings.emaSlowPeriod}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    emaSlowPeriod: parseInt(e.target.value, 10) || 26
                  })
                }
                className={`w-12 px-1 py-0.5 text-right rounded border text-xs font-mono ${
                  darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300'
                }`}
              />
            </div>
          </div>

          {/* RSI Toggle & Period */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showRsi}
                onChange={(e) => onUpdateSettings({ ...settings, showRsi: e.target.checked })}
                className="rounded text-violet-500 focus:ring-0"
              />
              <span className="text-violet-500 font-medium">RSI Oscillator</span>
            </label>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-neutral-400 text-[11px]">Period:</span>
              <input
                type="number"
                min="2"
                max="50"
                value={settings.rsiPeriod}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    rsiPeriod: parseInt(e.target.value, 10) || 14
                  })
                }
                className={`w-12 px-1 py-0.5 text-right rounded border text-xs font-mono ${
                  darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300'
                }`}
              />
            </div>
          </div>

          {/* Bollinger Bands Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showBollinger}
                onChange={(e) => onUpdateSettings({ ...settings, showBollinger: e.target.checked })}
                className="rounded text-sky-500 focus:ring-0"
              />
              <span className="text-sky-500 font-medium">Bollinger Bands</span>
            </label>
            <span className="font-mono text-[11px] text-neutral-400">(20, 2σ)</span>
          </div>

          {/* Volume Toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showVolume}
                onChange={(e) => onUpdateSettings({ ...settings, showVolume: e.target.checked })}
                className="rounded text-neutral-500 focus:ring-0"
              />
              <span className="text-neutral-500 dark:text-neutral-400">Volume Sub-track</span>
            </label>
          </div>
        </div>
      </div>

      {/* 5. Deliverables & Actions: CSV, Screenshot, Analysis Reports */}
      <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 block mb-2">
          Deliverables &amp; Exports
        </label>

        {/* Technical Analysis Report Button */}
        <button
          type="button"
          onClick={onOpenReport}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
        >
          <FileText className="w-4 h-4" />
          Technical Analysis Report
        </button>

        {/* Screenshot / Snapshot Button */}
        <button
          type="button"
          onClick={onTakeScreenshot}
          disabled={isCapturing}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
            darkMode
              ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-800'
          }`}
        >
          <Camera className="w-4 h-4 text-sky-500" />
          {isCapturing ? 'Generating Screenshot...' : 'Save Screenshot (PNG)'}
        </button>

        {/* CSV Export Button */}
        <button
          type="button"
          onClick={onExportCSV}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
            darkMode
              ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-800'
          }`}
        >
          <Download className="w-4 h-4 text-emerald-500" />
          Export Data (CSV)
        </button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className={`w-full flex items-center justify-between py-2 px-3 text-xs font-medium rounded-lg border transition-colors mt-2 ${
            darkMode
              ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
              : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          <div className="flex items-center gap-2">
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            {darkMode ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </aside>
  );
};
