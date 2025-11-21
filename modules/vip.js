import { Markup } from "telegraf";
import config from "../bot/config.js";
import { userDB, vipDB, groupDB } from "../bot/database.js";
import logger from "../bot/logger.js";

export default function vipModule(bot) {
  // VIP Menu Handler
  bot.command("vip", async (ctx) => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;

    try {
      // Check group membership
      const hasAccess = await checkGroupAccess(bot, userId);
      if (!hasAccess) {
        return ctx.reply("⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.", {
          parse_mode: "Markdown"
        });
      }

      const keyboard = {
        inline_keyboard: config.vipPackages &&
          Object.entries(config.vipPackages).map(([key, pkg]) => {
            const deepLink = `https://t.me/${config.ownerUsername}?start=vip_${key}_${userId}`;
            return [{
              text: `💎 VIP ${pkg.label} — Rp ${pkg.price.toLocaleString("id-ID")}`,
              url: deepLink
            }];
          })
      };

      const message = `💎 *DAFTAR PAKET VIP*\n\n` +
        `${'═'.repeat(35)}\n\n` +
        `✨ *PAKET VIP TERSEDIA:*\n\n` +
        Object.entries(config.vipPackages).map(([key, pkg], idx) => {
          const popular = idx === 1 ? " ⭐ PALING POPULER" : "";
          return `📌 *PAKET ${pkg.label}*${popular}\n` +
            `├─ Harga: Rp ${pkg.price.toLocaleString("id-ID")}\n` +
            `└─ Akses: Semua fitur selama ${pkg.label}\n`;
        }).join("\n") +
        `\n${'═'.repeat(35)}\n\n` +
        `🎯 *FITUR VIP YANG DIDAPATKAN:*\n` +
        `✓ Konversi file tanpa batas\n` +
        `✓ Ekstrak nomor (unlimited)\n` +
        `✓ Gabung & split file\n` +
        `✓ Rapikan & clean data\n` +
        `✓ Rename & manage file\n` +
        `✓ Dan fitur premium lainnya!\n\n` +
        `_Klik tombol di bawah untuk membeli! 😊_`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });

    } catch (error) {
      logger.error("Error in VIP command:", error);
      await ctx.reply("❌ Terjadi error, silakan hubungi owner.");
    }
  });

  // Check VIP Status
  bot.command("vipstatus", async (ctx) => {
    const userId = ctx.from.id;

    try {
      const vip = await vipDB.getVIP(userId);

      if (!vip || new Date(vip.expiresAt) < new Date()) {
        return ctx.reply("❌ *Anda tidak memiliki VIP aktif*\n\nGunakan /vip untuk membeli VIP membership.", {
          parse_mode: "Markdown"
        });
      }

      const expiresAt = new Date(vip.expiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

      await ctx.reply(
        `✅ *VIP Status*\n\n` +
        `💎 Package: ${vip.package}\n` +
        `📅 Expires: ${expiresAt.toLocaleDateString("id-ID")}\n` +
        `⏳ Sisa: ${daysLeft} hari\n` +
        `✨ Status: AKTIF 🎉`,
        { parse_mode: "Markdown" }
      );

    } catch (error) {
      logger.error("Error in VIP status command:", error);
      await ctx.reply("❌ Terjadi error.");
    }
  });
}

// Helper function to check group access
async function checkGroupAccess(bot, userId) {
  try {
    const mainGroup = config.groups.main;
    const cvGroup = config.groups.cv;

    // Check main group
    try {
      const mainMember = await bot.telegram.getChatMember(`@${mainGroup}`, userId);
      if (!["member", "administrator", "creator"].includes(mainMember.status)) {
        return false;
      }
    } catch {
      return false;
    }

    // Check CV group
    try {
      const cvMember = await bot.telegram.getChatMember(`@${cvGroup}`, userId);
      if (!["member", "administrator", "creator"].includes(cvMember.status)) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error checking group access:", error);
    return false;
  }
}
