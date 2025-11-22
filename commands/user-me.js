export default function (bot, db) {
  bot.onText(/^\/me$/, (msg) => {
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    let expireText = "permanen";

    const user = db.users[userId];
    if (user && user.role_expire && user.role_expire !== 0) {
      const expireDate = new Date(user.role_expire);
      expireText = expireDate.toLocaleString(); // Bisa disesuaikan formatnya
    }

    bot.sendMessage(
      msg.chat.id,
      `👤 *Profil Kamu*\n` +
      `Nama: ${msg.from.first_name}\n` +
      `ID: ${userId}\n` +
      `Role: *${role}*\n` +
      `Waktu expired role: ${expireText}`,
      { parse_mode: "Markdown" }
    );
  });
}