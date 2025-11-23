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
const token = process.env.TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN_HERE";

export default {
  // Bot Token dari @BotFather / Bot Token from @BotFather
  // Get it from: https://t.me/BotFather
  token: token,
  
  // Owner ID - Telegram user ID
  // Get it from: https://t.me/userinfobot
  owner: [0], // Replace with your Telegram ID (e.g., [123456789])
  
  // Owner Username
  ownerUsername: "YOUR_USERNAME",
  
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
