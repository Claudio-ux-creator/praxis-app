import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/connection.ts';
import { migrateSchema } from './db/migrate.ts';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

process.on('uncaughtException', (err) => console.error('[UNCAUGHT]', err.message));
process.on('unhandledRejection', (reason) => console.error('[UNHANDLED]', reason));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '../../frontend');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

try { initDatabase(); migrateSchema(); console.log('DB OK'); }
catch (err) { console.error('[DB]', err); process.exit(1); }

// API-Routen
app.use('/api', (await import('./routes/health.ts')).healthRouter);
app.use('/api', (await import('./routes/doctors.ts')).doctorsRouter);
app.use('/api', (await import('./routes/slots.ts')).slotsRouter);
app.use('/api', (await import('./routes/patients.ts')).patientsRouter);
app.use('/api', (await import('./routes/appointments.ts')).appointmentsRouter);
app.use('/api', (await import('./routes/questions.ts')).questionsRouter);
app.use('/api', (await import('./routes/vaccinations.ts')).vaccinationsRouter);
app.use('/api', (await import('./routes/prescriptions.ts')).prescriptionsRouter);
app.use('/api', (await import('./routes/mfa.ts')).mfaRouter);
app.use('/api', (await import('./routes/reminders.ts')).remindersRouter);
app.use('/api', (await import('./routes/doctor.ts')).doctorRouter);
app.use('/api', (await import('./routes/availability.ts')).availabilityRouter);
app.use('/api', (await import('./routes/acuteSlots.ts')).acuteSlotsRouter);

// Statische Dateien + SPA-Fallback in einer Middleware
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  // Kein Cache für JS-Bundle (bei jedem Neustart frisch laden)
  if (req.path === "/build/app.js") {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  // Nur Pfade ohne API-Prefix behandeln
  const requestedPath = req.path === '/' ? '/index.html' : req.path;
  const filePath = path.join(FRONTEND, requestedPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    // Existierende Datei ausliefern
    return res.sendFile(filePath);
  }

  // SPA-Fallback: index.html senden
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ success: false, error: 'Serverfehler' }); });

const PORT = parseInt(process.env.PORT || '3000', 10);
function startServer(port) {
  const server = app.listen(port, () => console.log('Server: http://localhost:' + port));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') { if (port < 3010) startServer(port + 1); }
    else console.error('Fehler:', err.message);
  });
}
startServer(PORT);

