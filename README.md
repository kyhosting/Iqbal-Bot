# 🎌 Iqbal CV Bot v2.1

**Telegram Bot File Converter & Contact Manager** - Konversi VCF, TXT, XLSX dengan sistem VIP, manajemen grup, dan 24/7 online support.

> Built dengan Node.js • Deployed ke Cyclic/Render/VPS • Production Ready ✅

---

## 🚀 Fitur Utama

✅ **File Conversion**
- VCF ↔ TXT, TXT → VCF, XLSX → VCF
- Gabung multiple files (VCF, TXT, XLSX)
- Potong/Split file dengan lanjutan
- Extract nomor dari kontak

✅ **VIP System**
- Paket 7/30/365 hari
- Deep-link purchase ke owner DM
- Redeem code system
- Role-based access (owner, admin, vip, trial, user)

✅ **Manajemen Kontak**
- Cek kontak (validasi format)
- Rename kontak (bulk)
- Rename file
- Hitung file

✅ **Grup Management**
- Anti-link, anti-virtex, welcome message
- Ban/warn system
- Auto-delete spam

✅ **🔐 Project Security**
- Integrity verification system
- Anti-piracy protection
- Credit tampering detection
- Bilingual documentation (English/Indonesian)

---

## 🔐 Security & Integrity Verification

Bot ini dilengkapi sistem keamanan canggih untuk mencegah pembajakan dan modifikasi tanpa izin.

### ⚠️ Integrity Verification System

Bot akan **otomatis memeriksa integritas proyek** pada saat startup untuk memastikan kredit dan watermark tidak diubah.

#### Fitur Keamanan:
- ✅ Deteksi tampering dengan kredit KIFZL & IQBAL DEV
- ✅ Verify watermark di config.js, index.js, package.json
- ✅ Auto-audit log untuk pelanggaran
- ✅ 2 mode operasi: STRICT (error) atau WARNING (log only)

#### Cara Kerja:

**Mode STRICT** (Recommended untuk Production):
```bash
export INTEGRITY_MODE=STRICT
npm start

# Jika ada yang hapus/ubah KIFZL:
❌ Bot ERROR & EXIT
🔒 Prevent unauthorized use
```

**Mode WARNING** (Untuk Development):
```bash
export INTEGRITY_MODE=WARNING
npm start

# Jika ada yang hapus/ubah KIFZL:
⚠️ Bot TETAP JALAN dengan warning
📝 Log pelanggaran ke .integrity-log
```

### Dokumen Keamanan Tersedia:
- 📄 **INTEGRITY_VERIFICATION_GUIDE.md** - Panduan lengkap sistem verifikasi
- 📄 **PROJECT_INTEGRITY_REPORT.txt** - Laporan status proteksi semua file
- 📄 **ALL_FILES_CREDITS.md** - Daftar lengkap 38 file terproteksi
- 📄 **FEATURES_LIST.md** - Semua 25+ fitur dengan kredit creator
- 📄 **LICENSE** - MIT License (Bilingual)
- 📄 **COPYRIGHT.txt** - Pemberitahuan hak cipta
- 📄 **CREDITS.md** - Atribusi lengkap
- 📄 **PROTECTION_NOTICE.txt** - Pemberitahuan anti-pembajakan

---

## 📋 Requirements

- **Node.js** >= 16.x
- **npm** atau yarn
- **Telegram Bot Token** (dari @BotFather)
- **Internet connection** (untuk Telegram API)

---

## 🔧 Setup & Installation

### Pilihan 1: **TERMUX** (Android)

#### Step 1: Install Dependencies
```bash
# Update package manager
pkg update && pkg upgrade -y

# Install Node.js
pkg install nodejs -y

# Install git
pkg install git -y
```

#### Step 2: Clone Repository
```bash
# Clone repo
git clone https://github.com/kyhosting/Iqbal-Bot.git
cd Iqbal-Bot

# Install dependencies
npm install
```

#### Step 3: Setup Bot Token (PENTING!)
**Termux akan auto-create config.js dari config.example.js saat first run.**

```bash
# First time run
npm start

# Bot akan create config.js otomatis dan tampil:
# ✅ config.js created! Please edit it with your settings.
# 📝 Edit these values in config.js:
#    - TELEGRAM_BOT_TOKEN
#    - owner: [YOUR_TELEGRAM_ID]
#    - ownerUsername
#    - groups.main and groups.cv
```

Setelah itu, edit `config.js`:
```bash
nano config.js
```

Ganti nilai-nilai ini:
```javascript
export default {
  token: "YOUR_BOT_TOKEN_HERE",      // Get from @BotFather
  owner: [YOUR_TELEGRAM_ID],          // Get from @userinfobot
  ownerUsername: "YourUsername",
  groups: {
    main: "your_group_name",
    cv: "your_channel_name"
  }
};
```

Tekan: `CTRL + X` → `Y` → `Enter`

**Alternatif: Gunakan Environment Variable (Recommended untuk Production)**
```bash
export TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
npm start
```

#### Step 4: Run Bot (Option A: Simple - Recommended untuk Termux)
```bash
# Jalankan bot langsung
npm start
```

**Bot akan online selama Termux dibuka.**

#### Step 4B: Run Bot (Option B: Dengan PM2 - Untuk Keep Running)
```bash
# Install PM2 globally
npm install -g pm2

# Start bot dengan PM2
pm2 start index.js --name "Iqbal-Bot"

# Save PM2 process list
pm2 save

# ⚠️ JANGAN gunakan pm2 startup di Termux! 
# (Termux tidak support init system - akan error)
```

**Untuk Keep-Alive di Termux:**
```bash
# Install Termux:Boot plugin untuk auto-start saat Termux launch
# Buka Play Store → Cari "Termux:Boot"
# Setelah install, buat file: ~/.termux/boot/start-bot.sh

# Copy script ini:
#!/data/data/com.termux/files/usr/bin/bash
cd ~/Iqbal-Bot
pm2 start index.js --name "Iqbal-Bot"
```

**Atau gunakan script Termux wrapper:**
```bash
# Buat file ~/Iqbal-Bot/start-termux.sh
cat > start-termux.sh << 'EOF'
#!/bin/bash
pm2 start index.js --name "Iqbal-Bot" || npm start
EOF

chmod +x start-termux.sh
./start-termux.sh
```

**⚠️ Catatan Penting untuk Termux:**
- ❌ **JANGAN** gunakan `pm2 startup` (error: Init system not found)
- ✅ **GUNAKAN** `npm start` untuk testing/development
- ✅ **GUNAKAN** `pm2 start` + `pm2 save` untuk persistent running
- ✅ **INSTALL** Termux:Boot plugin untuk auto-start saat device boot

**Untuk 24/7 Online Permanent:** Gunakan opsi hosting gratis lainnya (Cyclic, Render, Oracle Cloud)

---

### Pilihan 2: **VPS** (Linux/Ubuntu)

#### Step 1: SSH ke VPS
```bash
ssh user@your_vps_ip
```

#### Step 2: Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git -y
```

#### Step 3: Install Node.js
```bash
# Gunakan NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Verifikasi
node --version
npm --version
```

#### Step 4: Clone & Setup Bot
```bash
# Clone repository
git clone https://github.com/kyhosting/Iqbal-Bot.git
cd Iqbal-Bot

# Install dependencies
npm install
```

#### Step 5: Edit Configuration
```bash
nano config.js
```

Edit dengan bot token Anda.

#### Step 6: Install PM2 (Auto-Restart)
```bash
sudo npm install -g pm2

# Start bot dengan PM2
pm2 start index.js --name "iqbal-bot"

# Auto-start on reboot
pm2 startup
pm2 save
```

#### Step 7: View Logs
```bash
# Real-time logs
pm2 logs iqbal-bot

# Show status
pm2 show iqbal-bot
```

**Keuntungan VPS:**
- ✅ 24/7 online selamanya
- ✅ Full control
- ✅ Tidak ada downtime
- ✅ Bisa host multiple bots

---

### Pilihan 3: **Hosting Panel** (Pterodactyl, Pufferpanel, etc)

#### Step 1: Create Server
- Login ke control panel
- Buat server Node.js baru
- Set: `8GB RAM`, `5GB Storage`, `Java/Node.js`

#### Step 2: Upload Files
**Opsi A: Via Git**
```bash
git clone https://github.com/kyhosting/Iqbal-Bot.git
cd Iqbal-Bot
```

**Opsi B: Via Upload**
- Download: https://github.com/kyhosting/Iqbal-Bot/archive/refs/heads/main.zip
- Extract ke folder server di panel

#### Step 3: Install Dependencies
Di terminal panel:
```bash
cd /path/to/bot
npm install
```

#### Step 4: Edit Configuration
- Buka `config.js`
- Ganti token & group settings

#### Step 5: Set Startup Command
Di panel, set:
```
Startup Command: npm start
```

#### Step 6: Start Server
- Klik tombol "Start" di panel
- Bot akan online instantly

**Panel Recommendations:**
- 🟢 **Pterodactyl** - Gratis (self-hosted)
- 🟢 **Pufferpanel** - Gratis (self-hosted)
- 🔵 **Heroku** - $7/bulan (verified payment)
- 🔵 **Railway** - Gratis $5 credit

---

### Pilihan 4: **Cyclic** (Cloud Hosting - Recommended) ⭐

**Keuntungan:**
- ✅ Bot 24/7 online (NO SLEEP)
- ✅ Gratis selamanya
- ✅ Setup super cepat (5 menit)
- ✅ Auto-deploy dari GitHub

#### Step 1: Push Ke GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Buka Cyclic
- Klik: https://cyclic.sh
- Klik **"Deploy Now"**
- Login dengan GitHub

#### Step 3: Connect Repository
- Pilih repository: `kyhosting/Iqbal-Bot`
- Klik **"Connect"**

#### Step 4: Set Environment Variable
Di halaman deployment:
- Klik **"Environment"**
- Tambah 2 variable:
  ```
  TELEGRAM_BOT_TOKEN = YOUR_BOT_TOKEN
  INTEGRITY_MODE = STRICT
  ```
- Klik **"Save"**

#### Step 5: Deploy
- Klik **"Deploy"**
- Tunggu proses (2-3 menit)
- Status berubah menjadi **"Live"** ✅

**Done!** Bot sekarang online 24/7 gratis di Cyclic! 🎉

---

### Pilihan 5: **Render** (Cloud Hosting)

**Keuntungan:**
- ✅ Gratis 750 jam/bulan (cukup 24/7)
- ✅ Easy deployment
- ✅ Better monitoring

#### Step 1: Push Ke GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Buka Render
- Klik: https://render.com
- Klik **"New Web Service"**
- Login dengan GitHub

#### Step 3: Connect Repository
- Pilih: `kyhosting/Iqbal-Bot`
- Klik **"Connect"**

#### Step 4: Configure Service
```
Name: iqbal-bot
Environment: Node
Build Command: npm install
Start Command: npm start
```

#### Step 5: Set Environment Variable
- Scroll ke **"Environment Variables"**
- Tambah 2 variable:
  ```
  TELEGRAM_BOT_TOKEN = YOUR_BOT_TOKEN
  INTEGRITY_MODE = STRICT
  ```

#### Step 6: Deploy
- Klik **"Create Web Service"**
- Tunggu hingga status **"Live"**

#### Step 7: Keep-Alive (Penting!)
Render sleep setelah 15 menit. Gunakan **UptimeRobot** (gratis):

1. Buka: https://uptimerobot.com
2. Login
3. **Add Monitor**:
   - Type: HTTP(s)
   - URL: `https://your-service.onrender.com/ping`
   - Interval: 5 minutes
4. **Klik Create**

Bot akan tetap online dengan auto-ping! ✅

---

### Pilihan 6: **Oracle Cloud** (Cloud Hosting - Always Free)

**Keuntungan:**
- ✅ TRULY FREE FOREVER
- ✅ 1-4 ARM virtual machines
- ✅ 24/7 guaranteed uptime

#### Step 1: Create Account
- Buka: https://www.oracle.com/cloud/free/
- Sign up dengan email
- Verify dengan credit card (tidak dicharge)

#### Step 2: Create Instance
- Dashboard → **Compute** → **Instances**
- **Create Instance**:
  - Image: Ubuntu 22.04
  - Shape: Ampere A1 (4 cores, 24GB RAM)
  - Storage: 200GB free
- Klik **Create**

#### Step 3: Connect via SSH
```bash
# Download SSH key dari Oracle
ssh -i your_ssh_key ubuntu@your_instance_ip
```

#### Step 4: Install Node.js
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs git -y
```

#### Step 5: Deploy Bot
```bash
git clone https://github.com/kyhosting/Iqbal-Bot.git
cd Iqbal-Bot
npm install

# Set environment variable
export TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
export INTEGRITY_MODE="STRICT"

# Install PM2
sudo npm install -g pm2
pm2 start index.js --name "iqbal-bot"
pm2 startup
pm2 save
```

**Done!** Bot online 24/7 gratis selamanya! 🎉

---

## 📁 Project Structure

```
.
├── index.js                      # Bot main entry point
├── config.js                     # Configuration (token, owner, groups)
├── verify-integrity.js           # 🔐 Integrity verification system
├── commands/                     # Command handlers (25 files)
│   ├── vip-gabungfile.js        # Gabung file
│   ├── vip-txttovcf.js          # TXT to VCF
│   ├── vip-vcftotxt.js          # VCF to TXT
│   └── ... (22+ command files)
├── database.json                 # User database (auto-created)
├── redeem.json                   # Redeem code database
├── package.json                  # Dependencies
├── README.md                     # This file
│
├── 📄 Security & Protection
│   ├── LICENSE                   # MIT License (Bilingual)
│   ├── COPYRIGHT.txt             # Copyright notice (Bilingual)
│   ├── CREDITS.md                # Full credits (Bilingual)
│   ├── PROTECTION_NOTICE.txt     # Anti-piracy notice (Bilingual)
│   ├── INTEGRITY_VERIFICATION_GUIDE.md  # Integrity system documentation
│   ├── PROJECT_INTEGRITY_REPORT.txt     # Protection status report
│   ├── ALL_FILES_CREDITS.md      # Complete file listing with credits
│   └── FEATURES_LIST.md          # All 25+ features with credits
│
└── .gitignore                    # Git ignore rules
```

---

## 🎮 Bot Commands

### User Commands
```
/start              → Tampilkan menu & status user
/help               → Bantuan fitur bot
⛓️ TXT TO VCF       → Convert TXT ke VCF
⛓️ VCF TO TXT       → Convert VCF ke TXT
⛓️ XLS TO VCF       → Convert XLSX ke VCF
⛓️ MSG TO TXT       → Copy pesan ke TXT
⛓️ GABUNG FILE      → Gabung multiple file
⛓️ POTONG LANJUTAN  → Split file dengan lanjutan
⛓️ CEK KONTAK       → Validasi format kontak
🎁 REDEEM CODE      → Tukar code dengan akses
```

### Admin Commands
```
⛓️ BAGI LANJUTAN    → Share file ke users
⛓️ CREATE ADMIN     → Buat admin baru
⛓️ RENAME KONTAK    → Rename kontak (bulk)
⛓️ RENAME FILE      → Rename file
⛓️ HITUNG FILE      → Count file statistics
⛓️ MENU OWNER       → Owner panel (owner only)
```

---

## 🔐 Environment Configuration

### Setup dengan Environment Variable (Recommended untuk Production)

```bash
# Set environment variables
export TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
export INTEGRITY_MODE="STRICT"  # or WARNING

# Jalankan bot
npm start
```

### Setup dengan config.js (Development)

Edit `config.js`:

```javascript
// config.js
export default {
  token: process.env.TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN",
  owner: [8317563450],                    // Your Telegram ID
  ownerUsername: "Iqbaldev",              // Your username
  botCreator: "KIFZL & PARTNER/SUPPORT IQBAL DEV",  // Creator info
  groups: {
    main: "agentviber12",                 // Main group
    cv: "channelviber"                    // Channel/CV
  }
};
```

### Get Your Telegram ID
- Open: https://t.me/userinfobot
- Bot akan reply ID Anda

### Get Bot Token
- Open: https://t.me/BotFather
- Type: `/newbot`
- Follow instructions
- Copy token

---

## 📊 Database Schema

```json
{
  "users": {
    "user_id": {
      "username": "string",
      "firstName": "string",
      "role": "owner|admin|vip|trial|user",
      "totalOperations": 0,
      "joinedAt": "ISO timestamp"
    }
  },
  "vip": {
    "user_id": {
      "package": "7days|30days|365days",
      "expiresAt": "ISO timestamp",
      "purchaseDate": "ISO timestamp",
      "status": "active|expired"
    }
  },
  "redeemCodes": {
    "code_string": {
      "duration": 7,
      "used": false,
      "usedBy": "user_id or null",
      "createdAt": "ISO timestamp"
    }
  }
}
```

---

## 🐛 Troubleshooting

### Bot Tidak Merespons
```bash
# Check logs
pm2 logs iqbal-bot

# Restart bot
pm2 restart iqbal-bot
```

### Error: "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Bot Token Invalid
- Check di @BotFather
- Pastikan token benar (copy-paste, no spaces)
- Set di `config.js` atau environment variable

### File Conversion Error
- Pastikan format file valid (VCF, TXT, XLSX)
- Check file size (tidak terlalu besar)
- Check storage space di hosting

### Integrity Verification Error
Jika bot menunjukkan error integritas:

```bash
# Opsi 1: Restore file asli
git checkout config.js index.js package.json

# Opsi 2: Clone repository baru
git clone https://github.com/kyhosting/Iqbal-Bot.git
cd Iqbal-Bot
npm install
npm start

# Opsi 3: Pastikan tidak ada modifikasi di:
# - config.js (KIFZL & IQBAL DEV harus ada)
# - index.js (header harus intact)
# - package.json (author harus "KIFZL & PARTNER/SUPPORT IQBAL DEV")
```

---

## 📞 Support & Contact

- **Telegram Owner**: @Iqbaldev
- **Bug Report**: `/bantuan` → 🐞 Lapor Bug
- **Feature Request**: `/bantuan` → 🛠️ Request Fitur
- **GitHub Issues**: https://github.com/kyhosting/Iqbal-Bot/issues

---

## 📄 License

MIT License - Dibuat oleh **KIFZL & PARTNER/SUPPORT IQBAL DEV**

Kamu bebas menggunakan, memodifikasi, dan mendistribusikan bot ini dengan tetap mencantumkan credit original.

Lihat file `LICENSE` untuk detail lengkap.

---

## 🔒 Security & Anti-Piracy

Bot ini dilengkapi sistem anti-pembajakan yang komprehensif:

✅ **Copyright Protection**
- Semua 25+ command files dilindungi
- Header watermark di setiap file
- Legal documentation bilingual

✅ **Integrity Verification**
- Deteksi tampering otomatis pada startup
- Audit trail untuk pelanggaran
- STRICT dan WARNING modes tersedia

✅ **Legal Notices**
- LICENSE file (MIT bilingual)
- COPYRIGHT.txt (Bilingual)
- CREDITS.md (Full attribution)
- PROTECTION_NOTICE.txt (Anti-piracy terms)

Lihat dokumen keamanan untuk info lengkap:
- `INTEGRITY_VERIFICATION_GUIDE.md`
- `PROJECT_INTEGRITY_REPORT.txt`
- `ALL_FILES_CREDITS.md`
- `FEATURES_LIST.md`

---

## 🙏 Credits

Terima kasih kepada:
- **node-telegram-bot-api** - Telegram Bot API wrapper
- **vcard-parser** - VCF parser
- **XLSX** - Excel file handler
- **cheerio** - HTML parser
- **Cyclic & Render** - Cloud hosting infrastructure

---

## 🎌 Dibuat dengan ❤️

**By KIFZL & PARTNER/SUPPORT IQBAL DEV**

こんにちは 🎌 | Semangat coding! ✨

---

## Quick Deploy Links

🟢 **Deploy Sekarang:**
- [Deploy ke Cyclic](https://cyclic.sh) - **Recommended**
- [Deploy ke Render](https://render.com)
- [Deploy ke Railway](https://railway.app)
- [Deploy ke Oracle Cloud](https://www.oracle.com/cloud/free/)

🎯 **Get Help:**
- [Integrity Verification Guide](./INTEGRITY_VERIFICATION_GUIDE.md)
- [Protection Status](./PROJECT_INTEGRITY_REPORT.txt)
- [Features List](./FEATURES_LIST.md)
- [GitHub Issues](https://github.com/kyhosting/Iqbal-Bot/issues)

---

**Made with ❤️ • Open Source • Production Ready ✅ • Fully Protected 🔒**
