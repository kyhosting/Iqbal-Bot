export default function (bot, db, saveDB) {
  bot.on("message", async (msg) => {
    if (!msg.text || msg.chat.type === "private") return;

    const userId = msg.from.id;
    const user = db.users[userId];

    // Check if VIP
    if (user && user.role === "vip" && user.vip_expired > Date.now()) {
      const vipTag = `\n\n💎 [VIP] @${msg.from.username || msg.from.first_name} | Status: PREMIUM`;
      
      // Optional: Reply dengan VIP badge (tidak mengganggu)
      // Uncomment jika mau tampilkan badge di setiap message VIP
      // bot.sendMessage(msg.chat.id, vipTag);
    }
  });

  // Command to show VIP status
  bot.onText(/^\/vip_status$/, async (msg) => {
    const userId = msg.from.id;
    const user = db.users[userId];

    if (!user || user.role !== "vip" || user.vip_expired < Date.now()) {
      return bot.sendMessage(msg.chat.id, 
        `❌ Anda tidak punya VIP aktif.\n\nKetik /vip untuk membeli! 💎`);
    }

    const expiresAt = new Date(user.vip_expired);
    const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));

    const statusMsg = `💎 *VIP STATUS*

📊 *Info VIP Anda:*
├─ Status: ✅ AKTIF
├─ Tipe: ${user.vip_package || "VIP"}
├─ Expires: ${expiresAt.toLocaleDateString("id-ID")}
├─ Sisa: ${daysLeft} hari
└─ Priority: ⭐ Support Priority

🎯 *Benefit VIP:*
✓ Unlimited file conversion
✓ Priority support
✓ Badge di grup
✓ All premium features

_Selamat menikmati privilege VIP! 🎉_`;

    bot.sendMessage(msg.chat.id, statusMsg, { parse_mode: "Markdown" });
  });
}
