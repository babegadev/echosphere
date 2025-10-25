# Echosphere Backend

This directory contains Supabase Edge Functions for the Echosphere application.

## Structure

```
backend/
└── supabase/
    ├── functions/
    │   └── extract-echo-metadata/
    │       └── index.ts          # Edge Function for audio metadata extraction
    ├── config.toml                # Supabase configuration
    └── .env.example               # Environment variables template
```

## Setup

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Other platforms: https://supabase.com/docs/guides/cli
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/supabase/` directory:

```bash
cd backend/supabase
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
SUPABASE_URL=https://jhevbkdqfynrqveuqbrl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPGRAM_API_KEY=your-deepgram-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 3. Set Secrets in Supabase

Set the required secrets for your Edge Functions:

```bash
supabase secrets set DEEPGRAM_API_KEY=your-deepgram-api-key
supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 4. Deploy the Function

Deploy the Edge Function to Supabase:

```bash
cd backend/supabase
supabase functions deploy extract-echo-metadata
```

## Edge Functions

### extract-echo-metadata

Automatically processes uploaded audio files to extract metadata:

**Purpose:**
- Transcribes audio using Deepgram API
- Generates a catchy caption/title using Claude API
- Extracts location name from coordinates using reverse geocoding
- Updates the echo record in the database

**Endpoint:**
```
POST https://jhevbkdqfynrqveuqbrl.supabase.co/functions/v1/extract-echo-metadata
```

**Request Body:**
```json
{
  "echo_id": "uuid-of-echo",
  "audio_url": "https://storage-url/audio.mp3",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**Response:**
```json
{
  "success": true,
  "echo_id": "uuid-of-echo",
  "caption": "Morning Coffee Thoughts",
  "location_name": "San Francisco, California, USA",
  "transcription": "Just had an amazing cup of coffee..."
}
```

## Database Trigger Setup

To automatically call the Edge Function when a new echo is uploaded, create a database trigger:

### Option 1: Using SQL (Recommended)

```sql
-- Create a trigger function
CREATE OR REPLACE FUNCTION trigger_extract_echo_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function asynchronously using pg_net
  PERFORM
    net.http_post(
      url := 'https://jhevbkdqfynrqveuqbrl.supabase.co/functions/v1/extract-echo-metadata',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'echo_id', NEW.id,
        'audio_url', NEW.audio_url,
        'location', jsonb_build_object(
          'latitude', ST_Y(NEW.location::geometry),
          'longitude', ST_X(NEW.location::geometry)
        )
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_echo_created
  AFTER INSERT ON echoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_extract_echo_metadata();
```

### Option 2: Call from Application

Alternatively, call the function directly from your Python device code after upload:

```python
# In echosphere.py, after successful upload
import requests

response = requests.post(
    f"{SUPABASE_URL}/functions/v1/extract-echo-metadata",
    headers={
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "echo_id": result.data[0]['id'],
        "audio_url": audio_url,
        "location": {
            "latitude": self.location[0],
            "longitude": self.location[1]
        }
    }
)
```

## Testing Locally

Test the function locally before deploying:

```bash
# Start Supabase local development
supabase start

# Serve the function locally
supabase functions serve extract-echo-metadata --env-file supabase/.env

# In another terminal, test it
curl -i --location --request POST 'http://localhost:54321/functions/v1/extract-echo-metadata' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "echo_id": "test-uuid",
    "audio_url": "https://example.com/audio.mp3",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  }'
```

## Monitoring

View function logs in Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/jhevbkdqfynrqveuqbrl
2. Navigate to Edge Functions → extract-echo-metadata
3. View logs and invocations

Or use the CLI:

```bash
supabase functions logs extract-echo-metadata
```

## Cost Considerations

- **Deepgram**: Pay-as-you-go, ~$0.0125 per minute of audio
- **Claude API**: ~$0.003 per request (for caption generation)
- **Supabase Edge Functions**: First 500k requests/month free
- **OpenStreetMap Nominatim**: Free (rate limited to 1 req/sec)

For a typical 5-second echo:
- Deepgram: ~$0.001
- Claude: ~$0.003
- Total: ~$0.004 per echo

## Troubleshooting

### Function not being called
- Check database trigger is created: `SELECT * FROM pg_trigger WHERE tgname = 'on_echo_created';`
- Check Edge Function logs for errors
- Verify secrets are set correctly

### Transcription errors
- Verify DEEPGRAM_API_KEY is valid
- Check audio file is accessible (public URL)
- Ensure audio format is supported (MP3, WAV)

### Caption generation errors
- Verify ANTHROPIC_API_KEY is valid
- Check Claude API rate limits
- Review function logs for specific errors

### Location name not populated
- This is optional - function will continue without it
- Check coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
- Nominatim may be rate limited (1 req/sec)