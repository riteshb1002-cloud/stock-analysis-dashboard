import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Stock search endpoint with popular securities and query matching
  const POPULAR_TICKERS = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ', sector: 'Communication Services' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Communication Services' },
    { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE Arca', sector: 'ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', sector: 'ETF' },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', sector: 'Communication Services' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'DIS', name: 'The Walt Disney Company', exchange: 'NYSE', sector: 'Communication Services' }
  ];

  app.get('/api/search', (req: Request, res: Response) => {
    const q = ((req.query.q as string) || '').trim().toUpperCase();
    if (!q) {
      return res.json(POPULAR_TICKERS.slice(0, 8));
    }
    const matched = POPULAR_TICKERS.filter(
      (item) => item.symbol.includes(q) || item.name.toUpperCase().includes(q)
    );
    if (matched.length === 0) {
      // Allow custom ticker
      return res.json([{ symbol: q, name: `${q} Stock`, exchange: 'US', sector: 'Equities' }]);
    }
    return res.json(matched);
  });

  // Stock historical data proxy with Yahoo Finance v8 chart API + fallback generator
  app.get('/api/stock/:ticker', async (req: Request, res: Response) => {
    const ticker = (req.params.ticker || 'AAPL').toUpperCase().trim();
    const range = (req.query.range as string) || '1y'; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    const interval = (req.query.interval as string) || '1d'; // 1d, 1wk, 1mo

    try {
      const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        ticker
      )}?range=${range}&interval=${interval}&includePrePost=false`;

      const headers: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*'
      };

      const response = await fetch(yfUrl, { headers });

      if (response.ok) {
        const data = await response.json();
        const result = data?.chart?.result?.[0];
        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const timestamps: number[] = result.timestamp;
          const quote = result.indicators.quote[0];
          const adjClose = result.indicators?.adjclose?.[0]?.adjclose || quote.close;
          const meta = result.meta || {};

          const history = [];
          for (let i = 0; i < timestamps.length; i++) {
            const open = quote.open?.[i];
            const high = quote.high?.[i];
            const low = quote.low?.[i];
            const close = quote.close?.[i];
            const volume = quote.volume?.[i];
            const ac = adjClose?.[i] ?? close;

            if (open != null && high != null && low != null && close != null) {
              const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
              history.push({
                timestamp: timestamps[i],
                date,
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                adjClose: parseFloat((ac ?? close).toFixed(2)),
                volume: Math.round(volume || 0)
              });
            }
          }

          if (history.length > 5) {
            return res.json({
              symbol: ticker,
              companyName: meta.shortName || meta.longName || ticker,
              currency: meta.currency || 'USD',
              exchange: meta.exchangeName || 'NASDAQ',
              regularMarketPrice: meta.regularMarketPrice || history[history.length - 1].close,
              previousClose: meta.chartPreviousClose || meta.previousClose || history[0].open,
              fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
              fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
              source: 'yfinance',
              history
            });
          }
        }
      }
    } catch (err) {
      console.warn(`Yahoo Finance fetch failed for ${ticker}, using synthetic historical model:`, err);
    }

    // High quality synthetic historical dataset tailored to ticker
    const fallbackData = generateSyntheticStockData(ticker, range);
    return res.json(fallbackData);
  });

  // Helper for generating realistic price series if Yahoo Finance is rate-limited
  function generateSyntheticStockData(ticker: string, range: string) {
    const basePrices: Record<string, { price: number; name: string; sector: string; volatility: number }> = {
      AAPL: { price: 232.5, name: 'Apple Inc.', sector: 'Technology', volatility: 0.016 },
      NVDA: { price: 138.2, name: 'NVIDIA Corporation', sector: 'Technology', volatility: 0.028 },
      MSFT: { price: 428.1, name: 'Microsoft Corporation', sector: 'Technology', volatility: 0.014 },
      GOOGL: { price: 182.4, name: 'Alphabet Inc.', sector: 'Communication', volatility: 0.017 },
      AMZN: { price: 198.6, name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', volatility: 0.019 },
      TSLA: { price: 254.3, name: 'Tesla Inc.', sector: 'Automotive / EV', volatility: 0.035 },
      META: { price: 585.2, name: 'Meta Platforms Inc.', sector: 'Communication', volatility: 0.022 },
      AMD: { price: 156.4, name: 'Advanced Micro Devices', sector: 'Technology', volatility: 0.025 },
      SPY: { price: 582.0, name: 'SPDR S&P 500 ETF', sector: 'ETF Index', volatility: 0.009 },
      QQQ: { price: 498.5, name: 'Invesco QQQ Trust', sector: 'Tech Index', volatility: 0.012 }
    };

    const targetInfo = basePrices[ticker] || {
      price: Math.max(25, (ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 350) + 40),
      name: `${ticker} Corporation`,
      sector: 'Public Equities',
      volatility: 0.018
    };

    let days = 252; // 1 year of trading days
    if (range === '1w' || range === '5d') days = 5;
    else if (range === '1mo') days = 22;
    else if (range === '3mo') days = 66;
    else if (range === '6mo') days = 126;
    else if (range === '1y') days = 252;
    else if (range === '2y') days = 504;
    else if (range === '5y') days = 1260;

    const history = [];
    const now = new Date();
    // Deterministic random seed based on ticker
    let seed = ticker.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 12345);
    function pseudoRand() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    // Generate path ending at current price
    let currentPrice = targetInfo.price;
    const priceSeries: number[] = [currentPrice];
    const trendDrift = 0.0003; // slight upward bias
    for (let i = 0; i < days; i++) {
      const u1 = Math.max(0.0001, pseudoRand());
      const u2 = pseudoRand();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const dailyReturn = trendDrift + z0 * targetInfo.volatility;
      currentPrice = currentPrice / (1 + dailyReturn);
      priceSeries.unshift(Math.max(2, currentPrice));
    }

    // Now build candles forwards
    let curDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000 * 1.45);
    let pClose = priceSeries[0];

    for (let i = 0; i < days; i++) {
      curDate = new Date(curDate.getTime() + 24 * 60 * 60 * 1000);
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      const targetClose = priceSeries[i + 1] || pClose * (1 + (pseudoRand() - 0.48) * 0.015);
      const open = parseFloat((pClose * (1 + (pseudoRand() - 0.5) * 0.006)).toFixed(2));
      const close = parseFloat(targetClose.toFixed(2));
      const spread = Math.abs(close - open) + (targetClose * targetInfo.volatility * (0.5 + pseudoRand() * 0.8));
      const high = parseFloat((Math.max(open, close) + spread * (0.2 + pseudoRand() * 0.6)).toFixed(2));
      const low = parseFloat((Math.min(open, close) - spread * (0.2 + pseudoRand() * 0.6)).toFixed(2));
      const baseVol = 35000000 / (targetClose / 100);
      const volume = Math.round(baseVol * (0.6 + pseudoRand() * 0.8));

      const dateStr = curDate.toISOString().split('T')[0];
      history.push({
        timestamp: Math.floor(curDate.getTime() / 1000),
        date: dateStr,
        open,
        high,
        low,
        close,
        adjClose: close,
        volume
      });
      pClose = close;
    }

    const lastCandle = history[history.length - 1] || { close: targetInfo.price };
    const allCloses = history.map((h) => h.close);
    const fiftyTwoWeekHigh = Math.max(...allCloses);
    const fiftyTwoWeekLow = Math.min(...allCloses);

    return {
      symbol: ticker,
      companyName: targetInfo.name,
      currency: 'USD',
      exchange: 'NASDAQ',
      regularMarketPrice: lastCandle.close,
      previousClose: history.length > 1 ? history[history.length - 2].close : lastCandle.close,
      fiftyTwoWeekHigh: parseFloat(fiftyTwoWeekHigh.toFixed(2)),
      fiftyTwoWeekLow: parseFloat(fiftyTwoWeekLow.toFixed(2)),
      source: 'simulated_yfinance',
      history
    };
  }

  // Vite integration in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Stock Analysis Dashboard Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
