# Iqbal CV Bot - Python Config
import os
from dotenv import load_dotenv

load_dotenv()

CONFIG = {
    "token": os.getenv("BOT_TOKEN", "8411014638:AAFfzvaOIwWK9_6JY784IuVRqCzgXGp1fwg"),
    "owner": [8317563450],  # Iqbaldev
    "ownerUsername": "Iqbaldev",
    "groups": {
        "main": "agentviber12",
        "cv": "channelviber"
    }
}

# Database paths
DB_USERS = "database.json"
DB_REDEEM = "redeem.json"

# Telegram API
TELEGRAM_API = "https://api.telegram.org/bot"
