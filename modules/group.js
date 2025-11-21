import config from "../bot/config.js";
import { groupDB, vipDB, banDB } from "../bot/database.js";
import logger from "../bot/logger.js";

export default function groupModule(bot) {
  // Welcome message on new members
  bot.on("my_chat_member", async (ctx) => {
    try {
      const newMember = ctx.update.my_chat_member.new_chat_member;
      const oldMember = ctx.update.my_chat_member.old_chat_member;
      const chat = ctx.chat;

      // Bot added to group
      if (oldMember.status === "left" && newMember.status === "member") {
        logger.info(`✅ Bot added to group: ${chat.title} (${chat.id})`);

        const message = `🎌 *Halo Kak!*\n\n` +
          `Terima kasih sudah menambahkan bot ini ke grup! 🙏\n\n` +
          `🤖 Bot ini siap membantu dengan fitur:\n` +
          `✓ Konversi file (VCF, TXT, XLSX)\n` +
          `✓ Proteksi grup (anti-link, anti-spam)\n` +
          `✓ Manajemen member\n\n` +
          `📝 Gunakan /bantuan untuk info lebih lanjut.`;

        await ctx.reply(message, { parse_mode: "Markdown" });
      }

      // Bot removed from group
      if (oldMember.status === "member" && newMember.status === "left") {
        logger.info(`❌ Bot removed from group: ${chat.title} (${chat.id})`);
      }

    } catch (error) {
      logger.error("Error in my_chat_member handler:", error);
    }
  });

  // New members welcome
  bot.on("new_chat_members", async (ctx) => {
    try {
      const chat = ctx.chat;
      const settings = await groupDB.getGroupSettings(chat.id);

      if (!settings.welcome) return;

      const members = ctx.message.new_chat_members;
      for (const member of members) {
        if (member.is_bot) continue;

        const welcome = `👋 *Selamat Datang* @${member.username || member.first_name}!\n\n` +
          `Kami senang Anda bergabung dengan grup kami. 🎉\n\n` +
          `📋 *Mohon baca rules grup dan jangan spam!*\n` +
          `_Selamat menikmati!_ 😊`;

        await ctx.reply(welcome, { parse_mode: "Markdown" });
      }

    } catch (error) {
      logger.error("Error in new members handler:", error);
    }
  });

  // Message handler for anti-link, anti-spam, etc.
  bot.on("message", async (ctx) => {
    try {
      const chat = ctx.chat;
      const user = ctx.from;
      const text = ctx.message.text || ctx.message.caption || "";

      // Only in groups
      if (chat.type === "private") return;

      const settings = await groupDB.getGroupSettings(chat.id);
      const isVIP = await vipDB.isVIP(user.id);

      // Skip for VIP and admins
      if (isVIP || user.id === config.ownerId) return;

      // Anti-Link detection
      if (settings.antiLink && detectLink(text)) {
        logger.info(`🔗 Link detected from ${user.username} in ${chat.title}`);
        try {
          await ctx.deleteMessage();
          await ctx.reply(`⚠️ *Anti-Link Aktif*\n\n@${user.username}, link tidak diperbolehkan di grup ini.`, {
            parse_mode: "Markdown"
          });
        } catch (error) {
          logger.warn("Could not delete message:", error.message);
        }
        return;
      }

      // Anti-Virtex (suspicious unicode)
      if (settings.antiVirtex && detectVirtex(text)) {
        logger.info(`⚠️ Virtex detected from ${user.username} in ${chat.title}`);
        try {
          await ctx.deleteMessage();
          await ctx.reply(`⚠️ *Pesan Mencurigakan Dihapus*`, { parse_mode: "Markdown" });
        } catch (error) {
          logger.warn("Could not delete message:", error.message);
        }
        return;
      }

      // Auto-Delete long messages
      if (settings.autoDelete && text.length > config.autoDelete.messageLimit) {
        logger.info(`📏 Long message deleted from ${user.username}`);
        try {
          await ctx.deleteMessage();
        } catch (error) {
          logger.warn("Could not delete long message:", error.message);
        }
      }

    } catch (error) {
      logger.error("Error in message handler:", error);
    }
  });
}

function detectLink(text) {
  const linkPatterns = [
    /https?:\/\//i,
    /t\.me\//i,
    /telegram\.me\//i,
    /joinchat\//i
  ];
  return linkPatterns.some(pattern => pattern.test(text));
}

function detectVirtex(text) {
  // Detect suspicious unicode sequences (zalgo text, etc)
  const suspiciousChars = /[\u0300-\u036F\u0488-\u0489]{3,}/g;
  return suspiciousChars.test(text);
}
