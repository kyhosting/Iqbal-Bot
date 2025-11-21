export default function (bot, db, saveDB) {
  // Auto-delete spam messages
  bot.on("message", async (msg) => {
    if (msg.chat.type === "private") return;

    const text = msg.text || msg.caption || "";
    const userId = msg.from.id;
    const user = db.users[userId] || {};
    const isVIP = user.role === "vip" && user.vip_expired > Date.now();
    const isOwner = config.owner.includes(userId);

    // Skip if VIP or Owner
    if (isVIP || isOwner) return;

    // Delete spam patterns
    const spamPatterns = [
      /([😂🤣😅😆]{5,})/,  // Emoji spam
      /(.)\1{20,}/,         // Character repeat spam
      /[A-Z]{20,}/,         // ALL CAPS spam
      /\d{15,}/             // Number spam
    ];

    if (spamPatterns.some(pattern => pattern.test(text))) {
      try {
        await bot.deleteMessage(msg.chat.id, msg.message_id);
        // Optional: warn user
      } catch (error) {
        console.log("Could not delete spam message");
      }
    }
  });

  // Clear chat command (admin only)
  bot.onText(/^\/clear_chat (\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const count = parseInt(match[1]);

    if (msg.chat.type === "private") {
      return bot.sendMessage(chatId, "❌ Command ini hanya di grup!");
    }

    try {
      const member = await bot.getChatMember(chatId, userId);
      if (!["administrator", "creator"].includes(member.status) && !config.owner.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Hanya admin");
      }
    } catch (error) {
      return bot.sendMessage(chatId, "❌ Error check admin");
    }

    const deleteMsg = `🗑️ *Menghapus ${count} pesan terakhir...*`;
    const sentMsg = await bot.sendMessage(chatId, deleteMsg, { parse_mode: "Markdown" });

    // Note: Telegram API tidak support delete bulk messages, 
    // jadi satu-satu dengan delay
    let deleted = 0;
    for (let i = msg.message_id - 1; i > msg.message_id - count - 1; i--) {
      try {
        await bot.deleteMessage(chatId, i);
        deleted++;
        if (deleted % 10 === 0) await delay(1000); // Delay setiap 10 delete
      } catch (error) {
        // Message mungkin sudah dihapus atau expired
      }
    }

    // Update status
    bot.editMessageText(
      `✅ *Clear Selesai*\n\n📊 Deleted: ${deleted} messages`,
      {
        chat_id: chatId,
        message_id: sentMsg.message_id,
        parse_mode: "Markdown"
      }
    ).catch(() => {});
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
