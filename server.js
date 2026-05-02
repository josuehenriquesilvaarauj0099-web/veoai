const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate', async (req, res) => {
  const apiKey = req.headers['x-fal-key'];
  if (!apiKey) return res.status(401).json({ error: 'API Key não fornecida.' });
  const { model, prompt, duration, aspect_ratio } = req.body;
  try {
    const falRes = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration, aspect_ratio })
    });
    const data = await falRes.json();
    res.status(falRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/status/:model(*)/requests/:requestId', async (req, res) => {
  const apiKey = req.headers['x-fal-key'];
  const { model, requestId } = req.params;
  try {
    const falRes = await fetch(`https://queue.fal.run/${model}/requests/${requestId}/status`, {
      headers: { 'Authorization': `Key ${apiKey}` }
    });
    res.status(falRes.status).json(await falRes.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/result/:model(*)/requests/:requestId', async (req, res) => {
  const apiKey = req.headers['x-fal-key'];
  const { model, requestId } = req.params;
  try {
    const falRes = await fetch(`https://queue.fal.run/${model}/requests/${requestId}`, {
      headers: { 'Authorization': `Key ${apiKey}` }
    });
    res.status(falRes.status).json(await falRes.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ VeoAI rodando na porta ${PORT}`));
