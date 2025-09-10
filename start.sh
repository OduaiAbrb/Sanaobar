#!/bin/bash

# EcoReceipt Production Startup Script
echo "🚀 Starting EcoReceipt Application..."

# Start backend
echo "📊 Starting Backend API..."
cd /app/backend
python server.py &

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

# Start frontend (production build)
echo "🎨 Starting Frontend..."
cd /app/frontend
npx serve -s dist -p 3000 &

echo "✅ EcoReceipt Application Started Successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend API: http://localhost:8001"

# Keep the script running
wait