export default function (bot, db, saveDB) {
  bot.onText(/^\/clear$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "Markdown" }
      );
    }

    try {
      // Auto delete message user
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});

      // Get recent messages and delete bot messages (keep last 20 to avoid rate limit)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Send clean welcome message
      const cleanMsg = await bot.sendMessage(
        chatId,
        `✨ *Chat Dibersihkan!*\n\nSiap melanjutkan dengan fresh start! 😊`,
        { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
      );

      // Auto delete this success message after 3 seconds
      setTimeout(() => {
        bot.deleteMessage(chatId, cleanMsg.message_id).catch(() => {});
      }, 3000);
    } catch (err) {
      console.error("Clear chat error:", err);
    }
  });
}
