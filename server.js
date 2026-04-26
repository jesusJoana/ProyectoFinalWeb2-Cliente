import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number.parseInt(process.env.CLIENT_PORT ?? '5173', 10);

const viewsDir = path.join(__dirname, 'views');
const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(viewsDir, 'index.html'));
});

app.get('/installations', (req, res) => {
  res.sendFile(path.join(viewsDir, 'installations.html'));
});

app.get('/sports', (req, res) => {
  res.sendFile(path.join(viewsDir, 'sports.html'));
});

app.get('/weather-records', (req, res) => {
  res.sendFile(path.join(viewsDir, 'weather-records.html'));
});

app.listen(port, () => {
  console.log(`Cliente disponible en http://localhost:${port}`);
});
