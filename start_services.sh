#!/bin/bash

# --- START SCRIPT: start_services.sh (Robust Setup & Launcher) ---

# ====================================================================
# 1. KONFIGURASI AWAL & VARIABEL GLOBAL
# ====================================================================

LOG_DIR="/tmp"
BACKEND_LOG="$LOG_DIR/unipresence_backend.log"
FRONTEND_LOG="$LOG_DIR/unipresence_frontend.log"
# Folder Venv khusus
VENV_NAME="tugascitra"
VENV_DIR="./$VENV_NAME"
# Path binari Python untuk Linux/Mac dan Windows (Scripts)
VENV_BIN_PATH="$VENV_DIR/bin"
VENV_SCRIPTS_PATH="$VENV_DIR/Scripts"
PYTHON_CMD=""

# Hapus log lama
rm -f "$BACKEND_LOG" "$FRONTEND_LOG"


# ====================================================================
# 2. FUNGSI: SETUP PYTHON ENVIRONMENT
# ====================================================================

setup_python_env() {
    # Prioritas 1: Conda Aktif (Pilihan Lycus)
    if [ ! -z "$CONDA_PREFIX" ]; then
        PYTHON_CMD="$CONDA_PREFIX/bin/python"
        echo "✅ Python Environment: Conda ($(basename $CONDA_PREFIX)) terdeteksi dan digunakan."
        return 0
    fi
    
    # Prioritas 2: Venv tugascitra sudah ada
    if [ -f "$VENV_BIN_PATH/python" ]; then
        PYTHON_CMD="$VENV_BIN_PATH/python"
        echo "✅ Python Environment: Venv '$VENV_NAME' terdeteksi dan digunakan."
        return 0
    elif [ -f "$VENV_SCRIPTS_PATH/python.exe" ]; then
        PYTHON_CMD="$VENV_SCRIPTS_PATH/python.exe"
        echo "✅ Python Environment: Venv '$VENV_NAME' (Scripts/Windows) terdeteksi dan digunakan."
        return 0
    fi

    # Prioritas 3: Tawarkan untuk membuat Venv baru
    echo "--------------------------------------------------------"
    echo "❓ Setup Environment Python Belum Terdeteksi."
    echo "Pilih opsi setup Python (1 atau 2):"
    echo "1. Gunakan Python Venv Baru ('$VENV_NAME') - Disarankan untuk Windows/Lokal"
    echo "2. Keluar dan aktifkan Conda Env Anda secara manual (Misal: conda activate base)"
    echo "--------------------------------------------------------"
    read -p "Pilihan Anda (1/2): " choice

    if [ "$choice" == "1" ]; then
        echo "Membuat Python Virtual Environment '$VENV_NAME'..."
        # Mencoba python3, lalu python sebagai fallback
        if command -v python3 &>/dev/null; then
            python3 -m venv "$VENV_DIR"
        elif command -v python &>/dev/null; then
            python -m venv "$VENV_DIR"
        else
            echo "❌ ERROR: Perintah 'python' atau 'python3' tidak ditemukan. Instal Python atau aktifkan Conda."
            exit 1
        fi
        
        # Cek ulang path venv setelah dibuat dan set PYTHON_CMD
        if [ -f "$VENV_BIN_PATH/python" ]; then
            PYTHON_CMD="$VENV_BIN_PATH/python"
        elif [ -f "$VENV_SCRIPTS_PATH/python.exe" ]; then
             PYTHON_CMD="$VENV_SCRIPTS_PATH/python.exe"
        else
            echo "❌ ERROR: Venv berhasil dibuat tapi interpreter Python tidak ditemukan di $VENV_DIR. Skrip dibatalkan."
            exit 1
        fi
        echo "✅ Venv '$VENV_NAME' berhasil dibuat dan akan digunakan."
    elif [ "$choice" == "2" ]; then
        echo "❌ Silakan aktifkan Conda Environment Anda secara manual (Misal: conda activate base) sebelum menjalankan skrip ini."
        exit 1
    else
        echo "❌ Pilihan tidak valid. Skrip dibatalkan."
        exit 1
    fi
}


# ====================================================================
# 3. FUNGSI: DEPENDENCY CHECK & INSTALL & KILL SERVICES
# ====================================================================

check_and_install_deps() {
    # Cek Backend Dependencies
    echo ""
    echo "--- Memeriksa Backend (Python) Dependencies ---"
    REQUIREMENTS_FILE="./backend/requirements.txt"
    # Marker file agar tidak instal ulang setiap kali requirements.txt tidak berubah
    DEPENDENCY_MARKER="$VENV_DIR/.backend_deps_installed" 

    if [ -f "$REQUIREMENTS_FILE" ]; then
        # Cek apakah marker file ada DAN requirements.txt tidak lebih baru (artinya sudah terinstal)
        if [ -f "$DEPENDENCY_MARKER" ] && [ "$REQUIREMENTS_FILE" -ot "$DEPENDENCY_MARKER" ]; then
            echo "✅ Backend dependencies sudah terinstal di Venv/Conda ($VENV_NAME)."
        else
            echo "⚙️ Menginstal ulang/memperbarui Backend dependencies..."
            # Gunakan pip install --upgrade agar lebih aman jika ada perubahan
            "$PYTHON_CMD" -m pip install --upgrade pip
            "$PYTHON_CMD" -m pip install -r "$REQUIREMENTS_FILE"
            if [ $? -ne 0 ]; then
                echo "❌ ERROR: Gagal menginstal Python dependencies. Cek log instalasi di atas."
                exit 1
            fi
            touch "$DEPENDENCY_MARKER" # Buat marker baru
            echo "✅ Instalasi Backend selesai."
        fi
    else
        echo "Peringatan: File $REQUIREMENTS_FILE tidak ditemukan. Melewatkan instalasi Backend."
    fi

    # Cek Frontend Dependencies
    echo ""
    echo "--- Memeriksa Frontend (Yarn/NPM) Dependencies ---"
    if [ ! -d "./frontend/node_modules" ]; then
        echo "⚙️ Folder node_modules tidak ditemukan. Menjalankan instalasi..."
        
        if command -v yarn &>/dev/null; then
            yarn --cwd ./frontend install
            COMMAND_USED="Yarn"
        elif command -v npm &>/dev/null; then
            echo "Peringatan: Yarn tidak ditemukan. Menggunakan 'npm install'..."
            npm --prefix ./frontend install
            COMMAND_USED="NPM"
        else
            echo "❌ ERROR: Yarn dan NPM tidak ditemukan. Instal salah satu untuk melanjutkan."
            exit 1
        fi
        
        if [ $? -ne 0 ]; then
            echo "❌ ERROR: Gagal menjalankan $COMMAND_USED install. Cek koneksi internet/izin."
            exit 1
        fi
        echo "✅ Frontend dependencies terinstal dengan $COMMAND_USED."
    else
        echo "✅ Frontend dependencies (node_modules) sudah terinstal."
    fi
}

# FUNGSI BARU: Kill services yang sedang berjalan
kill_existing_services() {
    echo ""
    echo "⚙️ Menghentikan proses lama secara spesifik..."
    pkill -9 -f "server.py" 2>/dev/null
    pkill -9 -f "yarn dev" 2>/dev/null
    # Memberi waktu sejenak agar port benar-benar kosong
    sleep 1 
    echo "✅ Proses lama dibersihkan."
}


# ====================================================================
# 4. MAIN EXECUTION FLOW
# ====================================================================

echo ""
echo "=========================================================="
echo "🚀 UniPresence Service Launcher v3.0 (Full Setup)"
echo "=========================================================="

# 1. Eksekusi Setup Environment & Instalasi
setup_python_env
check_and_install_deps

# 2. KILL EXISTING PROCESSES (Dipanggil di sini)
kill_existing_services


# START BACKEND
echo ""
echo "Memulai Backend..."
# Eksekusi: $PYTHON_CMD menjalankan ./backend/server.py
$PYTHON_CMD ./backend/server.py > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Cek apakah proses benar-benar jalan
if [ -z "$BACKEND_PID" ] || ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "❌ ERROR: Backend GAGAL dimulai. Cek log: $BACKEND_LOG"
else
    echo "✅ Backend Berhasil dimulai (PID: $BACKEND_PID)"
fi


# START FRONTEND
echo "Memulai Frontend..."
# Menggunakan 'yarn --cwd ./frontend dev'
yarn --cwd ./frontend dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Cek apakah proses benar-benar jalan
if [ -z "$FRONTEND_PID" ] || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "❌ ERROR: Frontend GAGAL dimulai. Cek log: $FRONTEND_LOG"
else
    echo "✅ Frontend Berhasil dimulai (PID: $FRONTEND_PID)"
fi


# FINAL MESSAGE
echo ""
echo "=========================================================="
echo "Status Servis UniPresence:"
echo "Backend: http://localhost:8001 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo "Log Backend: $BACKEND_LOG"
echo "Log Frontend: $FRONTEND_LOG"
echo "=========================================================="