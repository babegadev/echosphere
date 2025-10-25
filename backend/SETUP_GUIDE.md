# Echosphere Backend Setup Guide

This guide will walk you through setting up automatic metadata extraction for your echoes.

## What This Does

When an audio file is uploaded to Echosphere:
1. **Transcription**: Deepgram transcribes the audio to text
2. **Caption Generation**: Claude AI generates a catchy, descriptive title
3. **Location Name**: Reverse geocoding converts coordinates to readable location names
4. **Database Update**: The echo record is automatically updated with this metadata

## Prerequisites

- Supabase CLI installed
- Deepgram API key ([get one here](https://deepgram.com))
- Anthropic API key ([get one here](https://console.anthropic.com))

## Quick Setup (5 minutes)

### 1. Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
cd backend/supabase
supabase link --project-ref jhevbkdqfynrqveuqbrl
```

### 4. Deploy the Function

```bash
cd backend
./deploy.sh
```

The script will prompt you for:
- Your Deepgram API key
- Your Anthropic API key

### 5. Set Up Database Trigger

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/jhevbkdqfynrqveuqbrl/sql)
2. Copy the contents of `backend/supabase/migrations/create_metadata_trigger.sql`
3. Paste and run the SQL
4. Copy the contents of `backend/supabase/migrations/set_service_role_key.sql`
5. Paste and run the SQL (this sets your service role key securely)

## Testing

### Test Upload

1. Record an echo using your Omi device:
   ```
   "Hey echo" [wait for trigger] "Testing the new metadata extraction feature"
   ```

2. Check the Supabase dashboard to see:
   - Caption: Something like "Testing Metadata Extraction"
   - Location name: e.g., "San Francisco, California, USA"

### View Logs

```bash
supabase functions logs extract-echo-metadata --follow
```

### Manual Test

You can also manually trigger the function:

```bash
curl -X POST 'https://jhevbkdqfynrqveuqbrl.supabase.co/functions/v1/extract-echo-metadata' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "echo_id": "YOUR_ECHO_ID",
    "audio_url": "https://your-storage-url.com/audio.mp3",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  }'
```

## How It Works

### Automatic Trigger

```
1. User records echo → "Hey echo"
2. Device uploads to Supabase Storage
3. Database INSERT trigger fires
4. Edge Function is called
5. Deepgram transcribes audio
6. Claude generates caption
7. OpenStreetMap provides location name
8. Database record is updated
```

### Architecture

```
┌─────────────┐
│ Omi Device  │
└──────┬──────┘
       │ 1. Upload audio
       ▼
┌─────────────────┐
│ Supabase        │
│ Storage         │
└──────┬──────────┘
       │ 2. Trigger on INSERT
       ▼
┌─────────────────┐
│ Edge Function   │
│ extract-echo-   │
│ metadata        │
└──────┬──────────┘
       │
       ├─────► Deepgram API (transcribe)
       │
       ├─────► Claude API (generate caption)
       │
       └─────► Nominatim (location name)

       3. Update database
       ▼
┌─────────────────┐
│ echoes table    │
│ - caption       │
│ - location_name │
└─────────────────┘
```

## Costs (per echo)

For a 5-second audio clip:
- Deepgram: ~$0.001
- Claude: ~$0.003
- Supabase: Free (first 500k functions/month)
- Total: **~$0.004 per echo**

## Troubleshooting

### Function not triggering
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_echo_created';

-- Check if pg_net extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

### Transcription failing
- Verify audio URL is publicly accessible
- Check Deepgram API key is valid
- Ensure audio format is MP3 or WAV

### Caption not generated
- Verify Anthropic API key is valid
- Check Claude API quota/billing
- Review function logs for errors

### View detailed logs
```bash
supabase functions logs extract-echo-metadata --follow
```

## Optional: Disable Automatic Processing

If you want to manually control when metadata is extracted:

```sql
-- Disable the trigger
DROP TRIGGER IF EXISTS on_echo_created ON echoes;

-- Re-enable later
CREATE TRIGGER on_echo_created
  AFTER INSERT ON echoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_extract_echo_metadata();
```

## Support

For issues or questions:
1. Check function logs: `supabase functions logs extract-echo-metadata`
2. Review the [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)
3. Check API status:
   - [Deepgram Status](https://status.deepgram.com)
   - [Anthropic Status](https://status.anthropic.com)