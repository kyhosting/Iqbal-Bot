export default function (bot, db, saveDB) {
  const AUTO_DELETE = 300000; // 5 minutes

  bot.checkFeatureAccess = (userId, feature = "default") => {
    const user = db.users[userId] || {};
    const isVIP = user.role === "vip" && user.vip_expired > Date.now();
    const isOwner = config.owner.includes(userId);

    if (isOwner) return { allowed: true, reason: "Owner" };
    if (isVIP) return { allowed: true, reason: "VIP" };

    const allowedFeatures = ["help", "stats", "leaderboard", "faq", "start", "bantuan", "vip", "me", "checkaccess"];
    
    if (allowedFeatures.includes(feature)) {
      return { allowed: true, reason: "Limited Access" };
    }

    return { allowed: false, reason: "VIP Required" };
  };

  bot.onText(/^\/checkaccess$|^🔐 CHECK ACCESS$/, (msg) => {
    const userId = msg.from.id;
    const user = db.users[userId] || {};
    const access = bot.checkFeatureAccess(userId);

    const accessMsg = `🔐 *YOUR ACCESS LEVEL*

Status: ${user.role === "vip" ? "💎 VIP" : config.owner.includes(userId) ? "👑 Owner" : "👤 User"}
Access: ${access.reason}

📋 *Accessible Features:*
✅ /help • /stats • /leaderboard
✅ /me • /bantuan • /vip • /faq

🔒 *Restricted (VIP Only):*
⛓️ File conversions
⛓️ Extract nomor
⛓️ Gabung/bagi file
⛓️ Admin panel
⛓️ Premium features

💎 _Beli VIP untuk unlock semua!_`;

    bot.sendMessage(msg.chat.id, accessMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💎 Beli VIP", callback_data: "vip_menu" },
            { text: "❓ Help", callback_data: "help_menu" }
          ],
          [
            { text: "📞 Bantuan", callback_data: "bantuan_menu" },
            { text: "🗑️ Delete", callback_data: `delete_${msg.message_id}` }
          ]
        ]
      }
    });
  });

  // Restricted feature warning
  bot.onText(/⛓️/, (msg) => {
    const userId = msg.from.id;
    const user = db.users[userId] || {};

    if (user.role !== "vip" || user.vip_expired < Date.now()) {
      if (!config.owner.includes(userId)) {
        const warnMsg = `⚠️ *Fitur VIP Terbatas*

Anda harus membeli VIP untuk mengakses fitur ini!

💎 *VIP Packages:*
• 7 Hari: Rp 15.000
• 30 Hari: Rp 40.000
• 1 Tahun: Rp 100.000`;

        bot.sendMessage(msg.chat.id, warnMsg, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "💎 Beli VIP", callback_data: "vip_menu" }],
              [{ text: "❓ Lihat Paket", callback_data: "vip_packages" }],
              [{ text: "🗑️ Delete", callback_data: `delete_${msg.message_id}` }]
            ]
          }
        });
      }
    }
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
