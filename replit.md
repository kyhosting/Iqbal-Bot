# Iqbal CV Bot - Telegram Bot for File Conversion

## Overview
Iqbal CV Bot is a Telegram bot designed for converting and managing contact files (VCF/TXT/XLSX). It features a VIP system with redeem codes, mandatory group verification, and a professional, Japanese-aesthetic user interface. The bot aims to streamline contact management for users, offering various conversion and utility tools, with a vision to become a leading solution in automated contact file processing.

## User Preferences
- **Komunikasi**: Bahasa Indonesia, ramah, cool, dan profesional dengan emoji
- **UI Style**: Japanese aesthetic dengan template clean
- **Response Format**: Markdown dengan keyboard buttons setelah setiap operasi

## System Architecture

### Core Technologies
The bot is built on Node.js using ES Modules, leveraging `node-telegram-bot-api` for Telegram integration. File processing capabilities are powered by `xlsx`, `vcard-parser`, and `cheerio`. User and redeem code data are persistently stored in JSON files (`database.json`, `redeem.json`).

### User Interface and Interaction
The bot features a Japanese aesthetic with a clean template. It utilizes Telegram's keyboard buttons for navigation, which are displayed after every operation. All responses are formatted in Markdown, include relevant emojis, and maintain a friendly, professional tone using phrases like "Kak".

### Group Verification System
Access to certain bot features requires users to join two mandatory Telegram groups (`@agentviber12` and `@channelviber`). A caching system is implemented to verify group membership efficiently, only performing a full check if the user hasn't been verified before or if their status changes. The system automatically suspends user access if they leave either group and restores it upon rejoining and initiating the bot with `/start`. Owner accounts bypass this verification.

### VIP and Redeem System
The bot incorporates a VIP system where users can gain premium access using single-use redeem codes with defined expiry dates. VIP users enjoy access to all premium features, and their operations are tracked. Owners have commands to create, delete redeem codes, and manually set VIP status for users.

### Access Control
- **Group Access Control**: In group chats, most bot features are restricted to VIP users and the bot owner. Regular users and those with redeem codes cannot access features in groups but can use them in direct messages with the bot.
- **Role-Based Features**: Keyboard menus and commands are dynamically displayed based on the user's role (user, VIP, owner).

### Features
The bot offers a range of features categorized as:
- **Conversion**: VCF to TXT, TXT to VCF, XLS to VCF, Message to TXT (extract numbers).
- **File Management**: Split VCF, Merge TXT/VCF, Extract Numbers from various formats, Count contacts, Rename files, Rename contacts within VCF, Create Admin VCF.
- **Utilities**: Display user profile, redeem VIP codes.
- **Owner Commands**: Manage redeem codes and user VIP statuses.
- **Group Management**: Set welcome messages and rules, ban/unban/kick users (VIP and admin only).

### Database Structure
User data is stored in `database.json`, including `id`, `username`, `first_name`, `last_name`, `role` (vip|user|owner), `vip_expired` timestamp, `status` (active|inactive|suspended), `total_operation` count, `suspended` flag for group access, `group_verified` for caching, and `notified_expiry` flag.

### Security and Data Safety
The system enforces group membership for VIP commands, uses single-use redeem codes, performs proper file cleanup, protects owner access, and manages VIP expiry with notifications. Daily backups of the database and logging of all commands ensure data persistence and traceability.

## External Dependencies

- `cheerio`: For parsing and manipulating HTML/XML (potentially for web scraping or specific file formats).
- `node-fetch`: A light-weight module that brings `window.fetch` to Node.js for making HTTP requests.
- `node-telegram-bot-api`: The official Telegram Bot API client for Node.js.
- `vcard-parser`: Used for parsing and manipulating VCF (vCard) files.
- `xlsx`: A library for reading and writing spreadsheet files (Excel).