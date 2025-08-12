require('dotenv').config();
const express = require('express');
const cors = require('cors');
const excelRoutes = require('./routes/excelRoutes');

const app = express();
const port = 3000;

// 1️⃣ Log ALL incoming requests
app.use((req, res, next) => {
  console.log(`🌐 Incoming request: ${req.method} ${req.url}`);
  next();
});

// 2️⃣ Enable wide-open CORS for testing
app.use(cors({
  origin: '*',
}));

app.use(express.json());

// 3️⃣ Mount routes
app.use('/', excelRoutes);

// 4️⃣ Global error logger
app.use((err, req, res, next) => {
  console.error('💥 Global error handler caught an error:', err);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
