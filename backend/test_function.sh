#!/bin/bash

# Test script for the extract-echo-metadata Edge Function

set -e

echo "🧪 Testing extract-echo-metadata function"
echo "========================================="

# Check if required arguments are provided
if [ "$#" -lt 2 ]; then
    echo "Usage: ./test_function.sh <echo_id> <audio_url> [latitude] [longitude]"
    echo ""
    echo "Example:"
    echo "  ./test_function.sh abc123 https://storage.com/audio.mp3 37.7749 -122.4194"
    exit 1
fi

ECHO_ID=$1
AUDIO_URL=$2
LATITUDE=${3:-37.7749}
LONGITUDE=${4:--122.4194}

# Get Supabase anon key
SUPABASE_URL="https://jhevbkdqfynrqveuqbrl.supabase.co"
read -p "Enter your Supabase Anon Key: " ANON_KEY

echo ""
echo "📝 Test Parameters:"
echo "  Echo ID: $ECHO_ID"
echo "  Audio URL: $AUDIO_URL"
echo "  Location: $LATITUDE, $LONGITUDE"
echo ""

# Build JSON payload
PAYLOAD=$(cat <<EOF
{
  "echo_id": "$ECHO_ID",
  "audio_url": "$AUDIO_URL",
  "location": {
    "latitude": $LATITUDE,
    "longitude": $LONGITUDE
  }
}
EOF
)

echo "🚀 Calling function..."
echo ""

# Call the function
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/extract-echo-metadata" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Pretty print response
echo "📥 Response:"
echo "$RESPONSE" | python3 -m json.tool

echo ""
echo "✅ Test complete!"
echo ""
echo "💡 To view logs:"
echo "   supabase functions logs extract-echo-metadata"