import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import profileRoutes from './routes/profileRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve directory paths since we are using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve static dashboard files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Register API Routes
app.use('/api', profileRoutes);

// Fallback to index.html for UI routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 GitHub Profile Analyzer API is running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
