#!/bin/bash

# =============================================================================
# 🚀 UNIPRESENCE UNIFIED SERVER - FLEXIBLE DEPLOYMENT
# =============================================================================
# Support 3 modes: Local | Ngrok | Nginx (Self-hosted)
# =============================================================================

# Konfigurasi
PORT=${PORT:-41201}  # Default port 41201
HOST=${HOST:-0.0.0.0}
LOG_DIR="/tmp"
SERVER_LOG="$LOG_DIR/unipresence_unified.log"
SERVER_PID_FILE="$LOG_DIR/unipresence_unified.pid"
NGROK_PID_FILE="$LOG_DIR/unipresence_ngrok.pid"

# Deployment mode
DEPLOY_MODE=""

# Warna
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Cleanup on exit
trap cleanup_on_exit INT TERM

cleanup_on_exit() {
    echo ""
    echo -e "${YELLOW}⚠️  Stopping server...${NC}"
    
    # Stop main server
    if [ -f "$SERVER_PID_FILE" ]; then
        SAVED_PID=$(cat "$SERVER_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_PID" ] && kill -0 "$SAVED_PID" 2>/dev/null; then
            kill -9 "$SAVED_PID" 2>/dev/null
            echo -e "${GREEN}✅ Server stopped (PID: $SAVED_PID)${NC}"
        fi
        rm -f "$SERVER_PID_FILE"
    fi
    
    # Stop ngrok if running
    if [ -f "$NGROK_PID_FILE" ]; then
        SAVED_PID=$(cat "$NGROK_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_PID" ] && kill -0 "$SAVED_PID" 2>/dev/null; then
            kill -9 "$SAVED_PID" 2>/dev/null
            echo -e "${GREEN}✅ Ngrok stopped${NC}"
        fi
        rm -f "$NGROK_PID_FILE"
    fi
    
    echo -e "${GREEN}✅ Cleanup complete. Goodbye!${NC}"
    exit 0
}

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

# Detect Python
detect_python() {
    if [ ! -z "$CONDA_PREFIX" ]; then
        PYTHON_CMD="python"
        print_success "Using Conda: $(basename $CONDA_PREFIX)"
    elif command -v python3 &>/dev/null; then
        PYTHON_CMD="python3"
        print_success "Using Python3"
    elif command -v python &>/dev/null; then
        PYTHON_CMD="python"
        print_success "Using Python"
    else
        print_error "Python not found!"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_header "📦 INSTALLING DEPENDENCIES"
    
    # Backend
    if [ -f "./backend/requirements.txt" ]; then
        print_info "Installing backend dependencies..."
        cd backend
        $PYTHON_CMD -m pip install -r requirements.txt --quiet --disable-pip-version-check
        cd ..
        print_success "Backend dependencies installed!"
    fi
    
    # Frontend
    if [ -f "./frontend/package.json" ]; then
        print_info "Installing frontend dependencies..."
        cd frontend
        if command -v yarn &>/dev/null; then
            yarn install --silent --non-interactive
        else
            npm install --silent
        fi
        cd ..
        print_success "Frontend dependencies installed!"
    fi
}

# Build frontend
build_frontend() {
    print_header "🔨 BUILDING FRONTEND (Production)"
    
    if [ ! -f "./frontend/package.json" ]; then
        print_error "Frontend package.json not found!"
        exit 1
    fi
    
    cd frontend
    
    # Create production env
    print_info "Configuring frontend for unified mode..."
    cat > .env.production << EOF
# Production build - API calls relative to same origin
VITE_BACKEND_URL=/api
EOF
    
    print_info "Building frontend (yarn build)..."
    if command -v yarn &>/dev/null; then
        yarn build
    else
        npm run build
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully!"
        print_info "Build location: frontend/dist/"
        
        # Show build size
        if [ -d "dist" ]; then
            BUILD_SIZE=$(du -sh dist | cut -f1)
            print_info "Build size: $BUILD_SIZE"
        fi
    else
        print_error "Frontend build failed!"
        cd ..
        exit 1
    fi
    
    cd ..
}

# Kill existing processes
kill_existing() {
    print_header "🧹 CLEANUP OLD PROCESSES"
    
    # Kill by PID file
    if [ -f "$SERVER_PID_FILE" ]; then
        SAVED_PID=$(cat "$SERVER_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_PID" ] && kill -0 "$SAVED_PID" 2>/dev/null; then
            kill -9 "$SAVED_PID" 2>/dev/null
            print_info "Killed old server (PID: $SAVED_PID)"
        fi
        rm -f "$SERVER_PID_FILE"
    fi
    
    # Kill ngrok if exists
    if [ -f "$NGROK_PID_FILE" ]; then
        SAVED_PID=$(cat "$NGROK_PID_FILE" 2>/dev/null)
        if [ ! -z "$SAVED_PID" ] && kill -0 "$SAVED_PID" 2>/dev/null; then
            kill -9 "$SAVED_PID" 2>/dev/null
            print_info "Killed old ngrok"
        fi
        rm -f "$NGROK_PID_FILE"
    fi
    
    # Kill by port
    if command -v lsof &>/dev/null; then
        PID=$(lsof -t -i:"$PORT" 2>/dev/null)
        if [ ! -z "$PID" ]; then
            kill -9 "$PID" 2>/dev/null
            print_info "Cleared port $PORT (PID: $PID)"
        fi
    fi
    
    sleep 2
    print_success "Cleanup complete!"
}

# Ask deployment mode
ask_deployment_mode() {
    echo ""
    print_header "🚀 DEPLOYMENT MODE"
    echo -e "${CYAN}Pilih mode deployment:${NC}"
    echo ""
    echo -e "  ${GREEN}1. 🏠 Local Only${NC}"
    echo -e "     → Akses: http://localhost:$PORT"
    echo -e "     → Untuk development/testing lokal"
    echo ""
    echo -e "  ${PURPLE}2. 🌐 Ngrok (Internet)${NC}"
    echo -e "     → Share dengan teman-teman via internet"
    echo -e "     → Instant public URL (free tier)"
    echo -e "     → Cocok untuk demo/testing remote"
    echo ""
    echo -e "  ${BLUE}3. 🔧 Nginx (Self-hosted)${NC}"
    echo -e "     → Production deployment dengan domain sendiri"
    echo -e "     → Full control, custom domain/SSL"
    echo -e "     → Butuh nginx config (sudah ada template)"
    echo ""
    read -p "Pilihan (1/2/3): " mode_choice
    
    case $mode_choice in
        1)
            DEPLOY_MODE="local"
            ;;
        2)
            DEPLOY_MODE="ngrok"
            ;;
        3)
            DEPLOY_MODE="nginx"
            ;;
        *)
            print_warning "Invalid choice. Using Local mode."
            DEPLOY_MODE="local"
            ;;
    esac
}

# Start unified server
start_server() {
    print_header "🚀 STARTING UNIFIED SERVER"
    
    # Set environment
    export PORT=$PORT
    export HOST=$HOST
    
    cd backend
    $PYTHON_CMD server_unified.py > "$SERVER_LOG" 2>&1 &
    SERVER_PID=$!
    cd ..
    
    echo "$SERVER_PID" > "$SERVER_PID_FILE"
    
    sleep 3
    
    if [ -z "$SERVER_PID" ] || ! kill -0 "$SERVER_PID" 2>/dev/null; then
        print_error "Server failed to start!"
        print_error "Check log: $SERVER_LOG"
        echo ""
        echo -e "${RED}Last 30 lines of log:${NC}"
        tail -30 "$SERVER_LOG"
        exit 1
    else
        print_success "Server running (PID: $SERVER_PID)"
        print_success "Listening on $HOST:$PORT"
    fi
}

# Start ngrok
start_ngrok() {
    print_header "🌐 STARTING NGROK"
    
    if ! command -v ngrok &>/dev/null; then
        print_error "Ngrok not installed!"
        print_info "Install: https://ngrok.com/download"
        print_warning "Falling back to local mode..."
        DEPLOY_MODE="local"
        return 1
    fi
    
    print_info "Starting ngrok tunnel for port $PORT..."
    ngrok http $PORT --log=stdout > /tmp/ngrok_unified.log 2>&1 &
    NGROK_PID=$!
    echo "$NGROK_PID" > "$NGROK_PID_FILE"
    
    sleep 6
    
    # Get URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$NGROK_URL" ]; then
        print_success "Ngrok tunnel active!"
        echo ""
        echo -e "${PURPLE}🌍 Public URL: $NGROK_URL${NC}"
        echo -e "${CYAN}📊 Dashboard: http://localhost:4040${NC}"
        echo ""
        NGROK_SUCCESS=true
    else
        print_warning "Could not get ngrok URL"
        print_info "Check dashboard: http://localhost:4040"
        NGROK_SUCCESS=false
    fi
}

# Show nginx instructions
show_nginx_info() {
    print_header "🔧 NGINX SETUP"
    
    print_info "Server berjalan di: $HOST:$PORT"
    print_info "Nginx config template: /app/nginx-unipresence.conf"
    echo ""
    
    if command -v nginx &>/dev/null; then
        print_success "Nginx detected!"
        echo ""
        echo -e "${YELLOW}📋 Quick Setup:${NC}"
        echo -e "${CYAN}1. Copy config template:${NC}"
        echo -e "   sudo cp /app/nginx-unipresence.conf /etc/nginx/sites-available/unipresence"
        echo ""
        echo -e "${CYAN}2. Edit domain dan SSL (opsional):${NC}"
        echo -e "   sudo nano /etc/nginx/sites-available/unipresence"
        echo ""
        echo -e "${CYAN}3. Enable site:${NC}"
        echo -e "   sudo ln -s /etc/nginx/sites-available/unipresence /etc/nginx/sites-enabled/"
        echo ""
        echo -e "${CYAN}4. Test config:${NC}"
        echo -e "   sudo nginx -t"
        echo ""
        echo -e "${CYAN}5. Reload nginx:${NC}"
        echo -e "   sudo systemctl reload nginx"
        echo ""
        echo -e "${GREEN}📖 Full guide: /app/NGINX_SETUP_GUIDE.md${NC}"
    else
        print_warning "Nginx not installed!"
        echo ""
        echo -e "${CYAN}Install nginx:${NC}"
        echo -e "   sudo apt update && sudo apt install nginx"
        echo ""
        echo -e "${GREEN}📖 Full guide: /app/NGINX_SETUP_GUIDE.md${NC}"
    fi
}

# Main execution
print_header "🚀 UNIPRESENCE UNIFIED SERVER v2.0"

print_info "Configuration:"
echo "   Port: $PORT"
echo "   Host: $HOST"
echo "   Mode: Production (Unified)"
echo ""

detect_python
install_dependencies
build_frontend
ask_deployment_mode
kill_existing
start_server

# Handle deployment mode
case $DEPLOY_MODE in
    "ngrok")
        start_ngrok
        ;;
    "nginx")
        show_nginx_info
        ;;
    "local")
        print_info "Running in local mode"
        ;;
esac

# Final status
print_header "✨ SERVER READY!"

echo -e "${GREEN}🔗 Access URLs:${NC}"
echo -e "   Local:     ${CYAN}http://localhost:$PORT${NC}"

# Show network IP if available
if command -v hostname &>/dev/null; then
    NETWORK_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ ! -z "$NETWORK_IP" ]; then
        echo -e "   Network:   ${CYAN}http://$NETWORK_IP:$PORT${NC}"
    fi
fi

if [ "$DEPLOY_MODE" == "ngrok" ] && [ "$NGROK_SUCCESS" == "true" ]; then
    echo -e "   Internet:  ${PURPLE}$NGROK_URL${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Logs: $SERVER_LOG${NC}"
echo ""

case $DEPLOY_MODE in
    "local")
        echo -e "${BLUE}💡 Mode: Local Development${NC}"
        echo -e "   Perfect untuk development dan testing lokal"
        ;;
    "ngrok")
        echo -e "${PURPLE}💡 Mode: Ngrok (Internet Sharing)${NC}"
        echo -e "   Share $NGROK_URL dengan teman-teman!"
        echo -e "   Dashboard: http://localhost:4040"
        ;;
    "nginx")
        echo -e "${BLUE}💡 Mode: Nginx (Production)${NC}"
        echo -e "   Configure nginx untuk production deployment"
        echo -e "   Guide: /app/NGINX_SETUP_GUIDE.md"
        ;;
esac

echo ""
echo -e "${GREEN}✨ Benefits:${NC}"
echo -e "   ✅ Single port = No CORS issues!"
echo -e "   ✅ Frontend + Backend unified"
echo -e "   ✅ Easy to deploy"
echo -e "   ✅ Production ready"
echo ""
echo -e "${CYAN}Press Ctrl+C to stop${NC}"
echo ""

# Keep running
wait
