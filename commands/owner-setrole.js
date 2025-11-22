export default function (bot, db, saveDB) {
  bot.onText(/, (msg, match) => {
    const executorId = msg.from.id;
    const targetId = parseInt(match[1]);
    const role = match[2].toLowerCase();
    const duration = match[3].toLowerCase();

    // Validasi hanya owner
    if (bot.getRole(executorId) !== "owner") {
      return bot.sendMessage(msg.chat.id, "❌ Hanya owner yang bisa mengubah role.");
    }

    // Validasi role yang diizinkan
    if (!["admin", "vip", "user"].includes(role)) {
      return bot.sendMessage(msg.chat.id, "❌ Role tidak valid. Gunakan: admin, vip, user.");
    }

    // Cek apakah target ada di database
    if (!db.users[targetId]) {
      return bot.sendMessage(
        msg.chat.id,
        `❌ User dengan ID ${targetId} belum terdaftar di database.`
      );
    }

    // Hitung expire timestamp
    let expire = 0; // default permanen
    let expireText = "permanen";
    if (duration !== "0") {
      const num = parseInt(duration.slice(0, -1));
      const unit = duration.slice(-1);

      const now = Date.now();
      switch (unit) {
        case "j": // jam
          expire = now + num * 60 * 60 * 1000;
          expireText = `${num} jam`;
          break;
        case "h": // hari
          expire = now + num * 24 * 60 * 60 * 1000;
          expireText = `${num} hari`;
          break;
        case "m": // bulan (30 hari)
          expire = now + num * 30 * 24 * 60 * 60 * 1000;
          expireText = `${num} bulan`;
          break;
        case "y": // tahun (365 hari)
          expire = now + num * 365 * 24 * 60 * 60 * 1000;
          expireText = `${num} tahun`;
          break;
        default:
          return bot.sendMessage(msg.chat.id, "❌ Format durasi tidak valid.");
      }
    }

    // Update role dan expire
    db.users[targetId].role = role;
    db.users[targetId].role_expire = expire;
    saveDB();

    // Notifikasi ke chat tempat perintah dijalankan
    bot.sendMessage(
      msg.chat.id,
      `✅ Role user *${targetId}* diubah menjadi *${role}* (expire: ${expireText})`,
      { parse_mode: "Markdown" }
    );

    // Notifikasi langsung ke user target
    bot.sendMessage(
      targetId,
      `🎉 Hai ${db.users[targetId].first_name || ""}!\nKamu mendapatkan role *${role}* selama ${expireText}.`,
      { parse_mode: "Markdown" }
    ).catch(() => {
      // Jika bot tidak bisa mengirim pesan (misal user belum memulai chat), jangan crash
      console.log(`⚠️ Tidak bisa mengirim notifikasi ke user ID ${targetId}`);
    });

    // Log ke console
    const executor = msg.from;
    console.log(`⚙️ ${executor.first_name} (${executor.id}) mengubah role ${targetId} → ${role} (expire: ${expireText})`);
  });
}
