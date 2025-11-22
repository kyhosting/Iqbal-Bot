#!/usr/bin/env python3
"""Iqbal CV Bot - Python Version (COMPLETE dengan semua 18 features)"""
import asyncio
import logging
from telegram import Update, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, filters, 
    ContextTypes, ConversationHandler, CallbackQueryHandler
)
from config_py import CONFIG
from helpers import *
from verification import check_group_membership, verify_group_access, handle_verify_again
from commands.user_commands import cmd_me, cmd_bantuan, cmd_fitur, cmd_cekid, cmd_viplist, cmd_clear
from redeem_system import redeem_start, redeem_input, REDEEM_INPUT
from owner_commands import owner_menu, handle_owner_input, owner_list_codes, owner_list_users
from vip_commands import handle_vip_command, handle_file_message, handle_text_message, handle_extract_nomor

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
        db_user = create_user(
            user_id,
            user.first_name,
            user.username,
            user_id in CONFIG["owner"]
        )
    
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
    """Handle all message types"""
    text = update.message.text or ""
    user_id = update.effective_user.id
    
    # Check if it's a button press - Updated keyboards with small caps
    button_commands = {
        "⛓️ ꜱᴛᴀᴛᴜꜱ ⛓️": lambda u, c: cmd_me(u, c),
        "⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ ⛓️": lambda u, c: handle_vip_command(u, c, 'txttovcf'),
        "⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ ⛓️": lambda u, c: handle_vip_command(u, c, 'vcftotxt'),
        "⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ ⛓️": lambda u, c: handle_vip_command(u, c, 'rapikatntxt'),
        "⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ ⛓️": lambda u, c: handle_vip_command(u, c, 'gabungfile'),
        "⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ ⛓️": lambda u, c: handle_vip_command(u, c, 'xlstovcf'),
        "⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️": lambda u, c: handle_vip_command(u, c, 'rename_file'),
        "⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️": lambda u, c: handle_vip_command(u, c, 'rename_kontak'),
        "⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ ⛓️": lambda u, c: handle_vip_command(u, c, 'msgtotxt'),
        "⛓️ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ ⛓️": lambda u, c: handle_extract_nomor(u, c),
        "⛓️ ʜɪᴛᴜɴɢ ᴋᴏɴᴛᴀᴋ ⛓️": lambda u, c: handle_vip_command(u, c, 'hitung'),
        "⛓️ ᴄᴇᴋ ɴᴀᴍᴀ ᴋᴏɴᴛᴀᴋ ⛓️": lambda u, c: handle_vip_command(u, c, 'cek_nama'),
        "⛓️ ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ ⛓️": lambda u, c: handle_vip_command(u, c, 'admin'),
        "🎁 ʀᴇᴅᴇᴇᴍ ᴄᴏᴅᴇ ⛓️": lambda u, c: redeem_start(u, c),
        "ᴍᴇɴᴜ ᴏᴡɴᴇʀ ⛓️": lambda u, c: owner_menu(u, c),
    }
    
    if text in button_commands:
        await button_commands[text](update, context)
        return
    
    # Check if handling VIP command
    if update.message.document:
        await handle_file_message(update, context)
    else:
        # Could be text input for VIP command or redeem
        from vip_commands import vip_sessions
        if user_id in vip_sessions and 'command' in vip_sessions[user_id]:
            await handle_text_message(update, context)
        elif text.lower() == 'batal':
            await update.message.reply_text("❌ *Dibatalkan ya Kak* 😊", parse_mode="Markdown")
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
    app.add_handler(CommandHandler("cekid", cmd_cekid))
    app.add_handler(CommandHandler("viplist", cmd_viplist))
    app.add_handler(CommandHandler("clear", cmd_clear))
    app.add_handler(CommandHandler("owner", owner_menu))
    
    # Redeem flow
    app.add_handler(ConversationHandler(
        entry_points=[
            CommandHandler("redeem", redeem_start),
            MessageHandler(filters.TEXT & filters.Regex(r"^🎁 Redeem Code$"), redeem_start)
        ],
        states={
            REDEEM_INPUT: [MessageHandler(filters.TEXT, redeem_input)]
        },
        fallbacks=[]
    ))
    
    # Callback queries
    app.add_handler(CallbackQueryHandler(handle_verify_again, pattern="^verify_again$"))
    app.add_handler(CallbackQueryHandler(owner_menu, pattern="^owner_"))
    
    # Message handlers
    app.add_handler(MessageHandler(filters.Document.ALL, handle_file_message))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Error handler
    app.add_error_handler(error_handler)
    
    logger.info("🎌 Iqbal CV Bot Python - Starting...")
    app.run_polling()

if __name__ == "__main__":
    main()
