'use client';

import { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  audioStream: MediaStream | null;
  isRecording: boolean;
}

export default function VoiceVisualizer({ audioStream, isRecording }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!audioStream || !isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up audio analysis
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const width = canvas.width;
    const height = canvas.height;
    const bars = 50;
    const barWidth = 3; // Slim bars
    const gap = (width - bars * barWidth) / (bars - 1);

    const draw = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < bars; i++) {
        const value = dataArray[i % bufferLength];
        const barHeight = Math.max(4, (value / 255) * height * 0.7);

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        // Blue color
        ctx.fillStyle = '#3b82f6';

        // Draw rounded rectangle
        ctx.beginPath();
        const radius = barWidth / 2; // Make it fully rounded
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioContext.close();
    };
  }, [audioStream, isRecording]);

  return (
    <div className="w-full h-32 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={800}
        height={128}
        className="w-full h-full"
      />
    </div>
  );
}
