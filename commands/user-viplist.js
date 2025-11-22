import config from "../config.js";

export default function (bot, db, saveDB) {
  bot.onText(/^\/viplist$|^VIPLIST$/i, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!config.owner.includes(userId)) {
      return bot.sendMessage(
        chatId,
        `◆◆ VIP LIST ◆◆\n\n╭─❖\n│ ❌ <b>Akses Ditolak</b>\n│ ➤ Command khusus owner\n╰───────────────❖`,
        { parse_mode: "HTML" }
      );
    }

    const vipUsers = Object.values(db.users).filter(
      (u) => u.role === "vip" && u.vip_expired > Date.now()
    );

    if (vipUsers.length === 0) {
      return bot.sendMessage(
        chatId,
        `◆◆ DAFTAR VIP USER ◆◆\n\n╭─❖\n│ ℹ️ <b>Status</b>\n│ ➤ Belum ada user VIP\n╰───────────────❖`,
        { parse_mode: "HTML" }
      );
    }

    let message = `◆◆ DAFTAR VIP USER (${vipUsers.length}) ◆◆\n\n`;
    vipUsers.forEach((user, i) => {
      const exp = new Date(user.vip_expired).toLocaleDateString("id-ID");
      message += `╭─❖ ${i + 1}\n`;
      message += `│ ➤ Nama: ${user.first_name}\n`;
      message += `│ ➤ ID: <code>${user.id}</code>\n`;
      message += `│ ➤ Username: @${user.username || "-"}\n`;
      message += `│ ➤ Expired: ${exp}\n`;
      message += `╰───────────────❖\n`;
    });

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  });
}
