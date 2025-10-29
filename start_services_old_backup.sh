#!/bin/bash

# =============================================================================
# 🚀 UNIPRESENCE SERVICE LAUNCHER v4.0 - FIX CONDA ENVIRONMENT
# *PASTIKAN FILE INI DISIMPAN DENGAN FORMAT LINE ENDINGS UNIX (LF)*
# =============================================================================

# ====================================================================
# 1. KONFIGURASI & VARIABEL GLOBAL
# ====================================================================

# --- Path Log ---
LOG_DIR="/tmp"
BACKEND_LOG="$LOG_DIR/unipresence_backend.log"
FRONTEND_LOG="$LOG_DIR/unipresence_frontend.log"
NGROK_LOG="$LOG_DIR/unipresence_ngrok.log"

# --- Python Environment ---
VENV_NAME="tugascitra"
VENV_DIR="./$VENV_NAME"
VENV_BIN_PATH="$VENV_DIR/bin"
VENV_SCRIPTS_PATH="$VENV_DIR/Scripts"
PYTHON_CMD=""
CONDA_BASE_PATH="" # Variabel baru untuk base path Conda
CONDA_ENV_NAME="$VENV_NAME" # Target Conda Env kita adalah "tugascitra"

# --- Ngrok Configuration ---
USE_NGROK=false
NGROK_BACKEND_PORT=8001
NGROK_FRONTEND_PORT=3000

# --- Warna Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Hapus log lama
rm -f "$BACKEND_LOG" "$FRONTEND_LOG" "$NGROK_LOG"

# ====================================================================
# 2. FUNGSI UTILITY (Pencetakan)
# ====================================================================

print_header() {
    echo -e "${CYAN}"
    echo "=========================================================="
    echo "$1"
    echo "=========================================================="
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# ====================================================================
# 3. FUNGSI: ASK FOR NGROK USAGE
# ====================================================================

ask_ngrok_usage() {
    echo ""
    print_header "🌐 NGROK NETWORK EXPOSURE"
    echo -e "${CYAN}Apakah Anda ingin mengaktifkan Ngrok untuk akses internet?${NC}"
    echo ""
    echo " 1. ✅ Ya - Aktifkan Ngrok (Akses dari Internet)"
    echo " 2. ❌ Tidak - Lokal saja (localhost:3000 & localhost:8001)"
    echo ""
    read -r -p "Pilihan Anda (1/2): " ngrok_choice
    
    if [ "$ngrok_choice" == "1" ]; then
        USE_NGROK=true
        print_success "Ngrok akan diaktifkan!"
    else
        USE_NGROK=false
        print_info "Mode Lokal - Ngrok tidak akan digunakan."
    fi
}

# ====================================================================
# 4. FUNGSI: CHECK NGROK INSTALLATION
# ====================================================================

check_ngrok_installation() {
    if ! command -v ngrok &>/dev/null; then
        print_error "Ngrok tidak ditemukan di sistem!"
        echo ""
        print_info "Install Ngrok dengan cara:"
        echo " 1. Download dari https://ngrok.com/download"
        echo " 2. Extract dan tambahkan ke PATH"
        echo " 3. Jalankan: ngrok config add-authtoken YOUR_TOKEN"
        echo ""
        print_warning "Melanjutkan tanpa Ngrok..."
        USE_NGROK=false
        return 1
    fi
    
    # Check ngrok config (termasuk path snap yang umum di Zorin OS)
    if [ ! -f "$HOME/.config/ngrok/ngrok.yml" ] && [ ! -f "$HOME/snap/ngrok/current/.config/ngrok/ngrok.yml" ]; then
        print_warning "Ngrok belum dikonfigurasi dengan authtoken!"
        print_info "Jalankan: ngrok config add-authtoken YOUR_TOKEN"
        print_warning "Melanjutkan tanpa Ngrok..."
        USE_NGROK=false
        return 1
    fi
    
    print_success "Ngrok terdeteksi dan siap digunakan!"
    return 0
}

# ====================================================================
# 5. FUNGSI: SETUP PYTHON ENVIRONMENT (FIXED)
# ====================================================================

setup_python_env() {
    # Prioritas 1: Conda Aktif (atau terdeteksi)
    if [ -n "$CONDA_PREFIX" ] || command -v conda &>/dev/null; then
        # Ambil CONDA_PREFIX atau CONDA_ROOT/base path
        if [ -n "$CONDA_PREFIX" ]; then
            # Jika sudah di-activate, Conda Base adalah parent dari CONDA_PREFIX
            CONDA_BASE_PATH=$(dirname $(dirname "$CONDA_PREFIX")) 
        else
            # Coba tebak Conda Base
            CONDA_BASE_PATH=$(conda info --base 2>/dev/null)
        fi
        
        if [ -d "$CONDA_BASE_PATH" ]; then
            # Kita hanya pastikan Conda ada, lalu targetkan ke env 'tugascitra'
            print_success "Python Environment: Conda terdeteksi. Target Env: '$CONDA_ENV_NAME'."
            return 0
        fi
    fi
    
    # Prioritas 2: Venv tugascitra
    if [ -f "$VENV_BIN_PATH/python" ]; then
        PYTHON_CMD="$VENV_BIN_PATH/python"
        print_success "Python Environment: Venv '$VENV_NAME' terdeteksi."
        return 0
    elif [ -f "$VENV_SCRIPTS_PATH/python.exe" ]; then
        PYTHON_CMD="$VENV_SCRIPTS_PATH/python.exe"
        print_success "Python Environment: Venv '$VENV_NAME' (Windows) terdeteksi."
        return 0
    fi

    # Prioritas 3: Buat Venv baru
    echo ""
    print_warning "Setup Environment Python Belum Terdeteksi."
    echo "Pilih opsi:"
    echo " 1. Buat Python Venv Baru ('$VENV_NAME')"
    echo " 2. Keluar (Aktifkan Conda manual)"
    echo ""
    read -r -p "Pilihan (1/2): " choice

    if [ "$choice" == "1" ]; then
        print_info "Membuat Python Virtual Environment '$VENV_NAME'..."
        if command -v python3 &>/dev/null; then
            python3 -m venv "$VENV_DIR"
        elif command -v python &>/dev/null; then
            python -m venv "$VENV_DIR"
        else
            print_error "Python tidak ditemukan! Install Python terlebih dahulu."
            exit 1
        fi
        
        # Cek path python di Venv yang baru dibuat
        if [ -f "$VENV_BIN_PATH/python" ]; then
            PYTHON_CMD="$VENV_BIN_PATH/python"
        elif [ -f "$VENV_SCRIPTS_PATH/python.exe" ]; then
            PYTHON_CMD="$VENV_SCRIPTS_PATH/python.exe"
        else
            print_error "Venv berhasil dibuat tapi Python tidak ditemukan di lokasi standar."
            exit 1
        fi
        print_success "Venv '$VENV_NAME' berhasil dibuat!"
    else
        print_error "Silakan aktifkan Conda Environment manual atau buat Venv."
        exit 1
    fi
}

# ====================================================================
# 6. FUNGSI: DEPENDENCY CHECK & INSTALL (FIXED)
# ====================================================================

check_and_install_deps() {
    echo ""
    print_header "📦 DEPENDENCY CHECK"
    
    # --- Backend Dependencies (Python) ---
    print_info "Memeriksa Backend (Python) Dependencies..."
    REQUIREMENTS_FILE="./backend/requirements.txt"
    DEPENDENCY_MARKER="./backend/.backend_deps_installed"

    # Logika Conda: Source dan Activate 'tugascitra'
    if [ -n "$CONDA_BASE_PATH" ]; then
        print_info "Mengaktifkan Conda Environment ('$CONDA_ENV_NAME') untuk instalasi..."
        source "$CONDA_BASE_PATH/etc/profile.d/conda.sh" 2>/dev/null
        conda activate "$CONDA_ENV_NAME" 2>/dev/null
        
        if [ $? -ne 0 ]; then
            print_error "Gagal mengaktifkan Conda Env '$CONDA_ENV_NAME'. Pastikan env tersebut sudah dibuat."
            exit 1
        fi

        # Setelah Conda aktif, kita tentukan PYTHON_CMD baru
        PYTHON_CMD="$CONDA_PREFIX/bin/python" 
        PIP_CMD="pip" 
    else
        # Jika Venv/Global
        PIP_CMD="\"$PYTHON_CMD\" -m pip"
    fi

    if [ -f "$REQUIREMENTS_FILE" ]; then
        if [ -f "$DEPENDENCY_MARKER" ] && [ "$REQUIREMENTS_FILE" -ot "$DEPENDENCY_MARKER" ]; then
            print_success "Backend dependencies sudah terinstal."
        else
            print_info "Menginstal Backend dependencies..."
            # Jalankan pip dengan variabel CMD yang sudah disesuaikan
            $PIP_CMD install --upgrade pip --quiet
            $PIP_CMD install -r "$REQUIREMENTS_FILE" --quiet
            if [ $? -ne 0 ]; then
                print_error "Gagal menginstal Python dependencies! Cek koneksi/requirements.txt."
                [ -n "$CONDA_BASE_PATH" ] && conda deactivate 2>/dev/null
                exit 1
            fi
            touch "$DEPENDENCY_MARKER"
            print_success "Backend dependencies terinstal."
        fi
    else
        print_warning "requirements.txt tidak ditemukan. Melewatkan instalasi Backend."
    fi

    # Deaktifkan Conda setelah instalasi selesai
    [ -n "$CONDA_BASE_PATH" ] && conda deactivate 2>/dev/null


    # --- Frontend Dependencies (Yarn/NPM) ---
    print_info "Memeriksa Frontend (Yarn/NPM) Dependencies..."
    if [ ! -d "./frontend/node_modules" ]; then
        print_info "Menjalankan instalasi node_modules..."
        
        if command -v yarn &>/dev/null; then
            yarn --cwd ./frontend install --silent
            print_success "Frontend dependencies terinstal (Yarn)."
        elif command -v npm &>/dev/null; then
            print_warning "Yarn tidak ditemukan. Menggunakan NPM..."
            npm --prefix ./frontend install --silent
            print_success "Frontend dependencies terinstal (NPM)."
        else
            print_error "Yarn dan NPM tidak ditemukan! Silakan instal salah satunya."
            exit 1
        fi
    else
        print_success "Frontend dependencies sudah terinstal."
    fi
}

# ====================================================================
# 7. FUNGSI: KILL EXISTING SERVICES
# ====================================================================

kill_existing_services() {
    echo ""
    print_header "🧽 CLEANUP EXISTING PROCESSES"
    
    # Kill by process name (lebih spesifik)
    pkill -9 -f "./backend/server.py" 2>/dev/null
    pkill -9 -f "yarn dev" 2>/dev/null
    pkill -9 -f "ngrok http" 2>/dev/null
    
    # Kill by port
    PORTS_TO_KILL=(3000 8000 8001 4040)
    
    for port in "${PORTS_TO_KILL[@]}"; do
        if command -v lsof &>/dev/null; then
            PID=$(lsof -t -i:"$port" 2>/dev/null)
            if [ -n "$PID" ]; then
                kill -9 "$PID" 2>/dev/null
                print_info "Port $port dibersihkan (PID: $PID)"
            fi
        fi
    done

    # !!! PERUBAHAN INI YANG PENTING !!!
    sleep 3 # DITINGKATKAN dari 1 detik ke 3 detik untuk memastikan port benar-benar bersih
    
    print_success "Proses lama berhasil dibersihkan."
}

# ====================================================================
# 8. FUNGSI: START SERVICES (FIXED)
# ====================================================================

start_backend() {
    print_header "🐍 STARTING BACKEND"
    
    # Conda activation
    if [ -n "$CONDA_BASE_PATH" ]; then
        print_info "Mengaktifkan Conda Environment ('$CONDA_ENV_NAME') untuk Backend..."
        source "$CONDA_BASE_PATH/etc/profile.d/conda.sh" 2>/dev/null
        conda activate "$CONDA_ENV_NAME" 2>/dev/null
        # Set PYTHON_CMD di sini juga, karena Conda sudah aktif
        PYTHON_CMD="$CONDA_PREFIX/bin/python" 
    fi
    
    # Jalankan di background, simpan PID
    "$PYTHON_CMD" ./backend/server.py > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    
    sleep 4 # Delay yang lebih lama
    
    if [ -z "$BACKEND_PID" ] || ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        print_error "Backend GAGAL dimulai! Cek log: $BACKEND_LOG"
        [ -n "$CONDA_BASE_PATH" ] && conda deactivate 2>/dev/null # Deaktifkan Conda jika gagal
        exit 1
    else
        print_success "Backend dimulai (PID: $BACKEND_PID) di http://localhost:8001"
    fi
    
    # Deaktifkan Conda setelah startup backend
    [ -n "$CONDA_BASE_PATH" ] && conda deactivate 2>/dev/null
}

start_frontend() {
    print_header "⚙️ STARTING FRONTEND"
    
    if command -v yarn &>/dev/null; then
        ( sleep 1 && yarn --cwd ./frontend dev --port 3000 --strictPort ) > "$FRONTEND_LOG" 2>&1 &
        FRONTEND_PID=$!
    elif command -v npm &>/dev/null; then
        ( sleep 1 && npm --prefix ./frontend run dev -- --port 3000 ) > "$FRONTEND_LOG" 2>&1 &
        FRONTEND_PID=$!
    else
        print_error "Yarn dan NPM tidak ditemukan. Frontend GAGAL dimulai."
        exit 1
    fi
    
    sleep 3 
    
    if [ -z "$FRONTEND_PID" ] || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        print_error "Frontend GAGAL dimulai! Cek log: $FRONTEND_LOG"
        exit 1
    else
        print_success "Frontend dimulai (PID: $FRONTEND_PID) di http://localhost:3000"
    fi
}

start_ngrok() {
    print_header "🌍 STARTING NGROK TUNNELS"
    
    print_info "Starting Ngrok tunnel for Backend (Port $NGROK_BACKEND_PORT)..."
    ngrok http "$NGROK_BACKEND_PORT" --log=stdout > "$NGROK_LOG" 2>&1 &
    NGROK_BACKEND_PID=$!
    
    sleep 5
    
    NGROK_BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$NGROK_BACKEND_URL" ]; then
        print_warning "Gagal mendapatkan Ngrok URL untuk Backend."
        print_info "Cek Ngrok dashboard di: http://localhost:4040"
    else
        print_success "Ngrok Backend URL: $NGROK_BACKEND_URL"
    fi
}

# ====================================================================
# 9. MAIN EXECUTION
# ====================================================================

print_header "🚀 UNIPRESENCE SERVICE LAUNCHER v4.2"

# Langkah 1: Minta user untuk memperbaiki line endings jika Conda tidak terdeteksi
if ! command -v conda &>/dev/null && [ -z "$PYTHON_CMD" ]; then
    print_warning "Jika Anda mengalami error 'command not found', pastikan script ini disimpan dengan format Line Endings: Unix (LF)!"
fi

# Step 1: Ask for Ngrok
ask_ngrok_usage

# Step 2: Check Ngrok if requested
if [ "$USE_NGROK" = true ]; then
    check_ngrok_installation
fi

# Step 3: Setup Python
setup_python_env

# Step 4: Install Dependencies
check_and_install_deps

# Step 5: Cleanup
kill_existing_services

# Step 6: Start Services
start_backend
start_frontend

# Step 7: Start Ngrok (if enabled)
if [ "$USE_NGROK" = true ]; then
    start_ngrok
fi

# ====================================================================
# 10. FINAL STATUS
# ====================================================================

echo ""
print_header "✨ UNIPRESENCE SERVICES RUNNING"

echo -e "${GREEN}Local Access:${NC}"
echo -e " Backend: ${CYAN}http://localhost:8001${NC}"
echo -e " Frontend: ${CYAN}http://localhost:3000${NC}"

if [ "$USE_NGROK" = true ] && [ -n "$NGROK_BACKEND_URL" ]; then
    echo ""
    echo -e "${GREEN}Internet Access (Ngrok):${NC}"
    echo -e " Backend: ${PURPLE}$NGROK_BACKEND_URL${NC}"
    echo -e " Dashboard: ${CYAN}http://localhost:4040${NC}"
fi

echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e " Backend: $BACKEND_LOG"
echo -e " Frontend: $FRONTEND_LOG"
if [ "$USE_NGROK" = true ]; then
    echo -e " Ngrok: $NGROK_LOG"
fi

echo ""
print_header "🎉 ALL SYSTEMS GO!"
echo -e "${GREEN}Tekan Ctrl+C untuk menghentikan semua services${NC}"
echo ""

# Keep script running
wait