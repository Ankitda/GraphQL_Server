import cron from "node-cron";
import User from "../schema/user.schema";

export const processScheduledDeactivations = () => {
  // Run every 24 hours to check for accounts that need to be deactivated
  cron.schedule("*/1440 * * * *", async () => {
    try {
      const now = new Date();

      // Find all users with scheduled deactivation that has passed
      const usersToDeactivate = await User.find({
        isActive: true,
        scheduledDeactivationAt: { $lte: now },
      });

      if (usersToDeactivate.length > 0) {
        console.log(
          `Processing ${usersToDeactivate.length} scheduled account deactivations...`
        );

        // Deactivate each user
        for (const user of usersToDeactivate) {
          user.isActive = false;
          // Keep the deactivation timestamps for record-keeping
          await user.save({ validateBeforeSave: false });

          console.log(
            `Account deactivated for user: ${user.email} (ID: ${user._id})`
          );
        }

        console.log("Scheduled deactivations processed successfully.");
      }
    } catch (error) {
      console.error("Error processing scheduled deactivations:", error);
    }
  });
};
