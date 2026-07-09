import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res) => {
  try {
    const staff = await prisma.employee.findMany({
      include: { availability: true }
    });
    res.json(staff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim Laden der Mitarbeiterdaten." });
  }
});

export default router;
