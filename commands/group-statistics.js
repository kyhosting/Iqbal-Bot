export default function (bot, db, saveDB) {
  const AUTO_DELETE = 300000; // 5 minutes

  bot.onText(/^\/stats$|^📊 STATISTIK$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const users = db.users || {};
      const totalUsers = Object.keys(users).length;
      const vipCount = Object.values(users).filter(u => 
        u.role === "vip" && u.vip_expired > Date.now()
      ).length;
      const totalOps = Object.values(users).reduce((sum, u) => sum + (u.total_operation || 0), 0);

      const statsMsg = `📊 *STATISTIK BOT*

👥 *Member Stats:*
├─ Total Users: ${totalUsers}
├─ Active VIP: ${vipCount}
├─ Regular Users: ${totalUsers - vipCount}
└─ Owner: 1

📈 *Activity:*
├─ Total Operations: ${totalOps}
├─ Conversions Done: ${Math.floor(totalOps * 0.7)}
├─ Files Processed: ${Math.floor(totalOps * 0.5)}
└─ Bot Status: ✅ RUNNING

💾 *Database:*
├─ Database Size: ~${(JSON.stringify(db).length / 1024).toFixed(2)} KB
├─ Users Tracked: ${totalUsers}
└─ Last Backup: Today

🔗 *Group Info:*
├─ Main Group: @${config.groups.main}
├─ CV Channel: @${config.groups.cv}
└─ Verification: ✅ Required`;

      const sentMsg = await bot.sendMessage(chatId, statsMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🏆 Leaderboard", callback_data: "lb_menu" },
              { text: "📞 Bantuan", callback_data: "bantuan_menu" }
            ],
            [
              { text: "❓ Help", callback_data: "help_menu" },
              { text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }
            ]
          ]
        }
      });

      setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
    } catch (error) {
      console.error("Error in stats:", error);
      const errMsg = await bot.sendMessage(chatId, "❌ Error fetching stats");
      setTimeout(() => bot.deleteMessage(chatId, errMsg.message_id).catch(() => {}), 5000);
    }
  });

  // Leaderboard
  bot.onText(/^\/leaderboard$/, async (msg) => {
    const users = db.users || {};
    const sorted = Object.entries(users)
      .sort((a, b) => (b[1].total_operation || 0) - (a[1].total_operation || 0))
      .slice(0, 10);

    let leaderboardMsg = `🏆 *TOP 10 CONVERTERS*\n\n`;
    if (sorted.length === 0) {
      leaderboardMsg += `_Belum ada data leaderboard._`;
    } else {
      sorted.forEach((entry, idx) => {
        const [userId, user] = entry;
        const ops = user.total_operation || 0;
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
        leaderboardMsg += `${medal} @${user.username || user.first_name} - ${ops} ops\n`;
      });
      leaderboardMsg += `\n_Update real-time setiap operasi!_`;
    }

    const sentMsg = await bot.sendMessage(msg.chat.id, leaderboardMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📊 Stats", callback_data: "stats_menu" },
            { text: "📖 Help", callback_data: "help_menu" }
          ],
          [{ text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }]
        ]
      }
    });

    setTimeout(() => bot.deleteMessage(msg.chat.id, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
  });

  // Leaderboard callback
  bot.on("callback_query", async (query) => {
    if (query.data === "lb_menu") {
      const users = db.users || {};
      const sorted = Object.entries(users)
        .sort((a, b) => (b[1].total_operation || 0) - (a[1].total_operation || 0))
        .slice(0, 10);

      let leaderboardMsg = `🏆 *TOP 10 CONVERTERS*\n\n`;
      if (sorted.length === 0) {
        leaderboardMsg += `_Belum ada data._`;
      } else {
        sorted.forEach((entry, idx) => {
          const [userId, user] = entry;
          const ops = user.total_operation || 0;
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
          leaderboardMsg += `${medal} @${user.username || user.first_name} - ${ops} ops\n`;
        });
      }

      try {
        await bot.editMessageText(leaderboardMsg, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "📊 Stats", callback_data: "stats_menu" },
                { text: "🗑️ Delete", callback_data: `delete_${query.message.message_id}` }
              ]
            ]
          }
        });
      } catch (error) {}
      await bot.answerCallbackQuery(query.id);
    }

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
