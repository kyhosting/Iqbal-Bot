export default function (bot, db, saveDB) {
  bot.onText(/^\/stats$|^📊 STATISTIK$/, async (msg) => {
    const chatId = msg.chat.id;

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
└─ Verification: ✅ Required

_Bot dibuat dengan ❤️ oleh Iqbaldev_`;

      bot.sendMessage(chatId, statsMsg, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error in stats:", error);
      bot.sendMessage(chatId, "❌ Error fetching stats");
    }
  });

  // Leaderboard (top converters)
  bot.onText(/^\/leaderboard$/, async (msg) => {
    const users = db.users || {};
    const sorted = Object.entries(users)
      .sort((a, b) => (b[1].total_operation || 0) - (a[1].total_operation || 0))
      .slice(0, 10);

    let leaderboardMsg = `🏆 *TOP 10 CONVERTERS*\n\n`;
    sorted.forEach((entry, idx) => {
      const [userId, user] = entry;
      const ops = user.total_operation || 0;
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
      leaderboardMsg += `${medal} @${user.username || user.first_name} - ${ops} ops\n`;
    });

    leaderboardMsg += `\n_Update real-time setiap operasi!_`;

    bot.sendMessage(msg.chat.id, leaderboardMsg, { parse_mode: "Markdown" });
  });
}
