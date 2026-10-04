#!/bin/bash
# ==============================================================================
# Learning OS — Ubuntu VM Automated Deployment Script
# ==============================================================================

set -e

echo "🚀 [1/6] Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y curl git build-essential python3 python3-pip

# Install Node.js 20.x LTS if not present
if ! command -v node &> /dev/null; then
    echo "📦 [2/6] Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js $(node -v) is already installed."
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 [3/6] Installing PM2 process manager globally..."
    sudo npm install -g pm2
fi

echo "📦 [4/6] Installing project dependencies..."
npm install --legacy-peer-deps

echo "🏗️ [5/6] Building frontend client..."
npm run build

mkdir -p logs

echo "⚡ [6/6] Starting application with PM2..."
pm2 start ecosystem.config.cjs || pm2 restart ecosystem.config.cjs
pm2 save

echo ""
echo "=============================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Learning OS is now running in the background on http://localhost:3000"
echo ""
echo "Useful PM2 Commands:"
echo "  - pm2 status          : View application status"
echo "  - pm2 logs learning-os: View live server logs"
echo "  - pm2 restart all     : Restart application"
echo "=============================================================================="
