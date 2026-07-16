import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import staffRouter from "./routes/staff.js";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.use("/api/staff", staffRouter);

app.get("/", (req, res) => {
  res.send({ message: "Arzt/MFA Terminplaner API laeuft." });
});

app.listen(port, () => {
  console.log(`Server laeuft auf http://localhost:${port}`);
});

