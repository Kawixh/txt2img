'use client';

import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { canvasExporter } from '@/lib/canvas-export';

export function ExportButton() {
  const { state, setExportStatus, setError } = useApp();

  const handleExport = async () => {
    try {
      setExportStatus('loading');
      setError(null);

      console.log('🎨 Starting canvas-based export...');
      
      // Use canvas exporter to render text with proper fonts
      const dataUrl = await canvasExporter.exportToPng(
        state.textElements,
        state.canvasSettings
      );

      console.log('✅ Canvas export completed successfully');

      const link = document.createElement('a');
      link.download = `text-image-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Canvas export failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
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