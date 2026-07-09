import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/connection.ts';
import { migrateSchema } from './db/migrate.ts';
import { healthRouter } from './routes/health.ts';
import { doctorsRouter } from './routes/doctors.ts';
import { slotsRouter } from './routes/slots.ts';

const app = express();
app.use(cors());
app.use(express.json());

// Datenbank initialisieren
initDatabase();
migrateSchema();

// Routen
app.use('/api', healthRouter);
app.use('/api', doctorsRouter);
app.use('/api', slotsRouter);

app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});