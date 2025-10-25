import asyncio
import os
from omi import listen_to_omi, OmiOpusDecoder, transcribe
from asyncio import Queue
import io
from collections import deque
import time
import numpy as np
from supabase import create_client, Client
import getpass

class TriggerRecorder:
    def __init__(self, supabase_client: Client = None, user_id: str = None, location: tuple = None):
        self.recording = False
        self.recording_start = None
        self.recorded_chunks = []
        self.supabase = supabase_client
        self.user_id = user_id
        self.location = location  # (latitude, longitude)
        
    def detect_trigger(self, transcript):
        triggers = ['hey echo', 'record echo', 'start echo']
        return any(t in transcript.lower() for t in triggers)
    
    def start_recording(self, duration=5):
        self.recording = True
        self.recording_start = time.time()
        self.recording_duration = duration
        self.recorded_chunks = []  # Start fresh, no pre-roll
        
        print(f"🔴 Recording started for {duration} seconds...")
    
    def add_audio(self, pcm_data):
        """Add audio to recording if active"""
        if self.recording:
            self.recorded_chunks.append(pcm_data)
            
            # Check if duration exceeded
            elapsed = time.time() - self.recording_start
            if elapsed > self.recording_duration:
                self.stop_recording()
    
    def stop_recording(self):
        """Stop and save recording"""
        self.recording = False
        print("⏹️  Recording stopped. Saving...")

        # Combine all chunks
        full_audio = b''.join(self.recorded_chunks)

        # Create recordings directory if it doesn't exist
        os.makedirs("recordings", exist_ok=True)

        # Save to MP3 (or WAV if pydub not available)
        timestamp = int(time.time())
        filename = f"recordings/echo_{timestamp}.mp3"
        duration, actual_filename = self.save_mp3(filename, full_audio)

        # Upload to ecosphere
        if self.supabase and self.user_id and duration:
            self.upload_to_ecosphere(actual_filename, duration)

        self.recorded_chunks = []
    
    def save_mp3(self, filename, pcm_data):
        """Convert PCM data to MP3 and save, returns (duration, filename) tuple"""
        try:
            from pydub import AudioSegment

            # Convert raw PCM bytes to AudioSegment
            # PCM format: 16-bit signed, mono, 16kHz
            audio = AudioSegment(
                data=pcm_data,
                sample_width=2,  # 16-bit = 2 bytes
                frame_rate=16000,
                channels=1
            )

            # Export as MP3
            audio.export(filename, format="mp3", bitrate="128k")
            duration = len(audio) / 1000.0
            print(f"💾 Saved: {filename} ({len(pcm_data)} bytes, {duration:.1f}s)")
            return int(duration), filename

        except ImportError:
            print("⚠️  pydub not installed. Falling back to WAV...")
            return self.save_wav_fallback(filename.replace('.mp3', '.wav'), pcm_data)
        except Exception as e:
            print(f"❌ Error saving MP3: {e}")
            print("Falling back to WAV...")
            return self.save_wav_fallback(filename.replace('.mp3', '.wav'), pcm_data)
    
    def save_wav_fallback(self, filename, pcm_data):
        """Fallback: Save as WAV if MP3 fails, returns (duration, filename) tuple"""
        import wave
        with wave.open(filename, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(16000)
            wav_file.writeframes(pcm_data)
        duration = len(pcm_data) / (16000 * 2)
        print(f"💾 Saved WAV: {filename} ({duration:.1f}s)")
        return int(duration), filename
    
    def upload_to_ecosphere(self, filename, duration):
        """Upload audio to Supabase storage and create database record"""
        try:
            # 1. Upload file to Supabase Storage
            print(f"☁️  Uploading {filename} to Supabase...")

            # Determine content type based on file extension
            content_type = "audio/mpeg" if filename.endswith('.mp3') else "audio/wav"

            # Extract just the filename without the recordings/ prefix
            basename = os.path.basename(filename)

            with open(filename, 'rb') as f:
                storage_path = f"{self.user_id}/{basename}"
                response = self.supabase.storage.from_('echoes').upload(
                    storage_path,
                    f.read(),
                    file_options={"content-type": content_type}
                )

            # 2. Get public URL
            audio_url = self.supabase.storage.from_('echoes').get_public_url(storage_path)
            print(f"✅ Uploaded to: {audio_url}")

            # 3. Create database record
            location_str = f"POINT({self.location[1]} {self.location[0]})" if self.location else "POINT(0 0)"

            echo_data = {
                "user_id": self.user_id,
                "audio_url": audio_url,
                "duration": duration,
                "location": location_str,
                "location_name": None,  # Can be populated with reverse geocoding later
            }

            result = self.supabase.table('echoes').insert(echo_data).execute()
            print(f"✅ Database record created: {result.data[0]['id']}")

            # Clean up local file after successful upload
            os.remove(filename)
            print(f"🗑️  Cleaned up local file: {filename}")

        except Exception as e:
            print(f"⚠️  Upload failed: {e}")
            import traceback
            traceback.print_exc()


def authenticate_user(supabase_url: str, supabase_key: str):
    """Authenticate user with Supabase using email and password"""
    print("\n🔐 Supabase Authentication")
    print("=" * 50)

    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)

    # Check if we have saved credentials
    email = os.getenv("SUPABASE_EMAIL")
    password = os.getenv("SUPABASE_PASSWORD")

    if not email or not password:
        # Prompt for credentials
        print("\nPlease enter your Echosphere credentials:")
        email = input("Email: ").strip()
        password = getpass.getpass("Password: ")

    try:
        # Sign in with email and password
        print("\n🔄 Signing in...")
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        user = response.user
        session = response.session

        print(f"✅ Successfully signed in as: {user.email}")
        print(f"👤 User ID: {user.id}")

        # Update the client with the session token
        supabase.postgrest.auth(session.access_token)

        return supabase, user.id, user.email

    except Exception as e:
        print(f"\n❌ Authentication failed: {e}")
        print("\nTips:")
        print("  - Make sure you have an account in your Supabase project")
        print("  - Check that email/password authentication is enabled in Supabase")
        print("  - Verify your credentials are correct")
        return None, None, None


async def main():
    # Your Omi device MAC address
    OMI_MAC = "7C390D0A-9F4F-9DB8-89E5-B8CA822CEE67"
    OMI_CHAR_UUID = "19B10001-E8F2-537E-4F6C-D104768A1214"  # Standard Omi audio UUID

    # Get environment variables
    DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

    # Supabase configuration
    SUPABASE_URL = "https://jhevbkdqfynrqveuqbrl.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXZia2RxZnlucnF2ZXVxYnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDU5MTYsImV4cCI6MjA3NjkyMTkxNn0.mZeuIMcBGItF0v8w-GDdHCbnlpt2hcHf1ZRXWoOx9WA"

    # Optional: Set your location (latitude, longitude)
    LOCATION = (37.7749, -122.4194)  # Example: San Francisco

    if not DEEPGRAM_API_KEY:
        print("❌ Error: DEEPGRAM_API_KEY not set!")
        print("Set it with: export DEEPGRAM_API_KEY='your-key-here'")
        return

    # Initialize Supabase client with authentication
    supabase_client = None
    user_id = None
    user_email = None

    if SUPABASE_URL and SUPABASE_KEY:
        # Authenticate user
        supabase_client, user_id, user_email = authenticate_user(SUPABASE_URL, SUPABASE_KEY)

        if supabase_client and user_id:
            print(f"✅ Authenticated as {user_email} - echoes will be uploaded")
        else:
            print("⚠️  Authentication failed - echoes will only be saved locally")
            supabase_client = None
            user_id = None
    else:
        print("⚠️  Supabase not configured - echoes will only be saved locally")
        print("Set: SUPABASE_URL, SUPABASE_KEY")
        print("Optionally set: SUPABASE_EMAIL, SUPABASE_PASSWORD (to skip login prompt)")

    audio_queue = Queue()
    decoder = OmiOpusDecoder()
    recorder = TriggerRecorder(
        supabase_client=supabase_client,
        user_id=user_id,
        location=LOCATION
    )
    
    def handle_audio(sender, data):
        """Called for each audio packet from Omi"""
        pcm_data = decoder.decode_packet(data)
        if pcm_data:
            # Add to recording if active
            recorder.add_audio(pcm_data)
            
            # Always send to transcription
            audio_queue.put_nowait(pcm_data)
    
    def handle_transcript(transcript):
        """Called when transcription arrives"""
        print(f"🎤 {transcript}")
        
        # Check for trigger phrase
        if recorder.detect_trigger(transcript) and not recorder.recording:
            recorder.start_recording(duration=5)  # 5 seconds
    
    print("🎧 Connecting to Omi...")
    print(f"MAC: {OMI_MAC}")
    print("Waiting for trigger phrases:")
    print("  - 'hey echo'")
    print("  - 'record echo'")
    print("  - 'start echo'")
    print("\n💡 Recording will start FROM the trigger word and last 5 seconds\n")
    
    # Start both audio capture and transcription
    try:
        await asyncio.gather(
            listen_to_omi(OMI_MAC, OMI_CHAR_UUID, handle_audio),
            transcribe(audio_queue, DEEPGRAM_API_KEY, on_transcript=handle_transcript)
        )
    except KeyboardInterrupt:
        print("\n👋 Stopped by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())