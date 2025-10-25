'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
}

export default function AudioVisualizer({ isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Clear canvas when not playing
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bars = 40;
    const barWidth = width / bars;

    // Create random heights for each bar
    const barHeights = Array(bars)
      .fill(0)
      .map(() => Math.random());

    let frameCount = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      frameCount++;

      for (let i = 0; i < bars; i++) {
        // Create smooth wave effect
        const waveOffset = Math.sin((frameCount * 0.05) + (i * 0.3)) * 0.5 + 0.5;
        const randomVariation = Math.sin((frameCount * 0.1) + (i * 0.5)) * 0.3;
        const barHeight = (barHeights[i] * 0.7 + waveOffset * 0.3 + randomVariation) * height * 0.8;

        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        // Gradient from blue to cyan
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={128}
        className="w-full h-full"
      />
    </div>
  );
}
