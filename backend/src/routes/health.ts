import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  try {
    const db = getDb();

    const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
    const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get() as { count: number };
    const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
    const pageCount = db.pragma('page_count') as unknown as number;
    const pageSize = db.pragma('page_size') as unknown as number;
    const dbSize = pageCount * pageSize;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          path: './prisma/praxis.db',
          sizeBytes: dbSize,
          patients: patientCount.count,
          doctors: doctorCount.count,
          appointments: appointmentCount.count,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Datenbankfehler',
    });
  }
});
