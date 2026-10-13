const express = require('express');
const cors = require('cors');

const app = express(); 
app.use(cors());       
app.use(express.json());
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use('/api/admin', require('./routes/admin'));

// Routes Mount
const providerRoutes = require('./routes/provider');
app.use('/api/provider', providerRoutes);
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: #0f172a;">🚀 SAINO Health Backend is Running!</h1>
      <p style="color: #64748b;">PostgreSQL Database is Connected.</p>
      <p>Test API: <a href="/api/provider/dashboard">/api/provider/dashboard</a></p>
    </div>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SAINO Health Backend is running!' });
});

// Server Listen
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});