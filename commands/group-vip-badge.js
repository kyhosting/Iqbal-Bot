export default function (bot, db, saveDB) {
  const AUTO_DELETE = 300000; // 5 minutes

  bot.onText(/^\/vip_status$/, async (msg) => {
    const userId = msg.from.id;
    const user = db.users[userId];

    if (!user || user.role !== "vip" || user.vip_expired < Date.now()) {
      const errMsg = await bot.sendMessage(msg.chat.id, 
        `❌ *Anda tidak punya VIP aktif*\n\nKetik /vip untuk membeli! 💎`, {
          parse_mode: "Markdown"
        });
      setTimeout(() => bot.deleteMessage(msg.chat.id, errMsg.message_id).catch(() => {}), 10000);
      return;
    }

    const expiresAt = new Date(user.vip_expired);
    const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));

    const statusMsg = `💎 *VIP STATUS*

📊 *Info VIP Anda:*
├─ Status: ✅ AKTIF
├─ Tipe: ${user.vip_package || "VIP"}
├─ Expires: ${expiresAt.toLocaleDateString("id-ID")}
├─ Sisa: ${daysLeft} hari
└─ Priority: ⭐ Supported

🎯 *Benefit VIP:*
✓ Unlimited file conversion
✓ Priority support
✓ Badge di grup
✓ All premium features

_Selamat menikmati VIP! 🎉_`;

    const sentMsg = await bot.sendMessage(msg.chat.id, statusMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "❓ Help", callback_data: "help_menu" },
            { text: "📞 Bantuan", callback_data: "bantuan_menu" }
          ],
          [{ text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }]
        ]
      }
    });

    setTimeout(() => bot.deleteMessage(msg.chat.id, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
  });

  // Delete callback
  bot.on("callback_query", async (query) => {
    if (query.data.startsWith("delete_")) {
      const msgId = parseInt(query.data.split("_")[1]);
      try {
        await bot.deleteMessage(query.message.chat.id, msgId);
        await bot.answerCallbackQuery(query.id, "✅ Deleted", true);
      } catch (error) {
        await bot.answerCallbackQuery(query.id, "❌ Error", false);
      }
    }
  });
}
