export default function (bot, db, saveDB) {
  bot.onText(/^\/welcome_setup$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Only owner & admin
    if (!config.owner.includes(userId)) {
      return bot.sendMessage(chatId, "❌ Hanya owner yang bisa setup welcome.");
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
📊 /stats - Lihat statistik bot & member

_Silakan /help untuk lihat semua command!_`;

      bot.sendMessage(chatId, welcomeMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💎 Beli VIP", callback_data: "vip_menu" },
              { text: "📞 Bantuan", callback_data: "bantuan_menu" }
            ],
            [{ text: "📖 Help Menu", callback_data: "help_menu" }]
          ]
        }
      });

    } catch (error) {
      console.error("Error in welcome setup:", error);
      bot.sendMessage(chatId, "❌ Error setup welcome");
    }
  });

  // Auto welcome on new members
  bot.on("new_chat_members", async (msg) => {
    const chatId = msg.chat.id;
    const members = msg.new_chat_members;

    for (const member of members) {
      if (member.is_bot) continue;

      const welcomeMsg = `👋 *Selamat Datang* @${member.username || member.first_name}!

Anda bergabung dengan grup konversi file terbaik. Jangan lupa baca rules dan gunakan bot dengan baik! 😊

💎 Tertarik VIP? Klik tombol di bawah!`;

      bot.sendMessage(chatId, welcomeMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💎 Lihat VIP", callback_data: "vip_menu" },
              { text: "❓ Help", callback_data: "help_menu" }
            ]
          ]
        }
      });
    }
  });
}
