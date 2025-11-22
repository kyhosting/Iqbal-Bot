# Iqbal CV Bot - Python Version 🎌

Complete port dari Iqbal CV Bot (Node.js) ke Python dengan semua 18+ features.

## Features

### User Commands
- `/start` - Dashboard aesthetic dengan foto profil
- `/me` - Profil user
- `/bantuan` - Help & bantuan
- `/fitur` - Daftar fitur
- `/redeem` - Redeem VIP code

### VIP Features (Conversion)
- ⛓️ **TXT TO VCF** - Convert TXT dengan nomor ke VCF
- ⛓️ **VCF TO TXT** - Extract nomor dari VCF ke TXT
- ⛓️ **XLS TO VCF** - Convert XLSX ke VCF
- ⛓️ **MSG TO TXT** - Extract nomor dari pesan

### VIP Features (File Management)
- ⛓️ **SPLIT FILE** - Potong VCF menjadi multiple file
- ⛓️ **GABUNG FILE** - Merge multiple files
- ⛓️ **GABUNG TXT** - Merge file TXT
- ⛓️ **GABUNG VCF** - Merge file VCF

### VIP Features (Utilities)
- ⛓️ **RAPIKAN TXT** - Clean, deduplicate, sort TXT
- ⛓️ **HITUNG FILE** - Count contacts di TXT/VCF
- ⛓️ **RENAME FILE** - Rename file
- ⛓️ **RENAME KONTAK** - Rename semua kontak dalam VCF
- ⛓️ **CEK KONTAK** - View detail kontak

### Owner Commands
- `/owner` - Panel owner dengan inline keyboard
- Buat redeem code
- List codes & users
- Set VIP manual

## Installation

```bash
cd python_src
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` ke `.env` dan update:
```
BOT_TOKEN=your_bot_token
```

## Running

```bash
python main.py
```

## Database Structure

- `database.json` - User data (role, VIP expiry, operations)
- `redeem.json` - Redeem codes

## System Architecture

- **verification.py** - Dual-group verification (@agentviber12, @channelviber)
- **file_converters.py** - All file conversion functions
- **redeem_system.py** - Redeem code management
- **owner_commands.py** - Owner panel & management
- **vip_commands.py** - All 13 VIP command handlers
- **helpers.py** - Database, formatting, utilities
- **main.py** - Bot entry point & message routing

## Features Persis dari Node.js

✅ Dashboard aesthetic dengan foto profil user  
✅ Mandatory 2-group verification system  
✅ VIP & Trial dengan auto-expiry  
✅ Redeem code system dengan persistence  
✅ File conversion (TXT ↔ VCF, XLS → VCF)  
✅ File management (split, merge, clean, rename)  
✅ Session management untuk multi-step commands  
✅ Auto operation tracking  
✅ Owner panel dengan management tools  

---
**Iqbal CV Bot Python v1.0** - Created with ❤️
