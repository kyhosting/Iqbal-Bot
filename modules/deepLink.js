import config from "../bot/config.js";
import { vipDB, userDB, logsDB } from "../bot/database.js";
import logger from "../bot/logger.js";

export default function deepLinkModule(bot) {
  // Start command with deep-link handling
  bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const payload = ctx.startPayload;

    try {
      // Save user info
      await userDB.setUser(userId, {
        username: ctx.from.username || null,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name || null,
        lastSeen: new Date().toISOString()
      });

      // Handle deep-link payloads
      if (payload) {
        logger.info(`🔗 Start payload received: ${payload}`);

        if (payload.startsWith("vip_")) {
          // VIP purchase payload: vip_7_12345 or vip_30_12345 or vip_365_12345
          const parts = payload.split("_");
          const packageKey = `vip_${parts[1]}`;
          const userIdFromLink = parts[2];

          if (userId === config.ownerId) {
            const pkg = config.vipPackages[packageKey];
            if (pkg) {
              const message = `💎 *PEMBELIAN VIP BARU*\n\n` +
                `• Paket: VIP ${pkg.label}\n` +
                `• Harga: Rp ${pkg.price.toLocaleString("id-ID")}\n` +
                `• User ID: ${userIdFromLink}\n` +
                `• User: @${ctx.from.username || ctx.from.first_name}`;

              await ctx.reply(message, { parse_mode: "Markdown" });

              await logsDB.addLog({
                type: "vip_purchase_request",
                userId: userIdFromLink,
                package: packageKey,
                price: pkg.price
              });
            }
          }
        } else if (payload.startsWith("bug_")) {
          // Bug report: bug_12345
          if (userId === config.ownerId) {
            await ctx.reply(
              `🐞 *BUG REPORT*\n\nUser ID: ${payload.split("_")[1]}`,
              { parse_mode: "Markdown" }
            );
          }
        } else if (payload.startsWith("error_")) {
          // Error report
          if (userId === config.ownerId) {
            await ctx.reply(
              `⚠️ *BOT ERROR REPORT*\n\nUser ID: ${payload.split("_")[1]}`,
              { parse_mode: "Markdown" }
            );
          }
        } else if (payload.startsWith("request_")) {
          // Feature request
          if (userId === config.ownerId) {
            await ctx.reply(
              `🛠️ *FEATURE REQUEST*\n\nUser ID: ${payload.split("_")[1]}`,
              { parse_mode: "Markdown" }
            );
          }
        }

        return;
      }

      // Default welcome message
      const message = `🎌 *Selamat Datang!*\n\n` +
        `Terima kasih sudah memulai bot Iqbal CV Bot! 🙏\n\n` +
        `📋 *Fitur Utama:*\n` +
        `✓ Konversi file (VCF, TXT, XLSX)\n` +
        `✓ Manajemen grup\n` +
        `✓ Sistem VIP premium\n\n` +
        `📝 *Perintah Penting:*\n` +
        `/bantuan - Bantuan & lapor bug\n` +
        `/vip - Beli membership VIP\n` +
        `/admin - Panel admin (grup)\n\n` +
        `_Ayo mulai! 😊_`;

      await ctx.reply(message, { parse_mode: "Markdown" });

    } catch (error) {
      logger.error("Error in start command:", error);
      await ctx.reply("❌ Terjadi error.");
    }
  });

  // Help command
  bot.help(async (ctx) => {
    const message = `ℹ️ *BANTUAN BOT*\n\n` +
      `📋 *Perintah Dasar:*\n` +
      `/start - Mulai bot\n` +
      `/bantuan - Menu bantuan & lapor bug\n` +
      `/vip - Beli VIP membership\n` +
      `/vipstatus - Cek status VIP Anda\n\n` +
      `🛠️ *Perintah Admin (Grup):*\n` +
      `/admin - Buka admin panel\n\n` +
      `📞 *Hubungi Kami:*\n` +
      `Gunakan /bantuan untuk lapor bug atau request fitur.`;

    await ctx.reply(message, { parse_mode: "Markdown" });
  });
}
