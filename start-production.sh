#!/bin/bash

# Production startup script for Fener Travel App

echo "🚀 Starting Fener Travel App in Production Mode..."

# Set environment variables
export NODE_ENV=production
export API_PORT=5030

# Start the API server using PM2
echo "📊 Starting API server with PM2..."
pm2 start ecosystem.config.js --env production

# Check PM2 status
echo "📈 PM2 Status:"
pm2 status

echo "✅ Fener Travel App started successfully!"
echo "🌐 API Server: http://localhost:5030"
echo "📁 Static files served from: ./dist/"
echo ""
echo "📋 Next steps:"
echo "1. Configure Nginx to serve static files from: $(pwd)/dist/"
echo "2. Update Nginx config with your domain name"
echo "3. Setup SSL certificates"
echo "4. Restart Nginx: sudo nginx -s reload" 