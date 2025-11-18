const express = require('express');
const fetch = require('node-fetch');

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

app.post('/v1/chat/completions', async (req, res) => {
  try {
    console.log('Request received');
    console.log('API Key exists:', !!GROQ_API_KEY);
    
    const { messages, model = 'llama-3.1-70b-versatile', temperature = 0.7, max_tokens = 1024, stream = false } = req.body;

    const groqPayload = {
      model,
      messages,
      temperature,
      max_tokens,
      stream
    };

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(groqPayload)
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      response.body.pipe(res);
    } else {
      const data = await response.json();
      console.log('Response status:', response.status);
      res.json(data);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/v1/models', (req, res) => {
  res.json({
    object: "list",
    data: [
      { id: "llama-3.1-70b-versatile", object: "model", created: 1686935002, owned_by: "groq" },
      { id: "llama-3.1-8b-instant", object: "model", created: 1686935002, owned_by: "groq" },
      { id: "mixtral-8x7b-32768", object: "model", created: 1686935002, owned_by: "groq" }
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: "healthy", service: "Groq Proxy" });
});

app.get('/', (req, res) => {
  res.json({ message: "Groq Proxy API is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
