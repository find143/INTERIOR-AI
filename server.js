const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function callGeminiAPI(prompt, jsonSchema = null, systemInstruction = null) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }]
  };

  if (jsonSchema) {
    payload.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: jsonSchema
    };
  }

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Gemini Http Error: ${response.status}`);
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) throw new Error('Empty text in candidate response');
    return jsonSchema ? JSON.parse(rawText) : rawText;
  } catch (error) {
    console.warn('Gemini API call failed, using intelligent fallback:', error.message);
    return null;
  }
}

app.get('/api/contractors', (req, res) => {
  try {
    const contractors = db.getContractors();
    res.json({ success: true, contractors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Unable to load contractors' });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, message: 'Missing required contact fields' });
  }

  try {
    db.saveContactRequest({ name, email, phone, message });
    console.log('New contact request saved:', { name, email, phone });
    return res.json({ success: true, message: 'Contact request received' });
  } catch (error) {
    console.error('Failed to save contact request:', error);
    return res.status(500).json({ success: false, message: 'Unable to save contact request' });
  }
});

app.post('/api/budget/optimize', async (req, res) => {
  const { totalBudget, propertyType, qualityTier } = req.body;

  const schema = {
    type: 'OBJECT',
    properties: {
      totalNet: { type: 'NUMBER' },
      tradeAllocations: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            trade: { type: 'STRING' },
            amount: { type: 'NUMBER' },
            percentage: { type: 'NUMBER' }
          },
          required: ['trade', 'amount', 'percentage']
        }
      },
      insights: { type: 'STRING' }
    },
    required: ['totalNet', 'tradeAllocations', 'insights']
  };

  const prompt = `Act as an expert interior quantity surveyor. Calculate optimal trade budget allocations for a ${propertyType} with target budget ₹${totalBudget} at ${qualityTier} quality tier. Include allocations for Furniture, Kitchen, Tiles, False Ceiling, Electrical, Painting, Labour, and GST (18%).`;

  let result = await callGeminiAPI(prompt, schema);

  if (!result) {
    const bgt = parseFloat(totalBudget) || 1000000;
    result = {
      totalNet: bgt,
      tradeAllocations: [
        { trade: 'Furniture & Joinery', amount: bgt * 0.28, percentage: 28 },
        { trade: 'Modular Kitchen', amount: bgt * 0.22, percentage: 22 },
        { trade: 'Tiles & Flooring', amount: bgt * 0.14, percentage: 14 },
        { trade: 'False Ceiling', amount: bgt * 0.08, percentage: 8 },
        { trade: 'Electrical & Lighting', amount: bgt * 0.08, percentage: 8 },
        { trade: 'Painting & Finishes', amount: bgt * 0.06, percentage: 6 },
        { trade: 'Labour & Execution', amount: bgt * 0.1, percentage: 10 },
        { trade: 'GST & Taxes (18%)', amount: bgt * 0.04, percentage: 4 }
      ],
      insights: 'Fallback budget allocation uses a standard trade split for premium interior budgets and includes GST.'
    };
  }

  return res.json({ success: true, data: result });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
