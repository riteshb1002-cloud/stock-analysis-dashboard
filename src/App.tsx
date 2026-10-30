import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { SidebarFilters } from './components/SidebarFilters';
import { MainStockChart } from './components/MainStockChart';
import { RsiOscillatorChart } from './components/RsiOscillatorChart';
import { PerformanceSummaryCard } from './components/PerformanceSummaryCard';
import { AnalysisReportModal } from './components/AnalysisReportModal';
import { HistoricalDataTable } from './components/HistoricalDataTable';
import { IndicatorsMatrix } from './components/IndicatorsMatrix';
import {
  StockCandle,
  ComputedCandle,
  IndicatorSettings,
  DEFAULT_INDICATOR_SETTINGS,
  computeAllIndicators,
  calculatePerformanceSummary,
  exportToCSV
} from './utils/indicators';
import { captureDashboardScreenshot } from './utils/screenshot';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

export default function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [companyName, setCompanyName] = useState('Apple Inc.');
  const [currency, setCurrency] = useState('USD');
  const [rawCandles, setRawCandles] = useState<StockCandle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings & Filter states
  const [presetRange, setPresetRange] = useState('1y');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCustomDateActive, setIsCustomDateActive] = useState(false);

  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [settings, setSettings] = useState<IndicatorSettings>(DEFAULT_INDICATOR_SETTINGS);
  const [activeTab, setActiveTab] = useState<'chart' | 'indicators' | 'history'>('chart');

  // Crosshair synchronized state
  const [hoveredCandle, setHoveredCandle] = useState<ComputedCandle | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('stocktrend_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });

  // Modal and Screenshot states
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotSuccess, setScreenshotSuccess] = useState(false);

  // Sync dark class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('stocktrend_dark_mode', String(darkMode));
  }, [darkMode]);

  // Fetch stock data from Express server proxy / Yahoo Finance
  const fetchStockData = async (targetTicker: string, range: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/stock/${encodeURIComponent(targetTicker)}?range=${range}`);
      if (!response.ok) {
        throw new Error(`Failed to load data for ${targetTicker} (Status ${response.status})`);
      }
      const data = await response.json();
      if (!data.history || data.history.length === 0) {
        throw new Error(`No historical records found for ${targetTicker}`);
      }

      setTicker(data.symbol || targetTicker);
      setCompanyName(data.companyName || targetTicker);
      setCurrency(data.currency || 'USD');
      setRawCandles(data.history);

      // Set default custom date limits
      if (data.history.length > 0) {
        setCustomStartDate(data.history[0].date);
        setCustomEndDate(data.history[data.history.length - 1].date);
      }
    } catch (err: any) {
      console.error('Error fetching stock data:', err);
      setErrorMessage(err.message || 'Error connecting to stock data provider');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(ticker, presetRange);
  }, [ticker, presetRange]);

  // Apply custom date range filtering if active
  const filteredCandles = useMemo(() => {
    if (!isCustomDateActive || !customStartDate || !customEndDate) {
      return rawCandles;
    }
    return rawCandles.filter((c) => c.date >= customStartDate && c.date <= customEndDate);
  }, [rawCandles, isCustomDateActive, customStartDate, customEndDate]);

  // Compute all technical indicators
  const computedCandles = useMemo(() => {
    return computeAllIndicators(filteredCandles, settings);
  }, [filteredCandles, settings]);

  // Compute performance summary metrics
  const performanceSummary = useMemo(() => {
    return calculatePerformanceSummary(computedCandles);
  }, [computedCandles]);

  // Handle custom date filter submission
  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setIsCustomDateActive(true);
  };

  const handleSelectPresetRange = (range: string) => {
    setIsCustomDateActive(false);
    setPresetRange(range);
  };

  const handleExportCSV = () => {
    exportToCSV(computedCandles, ticker);
  };

  const handleTakeScreenshot = async () => {
    setIsCapturingScreenshot(true);
    setScreenshotSuccess(false);
    try {
      const success = await captureDashboardScreenshot('dashboard-main-view', ticker);
      if (success) {
        setScreenshotSuccess(true);
        setTimeout(() => setScreenshotSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Screenshot error:', e);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        darkMode ? 'bg-[#080B11] text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* 3-Zone Clean Top Bar */}
      <Navbar
        onOpenReport={() => setIsReportOpen(true)}
        onExportCSV={handleExportCSV}
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        darkMode={darkMode}
      />

      {/* Screenshot notification toast */}
      {screenshotSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>Screenshot downloaded successfully!</span>
        </div>
      )}

      {/* Main App Layout: Sidebar Filters + Main Dashboard Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Filters */}
        <SidebarFilters
          currentTicker={ticker}
          onSelectTicker={(t) => {
            setTicker(t);
            setIsCustomDateActive(false);
          }}
          presetRange={presetRange}
          onSelectPresetRange={handleSelectPresetRange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
          chartType={chartType}
          onChangeChartType={setChartType}
          settings={settings}
          onUpdateSettings={setSettings}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onExportCSV={handleExportCSV}
          onTakeScreenshot={handleTakeScreenshot}
          onOpenReport={() => setIsReportOpen(true)}
          isCapturing={isCapturingScreenshot}
        />

        {/* Main Content Workspace */}
        <main
          id="dashboard-main-view"
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl"
        >
          {/* Top Ticker Meta & Live Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  {ticker}
                </h1>
                <span className="text-sm text-neutral-500 font-medium">
                  {companyName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                  {currency}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                <span>Data source: yfinance API</span>
                <span aria-hidden="true">·</span>
                <span>
                  {isCustomDateActive
                    ? `Filtered: ${customStartDate} to ${customEndDate}`
                    : `Preset: ${presetRange.toUpperCase()}`}
                </span>
                <span aria-hidden="true">·</span>
                <span>{computedCandles.length} candles</span>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div
              className={`flex p-1 rounded-lg border self-start sm:self-auto ${
                darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
              }`}
            >
              <button
                onClick={() => setActiveTab('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'chart'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Chart &amp; RSI
              </button>
              <button
                onClick={() => setActiveTab('indicators')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'indicators'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Indicators
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Historical Log
              </button>
            </div>
          </div>

          {/* Loading or Error State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              <span className="text-sm font-medium text-neutral-500">
                Fetching historical price records and calculating indicators for {ticker}...
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 flex items-start gap-3 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <span className="font-semibold block">Failed to load stock data</span>
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => fetchStockData(ticker, presetRange)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !errorMessage && (
            <>
              {/* Performance Summary Component */}
              <PerformanceSummaryCard
                summary={performanceSummary}
                ticker={ticker}
                companyName={companyName}
                currency={currency}
                darkMode={darkMode}
              />

              {/* Tab 1: Interactive Charts (Price + RSI) */}
              {activeTab === 'chart' && (
                <div className="space-y-4">
                  {/* Candlestick / Line Chart Component */}
                  <MainStockChart
                    candles={computedCandles}
                    ticker={ticker}
                    chartType={chartType}
                    settings={settings}
                    darkMode={darkMode}
                    onHoverCandle={setHoveredCandle}
                    hoveredIndex={hoveredIndex}
                    setHoveredIndex={setHoveredIndex}
                  />

                  {/* Synchronized RSI Oscillator Sub-Chart */}
                  {settings.showRsi && (
                    <RsiOscillatorChart
                      candles={computedCandles}
                      settings={settings}
                      darkMode={darkMode}
                      hoveredIndex={hoveredIndex}
                      setHoveredIndex={setHoveredIndex}
                    />
                  )}
                </div>
              )}

              {/* Tab 2: Indicators Matrix & Mathematical Formulas */}
              {activeTab === 'indicators' && (
                <IndicatorsMatrix
                  candles={computedCandles}
                  settings={settings}
                  summary={performanceSummary}
                  darkMode={darkMode}
                />
              )}

              {/* Tab 3: Historical Table with Sorting and CSV Export */}
              {activeTab === 'history' && (
                <HistoricalDataTable
                  candles={computedCandles}
                  ticker={ticker}
                  darkMode={darkMode}
                  onExportCSV={handleExportCSV}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Technical Analysis Report Modal */}
      <AnalysisReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        ticker={ticker}
        companyName={companyName}
        currency={currency}
        summary={performanceSummary}
        candles={computedCandles}
        darkMode={darkMode}
      />
    </div>
  );
}
