import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/connection.ts';
import { migrateSchema } from './db/migrate.ts';
import { healthRouter } from './routes/health.ts';
import { doctorsRouter } from './routes/doctors.ts';
import { slotsRouter } from './routes/slots.ts';
import { patientsRouter } from './routes/patients.ts';
import { appointmentsRouter } from './routes/appointments.ts';
import { questionsRouter } from './routes/questions.ts';
import { vaccinationsRouter } from './routes/vaccinations.ts';
import { prescriptionsRouter } from './routes/prescriptions.ts';
import { mfaRouter } from './routes/mfa.ts';
import { remindersRouter } from './routes/reminders.ts';

const app = express();
app.use(cors());
app.use(express.json());

initDatabase();
migrateSchema();

app.use('/api', healthRouter);
app.use('/api', doctorsRouter);
app.use('/api', slotsRouter);
app.use('/api', patientsRouter);
app.use('/api', appointmentsRouter);
app.use('/api', questionsRouter);
app.use('/api', vaccinationsRouter);
app.use('/api', prescriptionsRouter);
app.use('/api', mfaRouter);
app.use('/api', remindersRouter);

app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});
