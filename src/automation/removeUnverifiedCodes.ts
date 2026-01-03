import cron from "node-cron";
import Verification from "../schema/verification.schema";

export const removeUnverifiedCodes = () => {
  cron.schedule("*/1440 * * * *", async () => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    await Verification.deleteMany({
      createdAt: { $lt: new Date(tenMinutesAgo) },
    });
  });
};
