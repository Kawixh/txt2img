'use client';

import { Button } from '@/components/ui/button';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { reliableExporter } from '@/lib/reliable-export';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import posthog from 'posthog-js';

export function ExportButton() {
  const { setExportStatus, setError } = useAppActions();
  const exportStatus = useAppStore((state) => state.exportStatus);
  const textElements = useAppStore((state) => state.textElements);
  const canvasSettings = useAppStore((state) => state.canvasSettings);

  const handleExport = async () => {
    try {
      setExportStatus('loading');
      setError(null);

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
  };

  const getButtonContent = () => {
    switch (exportStatus) {
      case 'loading':
        return (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Exporting...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle size={16} className="mr-2" />
            Exported!
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle size={16} className="mr-2" />
            Export Failed
          </>
        );
      default:
        return (
          <>
            <Download size={16} className="mr-2" />
            Export PNG
          </>
        );
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

  const isDisabled = exportStatus === 'loading' || textElements.length === 0;

  return (
    <Button
      onClick={handleExport}
      disabled={isDisabled}
      variant={getButtonVariant()}
      size="sm"
    >
      {getButtonContent()}
    </Button>
  );
}
