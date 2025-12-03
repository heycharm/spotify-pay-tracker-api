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

// Root route
app.get("/", (req, res) => {
  res.send("API IS RUNNING ✅");
});

// Routes
app.use("/", userRoutes);


// Cron job for 1st of every month at 9 AM IST
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

// Render-friendly port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API is running on port ${PORT}`);
});
