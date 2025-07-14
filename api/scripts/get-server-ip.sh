#!/bin/bash

echo "🌐 Server IP Information"
echo "========================"

# Get all IP addresses
echo "📍 All network interfaces:"
ip addr show | grep 'inet ' | awk '{print $2}' | cut -d/ -f1

echo ""
echo "🏠 Primary IP (excluding localhost):"
hostname -I | awk '{print $1}'

echo ""
echo "🌍 Public IP (if available):"
curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "Could not determine public IP"

echo ""
echo "📋 Network interfaces:"
ip route | grep 'src' | awk '{print $9}' | sort -u

echo ""
echo "💡 To use remote access, update your .env file:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "   DATABASE_URL=\"postgresql://postgres:postgres123@${SERVER_IP}:5432/express_api_db?schema=public\""
echo "   REDIS_URL=\"redis://${SERVER_IP}:6379\""
echo "   MINIO_ENDPOINT=${SERVER_IP}"
echo "   MINIO_PUBLIC_URL=http://${SERVER_IP}:9000" 