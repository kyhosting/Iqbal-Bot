#!/usr/bin/env python3
"""Iqbal CV Bot - Python Version Main Entry Point"""
import asyncio
import logging
from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from config_py import CONFIG
from helpers import *
from commands.user_commands import cmd_me, cmd_bantuan, cmd_fitur
from commands.vip_commands import (
    vip_txttovcf, vip_vcftotxt, vip_xlstovcf, vip_msgtotxt, vip_rapikatntxt,
    vip_bagivcf, vip_gabungfile, vip_renamefile, vip_renamekontak, vip_hitungfile, vip_cekkontak
)

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    user_id = user.id
    
    # Get or create user
    db_user = get_user(user_id)
    if not db_user:
        db_user = create_user(user_id, user.first_name, user.username, is_owner(user_id))
    
    # Get dashboard
    dashboard = format_dashboard(db_user)
    keyboard = get_main_keyboard()
    
    try:
        # Try to get profile photo
        photos = await context.bot.get_user_profile_photos(user_id, limit=1)
        if photos.total_count > 0:
            photo = photos.photos[0][0]
            await context.bot.send_photo(
                chat_id=user_id,
                photo=photo.file_id,
                caption=dashboard,
                parse_mode="Markdown",
                reply_markup=ReplyKeyboardMarkup(keyboard["keyboard"], resize_keyboard=True)
            )
        else:
            await context.bot.send_message(
                chat_id=user_id,
                text=dashboard,
                parse_mode="Markdown",
                reply_markup=ReplyKeyboardMarkup(keyboard["keyboard"], resize_keyboard=True)
            )
    except Exception as e:
        logger.error(f"Error sending start message: {e}")
        await context.bot.send_message(
            chat_id=user_id,
            text=dashboard,
            parse_mode="Markdown",
            reply_markup=ReplyKeyboardMarkup(keyboard["keyboard"], resize_keyboard=True)
        )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages (button presses)"""
    text = update.message.text
    
    # Map tombol ke command handler
    button_map = {
        "⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ": vip_rapikatntxt,
        "⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ": vip_msgtotxt,
        "⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ": vip_txttovcf,
        "⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ": vip_xlstovcf,
        "⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ": vip_vcftotxt,
        "⛓️ ꜱᴘʟɪᴛ ꜰɪʟᴇ": vip_bagivcf,
        "⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ": vip_gabungfile,
        "⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ": vip_renamekontak,
        "⛓️ ᴀᴍʙɪʟ ɴᴀᴍᴀ ꜰɪʟᴇ": vip_cekkontak,
        "⛓️ ʙᴜᴀᴛ ɴᴀᴍᴀ": cmd_fitur,
        "⛓️ ᴀᴅᴍ & ɴᴀᴠʏ": cmd_bantuan,
        "⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ": vip_renamefile,
        "⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ": vip_hitungfile,
        "🎁 Redeem Code": cmd_bantuan
    }
    
    if text in button_map:
        await button_map[text](update, context)
    else:
        await update.message.reply_text("Gunakan tombol dibawah ya Kak! 😊")

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.error(f"Update {update} caused error {context.error}")

def main():
    """Start the bot"""
    app = Application.builder().token(CONFIG["token"]).build()
    
    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("me", cmd_me))
    app.add_handler(CommandHandler("bantuan", cmd_bantuan))
    app.add_handler(CommandHandler("fitur", cmd_fitur))
    app.add_handler(CommandHandler("help", cmd_bantuan))
    
    # Message handler untuk button presses
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Error handler
    app.add_error_handler(error_handler)
    
    logger.info("🎌 Iqbal CV Bot Python - Starting...")
    app.run_polling()

if __name__ == "__main__":
    main()
