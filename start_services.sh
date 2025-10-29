#!/bin/bash

# =============================================================================
# 🚀 UNIPRESENCE SERVICE LAUNCHER v5.0 - SMART & ALWAYS FRESH
# =============================================================================

# ====================================================================
# 1. KONFIGURASI & VARIABEL GLOBAL
# ====================================================================

LOG_DIR="/tmp"
BACKEND_LOG="$LOG_DIR/unipresence_backend.log"
FRONTEND_LOG="$LOG_DIR/unipresence_frontend.log"
NGROK_LOG="$LOG_DIR/unipresence_ngrok.log"

# PID Files (untuk tracking process)
BACKEND_PID_FILE="$LOG_DIR/unipresence_backend.pid"
FRONTEND_PID_FILE="$LOG_DIR/unipresence_frontend.pid"
NGROK_PID_FILE="$LOG_DIR/unipresence_ngrok.pid"

# Python Environment
PYTHON_CMD=""
USE_CONDA=false

# Ngrok Configuration
USE_NGROK=false
NGROK_BACKEND_PORT=8001

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Hapus log lama
rm -f "$BACKEND_LOG" "$FRONTEND_LOG" "$NGROK_LOG"

# Trap untuk cleanup saat Ctrl+C
trap cleanup_on_exit INT TERM

cleanup_on_exit() {
    echo ""
    print_warning "Stopping services..."
    
    # Kill services using PID files
    if [ -f "$BACKEND_PID_FILE" ]; then
        SAVED_PID=$(cat "$BACKEND_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_PID" ] && kill -0 "$SAVED_PID" 2>/dev/null; then
            kill -9 "$SAVED_PID" 2>/dev/null
            print_info "Stopped Backend (PID: $SAVED_PID)"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        SAVED_PID=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_PID" ] && kill -0 "$SAVED_PID" 2>/dev/null; then
            kill -9 "$SAVED_PID" 2>/dev/null
            print_info "Stopped Frontend (PID: $SAVED_PID)"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    if [ -f "$NGROK_PID_FILE" ]; then
        SAVED_PID=$(cat "$NGROK_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_PID" ] && kill -0 "$SAVED_PID" 2>/dev/null; then
            kill -9 "$SAVED_PID" 2>/dev/null
            print_info "Stopped Ngrok (PID: $SAVED_PID)"
        fi
        rm -f "$NGROK_PID_FILE"
    fi
    
    # Restore .env if using ngrok
    if [ "$USE_NGROK" = true ]; then
        restore_frontend_env
    fi
    
    print_success "Cleanup complete. Goodbye!"
    exit 0
}

# ====================================================================
# 2. FUNGSI UTILITY
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
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ====================================================================
# 3. FUNGSI: DETECT PYTHON ENVIRONMENT
# ====================================================================

detect_python_env() {
    print_header "🐍 DETECTING PYTHON ENVIRONMENT"
    
    # Check if Conda is active
    if [ ! -z "$CONDA_PREFIX" ]; then
        PYTHON_CMD="python"
        USE_CONDA=true
        print_success "Using Conda Environment: $(basename $CONDA_PREFIX)"
        return 0
    fi
    
    # Fallback to system python
    if command -v python3 &>/dev/null; then
        PYTHON_CMD="python3"
        print_success "Using System Python3"
        return 0
    elif command -v python &>/dev/null; then
        PYTHON_CMD="python"
        print_success "Using System Python"
        return 0
    else
        print_error "Python tidak ditemukan! Install Python atau aktifkan Conda."
        exit 1
    fi
}

# ====================================================================
# 4. FUNGSI: SMART DEPENDENCY INSTALL
# ====================================================================

install_backend_deps() {
    print_header "📦 INSTALLING BACKEND DEPENDENCIES"
    
    if [ ! -f "./backend/requirements.txt" ]; then
        print_warning "requirements.txt tidak ditemukan. Skipping..."
        return 0
    fi
    
    print_info "Running: pip install -r requirements.txt..."
    
    cd backend
    $PYTHON_CMD -m pip install -r requirements.txt --quiet --disable-pip-version-check
    
    if [ $? -eq 0 ]; then
        print_success "Backend dependencies berhasil diinstall/update!"
        cd ..
        return 0
    else
        print_error "Gagal install backend dependencies!"
        cd ..
        exit 1
    fi
}

install_frontend_deps() {
    print_header "📦 INSTALLING FRONTEND DEPENDENCIES"
    
    if [ ! -f "./frontend/package.json" ]; then
        print_warning "package.json tidak ditemukan. Skipping..."
        return 0
    fi
    
    # Check yarn vs npm
    if command -v yarn &>/dev/null; then
        print_info "Running: yarn install..."
        cd frontend
        yarn install --silent --non-interactive
        INSTALL_STATUS=$?
        cd ..
        
        if [ $INSTALL_STATUS -eq 0 ]; then
            print_success "Frontend dependencies berhasil diinstall/update (Yarn)!"
            return 0
        else
            print_error "Gagal install frontend dependencies!"
            exit 1
        fi
    elif command -v npm &>/dev/null; then
        print_warning "Yarn tidak ditemukan. Menggunakan npm..."
        print_info "Running: npm install..."
        cd frontend
        npm install --silent --no-progress
        INSTALL_STATUS=$?
        cd ..
        
        if [ $INSTALL_STATUS -eq 0 ]; then
            print_success "Frontend dependencies berhasil diinstall/update (npm)!"
            return 0
        else
            print_error "Gagal install frontend dependencies!"
            exit 1
        fi
    else
        print_error "Yarn dan npm tidak ditemukan! Install salah satu."
        exit 1
    fi
}

# ====================================================================
# 5. FUNGSI: ASK FOR NGROK
# ====================================================================

ask_ngrok_usage() {
    echo ""
    print_header "🌐 NGROK NETWORK EXPOSURE"
    echo -e "${CYAN}Apakah Anda ingin mengaktifkan Ngrok?${NC}"
    echo ""
    echo "  1. ✅ Ya - Aktifkan Ngrok (Internet Access)"
    echo "  2. ❌ Tidak - Lokal saja"
    echo ""
    read -p "Pilihan (1/2): " ngrok_choice
    
    if [ "$ngrok_choice" == "1" ]; then
        USE_NGROK=true
        print_success "Ngrok akan diaktifkan!"
    else
        USE_NGROK=false
        print_info "Mode Lokal"
    fi
}

# ====================================================================
# 6. FUNGSI: CHECK NGROK
# ====================================================================

check_ngrok_installation() {
    if ! command -v ngrok &>/dev/null; then
        print_error "Ngrok tidak terinstall!"
        print_info "Download: https://ngrok.com/download"
        print_warning "Melanjutkan tanpa Ngrok..."
        USE_NGROK=false
        return 1
    fi
    
    # Check authtoken (ngrok v3+ uses different config path)
    if [ ! -f "$HOME/.config/ngrok/ngrok.yml" ] && [ ! -f "$HOME/.ngrok2/ngrok.yml" ] && [ ! -f "$HOME/snap/ngrok/*/\.config/ngrok/ngrok.yml" ]; then
        print_warning "Ngrok authtoken belum dikonfigurasi!"
        print_info "Setup: ngrok config add-authtoken YOUR_TOKEN"
        print_warning "Melanjutkan tanpa Ngrok..."
        USE_NGROK=false
        return 1
    fi
    
    print_success "Ngrok siap digunakan!"
    return 0
}

# ====================================================================
# 7. FUNGSI: KILL EXISTING SERVICES (IMPROVED WITH PID FILES)
# ====================================================================

kill_existing_services() {
    print_header "🧹 CLEANUP OLD PROCESSES"
    
    # Step 1: Kill by saved PID files (most reliable)
    print_info "Checking saved PID files..."
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        SAVED_BACKEND_PID=$(cat "$BACKEND_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_BACKEND_PID" ] && kill -0 "$SAVED_BACKEND_PID" 2>/dev/null; then
            kill -9 "$SAVED_BACKEND_PID" 2>/dev/null
            print_success "Killed Backend (PID: $SAVED_BACKEND_PID)"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        SAVED_FRONTEND_PID=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_FRONTEND_PID" ] && kill -0 "$SAVED_FRONTEND_PID" 2>/dev/null; then
            kill -9 "$SAVED_FRONTEND_PID" 2>/dev/null
            print_success "Killed Frontend (PID: $SAVED_FRONTEND_PID)"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    if [ -f "$NGROK_PID_FILE" ]; then
        SAVED_NGROK_PID=$(cat "$NGROK_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_NGROK_PID" ] && kill -0 "$SAVED_NGROK_PID" 2>/dev/null; then
            kill -9 "$SAVED_NGROK_PID" 2>/dev/null
            print_success "Killed Ngrok (PID: $SAVED_NGROK_PID)"
        fi
        rm -f "$NGROK_PID_FILE"
    fi
    
    # Step 2: Kill by process name (fallback)
    print_info "Killing by process name (fallback)..."
    pkill -9 -f "server.py" 2>/dev/null
    pkill -9 -f "vite" 2>/dev/null
    pkill -9 -f "yarn dev" 2>/dev/null
    pkill -9 -f "ngrok http" 2>/dev/null
    
    # Step 3: Kill by port (most aggressive)
    print_info "Killing by port (aggressive cleanup)..."
    PORTS_TO_KILL=(3000 8000 8001 4040)
    
    for port in "${PORTS_TO_KILL[@]}"; do
        if command -v lsof &>/dev/null; then
            PID=$(lsof -t -i:"$port" 2>/dev/null)
            if [ ! -z "$PID" ]; then
                kill -9 "$PID" 2>/dev/null
                print_info "Cleared port $port (PID: $PID)"
            fi
        fi
    done

    # Wait for ports to be fully released
    sleep 3
    
    # Verify ports are free
    print_info "Verifying ports are free..."
    for port in 3000 8001; do
        if lsof -i:"$port" 2>/dev/null | grep -q LISTEN; then
            print_warning "Port $port still in use! Retrying..."
            PID=$(lsof -t -i:"$port" 2>/dev/null)
            kill -9 "$PID" 2>/dev/null
            sleep 2
        fi
    done
    
    print_success "Cleanup complete!"
}

# ====================================================================
# 8. FUNGSI: START SERVICES
# ====================================================================

start_backend() {
    print_header "🐍 STARTING BACKEND"
    
    cd backend
    $PYTHON_CMD server.py > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Save PID to file
    echo "$BACKEND_PID" > "$BACKEND_PID_FILE"
    
    # Wait and verify
    sleep 3
    
    if [ -z "$BACKEND_PID" ] || ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        print_error "Backend GAGAL start! Cek log: $BACKEND_LOG"
        tail -20 "$BACKEND_LOG"
        rm -f "$BACKEND_PID_FILE"
        exit 1
    else
        print_success "Backend running (PID: $BACKEND_PID) → http://localhost:8001"
        print_info "PID saved to: $BACKEND_PID_FILE"
    fi
}

start_frontend() {
    print_header "⚛️  STARTING FRONTEND"
    
    # Double check port 3000 is free
    if lsof -i:3000 2>/dev/null | grep -q LISTEN; then
        print_warning "Port 3000 still occupied! Force killing..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    cd frontend
    yarn dev --port 3000 --strictPort > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Save PID to file
    echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"
    
    # Wait and verify
    sleep 4
    
    if [ -z "$FRONTEND_PID" ] || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        print_error "Frontend GAGAL start! Cek log: $FRONTEND_LOG"
        tail -20 "$FRONTEND_LOG"
        rm -f "$FRONTEND_PID_FILE"
        
        # Debug: Show what's using port 3000
        print_warning "Checking port 3000..."
        lsof -i:3000
        exit 1
    else
        print_success "Frontend running (PID: $FRONTEND_PID) → http://localhost:3000"
        print_info "PID saved to: $FRONTEND_PID_FILE"
    fi
}

start_ngrok() {
    print_header "🌐 STARTING NGROK"
    
    print_info "Starting tunnel for port $NGROK_BACKEND_PORT..."
    ngrok http $NGROK_BACKEND_PORT --log=stdout > "$NGROK_LOG" 2>&1 &
    NGROK_PID=$!
    
    # Save PID to file
    echo "$NGROK_PID" > "$NGROK_PID_FILE"
    
    # Wait for ngrok to initialize
    sleep 6
    
    # Get public URL from API
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -z "$NGROK_URL" ]; then
        print_warning "Tidak dapat mendapatkan Ngrok URL"
        print_info "Cek dashboard: http://localhost:4040"
        return 1
    else
        print_success "Ngrok Backend URL: $NGROK_URL"
        print_info "PID saved to: $NGROK_PID_FILE"
        
        # Update frontend .env to use ngrok URL
        update_frontend_env_for_ngrok "$NGROK_URL"
    fi
    
    print_info "Dashboard: http://localhost:4040"
}

update_frontend_env_for_ngrok() {
    local NGROK_URL=$1
    
    print_info "Updating frontend .env untuk menggunakan Ngrok URL..."
    
    # Backup original .env
    if [ -f "./frontend/.env" ]; then
        cp ./frontend/.env ./frontend/.env.backup
        print_info "Backup .env → .env.backup"
    fi
    
    # Update or create .env dengan ngrok URL
    if [ -f "./frontend/.env" ]; then
        # Replace existing VITE_BACKEND_URL
        if grep -q "VITE_BACKEND_URL" ./frontend/.env; then
            sed -i.tmp "s|VITE_BACKEND_URL=.*|VITE_BACKEND_URL=$NGROK_URL|g" ./frontend/.env
            rm -f ./frontend/.env.tmp
        else
            echo "VITE_BACKEND_URL=$NGROK_URL" >> ./frontend/.env
        fi
    else
        echo "VITE_BACKEND_URL=$NGROK_URL" > ./frontend/.env
    fi
    
    print_success "Frontend akan menggunakan: $NGROK_URL"
    print_warning "Frontend perlu direstart untuk apply changes..."
    
    # Restart frontend to apply new env
    restart_frontend_for_ngrok
}

restart_frontend_for_ngrok() {
    print_info "Restarting frontend untuk apply Ngrok URL..."
    
    # Kill existing frontend using saved PID
    if [ -f "$FRONTEND_PID_FILE" ]; then
        SAVED_PID=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_PID" ]; then
            kill $SAVED_PID 2>/dev/null
            print_info "Stopped old frontend (PID: $SAVED_PID)"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Wait for port to be released
    sleep 3
    
    # Double check port 3000 is free
    if lsof -i:3000 2>/dev/null | grep -q LISTEN; then
        print_warning "Port 3000 still occupied! Force killing..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    # Restart frontend
    cd frontend
    yarn dev --port 3000 --strictPort > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Save new PID
    echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"
    
    sleep 4
    
    if [ -z "$FRONTEND_PID" ] || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        print_error "Frontend restart GAGAL!"
        tail -20 "$FRONTEND_LOG"
        exit 1
    else
        print_success "Frontend restarted dengan Ngrok backend URL!"
    fi
}

restore_frontend_env() {
    # Fungsi untuk restore .env ke localhost (dipanggil saat exit)
    if [ -f "./frontend/.env.backup" ]; then
        print_info "Restoring frontend .env to localhost..."
        mv ./frontend/.env.backup ./frontend/.env
        print_success ".env restored!"
    fi
}

# ====================================================================
# 9. MAIN EXECUTION
# ====================================================================

print_header "🚀 UNIPRESENCE LAUNCHER v5.0"

# Step 1: Detect Python
detect_python_env

# Step 2: Install Dependencies (ALWAYS)
install_backend_deps
install_frontend_deps

# Step 3: Ask Ngrok
ask_ngrok_usage

# Step 4: Check Ngrok if needed
if [ "$USE_NGROK" = true ]; then
    check_ngrok_installation
fi

# Step 5: Cleanup old processes
kill_existing_services

# Step 6: Start services
start_backend
start_frontend

# Step 7: Start Ngrok if enabled
if [ "$USE_NGROK" = true ]; then
    start_ngrok
fi

# ====================================================================
# 10. FINAL STATUS
# ====================================================================

echo ""
print_header "✨ ALL SYSTEMS RUNNING"

echo -e "${GREEN}🔗 Local Access:${NC}"
echo -e "   Backend:  ${CYAN}http://localhost:8001${NC}"

if [ "$USE_NGROK" = true ] && [ ! -z "$NGROK_URL" ]; then
    echo -e "   Frontend: ${CYAN}http://localhost:3000${NC} ${YELLOW}(using Ngrok backend)${NC}"
    echo ""
    echo -e "${GREEN}🌍 Internet Access (Ngrok):${NC}"
    echo -e "   Backend:  ${PURPLE}$NGROK_URL${NC}"
    echo -e "   Frontend: ${CYAN}http://localhost:3000${NC}"
    echo -e "   Dashboard: ${CYAN}http://localhost:4040${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  PENTING:${NC}"
    echo -e "   Frontend sudah dikonfigurasi untuk menggunakan Ngrok backend"
    echo -e "   Akses dari browser manapun akan aman dan terhubung via HTTPS"
else
    echo -e "   Frontend: ${CYAN}http://localhost:3000${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   Backend:  $BACKEND_LOG"
echo -e "   Frontend: $FRONTEND_LOG"
if [ "$USE_NGROK" = true ]; then
    echo -e "   Ngrok:    $NGROK_LOG"
fi

echo ""
print_header "🎉 READY TO GO!"
if [ "$USE_NGROK" = true ]; then
    echo -e "${GREEN}Share URL Ngrok untuk akses dari internet!${NC}"
fi
echo -e "${CYAN}Tekan Ctrl+C untuk stop dan restore config${NC}"
echo ""

# Keep running
wait
