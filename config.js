/**
 * 🔐 IQBAL CV BOT - EXAMPLE CONFIGURATION 🔐
 * 
 * ⚠️  COPY THIS FILE TO config.js AND FILL IN YOUR VALUES
 * 
 * ENGLISH:
 * - Created by: KIFZL & IQBAL DEV
 * - GitHub: https://github.com/kyhosting/Iqbal-Bot
 * - License: MIT (Keep Credits)
 * - DO NOT COMMIT config.js WITH REAL BOT TOKEN!
 * 
 * INDONESIA / INDONESIAN:
 * - Dibuat oleh: KIFZL & IQBAL DEV
 * - GitHub: https://github.com/kyhosting/Iqbal-Bot
 * - Lisensi: MIT (Pertahankan Kredit)
 * - JANGAN COMMIT config.js DENGAN BOT TOKEN ASLI!
 */

// Load token from environment variable (safer for production)
const token = process.env.TELEGRAM_BOT_TOKEN || "8411014638:AAFfzvaOIwWK9_6JY784IuVRqCzgXGp1fwg";

export default {
  // Bot Token dari @BotFather / Bot Token from @BotFather
  // Get it from: https://t.me/BotFather
  token: token,
  
  // Owner ID - Telegram user ID (NO GROUP VERIFICATION NEEDED!)
  // Get it from: https://t.me/userinfobot
  // Owner automatically bypass all group checks
  owner: [8317563450], // Owner - NO group verification required
  
  // Owner Username (for /support command)
  ownerUsername: "Iqbaldev",
  
  // Bot Creator Info / Info Pembuat Bot
  botCreator: "KIFZL & PARTNER/SUPPORT IQBAL DEV",
  
  // Group Configuration / Konfigurasi Grup
  groups: {
    main: "your_group_username",    // Main group / Grup utama
    cv: "your_channel_username"     // Channel CV
  },
  
  // Version & Copyright / Versi & Hak Cipta
  version: "2.1.0",
  copyright: "© 2025 KIFZL & IQBAL DEV. All rights reserved. / Semua hak dilindungi.",
  
  // Watermark - IMPORTANT: DO NOT REMOVE / JANGAN HAPUS
  watermark: "🎌 IQBAL CV BOT - OFFICIAL VERSION 🎌\nPowered by KIFZL & IQBAL DEV"
};
