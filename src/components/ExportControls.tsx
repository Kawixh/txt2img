'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { reliableExporter } from '@/lib/reliable-export';

export function ExportControls() {
  const { state, setExportStatus, setError } = useApp();

  const handleExport = async () => {
    try {
      setExportStatus('loading');
      setError(null);

      console.log('🎨 Starting canvas-based export with detailed logging...');
      console.log(
        'Text elements to export:',
        state.textElements.map((el) => ({
          id: el.id,
          content: el.content,
          x: el.x,
          y: el.y,
          width: el.width,
          fontSize: el.fontSize,
          textAlign: el.textAlign,
          fontFamily: el.fontFamily,
        })),
      );
      console.log('Canvas settings:', state.canvasSettings);

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

      console.log('HTML-to-image export successful!');
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
