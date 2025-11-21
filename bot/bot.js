import { Telegraf } from "telegraf";
import config from "./config.js";
import logger from "./logger.js";
import { initializeDatabase } from "./database.js";

// Import modules
import vipModule from "../modules/vip.js";
import bantuanModule from "../modules/bantuan.js";
import groupModule from "../modules/group.js";
import adminModule from "../modules/admin.js";
import deepLinkModule from "../modules/deepLink.js";
import utilsModule from "../modules/utils.js";

class Bot {
  constructor() {
    this.bot = new Telegraf(config.token);
    this.setupMiddlewares();
  }

  setupMiddlewares() {
    // Logging middleware
    this.bot.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      logger.debug(`⚡ ${ctx.updateType} processed in ${ms}ms`);
    });

    // Error handler
    this.bot.catch((err, ctx) => {
      logger.error("❌ Bot error:", {
        error: err.message,
        from: ctx.from?.id,
        chat: ctx.chat?.id,
        updateType: ctx.updateType
      });
      
      // Notify owner of error
      if (config.ownerId) {
        this.bot.telegram.sendMessage(
          config.ownerId,
          `⚠️ *BOT ERROR*\n\n` +
          `Error: ${err.message}\n` +
          `Chat ID: ${ctx.chat?.id}\n` +
          `User: @${ctx.from?.username || ctx.from?.first_name}`,
          { parse_mode: "Markdown" }
        ).catch(e => logger.error("Failed to notify owner:", e));
      }
    });
  }

  loadModules() {
    logger.info("📦 Loading modules...");
    
    try {
      vipModule(this.bot);
      logger.info("✅ VIP module loaded");
      
      bantuanModule(this.bot);
      logger.info("✅ Bantuan module loaded");
      
      groupModule(this.bot);
      logger.info("✅ Group module loaded");
      
      adminModule(this.bot);
      logger.info("✅ Admin module loaded");
      
      deepLinkModule(this.bot);
      logger.info("✅ Deep-link module loaded");
      
      utilsModule(this.bot);
      logger.info("✅ Utils module loaded");
      
    } catch (error) {
      logger.error("❌ Error loading modules:", error);
      throw error;
    }
  }

  async start() {
    try {
      // Initialize database
      const dbInitialized = await initializeDatabase();
      if (!dbInitialized) {
        throw new Error("Database initialization failed");
      }

      // Load modules
      this.loadModules();

      // Start bot
      this.bot.launch();
      logger.info("🎌 Bot is running...");

      // Graceful shutdown
      process.once("SIGINT", () => {
        logger.info("📛 SIGINT received, shutting down...");
        this.bot.stop("SIGINT");
      });

      process.once("SIGTERM", () => {
        logger.info("📛 SIGTERM received, shutting down...");
        this.bot.stop("SIGTERM");
      });

    } catch (error) {
      logger.error("❌ Failed to start bot:", error);
      process.exit(1);
    }
  }
}

// Export bot instance
export default new Bot();
