"""Iqbal CV Bot - Python Version"""
import logging
from telegram import Update, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
from config_py import CONFIG
from helpers import *

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
        is_owner = is_owner(user_id)
        db_user = create_user(user_id, user.first_name, user.username, is_owner)
    
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

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    help_text = """
🎌 *Iqbal CV Bot - Bantuan*

🎁 *Fitur Utama:*
⛓️ TXT ↔ VCF (Convert)
⛓️ XLS → VCF
⛓️ Split & Merge Files
⛓️ Clean & Rename Files

💎 *Untuk akses VIP:*
1. Join @agentviber12
2. Join @channelviber  
3. Ketik /start
4. Dapatkan trial 1 hari gratis!

❓ *Pertanyaan?*
Hub @Iqbaldev

Semoga membantu! 😊
"""
    await update.message.reply_text(help_text, parse_mode="Markdown")

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.error(f"Update {update} caused error {context.error}")

def main():
    """Start the bot"""
    app = Application.builder().token(CONFIG["token"]).build()
    
    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    
    # Error handler
    app.add_error_handler(error_handler)
    
    logger.info("🎌 Iqbal CV Bot Python - Starting...")
    app.run_polling()

if __name__ == "__main__":
    main()
