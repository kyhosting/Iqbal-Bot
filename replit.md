# Iqbal CV Bot - Telegram Bot for File Conversion

## Overview
Iqbal CV Bot is a Telegram bot designed for converting and managing contact files (VCF/TXT/XLSX). It features a VIP system with redeem codes, mandatory group verification, and a professional, Japanese-aesthetic user interface. The bot aims to streamline contact management for users, offering various conversion and utility tools, with a vision to become a leading solution in automated contact file processing.

## User Preferences
- **Komunikasi**: Bahasa Indonesia, ramah, cool, dan profesional dengan emoji
- **UI Style**: Japanese aesthetic dengan template clean
- **Response Format**: HTML parse_mode dengan keyboard buttons setelah setiap operasi

## System Architecture

### Core Technologies
The bot is built on Node.js using ES Modules, leveraging `node-telegram-bot-api` for Telegram integration. File processing capabilities are powered by `xlsx`, `vcard-parser`, and `cheerio`. User and redeem code data are persistently stored in JSON files (`database.json`, `redeem.json`).

### User Interface and Interaction
The bot features a Japanese aesthetic with a clean template. It utilizes Telegram's keyboard buttons for navigation, which are displayed after every operation. All responses are formatted using Telegram's HTML parse_mode (`parse_mode: "HTML"`), include relevant emojis, and maintain a friendly, professional tone using phrases like "Kak". Beautiful panel borders (◆◆, ╭─❖, etc.) provide visual structure to all messages.

### Keyboard Layout (v2.0.2)
Professional 2x2 grid format with trailing emoji (⛓️):
- **Row 1-2**: TXT↔VCF, XLS→VCF, MSG→TXT (2x2)
- **Row 3-4**: Bagi File, Gabung File (full width)
- **Row 5-6**: Potong File, Create Admin (2x2)
- **Row 7-8**: Cek Kontak, Hitung File (2x2)
- **Row 9-10**: Rename Kontak, Rename File (2x2)
- **Row 11-12**: Redeem Code, Menu Owner (2x2)

### Group Verification System
Access to certain bot features requires users to join two mandatory Telegram groups (`@agentviber12` and `@channelviber`). A caching system is implemented to verify group membership efficiently, only performing a full check if the user hasn't been verified before or if their status changes. The system automatically suspends user access if they leave either group and restores it upon rejoining and initiating the bot with `/start`. Owner accounts bypass this verification.

### VIP and Redeem System
The bot incorporates a VIP system where users can gain premium access using single-use redeem codes with defined expiry dates. VIP users enjoy access to all premium features, and their operations are tracked. Owners have commands to create, delete redeem codes, and manually set VIP status for users.

### Access Control
- **Group Access Control**: In group chats, most bot features are restricted to VIP users and the bot owner. Regular users and those with redeem codes cannot access features in groups but can use them in direct messages with the bot.
- **Role-Based Features**: Keyboard menus and commands are dynamically displayed based on the user's role (user, VIP, owner).

### Features (25 Commands Total)
**Conversion Features:**
- ⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ ⛓️ - Convert text to vCard format
- ⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ ⛓️ - Convert vCard to text format
- ⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ ⛓️ - Convert Excel to vCard format
- ⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ ⛓️ - Extract numbers from messages

**File Management Features:**
- ⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ ⛓️ - Split files (VCF/TXT/XLSX) by contact count
- ⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ ⛓️ - Merge multiple files (VCF/TXT/XLSX)
- ⛓️ ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ ⛓️ - Extract range of contacts (VCF/TXT/XLSX)
- ⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ ⛓️ - Count total contacts in file
- ⛓️ ᴄᴇᴋ ᴋᴏɴᴛᴀᴋ ⛓️ - View contact details from file
- ⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️ - Rename individual contacts in VCF
- ⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️ - Rename downloaded files
- ⛓️ ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ ⛓️ - Create admin contact list

**Utility Features:**
- 🎁 ʀᴇᴅᴇᴇᴍ ᴄᴏᴅᴇ - Redeem VIP access code
- /me - Display user profile
- /fitur - Show available features
- /cekid - Check user ID
- /bantuan - Get help & info
- /clear - Clear message history

**Owner Commands:**
- ⛓️ ᴍᴇɴᴜ ᴏᴡɴᴇʀ ⛓️ - Owner management panel
- Plus redeem code management, user VIP status control, and group settings

### Database Structure
User data is stored in `database.json`, including `id`, `username`, `first_name`, `last_name`, `role` (vip|user|owner), `vip_expired` timestamp, `status` (active|inactive|suspended), `total_operation` count, `suspended` flag for group access, `group_verified` for caching, and `notified_expiry` flag.

### Security and Data Safety
The system enforces group membership for VIP commands, uses single-use redeem codes, performs proper file cleanup, protects owner access, and manages VIP expiry with notifications. Daily backups of the database and logging of all commands ensure data persistence and traceability.

## External Dependencies

- `cheerio`: For parsing and manipulating HTML/XML
- `node-fetch`: Brings `window.fetch` to Node.js for HTTP requests
- `node-telegram-bot-api`: Official Telegram Bot API client for Node.js
- `vcard-parser`: Parsing and manipulating VCF (vCard) files
- `xlsx`: Reading and writing spreadsheet files (Excel)

## Recent Updates

**Session Nov 23, 2025 - HTML MESSAGE FORMATTING (v2.0.3):**
- 🎨 **ALL MESSAGES CONVERTED TO HTML FORMAT**
  - Migrated all 26 files (25 commands + index.js) to use `parse_mode: "HTML"`
  - Total of 239+ HTML parse_mode instances across the bot
  - Messages now render with proper Telegram HTML formatting
  - Beautiful panel borders (◆◆, ╭─❖, ├─❖, etc.) display correctly in Telegram clients
  
- ✅ **FORMATTING IMPROVEMENTS:**
  - All user messages use consistent HTML formatting
  - Emoji formatting preserved and enhanced
  - Message structure maintained with visual panel borders
  - Better rendering on all Telegram clients (mobile, desktop, web)

- ✅ **Bot Status: 25/25 PLUGINS LOADED - PRODUCTION READY** 🚀
  - All 25 commands loading successfully
  - HTML formatting implemented across entire bot
  - Bot process running stable

**Previous Session (Nov 23, 2025 - v2.0.2):**
- 🎨 **KEYBOARD LAYOUT UPDATE** - Professional 2x2 grid with trailing emoji format
  - All buttons now have consistent format: `⛓️ ᴛɪᴛʟᴇ ⛓️`
  - Organized into logical 2x2 groups for better UX
  
- ✅ **3 NEW COMMANDS ADDED:**
  - `⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ ⛓️` - Count contacts in VCF/TXT files
  - `⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️` - Rename individual contacts in VCF
  - `⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️` - Rename downloaded files
  
- 🔧 **FIXED: Regex Pattern Matching**
  - Updated 10 command files to match new trailing emoji format
  - All button text now match command regex patterns
  - All 25 commands now properly registered and working

- 🎁 **NEW OWNER FEATURE: List All Users**
  - Added `📊 Semua User` button to owner management panel
  - Shows complete user list with: Role (Owner/VIP/User), Status, VIP Expiry, Operation Count
  - Display format: Name | ID | Role | Status | VIP Expiry | Total Operations
  - Original "👥 Lihat User" renamed to "👥 Lihat User VIP" (shows only active VIP users)
