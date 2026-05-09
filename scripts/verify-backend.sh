#!/bin/bash
# ============================================
# EduCreds Backend Verification Script
# Run this to diagnose connection issues
# ============================================

echo "🔍 EduCreds Backend Diagnostic"
echo "=============================="

# 1. Check if Docker is running
echo -e "\n📦 Docker Status:"
if command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10
else
    echo "❌ Docker not installed"
fi

# 2. Check environment variables
echo -e "\n🔐 Required Environment Variables:"
REQUIRED_VARS=("FRONTEND_URL" "JWT_SECRET" "DB_HOST")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✅ $var is set"
    else
        echo "❌ $var is NOT set"
    fi
done

# 3. Test API endpoints
echo -e "\n🌐 API Endpoint Tests:"

# Health check
echo -n "Health endpoint: "
curl -s -o /dev/null -w "%{http_code}" https://api.educreds.xyz/health || echo "❌ Failed"
echo ""

# Governance institutions
echo -n "Governance institutions: "
curl -s -o /dev/null -w "%{http_code}" https://api.educreds.xyz/governance/institutions || echo "❌ Failed"
echo ""

# CORS test
echo -n "CORS preflight test: "
RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  -H "Origin: https://educreds.xyz" \
  -H "Access-Control-Request-Method: GET" \
  https://api.educreds.xyz/governance/institutions)
if [ "$RESULT" == "204" ] || [ "$RESULT" == "200" ]; then
    echo "✅ CORS OK ($RESULT)"
else
    echo "❌ CORS Issue ($RESULT)"
fi

# 4. Check SSL
echo -e "\n🔒 SSL Certificate:"
if command -v openssl &> /dev/null; then
    echo | openssl s_client -servername api.educreds.xyz -connect api.educreds.xyz:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "❌ SSL Check Failed"
fi

echo -e "\n✅ Diagnostic Complete"