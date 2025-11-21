# Iqbal CV Bot - Telegram Bot for File Conversion

## Overview

Telegram bot untuk konversi dan management file contact (VCF/TXT/XLSX). Bot ini memiliki sistem VIP dengan redeem code, verifikasi grup mandatory, dan UI aesthetic Japanese-style yang ramah dan profesional.

**Owner**: @Iqbaldev (ID: 8317563450)  
**Bot**: @Bot_cv_by_kyXploit_bot  
**Version**: 2.0.0

## User Preferences

- **Komunikasi**: Bahasa Indonesia, ramah, cool, dan profesional dengan emoji
- **UI Style**: Japanese aesthetic dengan template clean
- **Response Format**: Markdown dengan keyboard buttons setelah setiap operasi

## System Architecture

### Core Technologies
- **Runtime**: Node.js dengan ES Modules
- **Bot Library**: node-telegram-bot-api v0.66.0
- **File Processing**: xlsx, vcard-parser, cheerio
- **Database**: JSON file-based (database.json, redeem.json)

### Group Verification System ⭐
Bot memerlukan user join 2 grup mandatory:
- **@agentviber12** (grup utama)
- **@channelviber** (channel CV)

Sistem verifikasi:
- Check membership via `bot.verifyGroupAccess()` helper
- Dipanggil di setiap VIP command (keyboard + slash)
- Owner bypass verification check

#### Auto-Suspend Access System 🚫 (Preserve Trial Duration)
**Fitur Keamanan - Trial/VIP duration TETAP, hanya akses yang di-suspend:**
1. Bot otomatis detect event `my_chat_member` (user/bot left group)
2. System check membership status di kedua grup
3. JIKA tidak di 2 grup → **Akses DI-SUSPEND SEMENTARA**
4. Set flag: `suspended: true`, `status: "suspended"`
5. **PENTING:** `vip_expired` timestamp TIDAK direset (trial/VIP masih tersisa!)
6. User terima notifikasi: "❌ *Akses Dicabut Sementara Kak!*" dengan info trial masih ada
7. User join kedua grup → ketik `/start` → Akses otomatis DIPULIHKAN + notif ✅

**Flow Detail - Suspend & Restore:**
```
User keluar @agentviber12 atau @channelviber
    ↓
my_chat_member event trigger
    ↓
checkGroupMembership() verify status
    ↓
Status != verified → Set suspended=true (vip_expired TETAP)
    ↓
Database update: suspended=true, status="suspended"
    ↓
Notifikasi: "Akses dicabut sementara, trial masih ada"
    ↓
User join BOTH groups + /start
    ↓
Command detects: suspended=true && vip_expired > now()
    ↓
Auto-restore: suspended=false, status="active", role restored
    ↓
Notifikasi: "Akses dipulihkan! Sisa X hari" ✅
```

**Komponen Code:**
- Suspend Event: `bot.on("my_chat_member", async (update) => {...})`
- Lokasi suspend: index.js line 224-254
- Restore Logic: commands/user-start.js line 71-90
- Check method: `bot.checkGroupMembership(userId)`
- DB fields: `suspended`, `status`, `vip_expired` (preserved!)

### VIP & Redeem System 💎
**Redeem Code Features**:
- Single-use per code
- Expiry date tracking
- VIP duration (hari)
- Persistent storage di `redeem.json`

**VIP Benefits**:
- Akses ke semua fitur premium
- Tracking total operations
- Status monitoring dengan countdown hari tersisa

**Owner Commands**:
- `/createcode <KODE> <DURASI> <EXPIRED>` - Buat redeem code
- `/deletecode <KODE>` - Hapus redeem code  
- `/setvip <USER_ID> <DURASI>` - Set VIP manual
- Menu inline keyboard untuk management

### Database Structure
```javascript
{
  "users": {
    "userId": {
      "id": 123456789,
      "username": "username",
      "first_name": "Nama",
      "last_name": "Belakang",
      "role": "vip|user|owner",
      "vip_expired": timestamp,
      "status": "active|inactive",
      "total_operation": 0
    }
  }
}
```

### Keyboard System 🎹
Keyboard buttons dengan 2 kolom layout:
- Auto-display setelah setiap command selesai
- Japanese-style naming (⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ)
- Friendly emoji indicators
- Consistent across all features

### Available Features

#### User Commands
- `/start` - Welcome message dengan foto profil, status VIP, statistik
- `🎁 Redeem Code` - Redeem VIP access code

#### VIP Commands (Conversion)
- `⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ` - Convert VCF ke TXT
- `⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ` - Convert TXT ke VCF dengan nama kontak
- `⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ` - Convert Excel ke VCF
- `⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ` - Extract nomor dari message

#### VIP Commands (File Management)
- `⛓️ ʙᴀɢɪ ᴠᴄꜰ` - Split VCF file
- `⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ` - Continue split process
- `⛓️ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ` - Potong VCF lanjutan
- `⛓️ ɢᴀʙᴜɴɢ ᴛxᴛ` - Gabung file TXT
- `⛓️ ɢᴀʙᴜɴɢ ᴠᴄꜰ` - Gabung file VCF

#### VIP Commands (Utilities) ✨ NEW
- `⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ` - Hapus duplikat, rapikan, sort
- `⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ` - Hitung kontak di TXT/VCF
- `⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ` - Rename file
- `⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ` - Rename semua kontak dalam VCF
- `⛓️CEK KONTAK` - Cek detail kontak
- `⛓️ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ` - Create admin (owner only)

#### Owner Commands
- `⛓️MENU OWNER` - Panel management dengan inline keyboard
- Command management untuk redeem codes dan user VIP

### Message Tone & Style 💬

All bot responses follow this pattern:
```
✅ *Title Kak!* 🎉

Details dengan emoji yang sesuai

📂 *File:* `filename`
📊 *Stats:* data

Semoga membantu ya! 😊
```

Characteristics:
- Friendly dengan "Kak" untuk respect
- Emoji untuk visual appeal
- Markdown formatting (bold, code blocks)
- Always end with encouragement
- Error messages tetap ramah: "Yah… ada masalah" bukan "Error"

### Technical Implementation

#### Group Verification Flow
```javascript
// Di setiap VIP command:
const hasAccess = await bot.verifyGroupAccess(userId, chatId);
if (!hasAccess) return; // Stop execution

// Lanjut role check dan processing...
```

#### Operation Tracking
```javascript
// Di akhir setiap VIP operation:
bot.incrementOperation(userId);
```

#### File Cleanup Best Practice
```javascript
// Always check before delete:
if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);
}
```

### Security & Data Safety

1. **Group Membership**: Enforced di setiap VIP command
2. **Redeem Codes**: Single-use dengan persistence
3. **File Cleanup**: Proper cleanup dengan existsSync check
4. **Owner Protection**: Bypass all restrictions
5. **VIP Expiry**: Auto-downgrade dengan notification

### Backup & Persistence

- **Daily Backup**: Auto backup database ke `backup_YYYY-MM-DD.json`
- **Redeem Persistence**: Immediate save setelah redemption
- **Log System**: All commands logged ke `logs.txt`
- **Hot Reload**: Auto reload plugins on file change

### Dependencies

```json
{
  "cheerio": "github:syawaloktasyahputra/cheerio",
  "node-fetch": "^3.3.2",
  "node-telegram-bot-api": "^0.66.0",
  "vcard-parser": "^1.0.0",
  "xlsx": "^0.18.5"
}
```

### Deployment Notes

Bot berjalan dengan workflow "Iqbal CV Bot" (`node index.js`)
- Auto-restart on code changes
- Console output untuk monitoring
- Error handling user-friendly
- 19 plugins loaded successfully

## Recent Updates (v2.0.0 Final)

- ✅ Upgraded to Japanese aesthetic UI
- ✅ Implemented mandatory dual-group verification
- ✅ Added redeem code system with expiry
- ✅ Created owner management panel
- ✅ Added 5 new utility features
- ✅ Updated all responses to friendly tone
- ✅ Keyboard buttons on all commands
- ✅ Operation tracking system
- ✅ File cleanup improvements
- ✅ VIP auto-expiry with countdown
- ✅ **AUTO-REVOKE ACCESS** - Detect & revoke saat user leave grup
- ✅ TXT TO VCF & VCF TO TXT dengan format ◆ ▸
- ✅ Normalized message format across all features

## File Structure

```
/
├── index.js                 # Core bot system
├── config.js               # Bot configuration
├── package.json            # Dependencies
├── database.json           # User database
├── redeem.json            # Redeem codes
├── logs.txt               # Activity logs
└── commands/              # Command modules
    ├── user-start.js      # /start command
    ├── user-redeem.js     # Redeem system
    ├── owner-menu.js      # Owner panel
    ├── vip-*.js          # VIP features (19 files)
    └── ...
```

## Maintenance

- Check `database.json` untuk user statistics
- Monitor `logs.txt` untuk activity
- Manage VIP via `/owner` command
- Backup files di root directory

---
**Created with ❤️ by Iqbaldev**  
こんにちは、私は Iqbalʙᴏᴛ です 🎌
