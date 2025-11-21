// Permission system - User biasa restricted access
export default function (bot, db, saveDB) {
  // Middleware untuk check permission sebelum akses features
  bot.checkFeatureAccess = (userId, feature = "default") => {
    const user = db.users[userId] || {};
    const isVIP = user.role === "vip" && user.vip_expired > Date.now();
    const isOwner = config.owner.includes(userId);

    // Owner always has access
    if (isOwner) return { allowed: true, reason: "Owner" };

    // VIP has access to all features
    if (isVIP) return { allowed: true, reason: "VIP" };

    // User biasa only has limited access
    const allowedFeatures = ["help", "stats", "leaderboard", "faq", "start", "bantuan", "vip", "me"];
    
    if (allowedFeatures.includes(feature)) {
      return { allowed: true, reason: "Limited Access" };
    }

    return { allowed: false, reason: "VIP Required" };
  };

  // Intercept VIP-only commands
  const restrictedCommands = [
    "txt_to_vcf",
    "vcf_to_txt",
    "xls_to_vcf",
    "bagi_vcf",
    "extract_nomor",
    "gabung_file",
    "potong_vcf",
    "rapikan_txt",
    "hitung_file",
    "rename_file",
    "rename_kontak",
    "cek_kontak",
    "admin_panel",
    "welcome_setup",
    "lapor_admin"
  ];

  // Check permission on any command
  bot.onText(/(.+)/, (msg) => {
    const text = msg.text || "";
    const userId = msg.from.id;

    // Check if command is restricted
    const isRestricted = restrictedCommands.some(cmd => text.includes(cmd) || text.includes("⛓️") || text.includes("🎁"));

    if (isRestricted) {
      const access = bot.checkFeatureAccess(userId);

      if (!access.allowed) {
        // Don't block, but warn in certain cases
        // Command handlers akan check lagi
      }
    }
  });

  // Command for checking access
  bot.onText(/^\/checkaccess$/, (msg) => {
    const userId = msg.from.id;
    const user = db.users[userId] || {};
    const access = bot.checkFeatureAccess(userId);

    const accessMsg = `🔐 *YOUR ACCESS LEVEL*\n\n` +
      `Status: ${user.role === "vip" ? "💎 VIP" : config.owner.includes(userId) ? "👑 Owner" : "👤 User"}\n` +
      `Access: ${access.reason}\n\n` +
      `📋 *Accessible Features:*\n` +
      `✅ /help - Help menu\n` +
      `✅ /stats - Bot statistics\n` +
      `✅ /leaderboard - Top converters\n` +
      `✅ /me - Your info\n` +
      `✅ /bantuan - Support menu\n` +
      `✅ /vip - Buy VIP\n` +
      `✅ /faq - FAQ\n\n` +
      `🔒 *Restricted (VIP Only):*\n` +
      `⛓️ File conversion\n` +
      `⛓️ Extract nomor\n` +
      `⛓️ Gabung/bagi file\n` +
      `⛓️ Admin panel\n` +
      `⛓️ Semua premium features\n\n` +
      `💎 _Beli VIP untuk unlock semua fitur!_`;

    bot.sendMessage(msg.chat.id, accessMsg, { parse_mode: "Markdown" });
  });
}
