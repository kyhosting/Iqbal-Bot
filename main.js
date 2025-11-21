import bot from "./bot/bot.js";
import logger from "./bot/logger.js";

async function main() {
  try {
    logger.info("🎌 Iqbal CV Bot v2.1 Starting...");
    logger.info("🔧 Framework: Telegraf v4");
    logger.info("💾 Database: lowdb (JSON)");
    
    await bot.start();
    
  } catch (error) {
    logger.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
