#!/bin/bash

# =============================================================================
# 🧹 UNIPRESENCE MANUAL CLEANUP UTILITY
# Gunakan ini jika start_services.sh gagal cleanup atau Ctrl+C tidak berfungsi
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================================="
echo "🧹 UniPresence Manual Cleanup"
echo "=========================================================="
echo -e "${NC}"

# PID Files
BACKEND_PID_FILE="/tmp/unipresence_backend.pid"
FRONTEND_PID_FILE="/tmp/unipresence_frontend.pid"
NGROK_PID_FILE="/tmp/unipresence_ngrok.pid"

# Step 1: Kill by PID files
echo -e "${YELLOW}Step 1: Killing by saved PID files...${NC}"

if [ -f "$BACKEND_PID_FILE" ]; then
    PID=$(cat "$BACKEND_PID_FILE" 2>/dev/null)
    if [ ! -z "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        kill -9 "$PID" 2>/dev/null
        echo -e "${GREEN}✅ Killed Backend (PID: $PID)${NC}"
    fi
    rm -f "$BACKEND_PID_FILE"
fi

if [ -f "$FRONTEND_PID_FILE" ]; then
    PID=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
    if [ ! -z "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        kill -9 "$PID" 2>/dev/null
        echo -e "${GREEN}✅ Killed Frontend (PID: $PID)${NC}"
    fi
    rm -f "$FRONTEND_PID_FILE"
fi

if [ -f "$NGROK_PID_FILE" ]; then
    PID=$(cat "$NGROK_PID_FILE" 2>/dev/null)
    if [ ! -z "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        kill -9 "$PID" 2>/dev/null
        echo -e "${GREEN}✅ Killed Ngrok (PID: $PID)${NC}"
    fi
    rm -f "$NGROK_PID_FILE"
fi

# Step 2: Kill by process name
echo -e "${YELLOW}Step 2: Killing by process name...${NC}"
pkill -9 -f "server.py" 2>/dev/null && echo -e "${GREEN}✅ Killed server.py${NC}"
pkill -9 -f "vite" 2>/dev/null && echo -e "${GREEN}✅ Killed vite${NC}"
pkill -9 -f "yarn dev" 2>/dev/null && echo -e "${GREEN}✅ Killed yarn dev${NC}"
pkill -9 -f "ngrok http" 2>/dev/null && echo -e "${GREEN}✅ Killed ngrok${NC}"

# Step 3: Kill by port
echo -e "${YELLOW}Step 3: Killing by port...${NC}"
PORTS=(3000 8000 8001 4040)

for port in "${PORTS[@]}"; do
    if command -v lsof &>/dev/null; then
        PID=$(lsof -t -i:"$port" 2>/dev/null)
        if [ ! -z "$PID" ]; then
            kill -9 "$PID" 2>/dev/null
            echo -e "${GREEN}✅ Cleared port $port (PID: $PID)${NC}"
        fi
    fi
done

# Step 4: Restore .env if backup exists
echo -e "${YELLOW}Step 4: Restoring .env...${NC}"
if [ -f "/app/frontend/.env.backup" ]; then
    mv /app/frontend/.env.backup /app/frontend/.env
    echo -e "${GREEN}✅ Restored .env to localhost${NC}"
fi

echo ""
echo -e "${GREEN}=========================================================="
echo "✅ Cleanup Complete!"
echo "=========================================================="
echo -e "${NC}"

# Show current status
echo -e "${BLUE}Current Port Status:${NC}"
echo "Port 3000 (Frontend):"
lsof -i:3000 2>/dev/null || echo "  - FREE"
echo ""
echo "Port 8001 (Backend):"
lsof -i:8001 2>/dev/null || echo "  - FREE"
echo ""
echo "Port 4040 (Ngrok):"
lsof -i:4040 2>/dev/null || echo "  - FREE"
echo ""

echo -e "${GREEN}Ready to run ./start_services.sh 🚀${NC}"
