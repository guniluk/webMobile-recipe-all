import cron from "cron";
import https from "https";

const job = new cron.CronJob("*/14 * * * *", () => {
  https
    .get(process.env.API_URL, (res) => {
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
