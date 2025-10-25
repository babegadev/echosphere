# Echosphere Backend - Quick Start

Get your automatic metadata extraction running in 5 minutes!

## Step 1: Deploy the Function (2 minutes)

```bash
cd backend
./deploy.sh
```

When prompted, enter your API keys:
- Deepgram API key
- Anthropic API key

## Step 2: Set Up Database Trigger (3 minutes)

### 2a. Run the Main Migration

1. Go to: https://supabase.com/dashboard/project/jhevbkdqfynrqveuqbrl/sql
2. Open `backend/supabase/migrations/create_metadata_trigger.sql`
3. Copy all the SQL
4. Paste into Supabase SQL Editor
5. Click "RUN"

### 2b. Set Your Service Role Key

1. Still in the SQL Editor
2. Open `backend/supabase/migrations/set_service_role_key.sql`
3. Copy all the SQL (your service role key is already in it!)
4. Paste into Supabase SQL Editor
5. Click "RUN"

## Step 3: Test It! (1 minute)

Record an echo:
1. Say "Hey echo"
2. Wait for the beep
3. Say something like "Testing my new echo feature"
4. Wait 5 seconds

Then check your Supabase dashboard:
- Go to: https://supabase.com/dashboard/project/jhevbkdqfynrqveuqbrl/editor
- Open the `echoes` table
- Look for your new echo
- Check that `caption` and `location_name` are populated!

## View Logs

```bash
supabase functions logs extract-echo-metadata --follow
```

## What Happens Automatically

```
You say "Hey echo" → Recording starts
↓
Audio uploads to Supabase Storage
↓
Database trigger fires
↓
Edge Function extracts metadata:
  • Deepgram transcribes audio
  • Claude generates catchy caption
  • OpenStreetMap gets location name
↓
Database updates automatically
```

## Cost per Echo

- 5-second audio: ~$0.004 per echo
- 1000 echoes: ~$4
- Very affordable! 💰

## Troubleshooting

**Function not being called?**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_echo_created';
```

**Service role key not set?**
```sql
-- Check app_config
SELECT * FROM app_config WHERE key = 'service_role_key';
```

**Want to see what's happening?**
```bash
supabase functions logs extract-echo-metadata --follow
```

## Done! 🎉

Your echoes now automatically get:
- ✅ Transcribed audio
- ✅ AI-generated captions
- ✅ Human-readable location names

All happening in the background, automatically!