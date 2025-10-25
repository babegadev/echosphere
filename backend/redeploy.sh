#!/bin/bash

# Quick redeploy script

set -e

echo "🚀 Redeploying extract-echo-metadata function"
echo "============================================"
echo ""

cd supabase

echo "📦 Deploying function..."
supabase functions deploy extract-echo-metadata --no-verify-jwt

echo ""
echo "✅ Function redeployed successfully!"
echo ""
echo "🧪 Test by recording a new echo: 'hey echo'"
echo ""
echo "📊 View logs:"
echo "   supabase functions logs extract-echo-metadata --follow"