import { Markup } from "telegraf";
import config from "../bot/config.js";
import logger from "../bot/logger.js";

export default function bantuanModule(bot) {
  // Bantuan Command
  bot.command("bantuan", async (ctx) => {
    const userId = ctx.from.id;

    try {
      const bugMessage = `Halo Owner, saya ingin melaporkan BUG.\n\n• User ID: ${userId}\n\nTulis bug nya disini:`;
      const errorMessage = `Owner, BOT nya ERROR.\n\n• User ID: ${userId}\n\nError yang terjadi:`;
      const featureMessage = `Halo Owner, saya ingin request fitur baru.\n\n• User ID: ${userId}\n\nFitur yang saya inginkan:`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.url("🐞 Lapor Bug", `https://t.me/${config.ownerUsername}?text=${encodeURIComponent(bugMessage)}`)],
        [Markup.button.url("⚠️ Bot Error", `https://t.me/${config.ownerUsername}?text=${encodeURIComponent(errorMessage)}`)],
        [Markup.button.url("🛠️ Request Fitur", `https://t.me/${config.ownerUsername}?text=${encodeURIComponent(featureMessage)}`)],
        [Markup.button.callback("💎 Beli VIP", "show_vip_list")],
        [Markup.button.url("💬 Chat Owner", `https://t.me/${config.ownerUsername}`)]
      ]);

      const message = `🆘 *MENU BANTUAN*\n\n` +
        `Ada yang bisa dibantu Kak?\n\n` +
        `📋 *Pilihan Tersedia:*\n` +
        `• 🐞 Lapor Bug - Laporkan bug yang Anda temukan\n` +
        `• ⚠️ Bot Error - Laporkan error yang Anda alami\n` +
        `• 🛠️ Request Fitur - Usulkan fitur baru\n` +
        `• 💎 Beli VIP - Lihat paket VIP tersedia\n` +
        `• 💬 Chat Owner - Hubungi owner langsung\n\n` +
        `_Owner akan merespons secepat mungkin ya Kak!_ 😊`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });

    } catch (error) {
      logger.error("Error in bantuan command:", error);
      await ctx.reply("❌ Terjadi error.");
    }
  });

  // Callback for showing VIP list
  bot.action("show_vip_list", async (ctx) => {
    const userId = ctx.from.id;

    try {
      const vipButtons = Object.entries(config.vipPackages).map(([key, pkg]) => {
        const deepLink = `https://t.me/${config.ownerUsername}?start=vip_${key}_${userId}`;
        return [Markup.button.url(`💎 VIP ${pkg.label} — Rp ${pkg.price.toLocaleString("id-ID")}`, deepLink)];
      });

      vipButtons.push([Markup.button.callback("🔙 Kembali", "back_to_bantuan")]);

      const keyboard = Markup.inlineKeyboard(vipButtons);

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

      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      await ctx.answerCbQuery();

    } catch (error) {
      logger.error("Error in show VIP list:", error);
      await ctx.answerCbQuery("❌ Terjadi error");
    }
  });

  // Callback for back to bantuan
  bot.action("back_to_bantuan", async (ctx) => {
    const userId = ctx.from.id;

    try {
      const bugMessage = `Halo Owner, saya ingin melaporkan BUG.\n\n• User ID: ${userId}\n\nTulis bug nya disini:`;
      const errorMessage = `Owner, BOT nya ERROR.\n\n• User ID: ${userId}\n\nError yang terjadi:`;
      const featureMessage = `Halo Owner, saya ingin request fitur baru.\n\n• User ID: ${userId}\n\nFitur yang saya inginkan:`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.url("🐞 Lapor Bug", `https://t.me/${config.ownerUsername}?text=${encodeURIComponent(bugMessage)}`)],
        [Markup.button.url("⚠️ Bot Error", `https://t.me/${config.ownerUsername}?text=${encodeURIComponent(errorMessage)}`)],
        [Markup.button.url("🛠️ Request Fitur", `https://t.me/${config.ownerUsername}?text=${encodeURIComponent(featureMessage)}`)],
        [Markup.button.callback("💎 Beli VIP", "show_vip_list")],
        [Markup.button.url("💬 Chat Owner", `https://t.me/${config.ownerUsername}`)]
      ]);

      const message = `🆘 *MENU BANTUAN*\n\n` +
        `Ada yang bisa dibantu Kak?\n\n` +
        `📋 *Pilihan Tersedia:*\n` +
        `• 🐞 Lapor Bug - Laporkan bug yang Anda temukan\n` +
        `• ⚠️ Bot Error - Laporkan error yang Anda alami\n` +
        `• 🛠️ Request Fitur - Usulkan fitur baru\n` +
        `• 💎 Beli VIP - Lihat paket VIP tersedia\n` +
        `• 💬 Chat Owner - Hubungi owner langsung\n\n` +
        `_Owner akan merespons secepat mungkin ya Kak!_ 😊`;

      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      await ctx.answerCbQuery();

    } catch (error) {
      logger.error("Error in back to bantuan:", error);
      await ctx.answerCbQuery("❌ Terjadi error");
    }
  });
}
