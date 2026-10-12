'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BackgroundType,
  ShadowIntensity,
  AspectRatioPreset,
} from '@/types/studio';
import { DEFAULT_STUDIO_SETTINGS } from '../constants';

export function useStudioSettings() {
  const [canvasPadding, setCanvasPadding] = useState<number>(DEFAULT_STUDIO_SETTINGS.canvasPadding);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(DEFAULT_STUDIO_SETTINGS.backgroundType);
  const [backgroundPresetId, setBackgroundPresetId] = useState<string>(DEFAULT_STUDIO_SETTINGS.backgroundPresetId);
  const [customSolidColor, setCustomSolidColor] = useState<string>(DEFAULT_STUDIO_SETTINGS.customSolidColor);
  const [shadowIntensity, setShadowIntensity] = useState<ShadowIntensity>(DEFAULT_STUDIO_SETTINGS.shadowIntensity);
  const [cornerRadius, setCornerRadius] = useState<number>(DEFAULT_STUDIO_SETTINGS.cornerRadius);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>(DEFAULT_STUDIO_SETTINGS.aspectRatio);
  const [frameType, setFrameType] = useState<'macos' | 'browser' | 'none'>(DEFAULT_STUDIO_SETTINGS.frameType);
  const [browserUrl, setBrowserUrl] = useState<string>(DEFAULT_STUDIO_SETTINGS.browserUrl);

  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [hasSavedPreset, setHasSavedPreset] = useState<boolean>(false);
  const [computedDims, setComputedDims] = useState<{ w: number; h: number }>({ w: 1280, h: 720 });
  const canvasOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load saved mockup preset on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('studio_mockup_preset');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.canvasPadding === 'number') setCanvasPadding(parsed.canvasPadding);
          if (parsed.backgroundType) setBackgroundType(parsed.backgroundType);
          if (parsed.backgroundPresetId) setBackgroundPresetId(parsed.backgroundPresetId);
          if (parsed.customSolidColor) setCustomSolidColor(parsed.customSolidColor);
          if (parsed.shadowIntensity) setShadowIntensity(parsed.shadowIntensity);
          if (typeof parsed.cornerRadius === 'number') setCornerRadius(parsed.cornerRadius);
          if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
          if (parsed.frameType) setFrameType(parsed.frameType);
          if (parsed.browserUrl) setBrowserUrl(parsed.browserUrl);
          setHasSavedPreset(true);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved studio settings', e);
    }
  }, []);

  const handleSaveSettings = useCallback(() => {
    try {
      const presetToSave = {
        canvasPadding,
        backgroundType,
        backgroundPresetId,
        customSolidColor,
        shadowIntensity,
        cornerRadius,
        aspectRatio,
        frameType,
        browserUrl,
      };
      localStorage.setItem('studio_mockup_preset', JSON.stringify(presetToSave));
      setHasSavedPreset(true);
      setSettingsFeedback('Đã lưu cấu hình làm mặc định!');
      setTimeout(() => setSettingsFeedback(null), 3000);
    } catch {
      alert('Không thể lưu cấu hình vào trình duyệt');
    }
  }, [
    canvasPadding,
    backgroundType,
    backgroundPresetId,
    customSolidColor,
    shadowIntensity,
    cornerRadius,
    aspectRatio,
    frameType,
    browserUrl,
  ]);

  const handleResetSettings = useCallback(() => {
    try {
      localStorage.removeItem('studio_mockup_preset');
      setCanvasPadding(DEFAULT_STUDIO_SETTINGS.canvasPadding);
      setBackgroundType(DEFAULT_STUDIO_SETTINGS.backgroundType);
      setBackgroundPresetId(DEFAULT_STUDIO_SETTINGS.backgroundPresetId);
      setCustomSolidColor(DEFAULT_STUDIO_SETTINGS.customSolidColor);
      setShadowIntensity(DEFAULT_STUDIO_SETTINGS.shadowIntensity);
      setCornerRadius(DEFAULT_STUDIO_SETTINGS.cornerRadius);
      setAspectRatio(DEFAULT_STUDIO_SETTINGS.aspectRatio);
      setFrameType(DEFAULT_STUDIO_SETTINGS.frameType);
      setBrowserUrl(DEFAULT_STUDIO_SETTINGS.browserUrl);
      setHasSavedPreset(false);
      setSettingsFeedback('Đã khôi phục cài đặt gốc!');
      setTimeout(() => setSettingsFeedback(null), 3000);
    } catch {
      alert('Lỗi khôi phục cấu hình');
    }
  }, []);

  return {
    canvasPadding,
    setCanvasPadding,
    backgroundType,
    setBackgroundType,
    backgroundPresetId,
    setBackgroundPresetId,
    customSolidColor,
    setCustomSolidColor,
    shadowIntensity,
    setShadowIntensity,
    cornerRadius,
    setCornerRadius,
    aspectRatio,
    setAspectRatio,
    frameType,
    setFrameType,
    browserUrl,
    setBrowserUrl,
    settingsFeedback,
    hasSavedPreset,
    computedDims,
    setComputedDims,
    canvasOffsetRef,
    handleSaveSettings,
    handleResetSettings,
  };
}
