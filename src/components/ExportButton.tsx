'use client';

import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { reliableExporter } from '@/lib/reliable-export';

export function ExportButton() {
  const { state, setExportStatus, setError } = useApp();

  const handleExport = async () => {
    try {
      setExportStatus('loading');
      setError(null);

      console.log('🎨 Starting reliable html-to-image export...');

      // Get unique font families used in text elements
      const fontFamilies = [
        ...new Set(state.textElements.map((el) => el.fontFamily)),
      ];
      console.log('Font families to ensure:', fontFamilies);

      // Use reliable exporter that handles fonts properly
      const dataUrl = await reliableExporter.exportElementToPng(
        'text-canvas',
        {
          width: state.canvasSettings.width,
          height: state.canvasSettings.height,
          pixelRatio: 2,
          quality: 1.0,
        },
        fontFamilies,
      );

      console.log('✅ Reliable export completed successfully');

      // Download the image
      reliableExporter.downloadImage(dataUrl, `text-image-${Date.now()}.png`);

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
