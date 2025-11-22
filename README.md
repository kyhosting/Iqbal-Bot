# Iqbal CV Bot v2.1

Telegram bot dengan Telegraf v4 untuk konversi file dan manajemen grup dengan sistem VIP, admin panel, dan fitur keamanan.

## 🚀 Fitur Utama

- **VIP System**: Paket 7/30/365 hari dengan deep-link purchase ke owner DM
- **File Conversion**: VCF, TXT, XLSX converter
- **Grup Management**: Welcome message, anti-link, anti-virtex, auto-delete
- **Admin Panel**: Inline buttons untuk toggle features dan manage members
- **Ban & Warn System**: Sistem peringatan dan pemblokiran member
- **Deep-Link Support**: Lapor bug, error, request fitur langsung ke owner
- **Modular Architecture**: `/bot`, `/modules`, `/models`, `/scripts` structure
- **Database**: lowdb (JSON) dengan fallback mongoose untuk MongoDB

## 📋 Requirements

- Node.js >= 16
- npm atau yarn
- Telegram Bot Token (dari @BotFather)

## 🔧 Setup

### 1. Clone & Install Dependencies

```bash
git clone <repo>
cd iqbal-cv-bot
npm install
```

### 2. Environment Variables

Copy `.env.example` ke `.env` dan isi nilai-nilainya:

```bash
cp .env.example .env
```

Edit `.env`:
```env
BOT_TOKEN=your_bot_token_here
OWNER_ID=8317563450
OWNER_USERNAME=Iqbaldev
BOT_CREATOR=KIKI FZL DAN PARTNER/SUPPORT IQBAL DEV
GROUP_MAIN=agentviber12
GROUP_CV=channelviber
NODE_ENV=development
LOG_LEVEL=info
DB_TYPE=lowdb
```

### 3. Jalankan Bot

```bash
npm start
```

Atau dengan auto-reload (development):

```bash
npm run dev
```

## 📁 Struktur Folder

```
/bot
  ├── bot.js          # Entry point utama
  ├── config.js       # Konfigurasi bot
  ├── logger.js       # Winston logger
  └── database.js     # lowdb initialization & helpers

/modules
  ├── vip.js          # VIP system & purchase
  ├── bantuan.js      # Help menu & bug reports
  ├── group.js        # Group features (anti-link, welcome, etc)
  ├── admin.js        # Admin panel
  ├── deepLink.js     # Deep-link handler
  └── utils.js        # Utility commands

/models
  ├── User.js
  ├── VIP.js
  ├── GroupSetting.js
  ├── Warn.js
  └── Banned.js

/scripts
  └── migrations.js   # Database migrations

data/
  └── db.json         # Database file (auto-created)

logs/
  ├── error.log       # Error logs
  └── combined.log    # All logs
```

## 📚 Penggunaan

### User Commands

```
/start           - Welcome & info
/bantuan         - Menu bantuan (lapor bug, error, request fitur)
/vip             - Beli VIP membership
/vipstatus       - Check VIP status
/me              - Info akun Anda
/stats           - Statistik bot
/help            - Help menu
```

### Admin Commands (Grup)

```
/admin           - Buka admin panel dengan toggle features
```

Owner-only:
```
/ownerpanel      - Owner management panel
```

## 💎 VIP Packages

| Paket | Harga | Durasi |
|-------|-------|--------|
| VIP 7 Hari | Rp 15.000 | 7 hari |
| VIP 30 Hari ⭐ | Rp 40.000 | 30 hari |
| VIP 1 Tahun | Rp 100.000 | 365 hari |

User membeli melalui deep-link URL yang langsung buka DM owner dengan pesan pre-filled.

## 🔐 Grup Features

### Welcome Message
- Otomatis kirim welcome ke member baru
- Dapat di-toggle via admin panel

### Anti-Link
- Deteksi & hapus pesan dengan link (t.me, http, joinchat, dll)
- Skip untuk VIP users
- Dapat di-toggle

### Anti-Virtex
- Deteksi & hapus "zalgo text" dan unicode mencurigakan
- Dapat di-toggle

### Auto-Delete
- Hapus pesan yang melebihi character limit
- Configurable di `config.js`

### Admin Panel
Inline buttons untuk:
- Toggle welcome, anti-link, anti-virtex, auto-delete
- Ban/unban/warn management
- Clear chat (hapus N pesan terakhir)

## 📝 Database Schema (lowdb)

```json
{
  "users": {
    "user_id": {
      "username": "...",
      "firstName": "...",
      "role": "user|vip|admin",
      "lastSeen": "2025-11-21T20:00:00Z",
      "totalOperations": 0
    }
  },
  "vip": {
    "user_id": {
      "package": "vip_7|vip_30|vip_365",
      "expiresAt": "2025-12-21T20:00:00Z",
      "purchaseDate": "2025-11-21T20:00:00Z",
      "price": 40000,
      "status": "active|expired"
    }
  },
  "groupSettings": {
    "group_id": {
      "welcome": true,
      "antiLink": true,
      "antiVirtex": true,
      "autoDelete": true,
      "vipWhitelist": []
    }
  },
  "warns": {
    "group_id_user_id": {
      "count": 2,
      "warns": [{"reason": "...", "timestamp": "..."}]
    }
  },
  "banned": {
    "group_id": [
      {"userId": 123, "reason": "...", "bannedAt": "..."}
    ]
  }
}
```

## 🎯 Deep-Link System

Bot mendukung deep-link untuk:

1. **VIP Purchase**: `https://t.me/OWNER_USERNAME?start=vip_7_USER_ID`
2. **Bug Report**: `https://t.me/OWNER_USERNAME?text=...`
3. **Feature Request**: `https://t.me/OWNER_USERNAME?start=request_USER_ID`

Semua deep-link membuka DM owner dengan pesan pre-filled atau dengan callback handler.

## ⚙️ Configuration

Edit `bot/config.js` untuk mengatur:

```javascript
vipPackages: {
  vip_7: { days: 7, price: 15000, label: "7 Hari" },
  vip_30: { days: 30, price: 40000, label: "30 Hari" },
  vip_365: { days: 365, price: 100000, label: "1 Tahun" }
}
```

```javascript
autoDelete: {
  messageLimit: 1000,      // Max character count
  spamThreshold: 5,        // Spam detection
  deleteDelay: 1000        // Delay in ms
}
```

## 📊 Logging

Bot menggunakan Winston untuk logging:

- **logs/error.log**: Error-level logs
- **logs/combined.log**: Semua logs
- **Console**: Real-time console output

Log level dapat diatur via `LOG_LEVEL` di `.env`

## 🚨 Error Handling

- Semua errors di-catch dan di-log
- Owner notified via Telegram jika ada critical error
- Graceful shutdown on SIGINT/SIGTERM

## 🔒 Security

- User data encrypted (lowdb)
- Deep-link dengan timestamp validation (recommended)
- Rate limiting on heavy operations
- Input validation untuk anti-injection

## 📦 Deployment (Replit)

1. Fork repo di Replit
2. Set environment variables di "Secrets"
3. Jalankan `npm install`
4. Jalankan `npm start`

Bot akan auto-restart on code changes (dengan Replit's auto-run).

## 🛠️ Development

Untuk development dengan auto-reload:

```bash
npm run dev
```

Jalankan migrations:
```bash
npm run migrate
```

## 📞 Support

- Lapor bug: `/bantuan` → 🐞 Lapor Bug
- Error bot: `/bantuan` → ⚠️ Bot Error
- Request fitur: `/bantuan` → 🛠️ Request Fitur

## 📄 License

MIT - Dibuat oleh KIKI FZL DAN PARTNER/SUPPORT IQBAL DEV

## 🙏 Credits

- Built with [Telegraf](https://telegraf.js.org/) v4
- Database: [lowdb](https://github.com/typicode/lowdb)
- Logging: [Winston](https://github.com/winstonjs/winston)
- Rate Limiting: [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible)

---

Made with ❤️ by KIKI FZL DAN PARTNER/SUPPORT IQBAL DEV • こんにちは 🎌
