export default function (bot, db, saveDB) {
  bot.onText(/^\/rekomendasi$|^📋 REKOMENDASI$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const chatType = msg.chat.type; // private, group, supergroup, channel

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "Markdown" }
      );
    }

    let message = ``;

    if (chatType === 'private') {
      message = `📋 *REKOMENDASI FITUR UNTUK PRIVATE CHAT*\n\n`;
      message += `${'═'.repeat(35)}\n\n`;
      
      message += `🎯 *FITUR UTAMA YANG PERLU:*\n\n`;
      
      message += `1️⃣ *KONVERSI FILE*\n`;
      message += `   • TXT ↔ VCF - Ubah format kontak\n`;
      message += `   • XLS → VCF - Import dari Excel\n`;
      message += `   ✓ Gunakan saat punya file kontak\n\n`;

      message += `2️⃣ *EKSTRAK NOMOR*\n`;
      message += `   • Ambil semua nomor dari file\n`;
      message += `   • Support: VCF, TXT, XLSX, CSV\n`;
      message += `   ✓ Helpful untuk data mining nomor\n\n`;

      message += `3️⃣ *GABUNG FILE*\n`;
      message += `   • Gabung multiple file jadi satu\n`;
      message += `   ✓ Rapi data dari berbagai sumber\n\n`;

      message += `4️⃣ *RAPIKAN DATA*\n`;
      message += `   • Hapus duplikat otomatis\n`;
      message += `   • Sort & clean data\n`;
      message += `   ✓ Data lebih rapi & terorganisir\n\n`;

      message += `5️⃣ *UTILITIES*\n`;
      message += `   • Hitung file - Lihat total kontak\n`;
      message += `   • Rename - Ganti nama file/kontak\n`;
      message += `   • Cek kontak - Detail kontak\n\n`;

      message += `${'═'.repeat(35)}\n\n`;
      message += `💡 *TIPS PENGGUNAAN:*\n`;
      message += `✓ Gunakan /clear untuk rapihkan chat\n`;
      message += `✓ Gunakan /me untuk lihat status\n`;
      message += `✓ Gunakan /viplist untuk cek harga\n\n`;

      message += `🔑 *SEMUA FITUR BUTUH VIP!*\n`;
      message += `Beli VIP untuk akses unlimited 😊`;

    } else if (chatType === 'group' || chatType === 'supergroup') {
      message = `📋 *REKOMENDASI FITUR UNTUK GROUP*\n\n`;
      message += `${'═'.repeat(35)}\n\n`;
      
      message += `🎯 *FITUR YANG DIREKOMENDASIKAN:*\n\n`;
      
      message += `1️⃣ *GABUNG FILE*\n`;
      message += `   • Kumpulkan kontribusi dari member\n`;
      message += `   • Gabung jadi satu file besar\n`;
      message += `   ✓ Perfect untuk kolaborasi tim\n\n`;

      message += `2️⃣ *RAPIKAN DATA*\n`;
      message += `   • Hapus duplikat dari file gabung\n`;
      message += `   • Sort nomor otomatis\n`;
      message += `   ✓ Hasil lebih profesional\n\n`;

      message += `3️⃣ *EKSTRAK NOMOR*\n`;
      message += `   • Ekstrak dari file grup\n`;
      message += `   • Siap untuk campaign/marketing\n`;
      message += `   ✓ Gunakan untuk broadcast\n\n`;

      message += `4️⃣ *HITUNG FILE*\n`;
      message += `   • Lihat total kontak hasil gabung\n`;
      message += `   • Reporting akurat untuk member\n`;
      message += `   ✓ Transparansi data\n\n`;

      message += `5️⃣ *KONVERSI FORMAT*\n`;
      message += `   • Sesuaikan format untuk kebutuhan\n`;
      message += `   • Mix format dari berbagai member\n`;
      message += `   ✓ Fleksibel & mudah\n\n`;

      message += `${'═'.repeat(35)}\n\n`;
      message += `🎯 *USE CASE GRUP:*\n`;
      message += `📱 Marketing team - Manage database nomor\n`;
      message += `🏢 Company - Internal contact management\n`;
      message += `👥 Community - Collect & organize data\n\n`;

      message += `🔑 *SEMUA FITUR BUTUH VIP!*\n`;
      message += `Ajak member beli VIP untuk unlimited! 😊`;

    } else if (chatType === 'channel') {
      message = `📋 *REKOMENDASI UNTUK CHANNEL*\n\n`;
      message += `${'═'.repeat(35)}\n\n`;
      message += `📢 Channel bisa digunakan untuk:\n`;
      message += `• Distribusi template file\n`;
      message += `• Sharing hasil konversi\n`;
      message += `• Announcements fitur baru\n\n`;
      message += `🔑 Untuk menggunakan semua fitur bot,\n`;
      message += `member harus beli VIP di private chat!`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  });
}
