# Iqbal CV Bot - Telegram File Converter

## Overview

A production-ready Telegram bot for file conversion and contact management, specializing in VCF (vCard), TXT, and XLSX file operations. The bot features a VIP subscription system, role-based access control, and comprehensive file manipulation capabilities.

**Primary Purpose**: Provide automated file conversion services for Telegram users, with a focus on contact file management (VCF format) and phone number extraction.

**Target Platform**: Telegram Bot API (Node.js)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### 1. Core Technology Stack

**Runtime Environment**
- Node.js (≥16.0.0) with ES Modules
- Single-process architecture with polling-based Telegram integration

**Key Dependencies**
- `node-telegram-bot-api` - Primary bot framework
- `xlsx` - Excel file processing
- `vcard-parser` - VCF/vCard parsing
- `cheerio` - HTML/DOM manipulation
- `node-fetch` - HTTP requests

### 2. Data Storage Design

**File-Based Persistence**
- `database.json` - User profiles, VIP status, operation counts
- `redeem.json` - VIP redemption codes and usage tracking
- `config.js` - Bot configuration (token, owner IDs, group settings)

**Database Schema (database.json)**
```javascript
{
  "users": {
    "[user_id]": {
      "id": Number,
      "username": String,
      "first_name": String,
      "last_name": String,
      "role": "owner" | "admin" | "vip" | "trial" | "user",
      "vip_expired": Number (timestamp),
      "status": "active" | "inactive",
      "total_operation": Number,
      "group_verified": Boolean,
      "suspended": Boolean
    }
  }
}
```

**Rationale**: JSON file storage chosen for simplicity and easy deployment to serverless platforms (Cyclic, Render, Replit). No complex queries required; all operations are key-based lookups. Daily backups created automatically.

### 3. Authentication & Authorization

**Role-Based Access Control (RBAC)**
- **Owner**: Full access, bypasses all restrictions
- **Admin**: Management capabilities, no group verification required
- **VIP**: Premium features (file merging, advanced conversion)
- **Trial**: Limited VIP access with expiration
- **User**: Basic features only

**Group Membership Verification**
- Users must join 2 configured Telegram groups
- Verification bypassed for owners and admins
- Suspended users must re-verify membership
- Deep-link approach for seamless group joining

**Design Decision**: Group verification serves as both user acquisition and access gate. Owner bypass ensures administrative access remains uninterrupted.

### 4. File Processing Architecture

**Conversion Pipeline**
1. File upload via Telegram API
2. Download to temporary local storage
3. Format detection and validation
4. Conversion logic execution
5. Result file generation
6. Upload back to user
7. Cleanup of temporary files

**Supported Conversions**
- VCF ↔ TXT (bidirectional contact/text conversion)
- XLSX → VCF (Excel to contact cards)
- Multi-file merging (VCF, TXT, XLSX)
- Phone number extraction from any supported format

**File Handling Strategy**: Synchronous processing with immediate cleanup prevents disk space issues. No queue system - each conversion is blocking for simplicity.

### 5. VIP Subscription System

**Payment Flow**
- Deep-link integration to owner's DM
- Pre-filled purchase messages
- Manual verification by owner
- Redeem code generation and distribution

**VIP Packages**
- 7 days: 15K IDR
- 30 days: 50K IDR  
- 90 days: 120K IDR
- 365 days: 300K IDR

**Code Generation**: 8-character alphanumeric codes with usage tracking and expiration dates.

**Alternative Considered**: Automated payment gateway integration rejected due to complexity and regulatory requirements in target market.

### 6. Session Management

**Multi-Step Command Flow**
- In-memory session storage (object-based)
- Step-by-step user guidance
- "Batal" (cancel) keyword support at any step
- Automatic session cleanup on completion

**Example Session Pattern**
```javascript
sessions[userId] = {
  step: 1,
  file: null,
  originalName: null,
  // ... other session data
}
```

**Limitation**: Sessions lost on bot restart. Acceptable trade-off for stateless deployment simplicity.

### 7. Command Structure

**Registration Pattern**
- Keyboard button handlers (`bot.onText(/^⛓️ COMMAND$/i)`)
- Slash command handlers (`/command`)
- Callback query handlers (inline buttons)

**Modular Design**: Each feature isolated in separate files under `commands/` directory, dynamically loaded at startup.

### 8. Error Handling & Resilience

**Integrity Verification System**
- Startup checks for credit/watermark tampering
- Two modes: STRICT (exit on violation) vs WARNING (log only)
- Anti-piracy protection built into core files

**File Operation Safety**
- Try-catch blocks around all file I/O
- Automatic cleanup in error paths
- User-friendly error messages (Indonesian language)

### 9. Deployment Architecture

**Auto-Configuration**
- `config.example.js` → `config.js` auto-creation on first run
- Environment variable support (`TELEGRAM_BOT_TOKEN`)
- Zero-config startup for containerized environments

**Supported Platforms**
- Cyclic.sh (cloud hosting)
- Render.com (deployment platform)
- Replit (development environment)
- Railway (container hosting)
- VPS/Termux (manual deployment)

**Design Rationale**: Wide platform compatibility ensures users can deploy anywhere. Polling mode chosen over webhooks for firewall/NAT compatibility.

## External Dependencies

### Third-Party Libraries

**Telegram Integration**
- `node-telegram-bot-api@0.66.0` - Official Telegram Bot API wrapper
- Polling mode for message retrieval (no webhook required)

**File Processing**
- `xlsx@0.18.5` - Excel/XLSX file reading and manipulation
- `vcard-parser@1.0.0` - VCF/vCard format parsing
- `cheerio@1.0.0-rc.12` - HTML parsing (DOM manipulation)

**HTTP & Utilities**
- `node-fetch@3.3.2` - Fetch API for file downloads from Telegram servers

### Hosting Services

**Cloud Platforms**
- Cyclic.sh - Serverless Node.js hosting
- Render.com - Auto-deploy from Git
- Railway - Container-based deployment

**Development Platforms**
- Replit - Browser-based IDE with instant deployment

### External APIs

**Telegram Bot API**
- Endpoint: `https://api.telegram.org/bot<token>/`
- Used for: Message sending, file upload/download, user verification
- File size limit: 50MB (Telegram restriction)

**No Database Service**: Intentionally avoided to maintain zero-dependency deployment. JSON files sufficient for expected user scale (<10K users).

### Configuration Requirements

**Environment Variables (Optional)**
- `TELEGRAM_BOT_TOKEN` - Bot authentication token from @BotFather
- `INTEGRITY_MODE` - "STRICT" or "WARNING" for anti-piracy checks

**Required Setup**
- Telegram bot token from @BotFather
- Owner Telegram user ID (from @userinfobot)
- Two Telegram groups/channels for membership verification

**Group Configuration**
- `groups.main` - Primary community group
- `groups.cv` - Contact/channel group
- Both configured in `config.js`