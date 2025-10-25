import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EchoMetadata {
  echo_id: string;
  audio_url: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { echo_id, audio_url, location } = await req.json() as EchoMetadata;

    if (!echo_id || !audio_url) {
      throw new Error("Missing required fields: echo_id and audio_url");
    }

    console.log(`Processing echo ${echo_id} from ${audio_url}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Download audio file
    console.log("Downloading audio file...");
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
    }
    const audioBuffer = await audioResponse.arrayBuffer();
    console.log(`Audio downloaded: ${audioBuffer.byteLength} bytes`);

    // Step 2: Transcribe audio with Deepgram
    console.log("Transcribing audio with Deepgram...");
    const transcription = await transcribeAudio(audioBuffer);
    console.log(`Transcription: ${transcription}`);

    // Step 3: Generate caption with Claude
    console.log("Generating caption with Claude...");
    const caption = await generateCaption(transcription);
    console.log(`Caption: ${caption}`);

    // Step 4: Get location name if location provided
    let locationName = null;
    if (location && location.latitude && location.longitude) {
      console.log("Fetching location name...");
      locationName = await getLocationName(location.latitude, location.longitude);
      console.log(`Location: ${locationName}`);
    }

    // Step 5: Update echo record with metadata
    console.log("Updating echo record...");
    const { error: updateError } = await supabase
      .from("echoes")
      .update({
        caption,
        location_name: locationName,
      })
      .eq("id", echo_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Successfully processed echo ${echo_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        echo_id,
        caption,
        location_name: locationName,
        transcription,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing echo:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  const deepgramApiKey = Deno.env.get("DEEPGRAM_API_KEY");
  if (!deepgramApiKey) {
    throw new Error("DEEPGRAM_API_KEY not configured");
  }

  const response = await fetch("https://api.deepgram.com/v1/listen", {
    method: "POST",
    headers: {
      "Authorization": `Token ${deepgramApiKey}`,
      "Content-Type": "audio/mpeg",
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

  if (!transcript) {
    throw new Error("No transcription returned from Deepgram");
  }

  return transcript;
}

async function generateCaption(transcription: string): Promise<string> {
  const claudeApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!claudeApiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": claudeApiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Generate a short, catchy title (max 60 characters) for this audio recording. The title should capture the essence of what's being said. Be creative but accurate.

Transcription: "${transcription}"

Return ONLY the title, nothing else.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const caption = result.content?.[0]?.text?.trim() || transcription.slice(0, 60);

  // Remove quotes if Claude added them
  return caption.replace(/^["']|["']$/g, "");
}

async function getLocationName(latitude: number, longitude: number): Promise<string | null> {
  try {
    // Using OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
      {
        headers: {
          "User-Agent": "Echosphere/1.0",
        },
      }
    );

    if (!response.ok) {
      console.warn(`Geocoding API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Try to get a nice location name
    const address = data.address || {};
    const locationParts = [
      address.city || address.town || address.village,
      address.state || address.region,
      address.country,
    ].filter(Boolean);

    return locationParts.join(", ") || data.display_name || null;
  } catch (error) {
    console.warn("Error getting location name:", error);
    return null;
  }
}