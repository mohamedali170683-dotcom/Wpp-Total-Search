#!/bin/bash
# Quick start script for Wpp-Total-Search

set -e

echo "🚀 Starting Wpp-Total-Search..."

# Check if we're in the right directory
if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not installed"
    exit 1
fi

# Setup virtual environment if it doesn't exist
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source backend/venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r backend/requirements.txt

# Create .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp backend/.env.example backend/.env
fi

# Run the application
echo ""
echo "✅ Setup complete!"
echo ""
echo "Starting server in demo mode..."
echo "API docs will be available at: http://localhost:8000/docs"
echo ""

cd backend
uvicorn app.main:app --reload --port 8000
