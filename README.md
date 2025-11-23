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

#### Step 3: Setup Bot Token
```bash
# Edit config.js
nano config.js
```

Ganti nilai `token` dengan bot token dari @BotFather:
```javascript
export default {
  token: "YOUR_BOT_TOKEN_HERE",
  owner: [YOUR_TELEGRAM_ID],
  ownerUsername: "YourUsername",
  groups: {
    main: "your_group_name",
    cv: "your_channel_name"
  }
};
```

Tekan: `CTRL + X` → `Y` → `Enter`

#### Step 4: Run Bot
```bash
# Jalankan bot
npm start

# Atau dengan pm2 (auto-restart)
npm install -g pm2
pm2 start index.js --name "Iqbal-Bot"
pm2 save
pm2 startup
```

**Note:** Bot akan tetap online selama Termux dibuka. Untuk 24/7, gunakan PM2 atau opsi hosting lainnya.

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
- Tambah variable:
  ```
  Key: TELEGRAM_BOT_TOKEN
  Value: YOUR_BOT_TOKEN
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
- Tambah:
  ```
  TELEGRAM_BOT_TOKEN = YOUR_BOT_TOKEN
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
├── index.js                    # Bot main entry point
├── config.js                   # Configuration (token, owner, groups)
├── commands/                   # Command handlers
│   ├── vip-gabungfile.js      # Gabung file
│   ├── vip-txttovcf.js        # TXT to VCF
│   ├── vip-vcftotxt.js        # VCF to TXT
│   └── ... (23+ command files)
├── database.json              # User database (auto-created)
├── redeem.json                # Redeem code database
├── package.json               # Dependencies
├── DEPLOYMENT_CYCLIC.md       # Cyclic deployment guide
├── DEPLOYMENT_RENDER.md       # Render deployment guide
└── README.md                  # This file
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

Edit `config.js` atau set environment variable:

```javascript
// config.js
export default {
  token: process.env.TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN",
  owner: [8317563450],                    // Your Telegram ID
  ownerUsername: "Iqbaldev",              // Your username
  botCreator: "Your Name",                // Creator info
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

---

## 📞 Support & Contact

- **Telegram Owner**: @Iqbaldev
- **Bug Report**: `/bantuan` → 🐞 Lapor Bug
- **Feature Request**: `/bantuan` → 🛠️ Request Fitur
- **GitHub Issues**: https://github.com/kyhosting/Iqbal-Bot/issues

---

## 📄 License

MIT License - Dibuat oleh **KIKI FZL & IQBAL DEV**

Kamu bebas menggunakan, memodifikasi, dan mendistribusikan bot ini dengan tetap mencantumkan credit original.

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

**By KIKI FZL & PARTNER/SUPPORT IQBAL DEV**

こんにちは 🎌 | Semangat coding! ✨

---

## Quick Deploy Links

🟢 **Deploy Sekarang:**
- [Deploy ke Cyclic](https://cyclic.sh) - **Recommended**
- [Deploy ke Render](https://render.com)
- [Deploy ke Railway](https://railway.app)
- [Deploy ke Oracle Cloud](https://www.oracle.com/cloud/free/)

🎯 **Get Help:**
- [Bot Commands Guide](./DEPLOYMENT_CYCLIC.md)
- [Render Setup Guide](./DEPLOYMENT_RENDER.md)
- [GitHub Issues](https://github.com/kyhosting/Iqbal-Bot/issues)

---

**Made with ❤️ • Open Source • Production Ready ✅**
