import React, { useState, useMemo } from 'react';
import { ComputedCandle } from '../utils/indicators';
import { Download, Search, ArrowUpDown } from 'lucide-react';

interface HistoricalDataTableProps {
  candles: ComputedCandle[];
  ticker: string;
  darkMode: boolean;
  onExportCSV: () => void;
}

export const HistoricalDataTable: React.FC<HistoricalDataTableProps> = ({
  candles,
  ticker,
  darkMode,
  onExportCSV
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'close' | 'volume' | 'rsi'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let result = [...candles];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((c) => c.date.includes(q));
    }
    result.sort((a, b) => {
      let va = a[sortField] ?? 0;
      let vb = b[sortField] ?? 0;
      if (sortField === 'date') {
        va = a.timestamp;
        vb = b.timestamp;
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [candles, searchTerm, sortField, sortAsc]);

  const handleSort = (field: 'date' | 'close' | 'volume' | 'rsi') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        darkMode ? 'bg-[#111827] border-neutral-800' : 'bg-white border-neutral-200'
      }`}
    >
      {/* Table Toolbar */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Historical Trading Sessions &amp; Indicator Log
          </h3>
          <span className="text-xs text-neutral-500 font-mono">({filtered.length} entries)</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              placeholder="Search date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border font-mono ${
                darkMode
                  ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400'
              }`}
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            CSV Export
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[460px]">
        <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
          <thead
            className={`sticky top-0 z-10 select-none ${
              darkMode ? 'bg-[#0B0F17] text-neutral-400' : 'bg-neutral-50 text-neutral-600'
            }`}
          >
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th
                onClick={() => handleSort('date')}
                className="py-2.5 px-4 font-semibold cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-right">Open</th>
              <th className="py-2.5 px-3 font-semibold text-right">High</th>
              <th className="py-2.5 px-3 font-semibold text-right">Low</th>
              <th
                onClick={() => handleSort('close')}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Close</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('volume')}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Volume</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold text-right text-amber-500">SMA Fast</th>
              <th className="py-2.5 px-3 font-semibold text-right text-blue-500">SMA Slow</th>
              <th className="py-2.5 px-3 font-semibold text-right text-purple-500">EMA Fast</th>
              <th
                onClick={() => handleSort('rsi')}
                className="py-2.5 px-4 font-semibold text-right text-violet-400 cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>RSI (14)</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60">
            {filtered.map((c) => {
              const isGreen = c.close >= c.open;
              return (
                <tr
                  key={c.date}
                  className={`transition-colors ${
                    darkMode
                      ? 'hover:bg-neutral-800/40 text-neutral-300'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <td className="py-2 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    {c.date}
                  </td>
                  <td className="py-2 px-3 text-right">${c.open.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">${c.high.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">${c.low.toFixed(2)}</td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      isGreen ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    ${c.close.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right text-neutral-500">
                    {c.volume.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-amber-500">
                    {c.smaFast !== undefined ? `$${c.smaFast.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-blue-500">
                    {c.smaSlow !== undefined ? `$${c.smaSlow.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-purple-500">
                    {c.emaFast !== undefined ? `$${c.emaFast.toFixed(2)}` : '-'}
                  </td>
                  <td
                    className={`py-2 px-4 text-right font-semibold ${
                      c.rsi !== undefined && c.rsi >= 70
                        ? 'text-rose-500'
                        : c.rsi !== undefined && c.rsi <= 30
                        ? 'text-emerald-500'
                        : 'text-violet-400'
                    }`}
                  >
                    {c.rsi !== undefined ? c.rsi.toFixed(2) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
