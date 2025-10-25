#!/bin/bash

# Echosphere Backend Deployment Script
# This script deploys the Edge Functions to Supabase

set -e

echo "🚀 Deploying Echosphere Backend"
echo "================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Error: Not logged in to Supabase"
    echo "Run: supabase login"
    exit 1
fi

echo ""
echo "📝 Setting up secrets..."

# Check if secrets are already set
read -p "Do you want to set/update API keys? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Deepgram API Key: " DEEPGRAM_KEY
    read -p "Enter Anthropic API Key: " ANTHROPIC_KEY

    if [ ! -z "$DEEPGRAM_KEY" ]; then
        echo "Setting DEEPGRAM_API_KEY..."
        supabase secrets set DEEPGRAM_API_KEY="$DEEPGRAM_KEY"
    fi

    if [ ! -z "$ANTHROPIC_KEY" ]; then
        echo "Setting ANTHROPIC_API_KEY..."
        supabase secrets set ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
    fi
fi

echo ""
echo "📦 Deploying Edge Functions..."
cd supabase

# Deploy the extract-echo-metadata function
echo "Deploying extract-echo-metadata..."
supabase functions deploy extract-echo-metadata --no-verify-jwt

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Next steps:"
echo "1. Run the SQL migration to create the database trigger:"
echo "   - Go to https://supabase.com/dashboard/project/jhevbkdqfynrqveuqbrl/sql"
echo "   - Run the SQL in: backend/supabase/migrations/create_metadata_trigger.sql"
echo ""
echo "2. Set database configuration:"
echo "   ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';"
echo ""
echo "3. Test the function:"
echo "   supabase functions logs extract-echo-metadata --follow"
echo ""
echo "🎉 Done!"