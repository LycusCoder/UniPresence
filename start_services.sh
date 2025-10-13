#!/bin/bash

# Kill existing processes
killall -9 python node 2>/dev/null

# Start backend
echo "Starting backend..."
cd /app/backend
/root/.venv/bin/python server.py > /tmp/backend.log 2>&1 &
echo "Backend started (PID: $!)"

# Start frontend
echo "Starting frontend..."
cd /app/frontend
yarn dev > /tmp/frontend.log 2>&1 &
echo "Frontend started (PID: $!)"

echo "Services started successfully!"
echo "Backend: http://localhost:8001"
echo "Frontend: http://localhost:3000"
