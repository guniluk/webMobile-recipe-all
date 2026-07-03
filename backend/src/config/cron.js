import cron from "cron";
import https from "https";
import { ENV } from "./env.js";

const job = new cron.CronJob("*/14 * * * *", () => {
  if (!ENV.API_URL) {
    console.log("Keep-alive cron skipped: API_URL not configured");
    return;
  }
  https
    .get(ENV.API_URL, (res) => {
      if (res.statusCode === 200) {
        console.log("Success");
      } else {
        console.log("Fail");
      }
    })
    .on("error", (err) => {
      console.log("Error: " + err.message);
    });
});

export default job;
