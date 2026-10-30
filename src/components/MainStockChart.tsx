import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ComputedCandle, IndicatorSettings } from '../utils/indicators';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface MainStockChartProps {
  candles: ComputedCandle[];
  ticker: string;
  chartType: 'candlestick' | 'line';
  settings: IndicatorSettings;
  darkMode: boolean;
  onHoverCandle?: (candle: ComputedCandle | null) => void;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}

export const MainStockChart: React.FC<MainStockChartProps> = ({
  candles,
  ticker,
  chartType,
  settings,
  darkMode,
  onHoverCandle,
  hoveredIndex,
  setHoveredIndex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 440 });

  // Visible window for pan and zoom
  const [viewRange, setViewRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRange, setDragStartRange] = useState({ start: 0, end: 0 });

  // Update view range when candle set changes or ticker changes
  useEffect(() => {
    if (candles.length > 0) {
      setViewRange({
        start: 0,
        end: candles.length - 1
      });
    }
  }, [candles]);

  // Resize observer for responsive layout
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

  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    const s = Math.max(0, Math.min(viewRange.start, candles.length - 1));
    const e = Math.max(s, Math.min(viewRange.end, candles.length - 1));
    return candles.slice(s, e + 1);
  }, [candles, viewRange]);

  const startIndex = Math.max(0, Math.min(viewRange.start, candles.length - 1));

  // Compute price bounds for visible candles
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 1000 };

    let min = Infinity;
    let max = -Infinity;
    let volMax = 0;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > volMax) volMax = c.volume;

      // Also account for visible indicators
      if (settings.showSmaFast && c.smaFast) {
        if (c.smaFast < min) min = c.smaFast;
        if (c.smaFast > max) max = c.smaFast;
      }
      if (settings.showSmaSlow && c.smaSlow) {
        if (c.smaSlow < min) min = c.smaSlow;
        if (c.smaSlow > max) max = c.smaSlow;
      }
      if (settings.showEmaFast && c.emaFast) {
        if (c.emaFast < min) min = c.emaFast;
        if (c.emaFast > max) max = c.emaFast;
      }
      if (settings.showEmaSlow && c.emaSlow) {
        if (c.emaSlow < min) min = c.emaSlow;
        if (c.emaSlow > max) max = c.emaSlow;
      }
      if (settings.showBollinger && c.bollingerUpper && c.bollingerLower) {
        if (c.bollingerLower < min) min = c.bollingerLower;
        if (c.bollingerUpper > max) max = c.bollingerUpper;
      }
    });

    const padding = (max - min) * 0.08 || 1;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      maxVolume: volMax || 1
    };
  }, [visibleCandles, settings]);

  // Main canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const width = dimensions.width;
    const height = dimensions.height;

    // Chart layout margins
    const paddingRight = 68; // Price axis on right
    const paddingBottom = 28; // Date axis
    const paddingTop = 20;
    const paddingLeft = 12;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Theme colors
    const bgColor = darkMode ? '#0B0F17' : '#FFFFFF';
    const gridColor = darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = darkMode ? '#94A3B8' : '#64748B';
    const axisLineColor = darkMode ? '#1E293B' : '#E2E8F0';
    const greenColor = '#10B981'; // Up candle
    const redColor = '#EF4444';   // Down candle
    const crosshairColor = darkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    if (visibleCandles.length === 0) {
      ctx.fillStyle = textColor;
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No stock data available for selected range', width / 2, height / 2);
      return;
    }

    const priceToY = (price: number) => {
      if (maxPrice === minPrice) return paddingTop + chartHeight / 2;
      return paddingTop + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
    };

    const count = visibleCandles.length;
    const stepX = chartWidth / count;
    const getCandleX = (i: number) => paddingLeft + i * stepX + stepX / 2;

    // 1. Draw Gridlines & Price Y-Axis Labels
    const numPriceSteps = 6;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.fillStyle = textColor;
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= numPriceSteps; i++) {
      const priceVal = minPrice + ((maxPrice - minPrice) / numPriceSteps) * i;
      const y = priceToY(priceVal);

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Price label on right margin
      ctx.fillText(`$${priceVal.toFixed(2)}`, width - paddingRight + 8, y + 4);
    }

    // 2. Draw Date X-Axis Labels & Vertical Gridlines
    const dateInterval = Math.max(1, Math.floor(count / 6));
    ctx.textAlign = 'center';

    for (let i = 0; i < count; i += dateInterval) {
      const candle = visibleCandles[i];
      const x = getCandleX(i);

      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();

      ctx.fillText(candle.date, x, height - 8);
    }

    // 3. Draw Volume Bars at bottom (if enabled)
    if (settings.showVolume) {
      const volumeMaxHeight = chartHeight * 0.22;
      const volumeBaseY = paddingTop + chartHeight;

      visibleCandles.forEach((c, i) => {
        const x = paddingLeft + i * stepX;
        const barWidth = Math.max(1, stepX * 0.7);
        const barHeight = (c.volume / maxVolume) * volumeMaxHeight;
        const isUp = c.close >= c.open;

        ctx.fillStyle = isUp
          ? darkMode ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.28)'
          : darkMode ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.28)';

        ctx.fillRect(x + (stepX - barWidth) / 2, volumeBaseY - barHeight, barWidth, barHeight);
      });
    }

    // 4. Bollinger Bands (Cloud & lines)
    if (settings.showBollinger) {
      // Draw upper/lower cloud
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < count; i++) {
        const upper = visibleCandles[i].bollingerUpper;
        if (upper !== undefined) {
          const x = getCandleX(i);
          const y = priceToY(upper);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let i = count - 1; i >= 0; i--) {
        const lower = visibleCandles[i].bollingerLower;
        if (lower !== undefined) {
          const x = getCandleX(i);
          const y = priceToY(lower);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = darkMode ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 165, 233, 0.07)';
      ctx.fill();

      // Draw middle SMA line
      ctx.strokeStyle = darkMode ? 'rgba(56, 189, 248, 0.5)' : 'rgba(14, 165, 233, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      started = false;
      for (let i = 0; i < count; i++) {
        const mid = visibleCandles[i].bollingerMiddle;
        if (mid !== undefined) {
          const x = getCandleX(i);
          const y = priceToY(mid);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Draw Price Series (Candlestick OR Line Graph)
    if (chartType === 'candlestick') {
      const candleWidth = Math.max(2, stepX * 0.72);

      visibleCandles.forEach((c, i) => {
        const xCenter = getCandleX(i);
        const isUp = c.close >= c.open;
        const color = isUp ? greenColor : redColor;

        const yOpen = priceToY(c.open);
        const yClose = priceToY(c.close);
        const yHigh = priceToY(c.high);
        const yLow = priceToY(c.low);

        // Draw Wick (Upper and Lower)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(xCenter, yHigh);
        ctx.lineTo(xCenter, yLow);
        ctx.stroke();

        // Draw Candle Body
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
        const bodyX = xCenter - candleWidth / 2;

        ctx.fillStyle = color;
        ctx.fillRect(bodyX, bodyTop, candleWidth, bodyHeight);
      });
    } else {
      // Line Graph mode with subtle gradient under curve
      const lineGradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
      lineGradient.addColorStop(0, darkMode ? 'rgba(59, 130, 246, 0.28)' : 'rgba(59, 130, 246, 0.22)');
      lineGradient.addColorStop(1, darkMode ? 'rgba(59, 130, 246, 0.0)' : 'rgba(59, 130, 246, 0.0)');

      ctx.beginPath();
      ctx.moveTo(getCandleX(0), paddingTop + chartHeight);
      visibleCandles.forEach((c, i) => {
        ctx.lineTo(getCandleX(i), priceToY(c.close));
      });
      ctx.lineTo(getCandleX(count - 1), paddingTop + chartHeight);
      ctx.closePath();
      ctx.fillStyle = lineGradient;
      ctx.fill();

      // Main line stroke
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleCandles.forEach((c, i) => {
        const x = getCandleX(i);
        const y = priceToY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 6. Draw Indicator Lines (SMA Fast, SMA Slow, EMA Fast, EMA Slow)
    const drawIndicatorLine = (
      getValue: (c: ComputedCandle) => number | undefined,
      color: string,
      lineWidth = 1.5,
      isDashed = false
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (isDashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      let started = false;
      for (let i = 0; i < count; i++) {
        const val = getValue(visibleCandles[i]);
        if (val !== undefined) {
          const x = getCandleX(i);
          const y = priceToY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    if (settings.showSmaFast) {
      drawIndicatorLine((c) => c.smaFast, '#F59E0B', 1.8); // Amber
    }
    if (settings.showSmaSlow) {
      drawIndicatorLine((c) => c.smaSlow, '#3B82F6', 1.8); // Blue
    }
    if (settings.showEmaFast) {
      drawIndicatorLine((c) => c.emaFast, '#A855F7', 1.6); // Purple
    }
    if (settings.showEmaSlow) {
      drawIndicatorLine((c) => c.emaSlow, '#EC4899', 1.6); // Pink
    }

    // 7. Draw Crosshair & Hover Tooltip if active
    if (hoveredIndex !== null && hoveredIndex >= startIndex && hoveredIndex <= startIndex + count - 1) {
      const relIdx = hoveredIndex - startIndex;
      const targetCandle = visibleCandles[relIdx];
      if (targetCandle) {
        const hX = getCandleX(relIdx);
        const hY = priceToY(targetCandle.close);

        // Vertical crosshair
        ctx.strokeStyle = crosshairColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hX, paddingTop);
        ctx.lineTo(hX, height - paddingBottom);
        ctx.stroke();

        // Horizontal crosshair to right axis
        ctx.beginPath();
        ctx.moveTo(paddingLeft, hY);
        ctx.lineTo(width - paddingRight, hY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Price badge on right axis
        ctx.fillStyle = darkMode ? '#F8FAFC' : '#0F172A';
        ctx.fillRect(width - paddingRight + 2, hY - 10, paddingRight - 4, 20);
        ctx.fillStyle = darkMode ? '#0F172A' : '#FFFFFF';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`$${targetCandle.close.toFixed(2)}`, width - paddingRight / 2, hY + 4);

        // Date badge at bottom axis
        ctx.fillStyle = darkMode ? '#F8FAFC' : '#0F172A';
        ctx.fillRect(hX - 42, height - paddingBottom + 2, 84, 18);
        ctx.fillStyle = darkMode ? '#0F172A' : '#FFFFFF';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(targetCandle.date, hX, height - paddingBottom + 14);
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
  }, [
    dimensions,
    visibleCandles,
    chartType,
    settings,
    darkMode,
    hoveredIndex,
    startIndex,
    minPrice,
    maxPrice,
    maxVolume
  ]);

  // Handle Mouse Interactions for Crosshairs & Zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || candles.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    const paddingLeft = 12;
    const paddingRight = 68;
    const chartWidth = dimensions.width - paddingLeft - paddingRight;

    if (isDragging) {
      const deltaX = mouseX - dragStartX;
      const count = candles.length;
      const step = chartWidth / (dragStartRange.end - dragStartRange.start + 1);
      const shiftCandles = Math.round(-deltaX / step);

      const span = dragStartRange.end - dragStartRange.start;
      let newStart = dragStartRange.start + shiftCandles;
      let newEnd = dragStartRange.end + shiftCandles;

      if (newStart < 0) {
        newStart = 0;
        newEnd = span;
      }
      if (newEnd >= count) {
        newEnd = count - 1;
        newStart = Math.max(0, count - 1 - span);
      }

      setViewRange({ start: newStart, end: newEnd });
      return;
    }

    // Crosshair hover index
    const count = visibleCandles.length;
    if (count === 0) return;
    const stepX = chartWidth / count;
    const relativeX = mouseX - paddingLeft;
    const localIdx = Math.floor(relativeX / stepX);

    if (localIdx >= 0 && localIdx < count) {
      const globalIdx = startIndex + localIdx;
      setHoveredIndex(globalIdx);
      if (onHoverCandle) onHoverCandle(candles[globalIdx]);
    } else {
      setHoveredIndex(null);
      if (onHoverCandle) onHoverCandle(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDragging(true);
    setDragStartX(e.clientX - rect.left);
    setDragStartRange({ ...viewRange });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredIndex(null);
    if (onHoverCandle) onHoverCandle(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (candles.length === 0) return;

    const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
    const currentSpan = viewRange.end - viewRange.start + 1;
    const newSpan = Math.max(10, Math.min(candles.length, Math.round(currentSpan * zoomFactor)));

    const mid = (viewRange.start + viewRange.end) / 2;
    let newStart = Math.max(0, Math.round(mid - newSpan / 2));
    let newEnd = Math.min(candles.length - 1, newStart + newSpan - 1);

    if (newEnd - newStart < 10) return;

    setViewRange({ start: newStart, end: newEnd });
  };

  const resetZoom = () => {
    setViewRange({ start: 0, end: candles.length - 1 });
  };

  const zoomIn = () => {
    const span = viewRange.end - viewRange.start + 1;
    const newSpan = Math.max(10, Math.round(span * 0.7));
    const mid = (viewRange.start + viewRange.end) / 2;
    const start = Math.max(0, Math.round(mid - newSpan / 2));
    const end = Math.min(candles.length - 1, start + newSpan - 1);
    setViewRange({ start, end });
  };

  const zoomOut = () => {
    const span = viewRange.end - viewRange.start + 1;
    const newSpan = Math.min(candles.length, Math.round(span * 1.4));
    const mid = (viewRange.start + viewRange.end) / 2;
    const start = Math.max(0, Math.round(mid - newSpan / 2));
    const end = Math.min(candles.length - 1, start + newSpan - 1);
    setViewRange({ start, end });
  };

  // Active candle for top badge
  const activeCandle = hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : candles[candles.length - 1];
  const prevCandle = hoveredIndex !== null && hoveredIndex > 0 ? candles[hoveredIndex - 1] : candles[candles.length - 2];
  const dayChange = activeCandle && prevCandle ? activeCandle.close - prevCandle.close : 0;
  const dayChangePct = activeCandle && prevCandle && prevCandle.close ? (dayChange / prevCandle.close) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl border select-none transition-colors overflow-hidden ${
        darkMode ? 'bg-[#0B0F17] border-neutral-800' : 'bg-white border-neutral-200'
      }`}
      style={{ height: '460px' }}
    >
      {/* Live Information Ribbon */}
      <div
        className={`absolute top-2 left-3 right-16 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pointer-events-none ${
          darkMode ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        {activeCandle && (
          <>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                {ticker}
              </span>
              <span className="font-mono text-xs text-slate-500">{activeCandle.date}</span>
            </div>

            <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
              <span>
                O: <strong className="font-semibold">${activeCandle.open.toFixed(2)}</strong>
              </span>
              <span>
                H: <strong className="font-semibold">${activeCandle.high.toFixed(2)}</strong>
              </span>
              <span>
                L: <strong className="font-semibold">${activeCandle.low.toFixed(2)}</strong>
              </span>
              <span>
                C: <strong className="font-semibold">${activeCandle.close.toFixed(2)}</strong>
              </span>
              <span
                className={`font-semibold ${
                  dayChange >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)} ({dayChangePct >= 0 ? '+' : ''}
                {dayChangePct.toFixed(2)}%)
              </span>
              <span>
                Vol:{' '}
                <strong className="font-semibold">
                  {(activeCandle.volume / 1000000).toFixed(2)}M
                </strong>
              </span>
            </div>

            {/* Active Indicator Values */}
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
              {settings.showSmaFast && activeCandle.smaFast !== undefined && (
                <span className="text-amber-500">
                  SMA({settings.smaFastPeriod}): ${activeCandle.smaFast.toFixed(2)}
                </span>
              )}
              {settings.showSmaSlow && activeCandle.smaSlow !== undefined && (
                <span className="text-blue-500">
                  SMA({settings.smaSlowPeriod}): ${activeCandle.smaSlow.toFixed(2)}
                </span>
              )}
              {settings.showEmaFast && activeCandle.emaFast !== undefined && (
                <span className="text-purple-500">
                  EMA({settings.emaFastPeriod}): ${activeCandle.emaFast.toFixed(2)}
                </span>
              )}
              {settings.showEmaSlow && activeCandle.emaSlow !== undefined && (
                <span className="text-pink-500">
                  EMA({settings.emaSlowPeriod}): ${activeCandle.emaSlow.toFixed(2)}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Chart Controls */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        <button
          onClick={zoomIn}
          title="Zoom In"
          className={`p-1.5 rounded text-xs transition-colors ${
            darkMode
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className={`p-1.5 rounded text-xs transition-colors ${
            darkMode
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetZoom}
          title="Reset Range"
          className={`p-1.5 rounded text-xs transition-colors ${
            darkMode
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* The HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair"
      />
    </div>
  );
};
