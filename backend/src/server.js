import { ENV } from "./config/env.js";
const PORT = ENV.PORT;

import express from "express";
const app = express();
app.use(express.json());

import cors from "cors";
app.use(cors());

//render.com keep alive cronjob
import job from "./config/cron.js";
if (ENV.NODE_ENV === "production") job.start();

//test Routes
app.use("/api/test", (req, res) => {
  res.send("OK");
});

// Routes
import favoriteRoute from "./routes/favorite.route.js";
app.use("/api/favorites", favoriteRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
