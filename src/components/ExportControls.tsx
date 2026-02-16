'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppActions, useAppStore } from '@/contexts/AppContext';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { reliableExporter } from '@/lib/reliable-export';

export function ExportControls() {
  const { setExportStatus, setError } = useAppActions();
  const exportStatus = useAppStore((state) => state.exportStatus);
  const textElements = useAppStore((state) => state.textElements);
  const shapeCount = useAppStore((state) => state.shapeElements.length);
  const imageCount = useAppStore((state) => state.imageElements.length);
  const canvasSettings = useAppStore((state) => state.canvasSettings);
  const error = useAppStore((state) => state.error);

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
            Export as PNG
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

  const totalLayerCount = textElements.length + shapeCount + imageCount;
  const isDisabled = exportStatus === 'loading' || totalLayerCount === 0;

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

          {totalLayerCount === 0 && (
            <p className="text-muted-foreground text-center text-sm">
              Add at least one layer to export
            </p>
          )}

          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                <AlertCircle size={14} className="mr-1 inline" />
                {error}
              </p>
            </div>
          )}

          {exportStatus === 'success' && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm text-emerald-700">
                <CheckCircle size={14} className="mr-1 inline" />
                Image exported successfully!
              </p>
            </div>
          )}
        </div>

        <div className="text-muted-foreground space-y-1 text-xs">
          <p>• High resolution (3x scale)</p>
          <p>• PNG format with transparency support</p>
          <p>• Modern CSS color support</p>
          <p>• SVG-based rendering engine</p>
          <p>
            • Current size: {canvasSettings.width} × {canvasSettings.height}px
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
