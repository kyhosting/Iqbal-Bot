export default function (bot, db) {
  bot.onText(/^\/stats$/, async (msg) => {
    const chatId = msg.chat.id;

    // Ambil info bot dan waktu uptime
    const botInfo = await bot.getMe();
    const uptime = process.uptime(); // detik

    const formatTime = (seconds) => {
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor((seconds % (3600 * 24)) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      return `${d}d ${h}h ${m}m ${s}s`;
    };

    const totalUsers = Object.keys(db.users).length;
    const memoryUsage = process.memoryUsage().rss / 1024 / 1024; // MB
    const cpu = process.cpuUsage();

    const message = `
📊 *Bot Statistics*

🤖 *Bot Name:* ${botInfo.first_name}
🕒 *Uptime:* ${formatTime(uptime)}
👥 *Total User:* ${totalUsers}
💾 *RAM Usage:* ${memoryUsage.toFixed(2)} MB
⚙️ *CPU Usage:* User ${cpu.user} | System ${cpu.system}
🗓️ *Server Time:* ${new Date().toLocaleString()}

📌 Ketik /help untuk melihat semua perintah.
`;

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  });
}