export default function (bot, db, saveDB) {
  bot.onText(/^\/start$/, (msg) => {
    const userId = msg.from.id;

    // Jika user belum ada, tambahkan ke database
    if (!db.users[userId]) {
      db.users[userId] = {
        id: userId,
        username: msg.from.username || "",
        first_name: msg.from.first_name || "",
        last_name: msg.from.last_name || "",
        role: "user"
      };
      saveDB();
    }

    // Ambil role user
    const role = bot.getRole(userId);

    // Kirim pesan ke user
    bot.sendMessage(
      msg.chat.id,
      `Halo ${msg.from.first_name}!\nKamu terdaftar sebagai *${role}*`,
      { parse_mode: "Markdown" }
    );

    // Log ke console
    console.log(`🔹 /start digunakan oleh: ${msg.from.first_name} (@${msg.from.username || "tidak ada username"}), ID: ${userId}`);
  });
}