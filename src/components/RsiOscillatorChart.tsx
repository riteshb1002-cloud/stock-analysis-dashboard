import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ComputedCandle, IndicatorSettings } from '../utils/indicators';

interface RsiOscillatorChartProps {
  candles: ComputedCandle[];
  settings: IndicatorSettings;
  darkMode: boolean;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}

export const RsiOscillatorChart: React.FC<RsiOscillatorChartProps> = ({
  candles,
  settings,
  darkMode,
  hoveredIndex,
  setHoveredIndex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 140 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute active RSI value
  const activeCandle = hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : candles[candles.length - 1];
  const activeRSI = activeCandle?.rsi;

  let rsiStatusText = 'Neutral';
  let rsiStatusColor = darkMode ? 'text-slate-300' : 'text-slate-700';
  if (activeRSI !== undefined) {
    if (activeRSI >= 70) {
      rsiStatusText = 'Overbought (>70)';
      rsiStatusColor = 'text-rose-500 font-semibold';
    } else if (activeRSI <= 30) {
      rsiStatusText = 'Oversold (<30)';
      rsiStatusColor = 'text-emerald-500 font-semibold';
    } else if (activeRSI >= 50) {
      rsiStatusText = 'Bullish Zone (50-70)';
      rsiStatusColor = 'text-sky-500';
    } else {
      rsiStatusText = 'Bearish Zone (30-50)';
      rsiStatusColor = 'text-amber-500';
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const width = dimensions.width;
    const height = dimensions.height;

    const paddingRight = 68;
    const paddingBottom = 18;
    const paddingTop = 16;
    const paddingLeft = 12;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const bgColor = darkMode ? '#0B0F17' : '#FFFFFF';
    const gridColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = darkMode ? '#94A3B8' : '#64748B';
    const axisLineColor = darkMode ? '#1E293B' : '#E2E8F0';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // RSI scale is 0 to 100
    const rsiToY = (val: number) => {
      const clamped = Math.max(0, Math.min(100, val));
      return paddingTop + chartHeight - (clamped / 100) * chartHeight;
    };

    const count = candles.length;
    const stepX = chartWidth / count;
    const getX = (i: number) => paddingLeft + i * stepX + stepX / 2;

    // 1. Shaded Zone between 30 and 70
    const y70 = rsiToY(70);
    const y30 = rsiToY(30);
    const y50 = rsiToY(50);

    ctx.fillStyle = darkMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.04)';
    ctx.fillRect(paddingLeft, y70, chartWidth, y30 - y70);

    // 2. Threshold lines: 70, 50, 30
    // 70 Line
    ctx.strokeStyle = darkMode ? 'rgba(244, 63, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y70);
    ctx.lineTo(width - paddingRight, y70);
    ctx.stroke();

    // 50 Centerline
    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y50);
    ctx.lineTo(width - paddingRight, y50);
    ctx.stroke();

    // 30 Line
    ctx.strokeStyle = darkMode ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.4)';
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y30);
    ctx.lineTo(width - paddingRight, y30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Y-Axis Labels (70, 50, 30)
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = darkMode ? '#F43F5E' : '#DC2626';
    ctx.fillText('70', width - paddingRight + 8, y70 + 3);

    ctx.fillStyle = textColor;
    ctx.fillText('50', width - paddingRight + 8, y50 + 3);

    ctx.fillStyle = darkMode ? '#10B981' : '#059669';
    ctx.fillText('30', width - paddingRight + 8, y30 + 3);

    // 3. Draw RSI Curve
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let started = false;

    for (let i = 0; i < count; i++) {
      const val = candles[i].rsi;
      if (val !== undefined) {
        const x = getX(i);
        const y = rsiToY(val);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();

    // 4. Crosshair tracking
    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < count) {
      const hX = getX(hoveredIndex);
      const curRsi = candles[hoveredIndex].rsi;

      // Vertical line
      ctx.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hX, paddingTop);
      ctx.lineTo(hX, height - paddingBottom);
      ctx.stroke();

      if (curRsi !== undefined) {
        const hY = rsiToY(curRsi);
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(paddingLeft, hY);
        ctx.lineTo(width - paddingRight, hY);
        ctx.stroke();
        ctx.setLineDash([]);

        // RSI value tag on right axis
        ctx.fillStyle = '#8B5CF6';
        ctx.fillRect(width - paddingRight + 2, hY - 9, paddingRight - 4, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${curRsi.toFixed(1)}`, width - paddingRight / 2, hY + 4);
      }
    }

    // Border line dividing chart and axes
    ctx.strokeStyle = axisLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - paddingRight, paddingTop);
    ctx.lineTo(width - paddingRight, height - paddingBottom);
    ctx.lineTo(paddingLeft, height - paddingBottom);
    ctx.stroke();
  }, [dimensions, candles, darkMode, hoveredIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || candles.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    const paddingLeft = 12;
    const paddingRight = 68;
    const chartWidth = dimensions.width - paddingLeft - paddingRight;

    const count = candles.length;
    const stepX = chartWidth / count;
    const relativeX = mouseX - paddingLeft;
    const idx = Math.floor(relativeX / stepX);

    if (idx >= 0 && idx < count) {
      setHoveredIndex(idx);
    } else {
      setHoveredIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl border select-none transition-colors overflow-hidden ${
        darkMode ? 'bg-[#0B0F17] border-neutral-800' : 'bg-white border-neutral-200'
      }`}
      style={{ height: '140px' }}
    >
      {/* Indicator title & status header */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-xs pointer-events-none">
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          RSI ({settings.rsiPeriod})
        </span>
        {activeRSI !== undefined && (
          <span className="font-mono tabular-nums text-purple-500 font-bold">
            {activeRSI.toFixed(2)}
          </span>
        )}
        <span className={`text-[11px] ${rsiStatusColor}`}>{rsiStatusText}</span>
      </div>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full cursor-crosshair"
      />
    </div>
  );
};
