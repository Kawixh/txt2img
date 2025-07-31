'use client';

import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { toPng } from 'html-to-image';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';

export function ExportButton() {
  const { state, setExportStatus, setError } = useApp();

  const handleExport = async () => {
    try {
      setExportStatus('loading');
      setError(null);

      const canvas = document.getElementById('text-canvas');
      if (!canvas) {
        throw new Error('Canvas element not found');
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(canvas, {
        backgroundColor: undefined,
        width: state.canvasSettings.width,
        height: state.canvasSettings.height,
        pixelRatio: 2,
        cacheBust: true,
        quality: 1.0,
        preferredFontFormat: 'woff2',
        skipAutoScale: false,
        includeQueryParams: false,
        style: {
          width: `${state.canvasSettings.width}px`,
          height: `${state.canvasSettings.height}px`,
          transform: 'translateZ(0)',
        },
        filter: (node) => {
          if (node.classList?.contains('ignore-export')) {
            return false;
          }
          const tagName = node.tagName?.toLowerCase();
          if (['script', 'noscript', 'meta', 'title'].includes(tagName)) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = `text-image-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setError(error instanceof Error ? error.message : 'Export failed');
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus('idle');
        setError(null);
      }, 5000);
    }
  };

  const getButtonContent = () => {
    switch (state.exportStatus) {
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
    switch (state.exportStatus) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const isDisabled =
    state.exportStatus === 'loading' || state.textElements.length === 0;

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