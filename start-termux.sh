#!/bin/bash
# 🎌 IQBAL CV BOT - TERMUX STARTUP SCRIPT
# 
# Usage: ./start-termux.sh
# 
# This script safely starts the bot in Termux without using pm2 startup
# (which causes "Init system not found" error in Termux)

echo "🎌 Iqbal CV Bot - Starting..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install it first:"
    echo "   pkg install nodejs -y"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found. Installing globally..."
    npm install -g pm2
fi

# Try to start with PM2, fallback to direct npm start
if pm2 status &>/dev/null; then
    echo "✅ Starting with PM2..."
    pm2 start index.js --name "Iqbal-Bot"
    pm2 save
    echo "✅ Bot started with PM2!"
    echo "🎌 Bot Running!"
    pm2 logs Iqbal-Bot
else
    echo "⚠️  PM2 not available. Starting with npm..."
    npm start
fi
