# 🎌 IQBAL CV BOT - TERMUX SETUP GUIDE

**Untuk pengguna Android dengan Termux**

---

## ⚠️ JIKA ERROR: "Cannot find module... config.js"

**SOLUSI:** Bot sekarang auto-create `config.js` dari `config.example.js`!

Cukup ikuti langkah-langkah di bawah ini:

---

## 📋 LANGKAH-LANGKAH SETUP (Step by Step)

### STEP 1: Install Dependencies
```bash
pkg update && pkg upgrade -y
pkg install nodejs -y
pkg install git -y
```

### STEP 2: Clone Repository
```bash
cd ~/
git clone https://github.com/kyhosting/Iqbal-Bot.git
cd Iqbal-Bot
npm install
```

### STEP 3: Run Bot First Time (Auto-Create config.js)
```bash
npm start
```

**Output yang akan muncul:**
```
⚠️  config.js not found!
📋 Creating config.js from config.example.js...
✅ config.js created! Please edit it with your settings.
📝 Edit these values in config.js:
   - TELEGRAM_BOT_TOKEN
   - owner: [YOUR_TELEGRAM_ID]
   - ownerUsername
   - groups.main and groups.cv
```

**Tekan CTRL+C untuk stop bot.**

### STEP 4: Get Your Bot Token
1. Buka Telegram → Cari **@BotFather**
2. Type: `/newbot`
3. Ikuti instruksi
4. Copy bot token (format: `1234567890:ABCDEfghijklmnopqrstuvwxyz...`)

### STEP 5: Get Your Telegram ID
1. Buka Telegram → Cari **@userinfobot**
2. Bot akan reply ID Anda (misal: `123456789`)

### STEP 6: Edit config.js
```bash
nano config.js
```

**Ubah nilai-nilai ini:**

```javascript
export default {
  token: "YOUR_BOT_TOKEN_HERE",      // Ganti dengan bot token dari @BotFather
  owner: [123456789],                 // Ganti dengan ID dari @userinfobot
  ownerUsername: "your_username",     // Username Telegram Anda
  groups: {
    main: "group_username",           // Username grup tempat bot
    cv: "channel_username"            // Username channel
  },
  // ... sisa file tidak perlu diubah
};
```

**Contoh yang sudah diisi:**
```javascript
export default {
  token: "5987654321:ABCDefghijklmNOPQRSTUVWXYZ123456789",
  owner: [987654321],
  ownerUsername: "doni_developer",
  groups: {
    main: "developer_group",
    cv: "mychannel"
  },
  // ... sisa file
};
```

**Cara simpan file:**
- Tekan: `CTRL + X`
- Type: `Y` (yes)
- Tekan: `ENTER`

### STEP 7: Run Bot!
```bash
npm start
```

**Output yang benar:**
```
🎌 Iqbal CV Bot Initializing...
📦 Loading modules...
🔍 Verifying project integrity...
✅ Project Integrity: VERIFIED
✅ All credits: INTACT
✅ Bot siap dijalankan...
🚀 Bot Siap! Loading commands...
📁 Loading 25 commands...
✅ Bot Running! 🎌
🌐 Creator: KIFZL & PARTNER/SUPPORT IQBAL DEV
📱 Support: @Iqbaldev
```

**Bot sekarang online!** 🎉

---

## 🚀 KEEP BOT RUNNING (Opsional)

### Opsi 1: Gunakan PM2 (Recommended)
```bash
npm install -g pm2
pm2 start index.js --name "Iqbal-Bot"
pm2 save

# View logs
pm2 logs Iqbal-Bot

# Stop bot
pm2 stop Iqbal-Bot

# Restart bot
pm2 restart Iqbal-Bot
```

### Opsi 2: Gunakan Termux:Boot Plugin (Auto-start)
1. Buka **Play Store**
2. Cari **"Termux:Boot"**
3. Install
4. Buka Termux dan jalankan:
```bash
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/start-bot.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd ~/Iqbal-Bot
pm2 start index.js --name "Iqbal-Bot"
EOF

chmod +x ~/.termux/boot/start-bot.sh
```

5. Restart Termux → Bot akan auto-start!

### Opsi 3: Gunakan Script Helper
```bash
# Bot akan run dengan PM2, jika error maka fallback ke npm start
./start-termux.sh
```

---

## 🔧 TROUBLESHOOTING

### ERROR: "Cannot find module config.js"
**SOLUSI:**
- Run `npm start` - bot akan auto-create config.js
- Stop bot (CTRL+C)
- Edit config.js dengan token & ID Anda
- Run `npm start` lagi

### ERROR: "ETELEGRAM: 404 Not Found"
**SOLUSI:**
- Pastikan bot token di config.js benar (copy-paste dari @BotFather)
- Pastikan tidak ada space atau karakter salah
- Restart bot: `npm start`

### ERROR: "Init system not found" (saat pm2 startup)
**SOLUSI:**
- ❌ JANGAN gunakan: `pm2 startup`
- ✅ GUNAKAN: `pm2 save` (sudah di instruksi di atas)

### Bot Tidak Merespons
```bash
# Check logs
pm2 logs Iqbal-Bot

# Restart
pm2 restart Iqbal-Bot

# Atau jalankan langsung
npm start
```

### Storage Penuh
```bash
# Hapus backup lama
rm -f backup_*.json

# Hapus node_modules dan reinstall
rm -rf node_modules
npm install

# Clear npm cache
npm cache clean --force
```

---

## 📝 FILE PENTING

| File | Fungsi |
|------|--------|
| `config.js` | Konfigurasi bot (auto-created) |
| `config.example.js` | Template config.js |
| `index.js` | Entry point bot |
| `commands/` | Semua command modules |
| `database.json` | User database (auto-created) |
| `redeem.json` | Redeem codes (auto-created) |
| `start-termux.sh` | Helper script untuk Termux |

---

## 💡 TIPS TERMUX

### Buat Shortcut di Home Screen
```bash
# Buat script launcher
cat > ~/launcher.sh << 'EOF'
#!/bin/bash
cd ~/Iqbal-Bot
npm start
EOF

chmod +x ~/launcher.sh
```

### Keep Screen On
Di Termux settings:
- Settings → Display
- Set "Screen timeout" ke "Never"

### Monitor RAM/CPU
```bash
# Install htop
pkg install htop

# Run
htop
```

### Backup Database
```bash
# Backup database
cp database.json database.backup.json

# Restore dari backup
cp database.backup.json database.json
```

---

## 📞 SUPPORT

- **Telegram:** @Iqbaldev
- **GitHub:** https://github.com/kyhosting/Iqbal-Bot
- **Report Bug:** Type `/bantuan` di bot → Lapor Bug
- **Issues:** https://github.com/kyhosting/Iqbal-Bot/issues

---

## ✅ CHECKLIST SETUP

- [ ] Install dependencies (Node.js, git)
- [ ] Clone repository
- [ ] Run `npm start` (auto-create config.js)
- [ ] Get bot token dari @BotFather
- [ ] Get Telegram ID dari @userinfobot
- [ ] Edit config.js dengan token & ID
- [ ] Run `npm start` lagi
- [ ] Bot online! ✨
- [ ] (Optional) Setup PM2 atau Termux:Boot
- [ ] Done! 🎉

---

**Made with ❤️ by KIFZL & PARTNER/SUPPORT IQBAL DEV**

Good luck! If any issues, check the main README.md atau contact support. 🎌
