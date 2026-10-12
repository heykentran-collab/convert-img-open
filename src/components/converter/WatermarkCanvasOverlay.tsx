'use client';

import React, { useRef, useEffect } from 'react';
import { WatermarkConfig } from '@/types/studio';
import { renderWatermark } from '@/lib/studio/renderers/renderWatermark';

interface WatermarkCanvasOverlayProps {
  watermarkConfig: WatermarkConfig;
  width?: number;
  height?: number;
  className?: string;
  logoImg?: HTMLImageElement | null;
}

export const WatermarkCanvasOverlay: React.FC<WatermarkCanvasOverlayProps> = ({
  watermarkConfig,
  width = 320,
  height = 180,
  className = 'absolute inset-0 w-full h-full pointer-events-none z-10',
  logoImg,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!watermarkConfig.enabled) return;

    // Render with exact WYSIWYG scale = 1
    const scale = 1;

    // If logo image is specified in config but not yet passed as prop, load it
    if (watermarkConfig.type === 'image' && watermarkConfig.imageSrc && !logoImg) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!canvasRef.current) return;
        const currentCtx = canvasRef.current.getContext('2d');
        if (!currentCtx) return;
        currentCtx.clearRect(0, 0, canvas.width, canvas.height);
        renderWatermark(currentCtx, watermarkConfig, 0, 0, canvas.width, canvas.height, 0, img, scale);
      };
      img.src = watermarkConfig.imageSrc;
      return;
    }

    renderWatermark(ctx, watermarkConfig, 0, 0, canvas.width, canvas.height, 0, logoImg, scale);
  }, [watermarkConfig, width, height, logoImg]);

  if (!watermarkConfig.enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
};
