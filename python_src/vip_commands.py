"""Complete VIP Commands untuk Iqbal CV Bot - All 18 Features"""
import os
import re
from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import ContextTypes
from file_converters import txt_to_vcf, vcf_to_txt, xls_to_vcf, clean_txt, count_contacts, split_vcf
from helpers import increment_operation, get_user

# Global sessions untuk state management
vip_sessions = {}

def get_session(user_id):
    """Get or create session for user"""
    if user_id not in vip_sessions:
        vip_sessions[user_id] = {}
    return vip_sessions[user_id]

async def handle_vip_command(update: Update, context: ContextTypes.DEFAULT_TYPE, command: str):
    """Generic VIP command handler"""
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    
    # Check role & access
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return
    
    session = get_session(user_id)
    session['command'] = command
    session['step'] = 1
    session['files'] = []
    
    commands_info = {
        'txttovcf': ('⛓️ TXT TO VCF', 'Kirim file TXT dengan nomor telepon (satu nomor per baris)'),
        'vcftotxt': ('⛓️ VCF TO TXT', 'Kirim file VCF untuk extract nomor'),
        'xlstovcf': ('⛓️ XLS TO VCF', 'Kirim file XLSX dengan nomor di kolom'),
        'msgtotxt': ('⛓️ MSG TO TXT', 'Extract nomor dari pesan atau file'),
        'rapikatntxt': ('⛓️ RAPIKAN TXT', 'Kirim file TXT untuk dibersihkan & disort'),
        'hitungfile': ('⛓️ HITUNG FILE', 'Kirim file TXT/VCF untuk dihitung'),
        'renamefile': ('⛓️ RENAME FILE', 'Kirim file untuk direname'),
        'renamekontak': ('⛓️ RENAME KONTAK', 'Kirim file VCF untuk rename semua kontak'),
        'gabungfile': ('⛓️ GABUNG FILE', 'Kirim multiple file untuk digabung (minimal 2)'),
        'gabungvcf': ('⛓️ GABUNG VCF', 'Kirim multiple VCF untuk digabung'),
        'gabungtxt': ('⛓️ GABUNG TXT', 'Kirim multiple TXT untuk digabung'),
        'splitfile': ('⛓️ SPLIT FILE', 'Kirim file VCF untuk dipotong'),
        'cekkontak': ('⛓️ CEK KONTAK', 'Kirim file VCF untuk lihat detail'),
    }
    
    if command in commands_info:
        title, instruction = commands_info[command]
        await update.message.reply_text(
            f"*{title}*\n\n{instruction}\n\n"
            "Ketik `batal` untuk membatalkan",
            parse_mode="Markdown"
        )

async def handle_file_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle file messages from users"""
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    session = get_session(user_id)
    
    if 'command' not in session:
        return
    
    command = session['command']
    
    if not update.message.document:
        await update.message.reply_text("⚠️ Harus file ya Kak!", parse_mode="Markdown")
        return
    
    file_obj = update.message.document
    file_name = file_obj.file_name
    file_id = file_obj.file_id
    
    try:
        # Download file
        file = await context.bot.get_file(file_id)
        file_path = f"/tmp/{file_name}"
        await file.download_to_drive(file_path)
        
        # TXT TO VCF
        if command == 'txttovcf':
            if not file_name.endswith('.txt'):
                await update.message.reply_text("⚠️ Hanya file TXT!", parse_mode="Markdown")
                return
            
            if session['step'] == 1:
                session['file'] = file_path
                session['step'] = 2
                await update.message.reply_text(
                    "*Masukkan nama file output:*\n(Tanpa .vcf, ketik 'done' skip)",
                    parse_mode="Markdown"
                )
            return
        
        # VCF TO TXT
        if command == 'vcftotxt':
            if not file_name.endswith('.vcf'):
                await update.message.reply_text("⚠️ Hanya file VCF!", parse_mode="Markdown")
                return
            
            output_file = f"/tmp/output_{user_id}.txt"
            success, msg = vcf_to_txt(file_path, output_file)
            
            if success:
                await context.bot.send_document(chat_id, open(output_file, 'rb'))
                await update.message.reply_text(f"✅ *Berhasil!*\n\n{msg}", parse_mode="Markdown")
                increment_operation(user_id)
            else:
                await update.message.reply_text(f"❌ *Gagal:* {msg}", parse_mode="Markdown")
            
            if os.path.exists(output_file):
                os.remove(output_file)
            vip_sessions.pop(user_id, None)
            return
        
        # XLSX TO VCF
        if command == 'xlstovcf':
            if not file_name.endswith(('.xlsx', '.xls')):
                await update.message.reply_text("⚠️ Hanya file XLSX/XLS!", parse_mode="Markdown")
                return
            
            if session['step'] == 1:
                session['file'] = file_path
                session['step'] = 2
                await update.message.reply_text(
                    "*Masukkan nama kontak prefix:*\n(Misal: 'Contact', ketik 'done' pakai nama file)",
                    parse_mode="Markdown"
                )
            return
        
        # RAPIKAN TXT
        if command == 'rapikatntxt':
            if not file_name.endswith('.txt'):
                await update.message.reply_text("⚠️ Hanya file TXT!", parse_mode="Markdown")
                return
            
            output_file = f"/tmp/cleaned_{user_id}.txt"
            # Copy dan clean
            import shutil
            shutil.copy(file_path, output_file)
            success, msg = clean_txt(output_file)
            
            if success:
                await context.bot.send_document(chat_id, open(output_file, 'rb'))
                await update.message.reply_text(f"✅ *Berhasil!*\n\n{msg}", parse_mode="Markdown")
                increment_operation(user_id)
            else:
                await update.message.reply_text(f"❌ *Gagal:* {msg}", parse_mode="Markdown")
            
            if os.path.exists(output_file):
                os.remove(output_file)
            vip_sessions.pop(user_id, None)
            return
        
        # HITUNG FILE
        if command == 'hitungfile':
            if not file_name.endswith(('.txt', '.vcf')):
                await update.message.reply_text("⚠️ Hanya file TXT/VCF!", parse_mode="Markdown")
                return
            
            success, msg = count_contacts(file_path)
            
            if success:
                await update.message.reply_text(f"📊 *{msg}*", parse_mode="Markdown")
                increment_operation(user_id)
            else:
                await update.message.reply_text(f"❌ *Gagal:* {msg}", parse_mode="Markdown")
            
            vip_sessions.pop(user_id, None)
            return
        
        # RENAME FILE
        if command == 'renamefile':
            if session['step'] == 1:
                session['file'] = file_path
                session['ext'] = os.path.splitext(file_name)[1]
                session['step'] = 2
                await update.message.reply_text(
                    "*Masukkan nama file baru:*\n(Tanpa ekstensi)",
                    parse_mode="Markdown"
                )
            return
        
        # SPLIT FILE (VCF)
        if command == 'splitfile':
            if not file_name.endswith('.vcf'):
                await update.message.reply_text("⚠️ Hanya file VCF!", parse_mode="Markdown")
                return
            
            output_dir = f"/tmp/split_{user_id}"
            os.makedirs(output_dir, exist_ok=True)
            success, files = split_vcf(file_path, output_dir, chunk_size=100)
            
            if success:
                for f in files[:5]:  # Send max 5 files
                    await context.bot.send_document(chat_id, open(f, 'rb'))
                await update.message.reply_text(
                    f"✅ *Berhasil split ke {len(files)} file!*",
                    parse_mode="Markdown"
                )
                increment_operation(user_id)
            else:
                await update.message.reply_text(f"❌ *Gagal:* {files}", parse_mode="Markdown")
            
            vip_sessions.pop(user_id, None)
            return
        
        # GABUNG FILE (multiple files)
        if command in ['gabungfile', 'gabungvcf', 'gabungtxt']:
            session['files'].append(file_path)
            await update.message.reply_text(
                f"✅ *File tersimpan* ({len(session['files'])} file)\n\n"
                f"Kirim file lagi atau ketik `done`",
                parse_mode="Markdown"
            )
            return
        
        # RENAME KONTAK (VCF)
        if command == 'renamekontak':
            if not file_name.endswith('.vcf'):
                await update.message.reply_text("⚠️ Hanya file VCF!", parse_mode="Markdown")
                return
            
            if session['step'] == 1:
                session['file'] = file_path
                session['step'] = 2
                await update.message.reply_text(
                    "*Masukkan nama kontak baru:*\n(Semua kontak akan direname)",
                    parse_mode="Markdown"
                )
            return
        
        # CEK KONTAK (View VCF details)
        if command == 'cekkontak':
            if not file_name.endswith('.vcf'):
                await update.message.reply_text("⚠️ Hanya file VCF!", parse_mode="Markdown")
                return
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract contacts
            vcards = re.split(r'(?=BEGIN:VCARD)', content)
            vcards = [v.strip() for v in vcards if v.strip()][:5]
            
            text = "📋 *Detail Kontak:*\n\n"
            for i, vcard in enumerate(vcards, 1):
                fn_match = re.search(r'FN:(.+)', vcard)
                tel_match = re.search(r'TEL[^:]*:(.+)', vcard)
                
                if fn_match:
                    text += f"{i}. {fn_match.group(1)}"
                if tel_match:
                    text += f" - {tel_match.group(1)}"
                text += "\n"
            
            await update.message.reply_text(text, parse_mode="Markdown")
            increment_operation(user_id)
            vip_sessions.pop(user_id, None)
            return
        
    except Exception as e:
        await update.message.reply_text(f"❌ *Error:* {str(e)}", parse_mode="Markdown")
        vip_sessions.pop(user_id, None)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text input during VIP command"""
    text = update.message.text.strip()
    user_id = update.effective_user.id
    session = get_session(user_id)
    
    if 'command' not in session:
        return
    
    if text.lower() == 'batal':
        vip_sessions.pop(user_id, None)
        await update.message.reply_text("❌ *Dibatalkan ya Kak* 😊", parse_mode="Markdown")
        return
    
    command = session['command']
    
    # TXT TO VCF - Step 2/3
    if command == 'txttovcf' and session.get('step') == 2:
        output_name = text if text.lower() != 'done' else 'converted'
        session['output_name'] = output_name.replace('[^a-zA-Z0-9_-]', '_')
        session['step'] = 3
        await update.message.reply_text(
            "*Masukkan nama kontak prefix:*\n(Misal: 'Contact', ketik 'done' pakai nama file)",
            parse_mode="Markdown"
        )
        return
    
    if command == 'txttovcf' and session.get('step') == 3:
        contact_name = text if text.lower() != 'done' else session['output_name']
        
        output_file = f"/tmp/{session['output_name']}.vcf"
        success, msg = txt_to_vcf(session['file'], output_file, contact_name)
        
        if success:
            await context.bot.send_document(update.effective_chat.id, open(output_file, 'rb'))
            await update.message.reply_text(f"✅ *Berhasil!*\n\n{msg}", parse_mode="Markdown")
            increment_operation(user_id)
        else:
            await update.message.reply_text(f"❌ *Gagal:* {msg}", parse_mode="Markdown")
        
        if os.path.exists(output_file):
            os.remove(output_file)
        vip_sessions.pop(user_id, None)
        return
    
    # XLSX TO VCF - Step 2/3
    if command == 'xlstovcf' and session.get('step') == 2:
        contact_name = text if text.lower() != 'done' else 'Contact'
        session['contact_name'] = contact_name
        session['step'] = 3
        await update.message.reply_text(
            "*Masukkan nama file output:*\n(Tanpa .vcf)",
            parse_mode="Markdown"
        )
        return
    
    if command == 'xlstovcf' and session.get('step') == 3:
        output_name = text.replace('[^a-zA-Z0-9_-]', '_')
        output_file = f"/tmp/{output_name}.vcf"
        
        success, msg = xls_to_vcf(session['file'], output_file, session['contact_name'])
        
        if success:
            await context.bot.send_document(update.effective_chat.id, open(output_file, 'rb'))
            await update.message.reply_text(f"✅ *Berhasil!*\n\n{msg}", parse_mode="Markdown")
            increment_operation(user_id)
        else:
            await update.message.reply_text(f"❌ *Gagal:* {msg}", parse_mode="Markdown")
        
        if os.path.exists(output_file):
            os.remove(output_file)
        vip_sessions.pop(user_id, None)
        return
    
    # RENAME FILE - Step 2
    if command == 'renamefile' and session.get('step') == 2:
        new_name = text.replace('[^a-zA-Z0-9_-]', '_')
        output_file = f"/tmp/{new_name}{session['ext']}"
        
        import shutil
        shutil.copy(session['file'], output_file)
        
        await context.bot.send_document(update.effective_chat.id, open(output_file, 'rb'))
        await update.message.reply_text(f"✅ *File direname menjadi:* `{new_name}{session['ext']}`", parse_mode="Markdown")
        increment_operation(user_id)
        
        if os.path.exists(output_file):
            os.remove(output_file)
        vip_sessions.pop(user_id, None)
        return
    
    # RENAME KONTAK - Step 2
    if command == 'renamekontak' and session.get('step') == 2:
        new_name = text
        
        with open(session['file'], 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Simple rename: replace all FN: values
        import re
        counter = [0]
        
        def replace_fn(match):
            counter[0] += 1
            return f"FN:{new_name} {counter[0]}"
        
        content = re.sub(r'FN:[^\n]*', replace_fn, content)
        
        output_file = f"/tmp/renamed_{user_id}.vcf"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        await context.bot.send_document(update.effective_chat.id, open(output_file, 'rb'))
        await update.message.reply_text(f"✅ *Berhasil rename {counter[0]} kontak!*", parse_mode="Markdown")
        increment_operation(user_id)
        
        if os.path.exists(output_file):
            os.remove(output_file)
        vip_sessions.pop(user_id, None)
        return
    
    # GABUNG FILE - Done
    if command in ['gabungfile', 'gabungvcf', 'gabungtxt'] and text.lower() == 'done':
        if len(session['files']) < 2:
            await update.message.reply_text("⚠️ *Minimal 2 file!*", parse_mode="Markdown")
            return
        
        session['step'] = 2
        await update.message.reply_text("*Masukkan nama file output:*", parse_mode="Markdown")
        return
    
    # GABUNG FILE - Output name
    if command in ['gabungfile', 'gabungvcf', 'gabungtxt'] and session.get('step') == 2:
        output_name = text.replace('[^a-zA-Z0-9_-]', '_')
        
        # Simple merge: concatenate all files
        merged_content = ""
        for f in session['files']:
            with open(f, 'r', encoding='utf-8') as file:
                merged_content += file.read() + "\n"
        
        ext = '.vcf' if 'vcf' in command else '.txt'
        output_file = f"/tmp/{output_name}{ext}"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(merged_content)
        
        await context.bot.send_document(update.effective_chat.id, open(output_file, 'rb'))
        await update.message.reply_text(
            f"✅ *Berhasil gabung {len(session['files'])} file!*",
            parse_mode="Markdown"
        )
        increment_operation(user_id)
        
        if os.path.exists(output_file):
            os.remove(output_file)
        vip_sessions.pop(user_id, None)
