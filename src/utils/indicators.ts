export interface StockCandle {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

export interface ComputedCandle extends StockCandle {
  smaFast?: number;
  smaSlow?: number;
  emaFast?: number;
  emaSlow?: number;
  rsi?: number;
  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  volumeSMA?: number;
}

export interface IndicatorSettings {
  smaFastPeriod: number; // default 20
  smaSlowPeriod: number; // default 50
  emaFastPeriod: number; // default 12
  emaSlowPeriod: number; // default 26
  rsiPeriod: number;     // default 14
  bollingerPeriod: number; // default 20
  bollingerStdDev: number; // default 2
  showSmaFast: boolean;
  showSmaSlow: boolean;
  showEmaFast: boolean;
  showEmaSlow: boolean;
  showBollinger: boolean;
  showRsi: boolean;
  showMacd: boolean;
  showVolume: boolean;
}

export const DEFAULT_INDICATOR_SETTINGS: IndicatorSettings = {
  smaFastPeriod: 20,
  smaSlowPeriod: 50,
  emaFastPeriod: 12,
  emaSlowPeriod: 26,
  rsiPeriod: 14,
  bollingerPeriod: 20,
  bollingerStdDev: 2,
  showSmaFast: true,
  showSmaSlow: true,
  showEmaFast: false,
  showEmaSlow: false,
  showBollinger: true,
  showRsi: true,
  showMacd: false,
  showVolume: true
};

/**
 * Calculates SMA for an array of values
 */
export function calculateSMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result.push(parseFloat((sum / period).toFixed(2)));
    } else {
      result.push(undefined);
    }
  }
  return result;
}

/**
 * Calculates EMA for an array of values
 */
export function calculateEMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  if (data.length < period) {
    return data.map(() => undefined);
  }

  const multiplier = 2 / (period + 1);
  let firstSMA = 0;
  for (let i = 0; i < period; i++) {
    firstSMA += data[i];
    result.push(undefined);
  }
  firstSMA /= period;
  result[period - 1] = parseFloat(firstSMA.toFixed(2));

  let prevEMA = firstSMA;
  for (let i = period; i < data.length; i++) {
    const curEMA = (data[i] - prevEMA) * multiplier + prevEMA;
    result.push(parseFloat(curEMA.toFixed(2)));
    prevEMA = curEMA;
  }
  return result;
}

/**
 * Calculates RSI using Wilder's smoothed method
 */
export function calculateRSI(closes: number[], period: number = 14): (number | undefined)[] {
  const result: (number | undefined)[] = closes.map(() => undefined);
  if (closes.length <= period) return result;

  let gains = 0;
  let losses = 0;

  // First period changes
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = parseFloat((100 - (100 / (1 + rs))).toFixed(2));
  }

  // Wilder's smoothing for subsequent periods
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = parseFloat((100 - (100 / (1 + rs))).toFixed(2));
    }
  }

  return result;
}

/**
 * Calculates Bollinger Bands (Upper, Middle SMA, Lower)
 */
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: (number | undefined)[]; middle: (number | undefined)[]; lower: (number | undefined)[] } {
  const upper: (number | undefined)[] = [];
  const middle: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(undefined);
      middle.push(undefined);
      lower.push(undefined);
      continue;
    }

    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle.push(parseFloat(mean.toFixed(2)));
    upper.push(parseFloat((mean + stdDevMultiplier * stdDev).toFixed(2)));
    lower.push(parseFloat((mean - stdDevMultiplier * stdDev).toFixed(2)));
  }

  return { upper, middle, lower };
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: (number | undefined)[]; signal: (number | undefined)[]; hist: (number | undefined)[] } {
  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);

  const macdLine: (number | undefined)[] = [];
  for (let i = 0; i < closes.length; i++) {
    const f = emaFast[i];
    const s = emaSlow[i];
    if (f !== undefined && s !== undefined) {
      macdLine.push(parseFloat((f - s).toFixed(3)));
    } else {
      macdLine.push(undefined);
    }
  }

  // Calculate signal line as EMA of macdLine (filtering undefined for initial segment)
  const validMacdValues: number[] = [];
  const validIndices: number[] = [];
  macdLine.forEach((val, idx) => {
    if (val !== undefined) {
      validMacdValues.push(val);
      validIndices.push(idx);
    }
  });

  const signalLineValid = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | undefined)[] = closes.map(() => undefined);
  const hist: (number | undefined)[] = closes.map(() => undefined);

  signalLineValid.forEach((sigVal, idx) => {
    const originalIdx = validIndices[idx];
    if (sigVal !== undefined) {
      signalLine[originalIdx] = sigVal;
      const mVal = macdLine[originalIdx];
      if (mVal !== undefined) {
        hist[originalIdx] = parseFloat((mVal - sigVal).toFixed(3));
      }
    }
  });

  return { macd: macdLine, signal: signalLine, hist };
}

/**
 * Computes all requested indicators on candle series
 */
export function computeAllIndicators(
  candles: StockCandle[],
  settings: IndicatorSettings
): ComputedCandle[] {
  if (!candles || candles.length === 0) return [];

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);

  const smaFast = calculateSMA(closes, settings.smaFastPeriod);
  const smaSlow = calculateSMA(closes, settings.smaSlowPeriod);
  const emaFast = calculateEMA(closes, settings.emaFastPeriod);
  const emaSlow = calculateEMA(closes, settings.emaSlowPeriod);
  const rsi = calculateRSI(closes, settings.rsiPeriod);
  const bb = calculateBollingerBands(closes, settings.bollingerPeriod, settings.bollingerStdDev);
  const macd = calculateMACD(closes, settings.emaFastPeriod, settings.emaSlowPeriod, 9);
  const volumeSMA = calculateSMA(volumes, 20);

  return candles.map((c, i) => ({
    ...c,
    smaFast: smaFast[i],
    smaSlow: smaSlow[i],
    emaFast: emaFast[i],
    emaSlow: emaSlow[i],
    rsi: rsi[i],
    bollingerUpper: bb.upper[i],
    bollingerMiddle: bb.middle[i],
    bollingerLower: bb.lower[i],
    macd: macd.macd[i],
    macdSignal: macd.signal[i],
    macdHist: macd.hist[i],
    volumeSMA: volumeSMA[i]
  }));
}

/**
 * Calculates comprehensive performance statistics
 */
export interface PerformanceSummary {
  startPrice: number;
  endPrice: number;
  changeValue: number;
  changePercent: number;
  periodHigh: number;
  periodLow: number;
  avgVolume: number;
  totalVolume: number;
  volatility: number;
  maxDrawdown: number;
  currentRSI?: number;
  rsiCondition: 'Oversold' | 'Neutral' | 'Overbought';
  trendSignal: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  smaCrossSignal: 'Golden Cross' | 'Death Cross' | 'Bullish Alignment' | 'Bearish Alignment' | 'Neutral';
  supportLevels: number[];
  resistanceLevels: number[];
  daysCount: number;
}

export function calculatePerformanceSummary(candles: ComputedCandle[]): PerformanceSummary | null {
  if (!candles || candles.length < 2) return null;

  const first = candles[0];
  const last = candles[candles.length - 1];

  const startPrice = first.open;
  const endPrice = last.close;
  const changeValue = parseFloat((endPrice - startPrice).toFixed(2));
  const changePercent = parseFloat(((changeValue / startPrice) * 100).toFixed(2));

  let periodHigh = -Infinity;
  let periodLow = Infinity;
  let totalVolume = 0;

  // For drawdown and volatility
  let peak = -Infinity;
  let maxDrawdown = 0;
  const dailyReturns: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (c.high > periodHigh) periodHigh = c.high;
    if (c.low < periodLow) periodLow = c.low;
    totalVolume += c.volume;

    if (c.close > peak) peak = c.close;
    const dd = ((peak - c.close) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;

    if (i > 0) {
      const prevClose = candles[i - 1].close;
      if (prevClose > 0) {
        dailyReturns.push((c.close - prevClose) / prevClose);
      }
    }
  }

  // Annualized Volatility
  let volatility = 0;
  if (dailyReturns.length > 1) {
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance =
      dailyReturns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / (dailyReturns.length - 1);
    const dailyStdDev = Math.sqrt(variance);
    volatility = parseFloat((dailyStdDev * Math.sqrt(252) * 100).toFixed(2));
  }

  const avgVolume = Math.round(totalVolume / candles.length);

  // RSI Status
  const currentRSI = last.rsi;
  let rsiCondition: 'Oversold' | 'Neutral' | 'Overbought' = 'Neutral';
  if (currentRSI !== undefined) {
    if (currentRSI >= 70) rsiCondition = 'Overbought';
    else if (currentRSI <= 30) rsiCondition = 'Oversold';
  }

  // Moving Average Cross & Trend Signals
  let smaCrossSignal: PerformanceSummary['smaCrossSignal'] = 'Neutral';
  let trendSignal: PerformanceSummary['trendSignal'] = 'Neutral';

  const lastSmaFast = last.smaFast;
  const lastSmaSlow = last.smaSlow;

  if (lastSmaFast !== undefined && lastSmaSlow !== undefined) {
    // Check for recent crossover within last 5 candles
    let crossoverDetected = false;
    for (let j = Math.max(1, candles.length - 6); j < candles.length; j++) {
      const prev = candles[j - 1];
      const cur = candles[j];
      if (prev.smaFast !== undefined && prev.smaSlow !== undefined && cur.smaFast !== undefined && cur.smaSlow !== undefined) {
        if (prev.smaFast <= prev.smaSlow && cur.smaFast > cur.smaSlow) {
          smaCrossSignal = 'Golden Cross';
          crossoverDetected = true;
          break;
        } else if (prev.smaFast >= prev.smaSlow && cur.smaFast < cur.smaSlow) {
          smaCrossSignal = 'Death Cross';
          crossoverDetected = true;
          break;
        }
      }
    }

    if (!crossoverDetected) {
      if (lastSmaFast > lastSmaSlow) {
        smaCrossSignal = 'Bullish Alignment';
      } else {
        smaCrossSignal = 'Bearish Alignment';
      }
    }
  }

  // Determine Overall Trend
  const isAboveSmaFast = lastSmaFast !== undefined ? endPrice > lastSmaFast : endPrice > startPrice;
  const isAboveSmaSlow = lastSmaSlow !== undefined ? endPrice > lastSmaSlow : isAboveSmaFast;
  const isFastAboveSlow = lastSmaFast !== undefined && lastSmaSlow !== undefined ? lastSmaFast > lastSmaSlow : true;

  if (isAboveSmaFast && isAboveSmaSlow && isFastAboveSlow) {
    trendSignal = 'Strong Bullish';
  } else if (isAboveSmaFast) {
    trendSignal = 'Bullish';
  } else if (!isAboveSmaFast && !isAboveSmaSlow && !isFastAboveSlow) {
    trendSignal = 'Strong Bearish';
  } else {
    trendSignal = 'Bearish';
  }

  // Classic Standard Pivot Points
  // P = (High + Low + Close) / 3
  // R1 = (2 * P) - Low, S1 = (2 * P) - High
  // R2 = P + (High - Low), S2 = P - (High - Low)
  const pivot = (periodHigh + periodLow + endPrice) / 3;
  const r1 = 2 * pivot - periodLow;
  const s1 = 2 * pivot - periodHigh;
  const r2 = pivot + (periodHigh - periodLow);
  const s2 = pivot - (periodHigh - periodLow);

  return {
    startPrice: parseFloat(startPrice.toFixed(2)),
    endPrice: parseFloat(endPrice.toFixed(2)),
    changeValue,
    changePercent,
    periodHigh: parseFloat(periodHigh.toFixed(2)),
    periodLow: parseFloat(periodLow.toFixed(2)),
    avgVolume,
    totalVolume,
    volatility,
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    currentRSI,
    rsiCondition,
    trendSignal,
    smaCrossSignal,
    supportLevels: [parseFloat(s1.toFixed(2)), parseFloat(s2.toFixed(2))],
    resistanceLevels: [parseFloat(r1.toFixed(2)), parseFloat(r2.toFixed(2))],
    daysCount: candles.length
  };
}

/**
 * Formats CSV export data with all calculated indicators
 */
export function exportToCSV(candles: ComputedCandle[], ticker: string): void {
  if (!candles || candles.length === 0) return;

  const headers = [
    'Date',
    'Open',
    'High',
    'Low',
    'Close',
    'AdjClose',
    'Volume',
    'SMA_Fast',
    'SMA_Slow',
    'EMA_Fast',
    'EMA_Slow',
    'RSI_14',
    'BB_Upper',
    'BB_Middle',
    'BB_Lower',
    'MACD',
    'MACD_Signal'
  ];

  const rows = candles.map((c) => [
    c.date,
    c.open,
    c.high,
    c.low,
    c.close,
    c.adjClose,
    c.volume,
    c.smaFast ?? '',
    c.smaSlow ?? '',
    c.emaFast ?? '',
    c.emaSlow ?? '',
    c.rsi ?? '',
    c.bollingerUpper ?? '',
    c.bollingerMiddle ?? '',
    c.bollingerLower ?? '',
    c.macd ?? '',
    c.macdSignal ?? ''
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${ticker}_stock_analysis_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
