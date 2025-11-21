export default function (bot, db, saveDB) {
  const AUTO_DELETE = 300000; // 5 minutes

  bot.onText(/^\/welcome_setup$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!config.owner.includes(userId)) {
      const errMsg = await bot.sendMessage(chatId, "❌ Hanya owner yang bisa setup welcome.");
      setTimeout(() => bot.deleteMessage(chatId, errMsg.message_id).catch(() => {}), 5000);
      return;
    }

    try {
      const welcomeMsg = `👋 *SELAMAT DATANG DI GRUP KAMI!* 🎉

Halo dan terima kasih sudah bergabung dengan komunitas kami! 

📋 *RULES GRUP:*
✓ Jangan spam atau promote link
✓ Hormati sesama member
✓ Gunakan bot dengan bertanggung jawab
✓ Report abuse ke admin

🎯 *FITUR BOT:*
💎 Beli VIP - Akses unlimited semua fitur
📞 Bantuan - Lapor bug/error/request fitur
📊 Stats - Lihat statistik bot & member

_Silakan tekan tombol di bawah!_`;

      const sentMsg = await bot.sendMessage(chatId, welcomeMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💎 Beli VIP", callback_data: "vip_menu" },
              { text: "📞 Bantuan", callback_data: "bantuan_menu" }
            ],
            [
              { text: "📊 Stats", callback_data: "stats_menu" },
              { text: "📖 Help", callback_data: "help_menu" }
            ],
            [{ text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }]
          ]
        }
      });

      setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
    } catch (error) {
      console.error("Error in welcome setup:", error);
    }
  });

  // Auto welcome on new members
  bot.on("new_chat_members", async (msg) => {
    const chatId = msg.chat.id;
    const members = msg.new_chat_members;

    for (const member of members) {
      if (member.is_bot) continue;

      const welcomeMsg = `👋 *Selamat Datang* @${member.username || member.first_name}!

Anda bergabung dengan grup konversi file terbaik. Jangan lupa baca rules dan gunakan bot dengan baik! 😊`;

      const sentMsg = await bot.sendMessage(chatId, welcomeMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💎 Lihat VIP", callback_data: "vip_menu" },
              { text: "❓ Help", callback_data: "help_menu" }
            ],
            [
              { text: "📞 Bantuan", callback_data: "bantuan_menu" },
              { text: "📊 Stats", callback_data: "stats_menu" }
            ]
          ]
        }
      });

      setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
    }
  });

  // Delete message callback
  bot.on("callback_query", async (query) => {
    if (query.data.startsWith("delete_")) {
      const msgId = parseInt(query.data.split("_")[1]);
      try {
        await bot.deleteMessage(query.message.chat.id, msgId);
        await bot.answerCallbackQuery(query.id, "✅ Message deleted", true);
      } catch (error) {
        await bot.answerCallbackQuery(query.id, "❌ Error deleting message", false);
      }
    }
  });
}
