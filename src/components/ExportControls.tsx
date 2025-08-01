'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { toPng } from 'html-to-image';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { googleFontsManager } from '@/lib/google-fonts';

export function ExportControls() {
  const { state, setExportStatus, setError } = useApp();

  const handleExport = async () => {
    try {
      setExportStatus('loading');
      setError(null);

      const canvas = document.getElementById('text-canvas');
      if (!canvas) {
        throw new Error('Canvas element not found');
      }

      console.log('Ensuring all fonts are ready for export...');
      // Ensure all fonts used in text elements are ready
      const fontFamilies = state.textElements.map(element => element.fontFamily);
      await googleFontsManager.ensureAllFontsReady(fontFamilies);
      console.log('All fonts ready, starting export with html-to-image...');

      const dataUrl = await toPng(canvas, {
        backgroundColor: undefined,
        width: state.canvasSettings.width,
        height: state.canvasSettings.height,
        pixelRatio: 2,
        cacheBust: true,
        quality: 1.0, // Maximum quality
        preferredFontFormat: 'woff2', // Optimize font loading
        skipAutoScale: false, // Allow auto-scaling for large images
        includeQueryParams: false, // Clean URLs
        skipFonts: false, // Don't skip fonts
        fontEmbedCSS: '', // Let html-to-image handle font embedding
        style: {
          width: `${state.canvasSettings.width}px`,
          height: `${state.canvasSettings.height}px`,
          // Force hardware acceleration if available
          transform: 'translateZ(0)',
        },
        filter: (node) => {
          // Skip elements marked for export exclusion
          if (node.classList?.contains('ignore-export')) {
            return false;
          }

          // Skip script tags and other non-visual elements
          const tagName = node.tagName?.toLowerCase();
          if (['script', 'noscript', 'meta', 'title'].includes(tagName)) {
            return false;
          }

          // Skip Google Fonts stylesheets to avoid CORS issues
          if (node.tagName?.toLowerCase() === 'link' && 
              (node as HTMLLinkElement).rel === 'stylesheet' &&
              (node as HTMLLinkElement).href?.includes('fonts.googleapis.com')) {
            console.log('Skipping Google Fonts stylesheet to avoid CORS:', (node as HTMLLinkElement).href);
            return false;
          }

          return true;
        },
      });

      // Create and trigger download
      const link = document.createElement('a');
      link.download = `text-image-${Date.now()}.png`;
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Export successful!');
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      
      let errorMessage = 'Export failed';
      if (error instanceof Error) {
        if (error.message.includes('cssRules') || error.message.includes('SecurityError')) {
          console.log('Font CORS issue detected, attempting fallback export...');
          errorMessage = 'Font loading issue detected. Trying fallback export method...';
          
          // Attempt fallback export without font optimization
          try {
            const canvas = document.getElementById('text-canvas');
            if (canvas) {
              console.log('Starting fallback export with skipFonts...');
              const fallbackDataUrl = await toPng(canvas, {
                backgroundColor: undefined,
                width: state.canvasSettings.width,
                height: state.canvasSettings.height,
                pixelRatio: 1.5, // Reduced pixel ratio for compatibility
                quality: 0.9,
                skipFonts: true, // Skip font processing that causes CORS issues
                style: {
                  width: `${state.canvasSettings.width}px`,
                  height: `${state.canvasSettings.height}px`,
                },
                filter: (node) => {
                  if (node.classList?.contains('ignore-export')) return false;
                  const tagName = node.tagName?.toLowerCase();
                  return !['script', 'noscript', 'meta', 'title', 'link'].includes(tagName);
                },
              });

              const link = document.createElement('a');
              link.download = `text-image-${Date.now()}.png`;
              link.href = fallbackDataUrl;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              console.log('Fallback export successful!');
              setExportStatus('success');
              setTimeout(() => setExportStatus('idle'), 3000);
              return;
            }
          } catch (fallbackError) {
            console.error('Fallback export also failed:', fallbackError);
            errorMessage = 'Export failed. Please try refreshing the page and ensuring fonts are loaded before export.';
          }
        } else {
          errorMessage = error.message;
        }
      }
      
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
