'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { canvasExporter } from '@/lib/canvas-export';

export function ExportControls() {
  const { state, setExportStatus, setError } = useApp();

  const handleExport = async () => {
    try {
      setExportStatus('loading');
      setError(null);

      console.log('🎨 Starting canvas-based export with detailed logging...');
      console.log('Text elements:', state.textElements);
      console.log('Canvas settings:', state.canvasSettings);
      
      // Use canvas exporter to render text with proper fonts
      const dataUrl = await canvasExporter.exportToPng(
        state.textElements,
        state.canvasSettings
      );

      console.log('✅ Canvas export completed successfully');

      // Create and trigger download
      const link = document.createElement('a');
      link.download = `text-image-${Date.now()}.png`;
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Canvas export successful!');
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
            Export as PNG
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download size={20} />
          Export Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={handleExport}
            disabled={isDisabled}
            variant={getButtonVariant()}
            className="w-full"
            size="lg"
          >
            {getButtonContent()}
          </Button>

          {state.textElements.length === 0 && (
            <p className="text-muted-foreground text-center text-sm">
              Add some text elements to export
            </p>
          )}

          {state.error && (
            <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
              <p className="text-destructive text-sm">
                <AlertCircle size={14} className="mr-1 inline" />
                {state.error}
              </p>
            </div>
          )}

          {state.exportStatus === 'success' && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-700">
                <CheckCircle size={14} className="mr-1 inline" />
                Image exported successfully!
              </p>
            </div>
          )}
        </div>

        <div className="text-muted-foreground space-y-1 text-xs">
          <p>• High resolution (2x scale)</p>
          <p>• PNG format with transparency support</p>
          <p>• Modern CSS color support</p>
          <p>• SVG-based rendering engine</p>
          <p>
            • Current size: {state.canvasSettings.width} ×{' '}
            {state.canvasSettings.height}px
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
