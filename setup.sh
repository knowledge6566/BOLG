#!/bin/bash
# ============================================================
# BOLGERR SETUP SCRIPT
# Run this to get Bolgerr running locally in seconds
# ============================================================

echo "🚀 BOLGERR BLOG SETUP"
echo "===================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "📥 Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"
echo ""

# Ask user preference
echo "Select backend:"
echo "1) Node.js + Express (Recommended)"
echo "2) Python + Flask"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "📦 Installing Node.js dependencies..."
        npm install
        echo ""
        echo "✅ Setup complete!"
        echo ""
        echo "🚀 To start the server:"
        echo "   npm start"
        echo ""
        echo "📝 For development with auto-reload:"
        echo "   npm run dev"
        echo ""
        echo "🌐 Then visit: http://localhost:3000"
        ;;
    2)
        if ! command -v python3 &> /dev/null; then
            echo "❌ Python is not installed."
            echo "📥 Install from: https://python.org/"
            exit 1
        fi
        echo ""
        echo "✅ Python version: $(python3 --version)"
        echo ""
        echo "📦 Creating virtual environment..."
        python3 -m venv venv
        
        echo "📦 Activating virtual environment..."
        source venv/bin/activate
        
        echo "📦 Installing Python dependencies..."
        pip install -r requirements.txt
        
        echo ""
        echo "✅ Setup complete!"
        echo ""
        echo "🚀 To start the server:"
        echo "   source venv/bin/activate"
        echo "   python server-python.py"
        echo ""
        echo "🌐 Then visit: http://localhost:5000"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📚 Documentation:"
echo "   - README.md              (Overview & features)"
echo "   - API-DOCUMENTATION.md   (API endpoints & examples)"
echo "   - DEPLOYMENT.md          (Deploy to production)"
echo ""
echo "Happy blogging! ✨"
