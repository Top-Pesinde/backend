#!/bin/bash

echo "🔥 Setting up firewall for remote access..."

# Check if ufw is available
if command -v ufw >/dev/null 2>&1; then
    echo "📋 Using UFW (Ubuntu/Debian)"
    
    # Enable UFW if not already enabled
    sudo ufw --force enable
    
    # Open required ports
    echo "🔓 Opening PostgreSQL port (5432)..."
    sudo ufw allow 5432/tcp
    
    echo "🔓 Opening Redis port (6379)..."
    sudo ufw allow 6379/tcp
    
    echo "🔓 Opening MinIO API port (9000)..."
    sudo ufw allow 9000/tcp
    
    echo "🔓 Opening MinIO Console port (9001)..."
    sudo ufw allow 9001/tcp
    
    echo "🔓 Opening API port (3000)..."
    sudo ufw allow 3000/tcp
    
    echo "📊 UFW Status:"
    sudo ufw status numbered
    
elif command -v firewall-cmd >/dev/null 2>&1; then
    echo "📋 Using firewalld (CentOS/RHEL)"
    
    # Open required ports
    echo "🔓 Opening PostgreSQL port (5432)..."
    sudo firewall-cmd --permanent --add-port=5432/tcp
    
    echo "🔓 Opening Redis port (6379)..."
    sudo firewall-cmd --permanent --add-port=6379/tcp
    
    echo "🔓 Opening MinIO API port (9000)..."
    sudo firewall-cmd --permanent --add-port=9000/tcp
    
    echo "🔓 Opening MinIO Console port (9001)..."
    sudo firewall-cmd --permanent --add-port=9001/tcp
    
    echo "🔓 Opening API port (3000)..."
    sudo firewall-cmd --permanent --add-port=3000/tcp
    
    # Reload firewall
    sudo firewall-cmd --reload
    
    echo "📊 Firewall Status:"
    sudo firewall-cmd --list-all
    
else
    echo "⚠️ No supported firewall found (ufw or firewall-cmd)"
    echo "Please manually open the following ports:"
    echo "  - 3000/tcp (API)"
    echo "  - 5432/tcp (PostgreSQL)"
    echo "  - 6379/tcp (Redis)"
    echo "  - 9000/tcp (MinIO API)"
    echo "  - 9001/tcp (MinIO Console)"
fi

echo ""
echo "✅ Firewall setup completed!"
echo ""
echo "🔗 You can now access services from remote clients:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  - API: http://${SERVER_IP}:3000"
echo "  - PostgreSQL: ${SERVER_IP}:5432"
echo "  - Redis: ${SERVER_IP}:6379"
echo "  - MinIO API: http://${SERVER_IP}:9000"
echo "  - MinIO Console: http://${SERVER_IP}:9001" 