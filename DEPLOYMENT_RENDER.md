# Deploy Bot ke Render (24/7 dengan Ping)

## Keunggulan Render
✅ **Gratis 750 jam/bulan** - Cukup untuk 24/7
✅ **Easy to use** - Setup dari dashboard
✅ **Uptime monitoring** - Built-in status page
⚠️ **Butuh external ping** - Agar tidak sleep (gratis dengan UptimeRobot)

---

## Langkah Deploy

### 1. Push Ke GitHub
```bash
git add .
git commit -m "Bot ready for deployment"
git push origin main
```

### 2. Daftar ke Render
- Buka **https://render.com**
- Klik **"Sign Up"** → Login dengan GitHub
- Authorize Render untuk akses GitHub

### 3. Create New Service
- Klik **"New"** → **"Web Service"**
- Pilih repository `iqbal-cv-bot`
- Klik **"Connect"**

### 4. Configure Service
```
Name: iqbal-cv-bot
Environment: Node
Build Command: npm install
Start Command: npm start
```

### 5. Setup Environment Variable
- Scroll ke bagian **"Environment"**
- Tambahkan:
  - **Key:** `TELEGRAM_BOT_TOKEN`
  - **Value:** `8411014638:AAFfzvaOIwWK9_6JY784IuVRqCzgXGp1fwg`
- Klik **"Save"**

### 6. Deploy
- Klik **"Create Web Service"**
- Render akan:
  - Build project
  - Install dependencies
  - Deploy bot
  - Tunggu **"Live"** status

### 7. Keep-Alive Setup (PENTING!)
Bot akan sleep setelah 15 menit idle. Gunakan UptimeRobot untuk ping:

#### Setup UptimeRobot:
1. Buka **https://uptimerobot.com**
2. Klik **"Sign Up"** (gratis)
3. Klik **"Add Monitor"**
   - **Monitor Type:** HTTP(s)
   - **URL:** `https://iqbal-cv-bot.onrender.com/ping` (ganti dengan URL Render kamu)
   - **Monitoring Interval:** Every 5 minutes
4. Klik **"Create Monitor"**

#### Verify Ping Endpoint (di Render service):
```
GET https://your-service.onrender.com/ping → Should return 200 OK
```

---

## Monitoring
- **Render Dashboard** → Lihat logs real-time
- **UptimeRobot Dashboard** → Lihat uptime status
- Bot akan stay online 24/7 dengan ping dari UptimeRobot

---

## Jika Ada Error
**Error: "Service failed to start"**
- Check Render logs
- Pastikan `TELEGRAM_BOT_TOKEN` benar
- Pastikan tidak ada syntax error di code

**Error: "npm install failed"**
- Check `package.json` valid
- Semua dependencies ada

**Bot keeps sleeping**
- Ensure UptimeRobot monitor aktif
- Check UptimeRobot logs bahwa ping successful

---

## Tips
- Render free tier: 750 jam/bulan = 31+ hari continuous
- Dengan UptimeRobot ping, bot will stay awake
- Database (JSON) disimpan di folder lokal (persisten sampai re-deploy)

💚 **Bot siap 24/7 di Render!**
