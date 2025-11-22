import os
import re
import sys
import subprocess
import vobject
import json
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from pyrogram import Client, filters, idle
from pyrogram.types import KeyboardButton, ReplyKeyboardMarkup
from pyrogram.errors import FloodWait
from config import API_ID, API_HASH, BOT_TOKEN, OWNER_ID
import platform
import time

#====================
#Initiator Install dbs
#====================

bot = Client(
    name="OKTOCV",
    api_id=API_ID,
    api_hash=API_HASH,
    bot_token=BOT_TOKEN
)

START_TIME = time.time()
#====================
#Function Converting! - UNLIMITED VERSION
#====================

def get_runtime():
    seconds = int(time.time() - START_TIME)
    days, seconds = divmod(seconds, 86400)
    hours, seconds = divmod(seconds, 3600)
    minutes, seconds = divmod(seconds, 60)
    return f"{days}d {hours}h {minutes}m {seconds}s"

def remove_numbers(name):
    return re.sub(r'\d+', '', name).strip()

def remove_emojis(text):
    emoji_pattern = re.compile(
        "[" 
        u"\U0001F600-\U0001F64F"  # Emoticons
        u"\U0001F300-\U0001F5FF"  # Symbols & Pictographs
        u"\U0001F680-\U0001F6FF"  # Transport & Map Symbols
        u"\U0001F1E0-\U0001F1FF"  # Flags (iOS)
        u"\U00002702-\U000027B0"  # Dingbats
        u"\U000024C2-\U0001F251" 
        "]+", flags=re.UNICODE
    )
    return emoji_pattern.sub(r'', text)

# ========== FUNGSI UNLIMITED UNTUK FILE BESAR ==========

def read_vcf_unlimited(file_path):
    """Membaca VCF file besar tanpa batas - memory efficient"""
    contacts = []
    current_vcard = []
    
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            current_vcard.append(line)
            if line.strip() == "END:VCARD":
                try:
                    vcard_text = ''.join(current_vcard)
                    vcard = vobject.readOne(vcard_text)
                    contacts.append(vcard)
                except Exception as e:
                    print(f"⚠️ Error parsing vcard: {e}")
                finally:
                    current_vcard = []
    
    return contacts

def read_vcf_streaming(file_path):
    """Generator untuk membaca VCF file sangat besar - paling efficient"""
    current_vcard = []
    
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            current_vcard.append(line)
            if line.strip() == "END:VCARD":
                try:
                    vcard_text = ''.join(current_vcard)
                    vcard = vobject.readOne(vcard_text)
                    yield vcard
                except Exception as e:
                    print(f"⚠️ Error parsing vcard: {e}")
                finally:
                    current_vcard = []

def write_vcf_unlimited(contacts, file_path):
    """Menulis VCF file besar tanpa batas - memory efficient"""
    with open(file_path, 'w', encoding='utf-8') as file:
        for i, contact in enumerate(contacts):
            try:
                file.write(contact.serialize())
                if i % 1000 == 0:
                    file.flush()
            except Exception as e:
                print(f"⚠️ Error writing contact {i}: {e}")

def count_contacts_in_vcf_unlimited(file_path):
    """Menghitung kontak dalam file besar tanpa load ke memory"""
    count = 0
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            if line.strip() == "END:VCARD":
                count += 1
    return count

def count_contacts_in_txt_unlimited(file_path):
    """Menghitung nomor dalam file TXT besar"""
    count = 0
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            if re.search(r'\d', line):
                count += 1
    return count

def rename_contacts(contacts, start_index=1):
    renamed_contacts = []
    for index, contact in enumerate(contacts, start=start_index):
        if hasattr(contact, 'fn'):
            clean_name = remove_numbers(contact.fn.value)
            clean_name = remove_emojis(clean_name)
            contact.fn.value = f'{clean_name} {str(index).zfill(4)}'
        renamed_contacts.append(contact)
    return renamed_contacts

def split_vcf_unlimited(input_file, newna, contacts_per_file=100):
    """Split VCF file besar tanpa batas - memory efficient"""
    contacts_generator = read_vcf_streaming(input_file)
    
    file_count = 0
    dump_ = []
    current_chunk = []
    global_index = 1
    
    for i, contact in enumerate(contacts_generator, 1):
        current_chunk.append(contact)
        
        if len(current_chunk) >= contacts_per_file:
            file_count += 1
            output_file = f'{newna}-{file_count}.vcf'
            
            renamed_chunk = rename_contacts(current_chunk, start_index=global_index)
            write_vcf_unlimited(renamed_chunk, output_file)
            dump_.append(output_file)
            
            global_index += len(current_chunk)
            current_chunk = []
    
    if current_chunk:
        file_count += 1
        output_file = f'{newna}-{file_count}.vcf'
        renamed_chunk = rename_contacts(current_chunk, start_index=global_index)
        write_vcf_unlimited(renamed_chunk, output_file)
        dump_.append(output_file)
    
    return dump_

def split_vcf_session_unlimited(input_file, newna, contacts_per_file=100, start_index=1):
    contacts_generator = read_vcf_streaming(input_file)
    
    dump_ = []
    global_index = start_index
    file_index = 1
    current_chunk = []
    
    for contact in contacts_generator:
        current_chunk.append(contact)
        
        if len(current_chunk) >= contacts_per_file:
            output_file = f"{newna}-{file_index}.vcf"
            renamed_chunk = rename_contacts(current_chunk, start_index=global_index)
            write_vcf_unlimited(renamed_chunk, output_file)
            dump_.append(output_file)
            
            global_index += len(current_chunk)
            current_chunk = []
            file_index += 1
    
    if current_chunk:
        output_file = f"{newna}-{file_index}.vcf"
        renamed_chunk = rename_contacts(current_chunk, start_index=global_index)
        write_vcf_unlimited(renamed_chunk, output_file)
        dump_.append(output_file)
        global_index += len(current_chunk)
    
    return {
        "files": dump_,
        "next_index": global_index
    }

def split_cut_vcf_unlimited(input_file, namectc, dibagi_menjadi_bagian=1):
    """Membagi VCF besar menjadi beberapa bagian - memory efficient"""
    total_contacts = count_contacts_in_vcf_unlimited(input_file)
    contacts_per_file = (total_contacts + dibagi_menjadi_bagian - 1) // dibagi_menjadi_bagian
    
    contacts_generator = read_vcf_streaming(input_file)
    
    dump_ = []
    file_index = 1
    current_contacts = []
    global_index = 1
    
    for contact in contacts_generator:
        current_contacts.append(contact)
        
        if len(current_contacts) >= contacts_per_file and file_index < dibagi_menjadi_bagian:
            output_file = f'{namectc.replace(".vcf", "")}-{file_index}.vcf'
            renamed_chunk = rename_contacts(current_contacts, global_index)
            write_vcf_unlimited(renamed_chunk, output_file)
            dump_.append(output_file)
            
            global_index += len(current_contacts)
            current_contacts = []
            file_index += 1
    
    if current_contacts:
        output_file = f'{namectc.replace(".vcf", "")}-{file_index}.vcf'
        renamed_chunk = rename_contacts(current_contacts, global_index)
        write_vcf_unlimited(renamed_chunk, output_file)
        dump_.append(output_file)
    
    return dump_

def merge_vcf_files_unlimited(file_paths, output_file_path):
    """Merge multiple VCF files tanpa batas - streaming"""
    with open(f"{output_file_path}.vcf", 'w', encoding='utf-8') as outfile:
        for file_path in file_paths:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as infile:
                    while True:
                        chunk = infile.read(8192)
                        if not chunk:
                            break
                        outfile.write(chunk)
                outfile.write("\n")

def create_vcf_entry(phone_number, contact_name):
    vcf_entry = f"""BEGIN:VCARD
VERSION:3.0
FN:{contact_name}
TEL;TYPE=CELL:{"+" if not str(phone_number).startswith("0") else ""}{phone_number}
END:VCARD
"""
    return vcf_entry

def create_vcf_file_unlimited(phone_numbers, ctcname, file_name, start_index=1):
    """Create VCF file untuk jumlah kontak sangat besar"""
    with open(file_name, "w", encoding='utf-8') as file:
        for i, phone_number in enumerate(phone_numbers, start=start_index):
            clean_number = re.sub(r'[^\d+]', '', str(phone_number))
            if clean_number and len(clean_number) >= 8:
                vcf_entry = create_vcf_entry(clean_number, f"{ctcname}-{str(i).zfill(4)}")
                file.write(vcf_entry + "\n")
            
            if i % 1000 == 0:
                file.flush()
    
    return file_name

def extract_numbers_from_file_unlimited(file_path):
    """Extract numbers dari file besar"""
    numbers = []
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            found_numbers = re.findall(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]', line)
            numbers.extend(found_numbers)
    return numbers

def process_filesgbg_unlimited(file_paths, output_file):
    """Process multiple files tanpa batas"""
    all_numbers = set()
    
    for file_path in file_paths:
        if os.path.isfile(file_path):
            numbers = extract_numbers_from_file_unlimited(file_path)
            all_numbers.update(numbers)
    
    with open(output_file, 'w', encoding='utf-8') as file:
        for number in sorted(all_numbers):
            file.write(number + '\n')

def extract_phone_numbers_unlimited(vcf_file_path, output_txt_file_path):
    """Extract nomor dari VCF besar - streaming"""
    contacts_generator = read_vcf_streaming(vcf_file_path)
    
    with open(output_txt_file_path, 'w', encoding='utf-8') as txt_file:
        count = 0
        for vcard in contacts_generator:
            if hasattr(vcard, 'tel'):
                for tel in vcard.tel_list:
                    txt_file.write(tel.value + '\n')
                    count += 1
            
            if count % 1000 == 0:
                txt_file.flush()
    
    return count

def hapus_spasi_antar_nomor_unlimited(file_path):
    """Clean file TXT besar"""
    temp_file = file_path + ".temp"
    
    with open(file_path, 'r', encoding='utf-8') as infile, \
         open(temp_file, 'w', encoding='utf-8') as outfile:
        
        for line in infile:
            # Hapus spasi, tanda baca
            cleaned_line = ''.join(line.split())
            cleaned_line = re.sub(r'[\(\)\-\/]', '', cleaned_line)
            if cleaned_line:
                outfile.write(cleaned_line + '\n')
    
    os.replace(temp_file, file_path)

# ========== AUTO DETECTION FUNCTIONS ==========

def should_use_unlimited_mode(file_path):
    """Deteksi apakah file perlu menggunakan mode unlimited"""
    try:
        file_size = os.path.getsize(file_path)
        return file_size > 5 * 1024 * 1024  # 5MB
    except:
        return False

def get_file_contact_count(file_path):
    """Dapatkan jumlah kontak dengan metode yang sesuai"""
    if should_use_unlimited_mode(file_path):
        if file_path.endswith('.vcf'):
            return count_contacts_in_vcf_unlimited(file_path)
        else:
            return count_contacts_in_txt_unlimited(file_path)
    else:
        # Gunakan fungsi original untuk file kecil
        if file_path.endswith('.vcf'):
            contacts = list(read_vcf_unlimited(file_path))
            return len(contacts)
        else:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                numbers = re.findall(r'\d+', content)
                return len(numbers)

# ========== FUNGSI COMPATIBILITY (ORIGINAL) ==========
# Tetap simpan fungsi original untuk compatibility

def read_vcf(file_path):
    """Original function untuk file kecil"""
    return read_vcf_unlimited(file_path)

def write_vcf(contacts, file_path):
    """Original function untuk file kecil"""
    return write_vcf_unlimited(contacts, file_path)

def count_contacts_in_vcf(file_path):
    """Original function"""
    return count_contacts_in_vcf_unlimited(file_path)

def count_contacts_in_txt(file_path):
    """Original function"""
    return count_contacts_in_txt_unlimited(file_path)

def split_vcf(input_file, newna, contacts_per_file=100):
    """Original function"""
    return split_vcf_unlimited(input_file, newna, contacts_per_file)

def split_vcf_session(input_file, newna, contacts_per_file=100, start_index=1):
    """Original function"""
    return split_vcf_session_unlimited(input_file, newna, contacts_per_file, start_index)

def split_cut_vcf(input_file, namectc, dibagi_menjadi_bagian=1):
    """Original function"""
    return split_cut_vcf_unlimited(input_file, namectc, dibagi_menjadi_bagian)

def merge_vcf_files(file_paths, output_file_path):
    """Original function"""
    return merge_vcf_files_unlimited(file_paths, output_file_path)

def create_vcf_file(phone_numbers, ctcname, file_name, start_index=1):
    """Original function"""
    return create_vcf_file_unlimited(phone_numbers, ctcname, file_name, start_index)

def extract_numbers_from_file(file_path):
    """Original function"""
    return extract_numbers_from_file_unlimited(file_path)

def process_filesgbg(file_paths, output_file):
    """Original function"""
    return process_filesgbg_unlimited(file_paths, output_file)

def extract_phone_numbers(vcf_file_path, output_txt_file_path):
    """Original function"""
    return extract_phone_numbers_unlimited(vcf_file_path, output_txt_file_path)

def hapus_spasi_antar_nomor(file_path):
    """Original function"""
    return hapus_spasi_antar_nomor_unlimited(file_path)
    
#====================
#Database and Coin
#====================

class dbs:
    _buyer = {}

class session:
    split_counter = 1
    file_counter = 1
    
def load_data():
    try:
        with open("data.json", "r") as f:
            data = json.load(f)
            cleaned_data = {}
            for uid, value in data.items():
                if not isinstance(value, dict):
                    continue
                expired = value.get("expired")
                if expired:
                    try:
                        expired = datetime.strptime(expired, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        expired = datetime.now()
                    value["expired"] = expired
                cleaned_data[int(uid)] = value
            return cleaned_data
    except FileNotFoundError:
        return {}
    
def save_data():
    def serializer(obj):
        if isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%d %H:%M:%S")
        return obj

    with open('data.json', 'w') as file:
        json.dump(dbs._buyer, file, indent=2, default=serializer)

def parse_timedelta(time_str):
    pattern = r'(\d+)([hmb])'
    time_dict = {'h': 'days', 'm': 'weeks', 'b': 'months'}
    matches = re.findall(pattern, time_str)
    if not matches:
        return None
    kwargs = {'days': 0, 'weeks': 0, 'months': 0}
    for value, unit in matches:
        kwargs[time_dict[unit]] += int(value)
    return kwargs

def add_time_delta(current_time, time_str):
    delta_dict = parse_timedelta(time_str)
    if not delta_dict:
        return None
    new_time = current_time + timedelta(days=delta_dict['days'], weeks=delta_dict['weeks'])
    new_time = new_time + relativedelta(months=delta_dict['months'])
    return new_time
    
session_lanjutan = {
    "split_counter": 1,   # untuk penomoran kontak
    "file_counter": 1     # untuk nama file
}

def split_vcf_custom_start_session(input_file, newna, contacts_per_file=100, start_number=1, start_file=1):
    contacts = list(read_vcf(input_file))
    total_contacts = len(contacts)
    file_count = (total_contacts + contacts_per_file - 1) // contacts_per_file
    dump_ = []
    global_index = start_number
    file_index = start_file

    for _ in range(file_count):
        start = (file_index - start_file) * contacts_per_file
        end = min(start + contacts_per_file, total_contacts)
        chunk = rename_contacts(contacts[start:end], start_index=global_index)
        filename = f"{newna}-{file_index}.vcf"
        write_vcf(chunk, filename)
        dump_.append(filename)
        global_index += len(chunk)
        file_index += 1

    return dump_, global_index, file_index

#====================
#Filters User And More
#====================

home_keyboard = ReplyKeyboardMarkup([
    [KeyboardButton("💎 Status 💎")],
    [KeyboardButton("📨 ADMIN 📨"), KeyboardButton("🚧 RAPIKAN TXT 🚧")],
    [KeyboardButton("📊 POTONG VCF 📊"), KeyboardButton("📊 POTONG LANJUTAN 📊")],
    [KeyboardButton("🪓 BAGI VCF 🪓"), KeyboardButton("🪓 BAGI LANJUTAN 🪓")],
    [KeyboardButton("️📨 MSG to TXT 📨")],
    [KeyboardButton("🏷️ TXT to VCF 🏷️"), KeyboardButton("🚀 XLS to VCF 🚀")],
    [KeyboardButton("♻️ VCF to TXT ♻️"), KeyboardButton("🗄️ Gabung TXT 🗄️")],
    [KeyboardButton("🗄️ Gabung VCF 🗄️"), KeyboardButton("🔢 Hitung Kontak 🔢")],
    [KeyboardButton("🔍 Cek Nama Kontak 🔍")]
], resize_keyboard=True)

def on_msg(pilter=None):
    def wrapper(func):
        @bot.on_message(pilter)
        async def wrapped_func(client, message):
            try:
                await func(client, message)
            except Exception as err:
                await message.reply(f"**❌ Error:**\n```{err}```", parse_mode="Markdown")
        return wrapped_func
    return wrapper

def on_txt(message):
    if message.document:
        if message.document.file_name.endswith(".txt"):
            return True
    return False

def on_vcf(message):
    if message.document:
        if message.document.file_name.endswith(".vcf"):
            return True
    return False

def on_xls(message):
    if message.document:
        if message.document.file_name.endswith(".xls") or message.document.file_name.endswith(".xlsx"):
            return True
    return False

def ngecek_(user_id):
    if user_id not in dbs._buyer:
        return False
    data = dbs._buyer[user_id]
    if not data.get("expired"):
        return False
    return data["expired"] > datetime.now()

def batals(text):
    if text == "❌ Batal ❌":
        return True
    return False

def load_all_users():
    try:
        with open("users_all.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_all_users(data):
    with open("users_all.json", "w") as f:
        json.dump(data, f, indent=2)
        
#====================
#Core Modules initiator
#====================
@on_msg(filters.command("start") & filters.private)
async def start_(client, message):
    user_id = str(message.from_user.id)
    name = f"{message.from_user.first_name} {message.from_user.last_name or ''}".strip()
    username = f"@{message.from_user.username}" if message.from_user.username else "-"

    # Simpan semua user yang pernah start
    all_users = load_all_users()
    if user_id not in all_users:
        all_users[user_id] = {
            "name": name,
            "username": username,
            "first_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        save_all_users(all_users)

    # Salam singkat + info
    await message.reply(
        f"👋 **Halo {name}!**\n\n"
        f"Selamat datang di **Bot Konversi Kontak**\\.\n"
        f"Ketik `/help` untuk melihat daftar fitur lengkap\\.",
        reply_markup=home_keyboard,
        parse_mode="Markdown"
    )

#===========[RAPIHKAN TXT]

@on_msg(filters.command("🚧 RAPIKAN TXT 🚧", "") & filters.private)
async def ngecremotate(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    ask1 = await client.ask(text="**📤 Silakan kirim file TXT yang akan dirapihkan**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not on_txt(ask1) or batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**\n\nFile harus berformat \\.txt", reply_markup=home_keyboard, parse_mode="Markdown")
    file = await ask1.download()
    hapus_spasi_antar_nomor(file)
    try:
        await message.reply_document(file)
        await message.reply("**✅ Proses Selesai**\n\nFile TXT telah berhasil dirapihkan", reply_markup=home_keyboard, parse_mode="Markdown")
    except FloodWait as e:
        await asyncio.sleep(e.value)
        await message.reply_document(file)
        await message.reply("**✅ Proses Selesai**\n\nFile TXT telah berhasil dirapihkan", reply_markup=home_keyboard, parse_mode="Markdown")
    except:
        pass
    os.remove(file)

#===========[STATUS]
@on_msg(filters.command("💎 Status 💎", "") & filters.private)
async def status_user(client, message):
    user_id = message.from_user.id

    # Pastikan user terdaftar
    if user_id not in dbs._buyer:
        return await message.reply(
            "**❌ Akses Ditolak**\n\nAnda belum memiliki akses\\.\nHubungi @Deckro08 untuk mendapatkan akses\\.",
            parse_mode="Markdown"
        )

    data = dbs._buyer[user_id]
    nama = f"{message.from_user.first_name} {message.from_user.last_name or ''}".strip()
    username = f"@{message.from_user.username}" if message.from_user.username else data.get("username", "-")
    saldo = data.get("saldo", 0)

    expired = data.get("expired")
    if isinstance(expired, str):
        try:
            expired = datetime.strptime(expired, "%Y-%m-%d %H:%M:%S.%f")
        except:
            try:
                expired = datetime.strptime(expired, "%Y-%m-%d %H:%M:%S")
            except:
                expired = None
    expired_str = expired.strftime("%Y-%m-%d %H:%M:%S") if expired else "-"

    txt = (
        f"**💎 STATUS AKUN**\n\n"
        f"**🆔 ID:** `{user_id}`\n"
        f"**👤 Nama:** `{nama}`\n"
        f"**📱 Username:** `{username}`\n"
        f"**💰 Saldo:** `{saldo}`\n"
        f"**⏰ Masa Aktif:** `{expired_str}`"
    )

    await message.reply(txt, reply_markup=home_keyboard, parse_mode="Markdown")

#===========[MSG TO TXT]

@on_msg(filters.command("️📨 MSG to TXT 📨", "") & filters.private)
async def ngecreate(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    ask1 = await client.ask(text="**📝 Masukkan nomor telepon yang akan dikonversi ke file TXT**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    ask2 = await client.ask(text="**📄 Masukkan nama untuk file baru**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if batals(ask2.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    newname = ask2.text
    with open(f"{newname}.txt", 'w') as file:
        file.write(ask1.text)
    try:
        await message.reply_document(f"{newname}.txt")
        await message.reply("**✅ Konversi Berhasil**\n\nPesan telah berhasil dikonversi ke file TXT", reply_markup=home_keyboard, parse_mode="Markdown")
    except FloodWait as e:
        await asyncio.sleep(e.value)
        await message.reply_document(f"{newname}.txt")
        await message.reply("**✅ Konversi Berhasil**\n\nPesan telah berhasil dikonversi ke file TXT", reply_markup=home_keyboard, parse_mode="Markdown")
    except:
        pass
    return os.remove(f"{newname}.txt")

#===========[ADM DAN NAVY]

@on_msg(filters.command("📨 ADMIN 📨", "") & filters.private)
async def ngecreateadmin(client, message):
    user_id = message.from_user.id
    if not ngecek_(user_id):
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")

    # Minta nomor admin saja
    ask1 = await client.ask(
        text="**📝 Masukkan nomor admin**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )

    if batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")

    dmp_adm = ask1.text.split()

    # Buat file VCF admin
    file_name = 'ADMIN.vcf'
    with open(file_name, "w") as file:
        for index, phone_number in enumerate(dmp_adm, start=1):
            vcf_entry = create_vcf_entry(phone_number, f"ADMIN-{str(index).zfill(4)}")
            file.write(vcf_entry + "\n")

    try:
        await message.reply_document(file_name)
        await message.reply(
            "**✅ File ADMIN Berhasil Dibuat**\n\nFile kontak ADMIN telah siap digunakan",
            reply_markup=home_keyboard,
            parse_mode="Markdown"
        )
    except FloodWait as e:
        await asyncio.sleep(e.value)
        await message.reply_document(file_name)
    except:
        pass
    os.remove(file_name)

#===========[XLS TO VCF]

@on_msg(filters.command("🚀 XLS to VCF 🚀", "") & filters.private)
async def ngexlseate(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    ask1 = await client.ask(text="**📤 Kirim file Excel \\(XLS/XLSX\\) yang akan dikonversi**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not on_xls(ask1):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    file = await ask1.download()
    ask2 = await client.ask(text="**📄 Masukkan nama untuk file baru\\\nKlik *Skip* untuk menggunakan nama file asli**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not ask2.text or batals(ask2.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    elif ask2.text == "⭕️ Skip ⭕️":
        newname = ask1.document.file_name.replace(".txt", "")
    else:
        newname = ask2.text
    ask3 = await client.ask(text="**🏷️ Masukkan nama kontak\\\nKlik *Skip* untuk menggunakan nama file**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not ask3.text or batals(ask3.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    elif ask3.text == "⭕️ Skip ⭕️":
        newnamk = ask2.text
    else:
        newnamk = ask3.text
    cont_all = []
    df = pd.read_excel(file)
    ls_cont = df.values.flatten().tolist()
    for isi in ls_cont:
        isi_ = str(isi).replace("+", "")
        if isi_.isnumeric():
            cont_all.append(isi_)
    if not cont_all:
        return await message.reply("**❌ Data Tidak Ditemukan**\n\nTidak ada kontak yang dapat diproses", parse_mode="Markdown")
    dump_ = create_vcf_file(cont_all, newnamk, f'{newname}.vcf', start_index=1)
    try:
        await message.reply_document(dump_)
        await message.reply("**✅ Konversi Berhasil**\n\nFile Excel telah berhasil dikonversi ke VCF", reply_markup=home_keyboard, parse_mode="Markdown")
    except FloodWait as e:
        await asyncio.sleep(e.value)
        await message.reply_document(dump_)
        await message.reply("**✅ Konversi Berhasil**\n\nFile Excel telah berhasil dikonversi ke VCF", reply_markup=home_keyboard, parse_mode="Markdown")
    except:
        pass
    os.remove(dump_)
    os.remove(file)

#===========[TXT TO VCF]

@on_msg(filters.command("🏷️ TXT to VCF 🏷️", "") & filters.private)
async def ngecreate(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    ask1 = await client.ask(text="**📤 Kirim file TXT yang akan dikonversi**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not on_txt(ask1) or batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    file = await ask1.download()
    ask2 = await client.ask(text="**📄 Masukkan nama untuk file baru\\\nKlik *Skip* untuk menggunakan nama file asli**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not ask2.text or batals(ask2.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    elif ask2.text == "⭕️ Skip ⭕️":
        newname = ask1.document.file_name.replace(".txt", "")
    else:
        newname = ask2.text
    ask3 = await client.ask(text="**🏷️ Masukkan nama kontak\\\nKlik *Skip* untuk menggunakan nama file**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not ask3.text or batals(ask3.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    elif ask3.text == "⭕️ Skip ⭕️":
        newnamk = ask2.text
    else:
        newnamk = ask3.text
    cont_all = []
    with open(file, 'r') as f:
        ls_cont = f.read().split()
        for isi in ls_cont:
            isi_ = isi.replace("+", "")
            if isi_.isnumeric():
                cont_all.append(isi_)
    if not cont_all:
        return await message.reply("**❌ Data Tidak Ditemukan**\n\nTidak ada kontak yang dapat diproses", parse_mode="Markdown")
    dump_ = create_vcf_file(cont_all, newnamk, f'{newname}.vcf')
    try:
        await message.reply_document(dump_)
    except FloodWait as e:
        await asyncio.sleep(e.value)
        await message.reply_document(dump_)
    except:
        pass
    await message.reply("**✅ Konversi Berhasil**\n\nFile TXT telah berhasil dikonversi ke VCF", reply_markup=home_keyboard, parse_mode="Markdown")
    os.remove(dump_)
    os.remove(file)
            
            
#===========[BAGI VCF]

@on_msg(filters.command("🪓 BAGI VCF 🪓", "") & filters.private)
async def ngevcfkan(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    ask1 = await client.ask(text="**📤 Kirim file VCF yang akan dibagi**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not on_vcf(ask1):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    file = await ask1.download()
    ask2 = await client.ask(text="**📄 Masukkan nama untuk file baru\\\nKlik *Skip* untuk menggunakan nama file asli**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not ask2.text or batals(ask2.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    elif ask2.text == "⭕️ Skip ⭕️":
        newname = ask1.document.file_name.replace(".cvf", "")
    else:
        newname = ask2.text
    ask3 = await client.ask(text="**🔢 Masukkan jumlah bagian file yang diinginkan**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not ask3.text or not ask3.text.isnumeric() or ask3.text == "0":
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    hsl = split_cut_vcf(file, newname, int(ask3.text))
    for isi in hsl:
        try:
            await message.reply_document(isi)
        except FloodWait as e:
            await asyncio.sleep(e.value)
            await message.reply_document(isi)
        except:
            pass
        os.remove(isi)
    os.remove(file)
    try:
        await message.reply("**✅ Proses Selesai**\n\nFile VCF telah berhasil dibagi", reply_markup=home_keyboard, parse_mode="Markdown")
    except:
        pass

#===========[POTONG VCF]
@on_msg(filters.command("📊 POTONG VCF 📊", "") & filters.private)
async def potong_vcf_berlanjut(client, message):
    user_id = message.from_user.id
    if not ngecek_(user_id):
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Deckro08", reply_markup=home_keyboard, parse_mode="Markdown")

    # Reset counter saat memulai proses baru
    session.split_counter = 1
    session.file_counter = 1

    await lanjutkan_potong(client, message, user_id)
    
async def lanjutkan_potong(client, message, user_id):
    ask1 = await client.ask(
        text="**📤 Kirim file VCF yang akan dipotong**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    if not on_vcf(ask1) or batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")

    file = await ask1.download()

    ask2 = await client.ask(
        text="**📎 Masukkan nama file output \\(tanpa ekstensi\\)**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    if batals(ask2.text):
        os.remove(file)
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")

    if ask2.text == "⭕️ Skip ⭕️":
        newname = os.path.splitext(ask1.document.file_name)[0]
    else:
        newname = ask2.text

    ask3 = await client.ask(
        text="**🔢 Masukkan jumlah kontak per file**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    if batals(ask3.text) or not ask3.text.isnumeric() or int(ask3.text) <= 0:
        os.remove(file)
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")

    kontak_per_file = int(ask3.text)

    hasil = split_vcf_session(
    file, newname, kontak_per_file,
    start_index=session.split_counter,
    start_file=session.file_counter
)

    for f in hasil["files"]:
        try:
            await message.reply_document(f)
        except FloodWait as e:
            await asyncio.sleep(e.value)
            await message.reply_document(f)
        except:
            pass
        os.remove(f)

    session.split_counter = hasil["next_index"]
    session.file_counter = hasil["next_file_index"]
    os.remove(file)

    lanjut = await client.ask(
        text=f"**✅ Pemotongan Selesai**\n\nTerkirim hingga kontak `{session.split_counter - 1:04d}`\\.\nLanjutkan dengan file berikutnya?",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([
            [KeyboardButton("➕ Lanjut"), KeyboardButton("✅ Selesai")]
        ], resize_keyboard=True),
        parse_mode="Markdown"
    )

    if lanjut.text == "➕ Lanjut":
        return await lanjutkan_potong(client, message, user_id)

    return await message.reply("**✅ Semua Proses Telah Selesai**", reply_markup=home_keyboard, parse_mode="Markdown")


def split_vcf_session(input_file, newna, contacts_per_file=100, start_index=1, start_file=1):
    contacts = list(read_vcf(input_file))
    total_contacts = len(contacts)
    file_count = (total_contacts + contacts_per_file - 1) // contacts_per_file
    dump_ = []
    global_index = start_index
    file_index = start_file

    for i in range(file_count):
        start = i * contacts_per_file
        end = min(start + contacts_per_file, total_contacts)
        chunk = rename_contacts(contacts[start:end], start_index=global_index)
        filename = f"{newna}-{file_index}.vcf"
        write_vcf(chunk, filename)
        dump_.append(filename)
        global_index += len(chunk)
        file_index += 1

    return {
        "files": dump_,
        "next_index": global_index,
        "next_file_index": file_index
    }

#===========[GABUNG VCF - MODIFIED FOR BULK UPLOAD]
@on_msg(filters.command("🗄️ Gabung VCF 🗄️", "") & filters.private)
async def ngecreategabung(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    
    # Minta user mengirim semua file sekaligus
    ask = await client.ask(
        text="**📤 Silakan kirim SEMUA file VCF yang ingin digabung dalam SATU pesan**\n\nAnda bisa memilih multiple files sekaligus",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([
            [KeyboardButton("❌ Batal ❌")]
        ], resize_keyboard=True)
    )
    
    if batals(ask.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    
    # Collect semua file dari pesan
    allfile = []
    if ask.document and on_vcf(ask):
        file = await ask.download()
        allfile.append(file)
    
    # Cek jika ada media group (multiple files)
    if ask.media_group_id:
        try:
            media_group = await client.get_media_group(ask.chat.id, ask.id)
            for msg in media_group:
                if msg.document and on_vcf(msg):
                    file = await msg.download()
                    allfile.append(file)
        except Exception as e:
            await message.reply(f"**⚠️ Gagal mengambil beberapa file:** ```{e}```", parse_mode="Markdown")
    
    if len(allfile) < 2:
        # Cleanup files jika kurang dari 2
        for f in allfile:
            if os.path.exists(f):
                os.remove(f)
        return await message.reply("**❌ File Tidak Cukup**\n\nMinimal 2 file VCF untuk digabung", reply_markup=home_keyboard, parse_mode="Markdown")
    
    # Minta nama file output
    ask2 = await client.ask(
        text="**📄 Masukkan nama untuk file gabungan**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    
    if batals(ask2.text):
        # Cleanup files
        for f in allfile:
            if os.path.exists(f):
                os.remove(f)
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    
    # Proses penggabungan
    processing_msg = await message.reply(f"**🔄 Memproses {len(allfile)} file...**", parse_mode="Markdown")
    
    try:
        output_filename = f"{ask2.text}.vcf"
        merge_vcf_files_bulk(allfile, output_filename)
        
        # Kirim file hasil gabungan
        await processing_msg.delete()
        await message.reply_document(
            output_filename,
            caption=f"**✅ Penggabungan Berhasil**\n\n**📊 Statistik:**\n• **File digabung:** `{len(allfile)}`\n• **Format:** `VCF`",
            parse_mode="Markdown"
        )
        await message.reply("**✅ Proses Selesai**\n\nSemua file telah berhasil digabung", reply_markup=home_keyboard, parse_mode="Markdown")
        
    except Exception as e:
        await processing_msg.edit(f"**❌ Gagal Menggabungkan**\n\n```{e}```", parse_mode="Markdown")
    finally:
        # Cleanup semua file temporary
        for f in allfile:
            if os.path.exists(f):
                os.remove(f)
        if os.path.exists(output_filename):
            os.remove(output_filename)

#===========[GABUNG TXT - MODIFIED FOR BULK UPLOAD]
@on_msg(filters.command("🗄️ Gabung TXT 🗄️", "") & filters.private)
async def ngecreatetxtgbg(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    
    # Minta user mengirim semua file sekaligus
    ask = await client.ask(
        text="**📤 Silakan kirim SEMUA file TXT yang ingin digabung dalam SATU pesan**\n\nAnda bisa memilih multiple files sekaligus",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([
            [KeyboardButton("❌ Batal ❌")]
        ], resize_keyboard=True)
    )
    
    if batals(ask.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    
    # Collect semua file dari pesan
    allfile = []
    if ask.document and on_txt(ask):
        file = await ask.download()
        allfile.append(file)
    
    # Cek jika ada media group (multiple files)
    if ask.media_group_id:
        try:
            media_group = await client.get_media_group(ask.chat.id, ask.id)
            for msg in media_group:
                if msg.document and on_txt(msg):
                    file = await msg.download()
                    allfile.append(file)
        except Exception as e:
            await message.reply(f"**⚠️ Gagal mengambil beberapa file:** ```{e}```", parse_mode="Markdown")
    
    if len(allfile) < 2:
        # Cleanup files jika kurang dari 2
        for f in allfile:
            if os.path.exists(f):
                os.remove(f)
        return await message.reply("**❌ File Tidak Cukup**\n\nMinimal 2 file TXT untuk digabung", reply_markup=home_keyboard, parse_mode="Markdown")
    
    # Minta nama file output
    ask2 = await client.ask(
        text="**📄 Masukkan nama untuk file gabungan**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    
    if batals(ask2.text):
        # Cleanup files
        for f in allfile:
            if os.path.exists(f):
                os.remove(f)
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    
    # Proses penggabungan
    processing_msg = await message.reply(f"**🔄 Memproses {len(allfile)} file...**", parse_mode="Markdown")
    
    try:
        output_filename = f"{ask2.text}.txt"
        process_filesgbg_bulk(allfile, output_filename)
        
        # Kirim file hasil gabungan
        await processing_msg.delete()
        await message.reply_document(
            output_filename,
            caption=f"**✅ Penggabungan Berhasil**\n\n**📊 Statistik:**\n• **File digabung:** `{len(allfile)}`\n• **Format:** `TXT`",
            parse_mode="Markdown"
        )
        await message.reply("**✅ Proses Selesai**\n\nSemua file telah berhasil digabung", reply_markup=home_keyboard, parse_mode="Markdown")
        
    except Exception as e:
        await processing_msg.edit(f"**❌ Gagal Menggabungkan**\n\n```{e}```", parse_mode="Markdown")
    finally:
        # Cleanup semua file temporary
        for f in allfile:
            if os.path.exists(f):
                os.remove(f)
        if os.path.exists(output_filename):
            os.remove(output_filename)

#===========[VCF TO TXT]

@on_msg(filters.command("♻️ VCF to TXT ♻️", "") & filters.private)
async def ngetxtkanvcf(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    ask1 = await client.ask(text="**📤 Kirim file VCF yang akan dikonversi**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not on_vcf(ask1):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    file = await ask1.download()
    ask2 = await client.ask(text="**📄 Masukkan nama untuk file baru\\\nKlik *Skip* untuk menggunakan nama file asli**", user_id=user_id, chat_id=user_id, reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True))
    if not ask2.text or batals(ask2.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    elif ask2.text == "⭕️ Skip ⭕️":
        newname = ask1.document.file_name.replace(".vcf", ".txt")
    else:
        newname = f"{ask2.text}.txt"
    extract_phone_numbers(file, newname)
    await message.reply_document(newname)
    await message.reply("**✅ Konversi Berhasil**\n\nFile VCF telah berhasil dikonversi ke TXT", reply_markup=home_keyboard, parse_mode="Markdown")
    os.remove(file)
    os.remove(newname)
    
#===========[HITUNG CTC]

@on_msg(filters.command("🔢 Hitung Kontak 🔢", "") & filters.private)
async def count_contacts_handler(client, message):
    user_id = message.from_user.id
    if not ngecek_(user_id):
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", reply_markup=home_keyboard, parse_mode="Markdown")

    ask = await client.ask(
        text="**📤 Kirim file VCF atau TXT untuk dihitung jumlah kontaknya**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )

    if batals(ask.text) or not ask.document:
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")

    file = await ask.download()
    try:
        if on_vcf(ask):
            total = count_contacts_in_vcf(file)
            jenis = "VCF"
        elif on_txt(ask):
            total = count_contacts_in_txt(file)
            jenis = "TXT"
        else:
            return await message.reply("**❌ Format File Tidak Valid**\n\nHanya file VCF atau TXT yang didukung", reply_markup=home_keyboard, parse_mode="Markdown")

        await message.reply(
            f"**📊 Total Kontak**\n\nFile `{jenis}` berisi `{total}` kontak",
            reply_markup=home_keyboard,
            parse_mode="Markdown"
        )
    except Exception as e:
        await message.reply(f"**❌ Terjadi Kesalahan**\n\n```{e}```", reply_markup=home_keyboard, parse_mode="Markdown")
    finally:
        os.remove(file)

#===========[ADDUSR]

@on_msg(filters.command("add") & filters.private)
async def add_(client, message):
    user_id = message.from_user.id
    if user_id not in OWNER_ID:
        return await message.reply("**❌ Akses Ditolak**\n\nFitur ini hanya dapat digunakan oleh Owner", parse_mode="Markdown")

    try:
        _, target_id, timeny = message.text.split(maxsplit=2)
        target_id = int(target_id)
    except:
        return await message.reply(
            "**❌ Format Salah**\n\n**Contoh:** `/add 12345678 1b`\n\n"
            "**Keterangan:**\n• `b` = bulan\n• `m` = minggu\n• `h` = hari",
            parse_mode="Markdown"
        )

    # Ambil data user dari database, default ke dict kosong jika belum terdaftar
    user_data = dbs._buyer.get(target_id, {})
    
    # Ambil expired saat ini, fallback ke waktu sekarang jika belum ada
    current_expired = user_data.get("expired")
    if isinstance(current_expired, dict) or current_expired is None:
      current_expired = datetime.now()

    # Tambahkan waktu sesuai input
    new_expired = add_time_delta(current_expired, timeny.lower())
    if not new_expired:
        return await message.reply("**❌ Format Waktu Tidak Valid**\n\nGunakan akhiran h/m/b", parse_mode="Markdown")

    # Update database user
    dbs._buyer[target_id] = {
        "expired": new_expired,
        "name": user_data.get("name", "-"),
        "username": user_data.get("username", "-"),
        "saldo": user_data.get("saldo", 0),
        "log": user_data.get("log", [])
    }

    save_data()
    await message.reply(
        f"**✅ Berhasil Menambahkan Akses**\n\nUser `{target_id}` ditambahkan akses selama `{timeny}`",
        parse_mode="Markdown"
    )

#===========[REMOVE]

@on_msg(filters.command("remove") & filters.private)
async def remove_(client, message):
    user_id = message.from_user.id
    if user_id not in OWNER_ID:
        return await message.reply("**❌ Akses Ditolak**\n\nFitur ini hanya dapat digunakan oleh Owner", parse_mode="Markdown")

    if len(message.text.split()) != 2 or not message.text.split()[1].isnumeric():
        return await message.reply("**❌ Format Salah**\n\n**Contoh:** `/remove 91838299`", parse_mode="Markdown")

    _, target_id = message.text.split()
    removed = dbs._buyer.pop(int(target_id), None)
    save_data()

    if removed:
        await message.reply(f"**✅ Berhasil Dihapus**\n\nUser `{target_id}` telah dihapus dari akses", parse_mode="Markdown")
    else:
        await message.reply(f"**❌ Data Tidak Ditemukan**\n\nUser `{target_id}` tidak terdaftar dalam database", parse_mode="Markdown")

#===========[UPDATE]

@on_msg(filters.command("update") & filters.user(OWNER_ID[0]))
async def update_bot(client, message):
    x = await message.reply("**🔄 Memproses Update...**", quote=True, parse_mode="Markdown")
    #subprocess.run(['git', 'pull', '-q'])
    await x.edit("**✅ Update Berhasil**\n\nBot akan restart otomatis", parse_mode="Markdown")
    os.execl(sys.executable, sys.executable, "main.py")
    
async def check_exp_loop():
    while True:
        waktu_sekarang = datetime.now()
        expired_users = []

        for buyer in list(dbs._buyer):
            data = dbs._buyer[buyer]
            expired = data.get("expired")

            if not expired:
                continue

            selisih = waktu_sekarang - expired
            if selisih.total_seconds() > 0:
                expired_users.append(buyer)

        for user_id in expired_users:
            del dbs._buyer[user_id]

        save_data()
        await asyncio.sleep(600)

#===========[CHECK]

@on_msg(filters.command("check") & filters.user(OWNER_ID))
async def check_exp_command(client, message):
    await message.reply("**ℹ️ Informasi**\n\nPengecekan expired user berjalan otomatis setiap 10 menit", parse_mode="Markdown")
    
#===========[BACKUP]
    
@on_msg(filters.command("backup") & filters.private)
async def backup_data(client, message):
    user_id = message.from_user.id
    if user_id not in OWNER_ID:
        return await message.reply("**❌ Akses Ditolak**\n\nFitur ini hanya dapat digunakan oleh Owner", parse_mode="Markdown")

    try:
        await message.reply_document("data.json", caption="**📁 Backup Data**\n\nBerikut adalah file backup data akses user")
    except Exception as e:
        await message.reply(f"**❌ Gagal Mengirim Backup**\n\n```{e}```", parse_mode="Markdown")
        
#===========[USERALL]
 
@on_msg(filters.command("listalluser") & filters.user(OWNER_ID))
async def list_all_user(client, message):
    all_users = load_all_users()

    if not all_users:
        return await message.reply("**❌ Data Tidak Ditemukan**\n\nTidak ada user yang pernah memulai bot", parse_mode="Markdown")

    teks = f"**📋 Daftar Semua User**\n\n**Total:** `{len(all_users)}` user\n\n"

    for uid, data in all_users.items():
        name = data.get("name", "-")
        username = data.get("username", "-")
        teks += f"• `{uid}` — {name} \\({username}\\)\n"

    # Batasan panjang pesan Telegram (4096 char)
    if len(teks) > 4000:
        # Simpan ke file jika terlalu panjang
        with open("list_all_users.txt", "w", encoding="utf-8") as f:
            f.write(teks)
        await message.reply_document("list_all_users.txt")
        os.remove("list_all_users.txt")
    else:
        await message.reply(teks, parse_mode="Markdown")
 
#===========[LISTUSER]
        
@on_msg(filters.command("listuser") & filters.private)
async def list_user(client, message):
    user_id = message.from_user.id
    if user_id not in OWNER_ID:
        return await message.reply("**❌ Akses Ditolak**\n\nFitur ini hanya dapat digunakan oleh Owner", parse_mode="Markdown")

    aktif_users = {
        uid: data for uid, data in dbs._buyer.items()
        if isinstance(data, dict) and data.get("expired")
    }

    if not aktif_users:
        return await message.reply("**❌ Data Tidak Ditemukan**\n\nTidak ada user yang memiliki akses saat ini", parse_mode="Markdown")

    teks = "**👥 Daftar Pengguna Aktif**\n\n"

    for uid, data in aktif_users.items():
        expired = data.get("expired")
        try:
            user_info = await client.get_users(uid)
            nama = f"{user_info.first_name or ''} {user_info.last_name or ''}".strip()
            username = f"@{user_info.username}" if user_info.username else "-"
        except:
            nama = data.get("name", "Tidak diketahui")
            username = data.get("username", "-")

        teks += (
            f"**🆔 ID:** `{uid}`\n"
            f"**👤 Nama:** `{nama}`\n"
            f"**📱 Username:** `{username}`\n"
            f"**⏰ Expired:** `{expired.strftime('%Y-%m-%d %H:%M:%S')}`\n\n"
        )

    await message.reply(teks, parse_mode="Markdown")

#===========[CEK ID]

@on_msg(filters.command("id") & filters.private)
async def cek_id(client, message):
    user = message.from_user
    nama = f"{user.first_name} {user.last_name if user.last_name else ''}".strip()
    await message.reply(
        f"**🆔 ID Telegram Anda:** `{user.id}`\n**👤 Nama:** `{nama}`",
        reply_markup=home_keyboard,
        parse_mode="Markdown"
    )

#===========[BROADCAST]
    
def load_all_users():
    try:
        with open("users_all.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

@on_msg(filters.command("broadcast") & filters.private)
async def broadcast_(client, message):
    user_id = message.from_user.id
    if user_id not in OWNER_ID:
        return await message.reply("**❌ Akses Ditolak**\n\nFitur ini hanya dapat digunakan oleh Owner", reply_markup=home_keyboard, parse_mode="Markdown")

    ask = await client.ask(
        text="**📢 Masukkan pesan broadcast yang akan dikirim ke semua user**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )

    if batals(ask.text):
        return await message.reply("**❌ Broadcast Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")

    isi = ask.text
    all_users = load_all_users()
    aktif_users = [int(uid) for uid in all_users.keys()]

    total, sukses, gagal = 0, 0, 0
    for uid in aktif_users:
        total += 1
        try:
            await client.send_message(uid, isi)
            sukses += 1
            await asyncio.sleep(0.2)
        except:
            gagal += 1

    hasil = f"**📢 Broadcast Selesai**\n\n**📊 Statistik:**\n• **Total:** `{total}`\n• **Berhasil:** `{sukses}`\n• **Gagal:** `{gagal}`"
    await message.reply(hasil, reply_markup=home_keyboard, parse_mode="Markdown")
    
#===========[CEK NAMA KONTAK]
@on_msg(filters.command("🔍 Cek Nama Kontak 🔍", "") & filters.private)
async def cek_nama_kontak(client, message):
    user_id = message.from_user.id
    if not ngecek_(user_id):
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", reply_markup=home_keyboard, parse_mode="Markdown")

    ask = await client.ask(
        text="**📤 Kirim file VCF untuk dicek nama kontaknya**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )

    if batals(ask.text) or not ask.document or not on_vcf(ask):
        return await message.reply("**❌ Proses Dibatalkan**\n\nFile harus berformat VCF", reply_markup=home_keyboard, parse_mode="Markdown")

    file = await ask.download()

    try:
        kontak = list(read_vcf(file))
        daftar_nama = []

        for c in kontak:
            if hasattr(c, 'fn'):
                daftar_nama.append(c.fn.value.strip())

        if not daftar_nama:
            return await message.reply("**❌ Data Tidak Ditemukan**\n\nTidak ada nama kontak dalam file ini", reply_markup=home_keyboard, parse_mode="Markdown")

        hasil = "**📋 Daftar Nama Kontak**\n\n"
        hasil += '\n'.join(f"`{i+1}.` {nama}" for i, nama in enumerate(daftar_nama[:100]))  # Batas 100 agar tidak overload

        await message.reply(hasil, reply_markup=home_keyboard, parse_mode="Markdown")

    except Exception as e:
        await message.reply(f"**❌ Gagal Membaca File**\n\n```{e}```", reply_markup=home_keyboard, parse_mode="Markdown")
    finally:
        os.remove(file)
        
 #===========[STATISTIK]
@on_msg(filters.command("statistik") & filters.user(OWNER_ID))
async def statistik_bot(client, message):
    total_users = len(dbs._buyer)
    now = datetime.now()
    aktif = 0
    expired = 0
    total_saldo = 0
    online_today = 0

    for uid, data in dbs._buyer.items():
        exp = data.get("expired")
        saldo = data.get("saldo", 0)
        total_saldo += saldo

        if isinstance(exp, datetime):
            if exp > now:
                aktif += 1
                if (now - exp).days <= 0:
                    online_today += 1
            else:
                expired += 1

    teks = (
        f"**📊 Statistik Bot**\n\n"
        f"**👥 Total User:** `{total_users}`\n"
        f"**✅ User Aktif:** `{aktif}`\n"
        f"**❌ User Expired:** `{expired}`\n"
        f"**💰 Total Saldo:** `{total_saldo}`\n"
        f"**📅 Online Hari Ini:** `{online_today}`"
    )

    await message.reply(teks, parse_mode="Markdown")
    
#===========[POTONG LANJUTAN]
@on_msg(filters.private & filters.regex("📊 POTONG LANJUTAN 📊"))
async def potong_lanjutan_inline(client, message):
    user_id = message.from_user.id
    if not ngecek_(user_id):
        return await message.reply("**❌ Akses Ditolak**", reply_markup=home_keyboard, parse_mode="Markdown")

    session_lanjutan["split_counter"] = 1
    session_lanjutan["file_counter"] = 1

    await lanjut_potong_lanjutan(client, message, user_id)


async def lanjut_potong_lanjutan(client, message, user_id):
    # 1. Kirim file VCF
    ask1 = await client.ask(
        chat_id=user_id,
        text="**📤 Kirim file VCF**",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    if not on_vcf(ask1) or batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    file = await ask1.download()

    # 2. Masukkan nama file output
    ask2 = await client.ask(
        chat_id=user_id,
        text="**📎 Masukkan nama file output**",
        reply_markup=ReplyKeyboardMarkup(
            [[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]],
            resize_keyboard=True
        )
    )
    if batals(ask2.text):
        os.remove(file)
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    newname = os.path.splitext(ask1.document.file_name)[0] if ask2.text == "⭕️ Skip ⭕️" else ask2.text

    # 3. Jika pertama kali, minta angka awal penomoran & nama file
    if session_lanjutan["split_counter"] == 1:
        ask3 = await client.ask(
            chat_id=user_id,
            text="**🔢 Masukkan angka awal penomoran kontak**",
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        if batals(ask3.text) or not ask3.text.isnumeric():
            os.remove(file)
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        session_lanjutan["split_counter"] = int(ask3.text)

        ask_file = await client.ask(
            chat_id=user_id,
            text="**🔢 Masukkan angka awal nama file**",
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        if batals(ask_file.text) or not ask_file.text.isnumeric():
            os.remove(file)
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        session_lanjutan["file_counter"] = int(ask_file.text)

    # 4. Jumlah kontak per file
    ask4 = await client.ask(
        chat_id=user_id,
        text="**📄 Masukkan jumlah kontak per file**",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    if batals(ask4.text) or not ask4.text.isnumeric():
        os.remove(file)
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    kontak_per_file = int(ask4.text)

    # 5. Proses pemotongan
    hasil, next_index, next_file = split_vcf_custom_start_session(
        file, newname, kontak_per_file,
        session_lanjutan["split_counter"],
        session_lanjutan["file_counter"]
    )

    for f in hasil:
        try:
            await message.reply_document(f)
        except FloodWait as e:
            await asyncio.sleep(e.value)
            await message.reply_document(f)
        os.remove(f)

    session_lanjutan["split_counter"] = next_index
    session_lanjutan["file_counter"] = next_file
    os.remove(file)

    # 6. Tanya lanjut atau selesai
    lanjut = await client.ask(
        chat_id=user_id,
        text="**✅ Pemotongan Selesai**\n\nLanjutkan dengan file berikutnya?",
        reply_markup=ReplyKeyboardMarkup(
            [[KeyboardButton("➕ Lanjut"), KeyboardButton("✅ Selesai")]],
            resize_keyboard=True
        ),
        parse_mode="Markdown"
    )
    if lanjut.text == "➕ Lanjut":
        return await lanjut_potong_lanjutan(client, message, user_id)

    await message.reply("**✅ Semua Proses Telah Selesai**", reply_markup=home_keyboard, parse_mode="Markdown")

#===========[BAGI LANJUTAN]
@on_msg(filters.private & filters.regex("🪓 BAGI LANJUTAN 🪓"))
async def bagi_lanjutan_inline(client, message):
    user_id = message.from_user.id
    if not ngecek_(user_id):
        return await message.reply("**❌ Akses Ditolak**", reply_markup=home_keyboard, parse_mode="Markdown")

    session_lanjutan["split_counter"] = 1
    session_lanjutan["file_counter"] = 1

    await lanjut_bagi_lanjutan(client, message, user_id)


async def lanjut_bagi_lanjutan(client, message, user_id):
    # 1. Kirim file VCF
    ask1 = await client.ask(
        chat_id=user_id,
        text="**📤 Kirim file VCF yang akan dibagi**",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    if not on_vcf(ask1) or batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    file = await ask1.download()

    # 2. Nama file output
    ask2 = await client.ask(
        chat_id=user_id,
        text="**📎 Masukkan nama file output**",
        reply_markup=ReplyKeyboardMarkup(
            [[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]],
            resize_keyboard=True
        )
    )
    if batals(ask2.text):
        os.remove(file)
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    newname = os.path.splitext(ask1.document.file_name)[0] if ask2.text == "⭕️ Skip ⭕️" else ask2.text

    # 3. Jika pertama kali, minta angka awal penomoran & nama file
    if session_lanjutan["split_counter"] == 1:
        ask3 = await client.ask(
            chat_id=user_id,
            text="**🔢 Masukkan angka awal penomoran kontak**",
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        if batals(ask3.text) or not ask3.text.isnumeric():
            os.remove(file)
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        session_lanjutan["split_counter"] = int(ask3.text)

        ask_file = await client.ask(
            chat_id=user_id,
            text="**🔢 Masukkan angka awal nama file**",
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        if batals(ask_file.text) or not ask_file.text.isnumeric():
            os.remove(file)
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        session_lanjutan["file_counter"] = int(ask_file.text)

    # 4. Jumlah bagian yang diinginkan
    ask4 = await client.ask(
        chat_id=user_id,
        text="**🪓 Masukkan jumlah file \\(bagian\\) yang ingin dibuat**",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    if batals(ask4.text) or not ask4.text.isnumeric() or int(ask4.text) <= 0:
        os.remove(file)
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    bagian = int(ask4.text)

    # 5. Proses pembagian dengan rename dan lanjutan
    contacts = list(read_vcf(file))
    total_contacts = len(contacts)
    contacts_per_file = (total_contacts + bagian - 1) // bagian

    dump_ = []
    global_index = session_lanjutan["split_counter"]
    file_index = session_lanjutan["file_counter"]

    for i in range(bagian):
        start = i * contacts_per_file
        end = min(start + contacts_per_file, total_contacts)
        chunk = rename_contacts(contacts[start:end], start_index=global_index)
        filename = f"{newname}-{file_index}.vcf"
        write_vcf(chunk, filename)
        dump_.append(filename)
        global_index += len(chunk)
        file_index += 1

    for f in dump_:
        try:
            await message.reply_document(f)
        except FloodWait as e:
            await asyncio.sleep(e.value)
            await message.reply_document(f)
        os.remove(f)

    session_lanjutan["split_counter"] = global_index
    session_lanjutan["file_counter"] = file_index
    os.remove(file)

    lanjut = await client.ask(
        chat_id=user_id,
        text="**✅ Pembagian Selesai**\n\nLanjutkan dengan file berikutnya?",
        reply_markup=ReplyKeyboardMarkup(
            [[KeyboardButton("➕ Lanjut"), KeyboardButton("✅ Selesai")]],
            resize_keyboard=True
        ),
        parse_mode="Markdown"
    )
    if lanjut.text == "➕ Lanjut":
        return await lanjut_bagi_lanjutan(client, message, user_id)

    await message.reply("**✅ Semua Proses Telah Selesai**", reply_markup=home_keyboard, parse_mode="Markdown")

 #===========[HELP]
 
@on_msg(filters.command("help") & filters.private)
async def help_cmd(client, message):
    text = """
**📌 Daftar Fitur Bot**

🔹 **📊 POTONG VCF**  
Memecah file VCF besar menjadi beberapa bagian, dengan penomoran kontak dan file yang berurutan\\.

🔹 **📊 BAGI VCF**  
Membagi VCF menjadi beberapa bagian berdasarkan jumlah bagian yang diinginkan\\.

🔹 **♻️ VCF to TXT**  
Mengubah semua nomor dalam VCF menjadi file \\.txt\\.

🔹 **🏷️ TXT to VCF**  
Mengubah file \\.txt berisi nomor menjadi file kontak \\.vcf\\.

🔹 **🚀 XLS to VCF**  
Mengubah file Excel menjadi file kontak VCF\\.

🔹 **📨 MSG to TXT**  
Mengubah pesan teks menjadi file \\.txt\\.

🔹 **🚧 RAPIKAN TXT**  
Membersihkan spasi/simbol agar file txt berisi nomor yang bersih\\.

🔹 **🗄️ Gabung TXT / VCF**  
Menggabungkan beberapa file menjadi satu\\.

🔹 **🔢 Hitung Kontak**  
Menghitung jumlah nomor dari file VCF/TXT\\.

🔹 **🔍 Cek Nama Kontak**  
Melihat daftar nama yang tersimpan dalam VCF\\.

🔹 **📨 ADMIN**  
Membuat file VCF berisi nomor\\-nomor admin dengan format nama ADMIN\\-xxxx\\.

🔹 **💎 Status**  
Cek status dan masa berlaku akses kamu\\.

—

**❗️ Butuh akses atau ingin menyewa bot ini?**  
Silakan hubungi saya langsung melalui:

👉 **@Yareuu21**

Harga sewa murah dan support penuh\\!
"""
    await message.reply(text, reply_markup=home_keyboard, parse_mode="Markdown")
 
 #===========[RUNTIME]
@on_msg(filters.command("runtime") & filters.user(OWNER_ID))
async def runtime_handler(client, message):
    os_info = platform.system() + " " + platform.release()
    uptime = get_runtime()
    await message.reply(
        f"**🖥️ OS:** `{os_info}`\n"
        f"**⏱️ Uptime:** `{uptime}`",
        parse_mode="Markdown"
    )

#===========[RAPIHKAN TXT - UNLIMITED]

@on_msg(filters.command("🚧 RAPIKAN TXT 🚧", "") & filters.private)
async def ngecremotate(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    
    ask1 = await client.ask(
        text="**📤 Silakan kirim file TXT yang akan dirapihkan**", 
        user_id=user_id, 
        chat_id=user_id, 
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    
    if not on_txt(ask1) or batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**\n\nFile harus berformat \\.txt", reply_markup=home_keyboard, parse_mode="Markdown")
    
    processing_msg = await message.reply("**🔄 Memproses file...**", parse_mode="Markdown")
    file = await ask1.download()
    
    try:
        hapus_spasi_antar_nomor(file)
        await processing_msg.delete()
        await message.reply_document(file)
        await message.reply("**✅ Proses Selesai**\n\nFile TXT telah berhasil dirapihkan", reply_markup=home_keyboard, parse_mode="Markdown")
    except FloodWait as e:
        await asyncio.sleep(e.value)
        await message.reply_document(file)
        await message.reply("**✅ Proses Selesai**\n\nFile TXT telah berhasil dirapihkan", reply_markup=home_keyboard, parse_mode="Markdown")
    except Exception as e:
        await processing_msg.edit(f"**❌ Gagal Memproses**\n\n```{e}```", parse_mode="Markdown")
    finally:
        if os.path.exists(file):
            os.remove(file)

#===========[STATUS]
@on_msg(filters.command("💎 Status 💎", "") & filters.private)
async def status_user(client, message):
    user_id = message.from_user.id

    if user_id not in dbs._buyer:
        return await message.reply(
            "**❌ Akses Ditolak**\n\nAnda belum memiliki akses\\.\nHubungi @Deckro08 untuk mendapatkan akses\\.",
            parse_mode="Markdown"
        )

    data = dbs._buyer[user_id]
    nama = f"{message.from_user.first_name} {message.from_user.last_name or ''}".strip()
    username = f"@{message.from_user.username}" if message.from_user.username else data.get("username", "-")
    saldo = data.get("saldo", 0)

    expired = data.get("expired")
    if isinstance(expired, str):
        try:
            expired = datetime.strptime(expired, "%Y-%m-%d %H:%M:%S.%f")
        except:
            try:
                expired = datetime.strptime(expired, "%Y-%m-%d %H:%M:%S")
            except:
                expired = None
    expired_str = expired.strftime("%Y-%m-%d %H:%M:%S") if expired else "-"

    txt = (
        f"**💎 STATUS AKUN**\n\n"
        f"**🆔 ID:** `{user_id}`\n"
        f"**👤 Nama:** `{nama}`\n"
        f"**📱 Username:** `{username}`\n"
        f"**💰 Saldo:** `{saldo}`\n"
        f"**⏰ Masa Aktif:** `{expired_str}`"
    )

    await message.reply(txt, reply_markup=home_keyboard, parse_mode="Markdown")

#===========[MSG TO TXT - UNLIMITED]

@on_msg(filters.command("️📨 MSG to TXT 📨", "") & filters.private)
async def ngecreate(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    
    ask1 = await client.ask(
        text="**📝 Masukkan nomor telepon yang akan dikonversi ke file TXT**", 
        user_id=user_id, 
        chat_id=user_id, 
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    
    if batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    
    ask2 = await client.ask(
        text="**📄 Masukkan nama untuk file baru**", 
        user_id=user_id, 
        chat_id=user_id, 
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    
    if batals(ask2.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    
    newname = ask2.text
    with open(f"{newname}.txt", 'w', encoding='utf-8') as file:
        file.write(ask1.text)
    
    try:
        await message.reply_document(f"{newname}.txt")
        await message.reply("**✅ Konversi Berhasil**\n\nPesan telah berhasil dikonversi ke file TXT", reply_markup=home_keyboard, parse_mode="Markdown")
    except FloodWait as e:
        await asyncio.sleep(e.value)
        await message.reply_document(f"{newname}.txt")
        await message.reply("**✅ Konversi Berhasil**\n\nPesan telah berhasil dikonversi ke file TXT", reply_markup=home_keyboard, parse_mode="Markdown")
    except Exception as e:
        await message.reply(f"**❌ Gagal Mengirim File**\n\n```{e}```", parse_mode="Markdown")
    finally:
        if os.path.exists(f"{newname}.txt"):
            os.remove(f"{newname}.txt")

#===========[ADMIN - UNLIMITED]

@on_msg(filters.command("📨 ADMIN 📨", "") & filters.private)
async def ngecreateadmin(client, message):
    user_id = message.from_user.id
    if not ngecek_(user_id):
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")

    ask1 = await client.ask(
        text="**📝 Masukkan nomor admin**",
        user_id=user_id,
        chat_id=user_id,
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )

    if batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")

    dmp_adm = ask1.text.split()
    file_name = 'ADMIN.vcf'
    
    try:
        with open(file_name, "w", encoding='utf-8') as file:
            for index, phone_number in enumerate(dmp_adm, start=1):
                vcf_entry = create_vcf_entry(phone_number, f"ADMIN-{str(index).zfill(4)}")
                file.write(vcf_entry + "\n")

        await message.reply_document(file_name)
        await message.reply(
            "**✅ File ADMIN Berhasil Dibuat**\n\nFile kontak ADMIN telah siap digunakan",
            reply_markup=home_keyboard,
            parse_mode="Markdown"
        )
    except Exception as e:
        await message.reply(f"**❌ Gagal Membuat File**\n\n```{e}```", parse_mode="Markdown")
    finally:
        if os.path.exists(file_name):
            os.remove(file_name)

#===========[XLS TO VCF - UNLIMITED]

@on_msg(filters.command("🚀 XLS to VCF 🚀", "") & filters.private)
async def ngexlseate(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    
    ask1 = await client.ask(
        text="**📤 Kirim file Excel \\(XLS/XLSX\\) yang akan dikonversi**", 
        user_id=user_id, 
        chat_id=user_id, 
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    
    if not on_xls(ask1):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    
    processing_msg = await message.reply("**🔄 Memproses file Excel...**", parse_mode="Markdown")
    file = await ask1.download()
    
    try:
        ask2 = await client.ask(
            text="**📄 Masukkan nama untuk file baru\\\nKlik *Skip* untuk menggunakan nama file asli**", 
            user_id=user_id, 
            chat_id=user_id, 
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        
        if not ask2.text or batals(ask2.text):
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        elif ask2.text == "⭕️ Skip ⭕️":
            newname = os.path.splitext(ask1.document.file_name)[0]
        else:
            newname = ask2.text
        
        ask3 = await client.ask(
            text="**🏷️ Masukkan nama kontak\\\nKlik *Skip* untuk menggunakan nama file**", 
            user_id=user_id, 
            chat_id=user_id, 
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        
        if not ask3.text or batals(ask3.text):
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        elif ask3.text == "⭕️ Skip ⭕️":
            newnamk = newname
        else:
            newnamk = ask3.text

        # Process Excel file
        cont_all = []
        df = pd.read_excel(file)
        ls_cont = df.values.flatten().tolist()
        
        for isi in ls_cont:
            isi_ = str(isi).replace("+", "")
            if isi_.isnumeric():
                cont_all.append(isi_)
        
        if not cont_all:
            return await message.reply("**❌ Data Tidak Ditemukan**\n\nTidak ada kontak yang dapat diproses", parse_mode="Markdown")
        
        await processing_msg.edit(f"**🔄 Membuat file VCF dengan {len(cont_all)} kontak...**")
        dump_ = create_vcf_file(cont_all, newnamk, f'{newname}.vcf', start_index=1)
        
        await processing_msg.delete()
        await message.reply_document(dump_)
        await message.reply("**✅ Konversi Berhasil**\n\nFile Excel telah berhasil dikonversi ke VCF", reply_markup=home_keyboard, parse_mode="Markdown")
        
    except Exception as e:
        await processing_msg.edit(f"**❌ Gagal Memproses**\n\n```{e}```", parse_mode="Markdown")
    finally:
        if os.path.exists(file):
            os.remove(file)
        if 'dump_' in locals() and os.path.exists(dump_):
            os.remove(dump_)

#===========[TXT TO VCF - UNLIMITED]

@on_msg(filters.command("🏷️ TXT to VCF 🏷️", "") & filters.private)
async def ngecreate(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    
    ask1 = await client.ask(
        text="**📤 Kirim file TXT yang akan dikonversi**", 
        user_id=user_id, 
        chat_id=user_id, 
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    
    if not on_txt(ask1) or batals(ask1.text):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    
    processing_msg = await message.reply("**🔄 Memproses file TXT...**", parse_mode="Markdown")
    file = await ask1.download()
    
    try:
        ask2 = await client.ask(
            text="**📄 Masukkan nama untuk file baru\\\nKlik *Skip* untuk menggunakan nama file asli**", 
            user_id=user_id, 
            chat_id=user_id, 
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        
        if not ask2.text or batals(ask2.text):
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        elif ask2.text == "⭕️ Skip ⭕️":
            newname = os.path.splitext(ask1.document.file_name)[0]
        else:
            newname = ask2.text
        
        ask3 = await client.ask(
            text="**🏷️ Masukkan nama kontak\\\nKlik *Skip* untuk menggunakan nama file**", 
            user_id=user_id, 
            chat_id=user_id, 
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        
        if not ask3.text or batals(ask3.text):
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        elif ask3.text == "⭕️ Skip ⭕️":
            newnamk = newname
        else:
            newnamk = ask3.text

        # Process TXT file
        cont_all = []
        with open(file, 'r', encoding='utf-8') as f:
            for line in f:
                isi_ = line.strip().replace("+", "")
                if isi_ and isi_.isnumeric():
                    cont_all.append(isi_)
        
        if not cont_all:
            return await message.reply("**❌ Data Tidak Ditemukan**\n\nTidak ada kontak yang dapat diproses", parse_mode="Markdown")
        
        await processing_msg.edit(f"**🔄 Membuat file VCF dengan {len(cont_all)} kontak...**")
        dump_ = create_vcf_file(cont_all, newnamk, f'{newname}.vcf')
        
        await processing_msg.delete()
        await message.reply_document(dump_)
        await message.reply("**✅ Konversi Berhasil**\n\nFile TXT telah berhasil dikonversi ke VCF", reply_markup=home_keyboard, parse_mode="Markdown")
        
    except Exception as e:
        await processing_msg.edit(f"**❌ Gagal Memproses**\n\n```{e}```", parse_mode="Markdown")
    finally:
        if os.path.exists(file):
            os.remove(file)
        if 'dump_' in locals() and os.path.exists(dump_):
            os.remove(dump_)

#===========[BAGI VCF - UNLIMITED]

@on_msg(filters.command("🪓 BAGI VCF 🪓", "") & filters.private)
async def ngevcfkan(client, message):
    user_id = message.from_user.id
    ngecek = ngecek_(user_id)
    if not ngecek:
        return await message.reply("**❌ Akses Ditolak**\n\nUntuk mendapatkan akses, silakan hubungi @Yareuu21", parse_mode="Markdown")
    
    ask1 = await client.ask(
        text="**📤 Kirim file VCF yang akan dibagi**", 
        user_id=user_id, 
        chat_id=user_id, 
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    
    if not on_vcf(ask1):
        return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
    
    processing_msg = await message.reply("**🔄 Memproses file VCF...**", parse_mode="Markdown")
    file = await ask1.download()
    
    try:
        ask2 = await client.ask(
            text="**📄 Masukkan nama untuk file baru\\\nKlik *Skip* untuk menggunakan nama file asli**", 
            user_id=user_id, 
            chat_id=user_id, 
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️")], [KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        
        if not ask2.text or batals(ask2.text):
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        elif ask2.text == "⭕️ Skip ⭕️":
            newname = os.path.splitext(ask1.document.file_name)[0]
        else:
            newname = ask2.text
        
        ask3 = await client.ask(
            text="**🔢 Masukkan jumlah bagian file yang diinginkan**", 
            user_id=user_id, 
            chat_id=user_id, 
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
        )
        
        if not ask3.text or not ask3.text.isnumeric() or ask3.text == "0":
            return await message.reply("**❌ Proses Dibatalkan**", reply_markup=home_keyboard, parse_mode="Markdown")
        
        await processing_msg.edit("**🔄 Membagi file VCF...**")
        hsl = split_cut_vcf(file, newname, int(ask3.text))
        
        await processing_msg.delete()
        for isi in hsl:
            try:
                await message.reply_document(isi)
            except FloodWait as e:
                await asyncio.sleep(e.value)
                await message.reply_document(isi)
            except Exception as e:
                print(f"Error sending file {isi}: {e}")
            finally:
                if os.path.exists(isi):
                    os.remove(isi)
        
        await message.reply("**✅ Proses Selesai**\n\nFile VCF telah berhasil dibagi", reply_markup=home_keyboard, parse_mode="Markdown")
        
    except Exception as e:
        await processing_msg.edit(f"**❌ Gagal Memproses**\n\n```{e}```", parse_mode="Markdown")
    finally:
        if os.path.exists(file):
            os.remove(file)

# ... (Lanjutkan dengan fungsi-fungsi lainnya dengan pattern yang sama)

# Tetap tambahkan fungsi-fungsi lainnya seperti Gabung VCF, Gabung TXT, VCF to TXT, dll
# dengan menggunakan fungsi unlimited version yang sudah dibuat

async def main():
    data_ = load_data()
    dbs._buyer = data_
    await bot.start()
    # Hapus check_exp_loop() jika tidak ada, atau tambahkan jika diperlukan
    await idle()

if __name__ == "__main__":
    asyncio.get_event_loop_policy().get_event_loop().run_until_complete(main())