# Deploy Bot ke Cyclic (24/7 Gratis)

## Keunggulan Cyclic
✅ **Bot tetap online 24/7** - Tidak ada sleep period
✅ **Gratis selamanya** - Tidak ada upgrade diperlukan
✅ **Simple setup** - Hanya beberapa klik
✅ **No credit card** - Benar-benar gratis

---

## Langkah Deploy

### 1. Push Ke GitHub
```bash
# Pastikan sudah ada git repository
git add .
git commit -m "Bot ready for deployment"
git push origin main
```

### 2. Daftar ke Cyclic
- Buka **https://cyclic.sh**
- Klik **"Deploy Now"**
- Login dengan GitHub
- Authorize Cyclic untuk akses GitHub

### 3. Deploy Repository
- Pilih repository `iqbal-cv-bot`
- Klik **"Connect"**

### 4. Setup Environment Variable
- Di halaman deployment, cari **"Environment Variables"**
- Tambahkan:
  - **Key:** `TELEGRAM_BOT_TOKEN`
  - **Value:** `8411014638:AAFfzvaOIwWK9_6JY784IuVRqCzgXGp1fwg`
- Klik **"Save"**

### 5. Selesai!
- Cyclic otomatis akan:
  - Build project
  - Install dependencies
  - Jalankan `npm start`
  - Bot online 24/7

---

## Monitoring & Logs
- Buka **Cyclic Dashboard**
- Lihat **"Logs"** untuk debug
- Status bot terlihat real-time

---

## Jika Ada Error
**Error: "Cannot find module"**
- Pastikan `package.json` ada
- Pastikan `npm install` berhasil
- Cek di Cyclic Logs

**Error: "Bot token invalid"**
- Check environment variable `TELEGRAM_BOT_TOKEN` benar
- Pastikan token tidak ada spasi di awal/akhir

---

## Tips
- Bot akan restart otomatis jika crash
- Database (JSON) disimpan di `/tmp` (tidak persisten antara restart)
- Untuk persistent storage, upgrade ke paid plan atau pakai external database

💚 **Bot sudah siap 24/7 di Cyclic!**
