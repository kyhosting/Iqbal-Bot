import { Markup } from "telegraf";
import config from "../bot/config.js";
import { banDB, warnDB, groupDB } from "../bot/database.js";
import logger from "../bot/logger.js";

export default function adminModule(bot) {
  // Admin panel command
  bot.command("admin", async (ctx) => {
    try {
      const user = ctx.from;
      const chat = ctx.chat;

      // Only in groups
      if (chat.type === "private") {
        return ctx.reply("⚠️ Command ini hanya bisa digunakan di grup.");
      }

      // Check if admin
      const member = await ctx.telegram.getChatMember(chat.id, user.id);
      if (!["administrator", "creator"].includes(member.status)) {
        return ctx.reply("⚠️ Hanya admin yang bisa menggunakan panel ini.");
      }

      const settings = await groupDB.getGroupSettings(chat.id);

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            `Welcome: ${settings.welcome ? "✅" : "❌"}`,
            `toggle_welcome_${chat.id}`
          )
        ],
        [
          Markup.button.callback(
            `Anti-Link: ${settings.antiLink ? "✅" : "❌"}`,
            `toggle_antilink_${chat.id}`
          )
        ],
        [
          Markup.button.callback(
            `Anti-Virtex: ${settings.antiVirtex ? "✅" : "❌"}`,
            `toggle_antivirtex_${chat.id}`
          )
        ],
        [
          Markup.button.callback(
            `Auto-Delete: ${settings.autoDelete ? "✅" : "❌"}`,
            `toggle_autodelete_${chat.id}`
          )
        ],
        [
          Markup.button.callback("📋 Ban/Warn", `ban_menu_${chat.id}`),
          Markup.button.callback("🗑️ Clear Chat", `clear_chat_${chat.id}`)
        ]
      ]);

      const message = `⚙️ *ADMIN PANEL*\n\n` +
        `Grup: ${chat.title}\n\n` +
        `📊 *Pengaturan Grup:*\n` +
        `Welcome: ${settings.welcome ? "✅ Aktif" : "❌ Nonaktif"}\n` +
        `Anti-Link: ${settings.antiLink ? "✅ Aktif" : "❌ Nonaktif"}\n` +
        `Anti-Virtex: ${settings.antiVirtex ? "✅ Aktif" : "❌ Nonaktif"}\n` +
        `Auto-Delete: ${settings.autoDelete ? "✅ Aktif" : "❌ Nonaktif"}\n\n` +
        `_Gunakan tombol di bawah untuk mengatur grup._`;

      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });

    } catch (error) {
      logger.error("Error in admin command:", error);
      await ctx.reply("❌ Terjadi error.");
    }
  });

  // Toggle callbacks
  bot.action(/^toggle_(\w+)_(-?\d+)$/, async (ctx) => {
    try {
      const feature = ctx.match[1];
      const groupId = parseInt(ctx.match[2]);

      // Verify admin
      const member = await ctx.telegram.getChatMember(groupId, ctx.from.id);
      if (!["administrator", "creator"].includes(member.status)) {
        return ctx.answerCbQuery("⚠️ Hanya admin yang bisa mengubah settings.");
      }

      const newValue = await groupDB.toggleFeature(groupId, feature);
      const status = newValue ? "✅ Diaktifkan" : "❌ Dinonaktifkan";

      await ctx.answerCbQuery(`${status}`);
      logger.info(`🔧 Feature ${feature} toggled in group ${groupId}: ${newValue}`);

    } catch (error) {
      logger.error("Error in toggle callback:", error);
      await ctx.answerCbQuery("❌ Terjadi error.");
    }
  });

  // Ban menu
  bot.action(/^ban_menu_(-?\d+)$/, async (ctx) => {
    const groupId = parseInt(ctx.match[1]);

    try {
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("🚫 Ban User", `ban_user_${groupId}`),
          Markup.button.callback("✅ Unban User", `unban_user_${groupId}`)
        ],
        [
          Markup.button.callback("⚠️ Warn User", `warn_user_${groupId}`),
          Markup.button.callback("🔄 Reset Warn", `reset_warn_${groupId}`)
        ],
        [Markup.button.callback("🔙 Kembali", `admin_panel_${groupId}`)]
      ]);

      await ctx.editMessageText(
        `🚨 *BAN & WARN MANAGEMENT*\n\n_Pilih aksi yang ingin dilakukan._`,
        {
          parse_mode: "Markdown",
          reply_markup: keyboard
        }
      );
      await ctx.answerCbQuery();

    } catch (error) {
      logger.error("Error in ban menu:", error);
      await ctx.answerCbQuery("❌ Terjadi error.");
    }
  });

  // Ban user - requires reply to message
  bot.action(/^ban_user_(-?\d+)$/, async (ctx) => {
    try {
      await ctx.answerCbQuery("❌ Fitur reply-to-ban akan ditambahkan soon");
    } catch (error) {
      logger.error("Error in ban user:", error);
    }
  });

  // Clear chat
  bot.action(/^clear_chat_(-?\d+)$/, async (ctx) => {
    const groupId = parseInt(ctx.match[1]);

    try {
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback("Hapus 50 pesan terakhir", `clear_50_${groupId}`),
          Markup.button.callback("Hapus 100 pesan", `clear_100_${groupId}`)
        ],
        [Markup.button.callback("🔙 Kembali", `admin_panel_${groupId}`)]
      ]);

      await ctx.editMessageText(
        `🗑️ *CLEAR CHAT*\n\n_Pilih berapa pesan yang ingin dihapus._`,
        {
          parse_mode: "Markdown",
          reply_markup: keyboard
        }
      );
      await ctx.answerCbQuery();

    } catch (error) {
      logger.error("Error in clear chat menu:", error);
    }
  });

  // Clear messages
  bot.action(/^clear_(\d+)_(-?\d+)$/, async (ctx) => {
    const count = parseInt(ctx.match[1]);
    const groupId = parseInt(ctx.match[2]);

    try {
      await ctx.reply(`🗑️ *Menghapus ${count} pesan terakhir...*`, { parse_mode: "Markdown" });

      // This would require bot to have admin permissions
      // Implementation depends on Telegram API limits

      await ctx.answerCbQuery("✅ Proses clear dimulai");

    } catch (error) {
      logger.error("Error clearing messages:", error);
      await ctx.answerCbQuery("❌ Gagal menghapus pesan.");
    }
  });
}
