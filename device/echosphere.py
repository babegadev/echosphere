import asyncio
import os
from omi import listen_to_omi, OmiOpusDecoder, transcribe
from asyncio import Queue
import io
from collections import deque
import time
import numpy as np

class TriggerRecorder:
    def __init__(self):
        self.recording = False
        self.recording_start = None
        self.recorded_chunks = []
        
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
        
        # Save to MP3
        timestamp = int(time.time())
        filename = f"recordings/echo_{timestamp}.mp3"
        self.save_mp3(filename, full_audio)
        
        # Upload to ecosphere (optional)
        # self.upload_to_ecosphere(filename, full_audio)
        
        self.recorded_chunks = []
    
    def save_mp3(self, filename, pcm_data):
        """Convert PCM data to MP3 and save"""
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
            
        except ImportError:
            print("⚠️  pydub not installed. Falling back to WAV...")
            self.save_wav_fallback(filename.replace('.mp3', '.wav'), pcm_data)
        except Exception as e:
            print(f"❌ Error saving MP3: {e}")
            print("Falling back to WAV...")
            self.save_wav_fallback(filename.replace('.mp3', '.wav'), pcm_data)
    
    def save_wav_fallback(self, filename, pcm_data):
        """Fallback: Save as WAV if MP3 fails"""
        import wave
        with wave.open(filename, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(16000)
            wav_file.writeframes(pcm_data)
        duration = len(pcm_data) / (16000 * 2)
        print(f"💾 Saved WAV: {filename} ({duration:.1f}s)")
    
    def upload_to_ecosphere(self, filename, audio_data):
        """Upload to your ecosphere API"""
        import requests
        
        try:
            with open(filename, 'rb') as f:
                files = {'audio': (filename, f, 'audio/mpeg')}
                response = requests.post(
                    'https://your-ecosphere-api.com/echoes',
                    files=files,
                    headers={'Authorization': 'Bearer YOUR_API_KEY'},
                    timeout=10
                )
                print(f"☁️  Uploaded to ecosphere: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Upload failed: {e}")

async def main():
    # Your Omi device MAC address
    OMI_MAC = "7C390D0A-9F4F-9DB8-89E5-B8CA822CEE67"
    OMI_CHAR_UUID = "19B10001-E8F2-537E-4F6C-D104768A1214"  # Standard Omi audio UUID
    DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
    
    if not DEEPGRAM_API_KEY:
        print("❌ Error: DEEPGRAM_API_KEY not set!")
        print("Set it with: export DEEPGRAM_API_KEY='your-key-here'")
        return
    
    audio_queue = Queue()
    decoder = OmiOpusDecoder()
    recorder = TriggerRecorder()
    
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