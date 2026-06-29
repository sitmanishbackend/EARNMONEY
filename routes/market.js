'use strict';
// ============================================================
// LIVE MARKET DATA — cached, rate-limit-safe
// ============================================================
// Real, free data sources used:
//   - NIFTY 50, SENSEX  → Yahoo Finance (yahoo-finance2, unofficial but free)
//   - Bitcoin (INR)      → CoinGecko public API (free, no key)
//   - USD/INR            → exchangerate.host (free, no key)
//
// NOTE on "Gold (10g)": there is no reliable free real-time gold-rate API.
// Every "free" gold API either requires a paid key, rate-limits hard, or is
// unofficial/unstable. Rather than show a fake/static gold price labeled as
// live data, it's left out here. If you want it, the cleanest free-ish path
// is metals-api.com (free tier, limited calls/month) — ask and I'll wire it
// in with its own slower refresh interval so it doesn't burn your quota.
//
// Caching strategy: ONE background fetch every 15s updates an in-memory
// cache. All visitor requests to /api/market read from that cache instantly
// — so traffic volume never multiplies your calls to Yahoo/CoinGecko.
// ============================================================

const express = require('express');
const router = express.Router();
const yahooFinance = require('yahoo-finance2').default;

const axios = require('axios');

// Silence yahoo-finance2's noisy survey/notice logs in the console
// yahooFinance.suppressNotices(['yahooSurvey']);
// const yahooFinance = require('yahoo-finance2').default;
let marketCache = [];
let lastFetchOk = false;
let lastFetchTime = null;

async function fetchFreshMarketData() {
  const results = [];

  // ── NIFTY 50 + SENSEX (Yahoo Finance) ──────────────────────
  try {
    const [nifty, sensex, gold, silver] = await Promise.all([
  yahooFinance.quote('^NSEI'),
  yahooFinance.quote('^BSESN'),
  yahooFinance.quote('GC=F'),
  yahooFinance.quote('SI=F')
]);

    if (nifty && typeof nifty.regularMarketPrice === 'number') {
      results.push({
        label: 'NIFTY',
        value: nifty.regularMarketPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
        change: (nifty.regularMarketChangePercent >= 0 ? '+' : '') + nifty.regularMarketChangePercent.toFixed(2) + '%',
        up: nifty.regularMarketChangePercent >= 0,
      });
    }
    if (sensex && typeof sensex.regularMarketPrice === 'number') {
      results.push({
        label: 'SENSEX',
        value: sensex.regularMarketPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
        change: (sensex.regularMarketChangePercent >= 0 ? '+' : '') + sensex.regularMarketChangePercent.toFixed(2) + '%',
        up: sensex.regularMarketChangePercent >= 0,
      });
    }

    if (gold && typeof gold.regularMarketPrice === 'number') {
  results.push({
    label: 'GOLD',
    value: '$' + gold.regularMarketPrice.toFixed(2),
    change:
      (gold.regularMarketChangePercent >= 0 ? '+' : '') +
      gold.regularMarketChangePercent.toFixed(2) + '%',
    up: gold.regularMarketChangePercent >= 0,
  });
}

if (silver && typeof silver.regularMarketPrice === 'number') {
  results.push({
    label: 'SILVER',
    value: '$' + silver.regularMarketPrice.toFixed(2),
    change:
      (silver.regularMarketChangePercent >= 0 ? '+' : '') +
      silver.regularMarketChangePercent.toFixed(2) + '%',
    up: silver.regularMarketChangePercent >= 0,
  });
}

console.log('NIFTY:', nifty?.regularMarketPrice);
console.log('SENSEX:', sensex?.regularMarketPrice);
console.log('GOLD:', gold?.regularMarketPrice);
console.log('SILVER:', silver?.regularMarketPrice);
  } catch (e) {
    console.error('[market] Yahoo Finance fetch failed:', e.message);
  }

  // ── Bitcoin in INR (CoinGecko, free, no key) ───────────────
  try {
    const cg = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr&include_24hr_change=true',
      { timeout: 8000 }
    );
    const btc = cg.data && cg.data.bitcoin;
    if (btc && typeof btc.inr === 'number') {
      const change = typeof btc.inr_24h_change === 'number' ? btc.inr_24h_change : 0;
      results.push({
        label: 'BITCOIN',
        value: '₹' + Math.round(btc.inr).toLocaleString('en-IN'),
        change: (change >= 0 ? '+' : '') + change.toFixed(2) + '%',
        up: change >= 0,
      });
    }
  } catch (e) {
    console.error('[market] CoinGecko fetch failed:', e.message);
  }

  // ── USD/INR (exchangerate.host, free, no key) ──────────────
  try {
    const fx = await axios.get('https://api.exchangerate.host/latest?base=USD&symbols=INR', { timeout: 8000 });
    const rate = fx.data && fx.data.rates && fx.data.rates.INR;
    if (typeof rate === 'number') {
      results.push({
        label: 'USD/INR',
        value: '₹' + rate.toFixed(2),
        change: '', // this free endpoint doesn't provide a day-change; omit rather than fake it
        up: true,
      });
    }
  } catch (e) {
    console.error('[market] exchangerate.host fetch failed:', e.message);
  }

  return results;
}

async function refreshCache() {
  try {
    const fresh = await fetchFreshMarketData();
    if (fresh.length) {
      marketCache = fresh;
      lastFetchOk = true;
      lastFetchTime = new Date();
    } else {
      lastFetchOk = false;
    }
  } catch (e) {
    console.error('[market] refreshCache error:', e.message);
    lastFetchOk = false;
  }
}

// Fetch immediately on server start (so the very first visitor doesn't
// see an empty ticker), then refresh every 15s in the background.
refreshCache();
setInterval(refreshCache, 15000);

router.get('/market', (req, res) => {
  res.json({
    data: marketCache,
    ok: lastFetchOk,
    updatedAt: lastFetchTime,
  });
});

module.exports = router;