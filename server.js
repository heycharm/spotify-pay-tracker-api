import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";   
import userRoutes from "./userRoutes.js";
import { renewMonth } from "./userController.js";   

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API IS RUNNING ✅");
});

app.use("/", userRoutes);

cron.schedule(
  "0 9 1 * *",
  () => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = String(now.getFullYear()).slice(2);
    const monthName = `${month} ${year}`;

    renewMonth(
      { body: { month_name: monthName } },
      {
        json: (msg) => console.log("➡ Renew completed:", msg),
        status: () => ({
          json: (err) => console.log("❌ Renew error:", err),
        }),
      }
    );
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata", 
  }
);

app.listen(5000, "0.0.0.0", () => {
  console.log("API IS RUNNING ");
});
