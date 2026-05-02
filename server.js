const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getJWT(accessKey, secretKey) {
  const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload = Buffer.from(JSON.stringify({iss:accessKey,exp:Math.floor(Date.now()/1000)+1800,nbf:Math.floor(Date.now()/1000)-5})).toString('base64url');
  const sig = crypto.createHmac('sha256', secretKey).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

app.post('/api/generate', async (req, res) => {
  const {accessKey, secretKey, prompt, duration, aspect_ratio} = req.body;
  if (!accessKey || !secretKey) return res.status(401).json({error:'Chaves não fornecidas.'});
  try {
    const token = getJWT(accessKey, secretKey);
    const r = await fetch('https://api.klingai.com/v1/videos/text2video', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body: JSON.stringify({model:'kling-v1',prompt,duration:parseInt(duration)||5,aspect_ratio:aspect_ratio||'16:9'})
    });
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json(d);
    res.json(d);
  } catch(err) { res.status(500).json({error:err.message}); }
});

app.get('/api/status/:taskId', async (req, res) => {
  const {accessKey, secretKey} = req.query;
  const {taskId} = req.params;
  try {
    const token = getJWT(accessKey, secretKey);
    const r = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
      headers:{'Authorization':`Bearer ${token}`}
    });
    res.status(r.status).json(await r.json());
  } catch(err) { res.status(500).json({error:err.message}); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ VeoAI rodando na porta ${PORT}`));
