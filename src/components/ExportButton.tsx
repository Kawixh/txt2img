'use client';

import { Button } from '@/components/ui/button';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { reliableExporter } from '@/lib/reliable-export';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import posthog from 'posthog-js';
import { useCallback } from 'react';

type ExportButtonProps = {
  iconOnly?: boolean;
  className?: string;
};

export function ExportButton({ iconOnly = false, className }: ExportButtonProps) {
  const { setExportStatus, setError } = useAppActions();
  const exportStatus = useAppStore((state) => state.exportStatus);
  const textElements = useAppStore((state) => state.textElements);
  const shapeCount = useAppStore((state) => state.shapeElements.length);
  const imageCount = useAppStore((state) => state.imageElements.length);
  const canvasSettings = useAppStore((state) => state.canvasSettings);

  const handleExport = useCallback(async () => {
    try {
      setExportStatus('loading');
      setError(null);

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const fontFamilies = [
        ...new Set(textElements.map((el) => el.fontFamily)),
      ];

      const dataUrl = await reliableExporter.exportElementToPng(
        'text-canvas',
        {
          width: canvasSettings.width,
          height: canvasSettings.height,
          pixelRatio: 3,
          quality: 1.0,
          transparentBackground: canvasSettings.background.type === 'transparent',
        },
        fontFamilies,
      );

      reliableExporter.downloadImage(dataUrl, `text-image-${Date.now()}.png`);

      posthog.capture('image-exported');
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export failed:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Export failed';
      setError(errorMessage);
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus('idle');
        setError(null);
      }, 8000);
    }
  }, [
    canvasSettings.background.type,
    canvasSettings.height,
    canvasSettings.width,
    setError,
    setExportStatus,
    textElements,
  ]);

  const getButtonIcon = () => {
    switch (exportStatus) {
      case 'loading':
        return <Loader2 size={16} className="animate-spin" />;
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <Download size={16} />;
    }
  };

  const getButtonLabel = () => {
    switch (exportStatus) {
      case 'loading':
        return 'Exporting...';
      case 'success':
        return 'Exported!';
      case 'error':
        return 'Export Failed';
      default:
        return 'Export PNG';
    }
  };

  const getButtonVariant = () => {
    switch (exportStatus) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const totalLayerCount = textElements.length + shapeCount + imageCount;
  const isDisabled = exportStatus === 'loading' || totalLayerCount === 0;
  const buttonTitle = isDisabled
    ? 'Add at least one layer to export'
    : 'Export current canvas as PNG';

  if (iconOnly) {
    return (
      <Button
        onClick={handleExport}
        disabled={isDisabled}
        variant={getButtonVariant()}
        size="icon"
        className={cn('size-10 rounded-xl', className)}
        title={`${buttonTitle} (${getButtonLabel()})`}
        aria-label={buttonTitle}
      >
        {getButtonIcon()}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isDisabled}
      variant={getButtonVariant()}
      size="sm"
      className={className}
      title={buttonTitle}
    >
      {getButtonIcon()}
      {getButtonLabel()}
    </Button>
  );
}
