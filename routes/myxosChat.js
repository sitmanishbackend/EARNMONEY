// ============================================
// MYXOS AI CHAT - BACKEND ROUTE (Gemini)
// File: routes/myxosChat.js
// ============================================

const express = require('express');
const router = express.Router();
console.log('✅ Myxos Chat Route Loaded');

// 🔑 Apni Gemini API key yahan .env file me daalein:
// .env file me ye line add karein:
// GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxx
//
// Free Gemini API key yahan se milegi: https://aistudio.google.com/apikey
//
// Phir apne main app.js / server.js me top par ye line honi chahiye:
// require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Simple in-memory rate limiter (per IP) - spam/abuse rokne ke liye
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 messages per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }

  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

// System prompt - Myxos AI ka personality/context define karta hai
const SYSTEM_PROMPT = `Aap "Myxos AI" hain, EarnMoney.com website ke liye ek helpful Hindi AI assistant. 
Ye website online earning, freelancing, investment aur business ideas par Hindi blog hai.
Aap users ke sawalon ka jawab friendly, simple Hindi (Hinglish mix chalega) me dein.
Jawab short aur practical rakhein. Agar koi financial/investment advice maange to ये बताएं कि final decision unka khud ka hona chahiye aur ye sirf general guidance hai, professional advice nahi.`;

router.post('/api/myxos-chat', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (isRateLimited(ip)) {
      return res.status(429).json({
        error: 'Bahut zyada messages bhej diye. Thodi der baad try karein.'
      });
    }

    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message khali nahi ho sakta.' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message bahut lamba hai. Kripya chhota karein.' });
    }

    if (!genAI) {
      return res.status(500).json({
        error: 'AI service abhi configure nahi hai. Admin se contact karein.'
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    // Build conversation history (last 10 messages max, to control cost)
    // Gemini requires the history to START with a 'user' role, so we
    // trim any leading 'assistant'/'model' messages after slicing.
    let geminiHistory = [];
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      geminiHistory = recentHistory
        .filter(h => h.role === 'user' || h.role === 'assistant')
        .map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(h.content).slice(0, 1000) }]
        }));

      while (geminiHistory.length && geminiHistory[0].role !== 'user') {
        geminiHistory.shift();
      }
    }

    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7
      }
    });

    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text()?.trim();

    if (!reply) {
      return res.status(502).json({ error: 'Khali response mila AI se. Dobara try karein.' });
    }

    res.json({ reply });

  } catch (err) {
    console.error('Myxos chat error:', err);
    res.status(500).json({ error: 'Kuch gadbad ho gayi. Thodi der baad try karein.' });
  }
});

module.exports = router;

// ============================================
// SETUP STEPS
// ============================================
//
// 1. Package install karein:
//    npm install @google/generative-ai
//
// 2. .env file me apni free Gemini key daalein
//    (https://aistudio.google.com/apikey se milegi):
//    GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxx
//
// 3. Apne main app.js / server.js me:
//
//    require('dotenv').config();
//    const myxosChatRoute = require('./routes/myxosChat');
//    app.use(myxosChatRoute);
//
//    (Express ka body parser middleware already hona chahiye:)
//    app.use(express.json());