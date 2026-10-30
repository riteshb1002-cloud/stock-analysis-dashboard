import React from 'react';
import { Activity, Download, FileText } from 'lucide-react';

interface NavbarProps {
  onOpenReport: () => void;
  onExportCSV: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenReport,
  onExportCSV,
  activeTab,
  setActiveTab,
  darkMode
}) => {
  return (
    <header
      className={`h-16 px-6 border-b flex items-center justify-between gap-8 transition-colors select-none ${
        darkMode ? 'bg-[#0B0F17] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">StockTrend</span>
      </div>

      {/* Zone 2: 4–5 concise single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        <button
          onClick={() => setActiveTab('chart')}
          className={`hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'chart' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
          }`}
        >
          Chart Analysis
        </button>
        <button
          onClick={() => setActiveTab('indicators')}
          className={`hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'indicators' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
          }`}
        >
          Indicators Matrix
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'history' ? 'text-sky-600 dark:text-sky-400 font-semibold' : ''
          }`}
        >
          Historical Table
        </button>
        <button
          onClick={onOpenReport}
          className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Executive Report
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenReport}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Analysis Report</span>
        </button>
      </div>
    </header>
  );
};
