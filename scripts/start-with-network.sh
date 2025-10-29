#!/bin/bash

# UniPresence Enterprise - Network Access Startup Script
# This script starts the app with ngrok for HTTPS mobile access

echo "🚀 UniPresence Enterprise - Network Startup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo -e "${BLUE}📡 Local IP Address: ${GREEN}$LOCAL_IP${NC}"
echo ""

# Check if ngrok is authenticated
if ! ngrok config check &>/dev/null; then
    echo -e "${YELLOW}⚠️  ngrok belum di-configure!${NC}"
    echo ""
    echo "Untuk menggunakan ngrok:"
    echo "1. Buat account gratis di: https://ngrok.com/"
    echo "2. Dapatkan authtoken dari dashboard"
    echo "3. Jalankan: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    echo -e "${BLUE}Atau akses via Local IP (HTTP only - camera tidak jalan di mobile):${NC}"
    echo -e "http://$LOCAL_IP:3000"
    echo ""
    read -p "Lanjutkan tanpa ngrok? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Ensure services are running
echo -e "${BLUE}🔧 Checking services...${NC}"
sudo supervisorctl status all

echo ""
echo -e "${GREEN}✅ Starting ngrok tunnel for frontend...${NC}"
echo ""

# Start ngrok in background for frontend (port 3000)
ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Failed to get ngrok URL${NC}"
    echo ""
    echo -e "${YELLOW}Fallback - Akses via Local IP:${NC}"
    echo -e "${GREEN}http://$LOCAL_IP:3000${NC}"
    echo ""
    echo "Note: Camera tidak akan jalan di mobile tanpa HTTPS!"
else
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║     🎉 UniPresence Enterprise - READY!            ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}✅ HTTPS URL (untuk Mobile/Camera):${NC}"
    echo -e "   ${BLUE}$NGROK_URL${NC}"
    echo ""
    echo -e "${GREEN}✅ Local Network URL (HTTP only):${NC}"
    echo -e "   ${BLUE}http://$LOCAL_IP:3000${NC}"
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║  📱 Untuk Mahasiswa/Tester:                       ║"
    echo "║                                                    ║"
    echo "║  1. Buka URL HTTPS di atas                        ║"
    echo "║  2. Login dengan:                                 ║"
    echo "║     - EMP001 / admin123 (Admin)                   ║"
    echo "║     - EMP002 / manager123 (Manager)               ║"
    echo "║     - EMP003 / employee123 (Employee)             ║"
    echo "║                                                    ║"
    echo "║  3. Camera akan jalan dengan HTTPS! ✅            ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    
    # Generate QR Code (if qrencode is available)
    if command -v qrencode &> /dev/null; then
        echo -e "${BLUE}📱 QR Code untuk akses cepat:${NC}"
        echo ""
        qrencode -t ANSIUTF8 "$NGROK_URL"
        echo ""
    else
        echo -e "${YELLOW}💡 Install qrencode untuk QR code: sudo apt install qrencode${NC}"
        echo ""
    fi
    
    echo -e "${BLUE}📊 Ngrok Web Interface:${NC}"
    echo "   http://localhost:4040"
    echo ""
    echo -e "${YELLOW}⏳ Ngrok tunnel akan tetap aktif...${NC}"
    echo -e "${YELLOW}   Tekan Ctrl+C untuk stop${NC}"
    echo ""
    
    # Keep script running
    trap "echo ''; echo 'Stopping ngrok...'; kill $NGROK_PID 2>/dev/null; exit" INT TERM
    
    # Monitor ngrok
    while kill -0 $NGROK_PID 2>/dev/null; do
        sleep 1
    done
fi

echo ""
echo "Ngrok stopped."
