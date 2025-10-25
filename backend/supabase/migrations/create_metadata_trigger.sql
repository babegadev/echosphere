-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a table to store configuration (simpler approach)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the service role key (you'll update this after running the migration)
INSERT INTO app_config (key, value)
VALUES ('service_role_key', 'YOUR_SERVICE_ROLE_KEY')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Restrict access to app_config table (only service role can access)
REVOKE ALL ON app_config FROM anon, authenticated;
GRANT ALL ON app_config TO service_role;

-- Create a function to call the Edge Function when a new echo is created
CREATE OR REPLACE FUNCTION trigger_extract_echo_metadata()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get the service role key from the config table
  SELECT value INTO service_role_key FROM app_config WHERE key = 'service_role_key';

  -- Set the function URL
  function_url := 'https://jhevbkdqfynrqveuqbrl.supabase.co/functions/v1/extract-echo-metadata';

  -- Only proceed if we have a service role key
  IF service_role_key IS NOT NULL AND service_role_key != 'YOUR_SERVICE_ROLE_KEY' THEN
    -- Call the Edge Function asynchronously
    PERFORM
      net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'echo_id', NEW.id,
          'audio_url', NEW.audio_url,
          'location', CASE
            WHEN NEW.location IS NOT NULL THEN
              jsonb_build_object(
                'latitude', ST_Y(NEW.location::geometry),
                'longitude', ST_X(NEW.location::geometry)
              )
            ELSE NULL
          END
        )
      );
  ELSE
    RAISE NOTICE 'Service role key not configured. Please update app_config table.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_echo_created ON echoes;

-- Create the trigger to fire after INSERT on echoes table
CREATE TRIGGER on_echo_created
  AFTER INSERT ON echoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_extract_echo_metadata();

-- Add a comment to explain the trigger
COMMENT ON TRIGGER on_echo_created ON echoes IS
  'Automatically calls the extract-echo-metadata Edge Function to generate caption and location name';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, anon, authenticated, service_role;

-- Set the database settings (you'll need to set these in your Supabase dashboard)
-- ALTER DATABASE postgres SET app.settings.function_url = 'https://jhevbkdqfynrqveuqbrl.supabase.co/functions/v1/extract-echo-metadata';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';

-- Optional: Create an index on caption for faster searches
CREATE INDEX IF NOT EXISTS idx_echoes_caption ON echoes USING gin(to_tsvector('english', caption));

-- Optional: Create an index on location_name for faster searches
CREATE INDEX IF NOT EXISTS idx_echoes_location_name ON echoes(location_name);