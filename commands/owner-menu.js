export default function (bot, db, saveDB) {
  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (bot.getRole(userId) !== "owner") {
      return bot.answerCallbackQuery(query.id, { text: "Khusus owner!" });
    }

    if (data === "owner_all_users") {
      bot.answerCallbackQuery(query.id);
      const users = Object.values(db.users);
      const vipUsers = users.filter(u => u.role === "vip" && u.vip_expired > Date.now());
      const normalUsers = users.filter(u => u.role === "user" || (u.role === "vip" && u.vip_expired <= Date.now()));

      if (users.length === 0) {
        return bot.sendMessage(chatId, `❌ Belum ada user di database`, { parse_mode: "Markdown" });
      }

      let message = `📋 *Daftar Semua User*\n\n`;
      message += `📊 Total: ${users.length} user\n`;
      message += `💎 VIP Aktif: ${vipUsers.length}\n`;
      message += `👤 Normal: ${normalUsers.length}\n\n`;

      // VIP users
      if (vipUsers.length > 0) {
        message += `*VIP Users (${vipUsers.length}):*\n`;
        vipUsers.forEach((u, i) => {
          const exp = new Date(u.vip_expired).toLocaleDateString('id-ID');
          message += `${i + 1}. ${u.first_name || 'Unknown'} (@${u.username || 'no-username'})\n`;
          message += `   🆔 ${u.id} | ⏳ ${exp}\n`;
        });
        message += `\n`;
      }

      // Normal users
      if (normalUsers.length > 0) {
        message += `*Normal Users (${normalUsers.length}):*\n`;
        normalUsers.slice(0, 20).forEach((u, i) => {
          message += `${vipUsers.length + i + 1}. ${u.first_name || 'Unknown'} (@${u.username || 'no-username'})\n`;
          message += `   🆔 ${u.id}\n`;
        });
        if (normalUsers.length > 20) {
          message += `\n... dan ${normalUsers.length - 20} user lainnya`;
        }
      }

      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }
  });
}
