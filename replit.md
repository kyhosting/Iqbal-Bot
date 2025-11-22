# Iqbal CV Bot - Telegram Bot for File Conversion

## Overview

Telegram bot untuk konversi dan management file contact (VCF/TXT/XLSX). Bot ini memiliki sistem VIP dengan redeem code, verifikasi grup mandatory, dan UI aesthetic Japanese-style yang ramah dan profesional.

**Developer**: KIKI FZL DAN PARTNER/SUPPORT IQBAL DEV  
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
Keyboard buttons dengan 2 kolom layout yang rapi:

**User Biasa / Trial / VIP / Redeem Code:**
```
⛓️ TXT TO VCF ⛓️        ⛓️ VCF TO TXT ⛓️
⛓️ XLS TO VCF ⛓️        ⛓️ MSG TO TXT ⛓️
⛓️ BAGI LANJUT ⛓️       ⛓️ ESTRAK NOMOR ⛓️
⛓️ GABUNG FILE ⛓️
⛓️ POTONG LANJUT ⛓️     ⛓️ CREATE ADMIN ⛓️
⛓️ CEK KONTAK ⛓️        ⛓️ HITUNG FILE ⛓️
⛓️ RENAME KONTAK ⛓️     ⛓️ RENAME FILE ⛓️
🎁 REDEEM CODE
```

**Owner Saja:**
```
⛓️ TXT TO VCF ⛓️        ⛓️ VCF TO TXT ⛓️
⛓️ XLS TO VCF ⛓️        ⛓️ MSG TO TXT ⛓️
⛓️ BAGI LANJUT ⛓️       ⛓️ ESTRAK NOMOR ⛓️
⛓️ GABUNG FILE ⛓️
⛓️ POTONG LANJUT ⛓️     ⛓️ CREATE ADMIN ⛓️
⛓️ CEK KONTAK ⛓️        ⛓️ HITUNG FILE ⛓️
⛓️ RENAME KONTAK ⛓️     ⛓️ RENAME FILE ⛓️
🎁 REDEEM CODE           ⛓️ MENU OWNER ⛓️
```

- Auto-display setelah setiap command selesai
- Clean & professional naming
- **Role-based filtering** - MENU OWNER hanya untuk Owner
- Consistent across all features

### Group Access Control System 🔐 (NEW)
**Fitur Keamanan - Hanya Owner & VIP di Grup**

Semua fitur bot di grup hanya bisa diakses oleh Owner dan VIP users:
- User biasa: TIDAK bisa akses apapun di grup
- Redeem code users: TIDAK bisa akses di grup (hanya bisa di DM)
- VIP users: BISA akses semua fitur di grup
- Owner: BISA akses semua fitur dimana saja

**Komponen Code:**
- Helper: `bot.checkGroupOwnerVipAccess(userId, chatId)` - Check role & chat type
- Implementasi: Semua 8 user commands + owner menu
- Commands terproteksi:
  - `/redeem`, `/bantuan`, `/cekid`, `/fitur`, `/clear`, `/viplist`
  - `/owner`, `⛓️ MENU OWNER ⛓️`
  - `/setwelcome`, `/setrules`, `/ban`, `/unban`, `/kick`

**Flow:**
1. User invoke command di grup
2. Bot check: apakah group chat?
3. JIKA group → verify role (owner atau vip?)
4. JIKA bukan owner/vip → block dengan: "❌ Fitur grup hanya untuk VIP users kak!"
5. JIKA DM → allow (normal behavior)

### Available Features

#### User Commands (Group-Protected ⛓️)
- `/start` - Welcome message dengan foto profil, status VIP, statistik
- `🎁 REDEEM CODE` - Redeem VIP access code (DM only / VIP in group)

#### VIP Commands (Conversion)
- `⛓️ VCF TO TXT ⛓️` - Convert VCF ke TXT
- `⛓️ TXT TO VCF ⛓️` - Convert TXT ke VCF dengan nama kontak
- `⛓️ XLS TO VCF ⛓️` - Convert Excel ke VCF
- `⛓️ MSG TO TXT ⛓️` - Extract nomor dari message

#### VIP Commands (File Management)
- `⛓️ BAGI LANJUT ⛓️` - Split VCF file advanced
- `⛓️ POTONG LANJUT ⛓️` - Potong VCF lanjutan
- `⛓️ GABUNG FILE ⛓️` - Gabung file TXT & VCF

#### VIP Commands (Utilities) ✨ NEW
- `⛓️ ESTRAK NOMOR ⛓️` - Ekstrak nomor dari multiple file format
- `⛓️ HITUNG FILE ⛓️` - Hitung kontak di TXT/VCF
- `⛓️ RENAME FILE ⛓️` - Rename file
- `⛓️ RENAME KONTAK ⛓️` - Rename semua kontak dalam VCF
- `⛓️ CEK KONTAK ⛓️` - Cek detail kontak
- `⛓️ CREATE ADMIN ⛓️` - Create admin VCF

#### Owner Commands (Group-Protected ⛓️)
- `⛓️ MENU OWNER ⛓️` - Panel management dengan inline keyboard
- Command management untuk redeem codes dan user VIP
- `/owner` - Slash command untuk owner menu (same as keyboard)

#### Group Management Commands (VIP-Only ⛓️)
- `/setwelcome` - Set custom welcome message (VIP + admin)
- `/setrules` - Set custom grup rules (VIP + admin)
- `/rules` - Show grup rules (anyone)
- `/ban` - Ban user dari grup (VIP + admin)
- `/unban` - Unban user (VIP + admin)
- `/kick` - Kick user dari grup (VIP + admin)

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

## Recent Updates (v2.0.0 FINAL - PRODUCTION READY)

**Session Nov 22, 2025 - OPERATIONAL STATUS:**
- ✅ Upgraded to Japanese aesthetic UI with anime-style formatting
- ✅ Implemented mandatory dual-group verification (@agentviber12 + @channelviber)
- ✅ Added redeem code system with expiry dates and single-use validation
- ✅ Created owner management panel with inline keyboard controls
- ✅ Added 5 new utility features (clean, count, rename, check, admin)
- ✅ Updated all responses to friendly Indonesian tone with emojis
- ✅ Keyboard buttons on all commands with role-based filtering
- ✅ Operation tracking system per user
- ✅ File cleanup with proper existsSync checks
- ✅ VIP auto-expiry with countdown notifications
- ✅ **AUTO-SUSPEND/RESTORE ACCESS** - Detect & auto-restore saat user rejoin grup
- ✅ TXT TO VCF & VCF TO TXT dengan format separator ◆ ▸
- ✅ Normalized message format across all 23 features
- ✅ **HTML parse_mode formatting** - All critical messages converted to HTML
- ✅ **GROUP MANAGEMENT SYSTEM** - 2 new commands: welcome + moderation (VIP-only access)
- ✅ **GROUP ACCESS CONTROL** - ALL fitur bot di grup restricted untuk Owner & VIP only
- ✅ **Bot Status: RUNNING** - All 23 command files loaded successfully ✅

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

## Maintenance & Operation

**Active Bot Status:**
- ✅ Bot running dengan `node index.js` workflow
- ✅ All 23 commands loaded and operational
- ✅ Database auto-backup setiap hari
- ✅ Group verification working correctly
- ✅ VIP redeem & manual set working

**Daily Checks:**
- Check `database.json` untuk user statistics
- Monitor bot logs untuk activity errors
- Manage VIP codes via `/owner` command
- Verify group membership enforcement
- Backup files di root directory

**Commands Reference:**
- **/start** - Welcome dashboard dengan foto profil
- **/me** - User profile & statistics
- **/owner** - Owner management panel (owner only)
- **/redeem KODE** - Redeem VIP code
- **/createcode KODE DURASI DATE** - Create redeem code (owner)
- **/deletecode KODE** - Delete redeem code (owner)
- **/setvip USER_ID DURASI** - Set VIP manual (owner)

---
**Created with ❤️ by KIKI FZL DAN PARTNER/SUPPORT IQBAL DEV**  
こんにちは、私は Iqbalʙᴏᴛ です 🎌
