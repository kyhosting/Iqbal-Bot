import config from "../bot/config.js";
import { userDB } from "../bot/database.js";
import logger from "../bot/logger.js";

export default function utilsModule(bot) {
  // Me command - show user info
  bot.command("me", async (ctx) => {
    try {
      const user = ctx.from;
      const userData = await userDB.getUser(user.id);

      const message = `👤 *INFO AKUN ANDA*\n\n` +
        `ID: \`${user.id}\`\n` +
        `Username: @${user.username || "Tidak ada"}\n` +
        `Nama: ${user.first_name} ${user.last_name || ""}\n` +
        `Status: ${user.is_bot ? "🤖 Bot" : "👤 User"}\n\n` +
        `Last Seen: ${userData?.lastSeen || "Tidak ada data"}`;

      await ctx.reply(message, { parse_mode: "Markdown" });

    } catch (error) {
      logger.error("Error in me command:", error);
      await ctx.reply("❌ Terjadi error.");
    }
  });

  // Settings command (for personal settings)
  bot.command("settings", async (ctx) => {
    try {
      const message = `⚙️ *PENGATURAN PRIBADI*\n\n` +
        `Fitur pengaturan personal akan ditambahkan soon.\n` +
        `Gunakan /bantuan untuk bantuan.`;

      await ctx.reply(message, { parse_mode: "Markdown" });

    } catch (error) {
      logger.error("Error in settings command:", error);
    }
  });

  // Stats command
  bot.command("stats", async (ctx) => {
    try {
      const allUsers = await userDB.getAllUsers();
      const userCount = Object.keys(allUsers).length;

      const message = `📊 *STATISTIK BOT*\n\n` +
        `Total Users: ${userCount}\n` +
        `Bot Status: ✅ Online\n\n` +
        `Powered by Telegraf v4 & Iqbaldev 💚`;

      await ctx.reply(message, { parse_mode: "Markdown" });

    } catch (error) {
      logger.error("Error in stats command:", error);
    }
  });

  // Owner only commands
  if (config.ownerId) {
    bot.command("ownerpanel", async (ctx) => {
      if (ctx.from.id !== config.ownerId) {
        return ctx.reply("⚠️ Akses ditolak.");
      }

      try {
        const allUsers = await userDB.getAllUsers();

        const message = `👑 *OWNER PANEL*\n\n` +
          `Total Users: ${Object.keys(allUsers).length}\n` +
          `Bot Status: ✅ Running\n\n` +
          `_Panel management akan ditambahkan soon._`;

        await ctx.reply(message, { parse_mode: "Markdown" });

      } catch (error) {
        logger.error("Error in owner panel:", error);
      }
    });
  }
}
