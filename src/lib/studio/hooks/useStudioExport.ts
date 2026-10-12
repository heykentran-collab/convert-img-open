import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addLayerBlobToStitcher } from '@/lib/stitcher';
import { r2Fetch } from '@/lib/r2-api-client';

export interface UseStudioExportProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  sourceKey: string | null;
  setSourceKey: (key: string | null) => void;
  imageSrc: string | null;
}

export function useStudioExport({
  canvasRef,
  sourceKey,
  setSourceKey,
  imageSrc,
}: UseStudioExportProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [sendingToStitcher, setSendingToStitcher] = useState(false);
  const [uploadingToR2, setUploadingToR2] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleExportStudioImage = async ({
    format = 'png',
    quality = 0.92,
    scale = 1,
    customName,
  }: {
    format?: 'png' | 'webp' | 'jpeg';
    quality?: number;
    scale?: number;
    customName?: string;
  } = {}) => {
    const sourceCanvas = canvasRef.current;
    if (!sourceCanvas) return;

    let targetCanvas = sourceCanvas;
    let tempCanvas: HTMLCanvasElement | null = null;

    if (scale !== 1 || format === 'jpeg') {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.round(sourceCanvas.width * scale);
      tempCanvas.height = Math.round(sourceCanvas.height * scale);
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // If JPEG, fill white background to avoid black transparency
        if (format === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        ctx.drawImage(
          sourceCanvas,
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        targetCanvas = tempCanvas;
      }
    }

    const mimeType =
      format === 'png'
        ? 'image/png'
        : format === 'jpeg'
        ? 'image/jpeg'
        : 'image/webp';

    const ext = format === 'jpeg' ? 'jpg' : format;

    const baseName = customName?.trim()
      ? customName.trim().replace(/\.[^/.]+$/, '')
      : sourceKey
      ? sourceKey.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'artwork'
      : 'volticen-artwork';

    const scaleSuffix = scale > 1 ? `@${scale}x` : '';
    const finalFileName = `${baseName}-annotated${scaleSuffix}.${ext}`;

    const blob = await new Promise<Blob | null>((resolve) => {
      targetCanvas.toBlob((b) => resolve(b), mimeType, quality);
    });

    // Zero-Retention: Release temporary canvas memory if created
    if (tempCanvas) {
      tempCanvas.width = 0;
      tempCanvas.height = 0;
    }

    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const copyImageToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          alert('Trình duyệt không hỗ trợ sao chép ảnh trực tiếp vào clipboard');
        }
      }
    }, 'image/png');
  };

  // Send active canvas to Stitcher as a new layer
  const handleSendToStitcher = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    setSendingToStitcher(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
      });

      if (blob) {
        const cleanName = sourceKey
          ? `studio-${sourceKey.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'artwork'}.png`
          : `studio-artwork-${Date.now()}.png`;
        const res = await addLayerBlobToStitcher(blob, cleanName);
        if (res.success) {
          router.push('/stitcher?source=studio');
        } else {
          alert('Không thể chuyển ảnh sang Ghép ảnh');
        }
      }
    } catch (err) {
      console.error('Failed to send to stitcher:', err);
    } finally {
      setSendingToStitcher(false);
    }
  };

  // Upload annotated canvas back to Cloudflare R2
  const handleSaveToR2 = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const defaultKey = sourceKey || `posts/studio-${Date.now()}.webp`;
    const targetKey = prompt(
      'Nhập đường dẫn R2 Key để lưu ảnh:\n(Mặc định ghi đè tệp gốc hoặc đổi tên)',
      defaultKey
    );
    if (!targetKey) return;

    setUploadingToR2(true);
    setUploadSuccess(false);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setUploadingToR2(false);
          return;
        }

        try {
          const res = await r2Fetch('/api/r2/upload', {
            method: 'POST',
            headers: {
              'x-r2-key': encodeURIComponent(targetKey.trim()),
              'x-r2-content-type': 'image/webp',
            },
            body: blob,
          });
          const data = await res.json();
          if (data.success) {
            setUploadSuccess(true);
            setSourceKey(targetKey);
            setTimeout(() => setUploadSuccess(false), 3000);
          } else {
            alert('Lỗi lưu R2: ' + data.error);
          }
        } catch (err: any) {
          alert('Lỗi: ' + err.message);
        } finally {
          setUploadingToR2(false);
        }
      },
      'image/webp',
      0.9
    );
  };

  return {
    copied,
    sendingToStitcher,
    uploadingToR2,
    uploadSuccess,
    handleExportStudioImage,
    copyImageToClipboard,
    handleSendToStitcher,
    handleSaveToR2,
  };
}
