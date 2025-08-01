'use client';

import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { toPng } from 'html-to-image';
import { AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import { googleFontsManager } from '@/lib/google-fonts';

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

      // Ensure all fonts used in text elements are ready
      const fontFamilies = state.textElements.map(element => element.fontFamily);
      await googleFontsManager.ensureAllFontsReady(fontFamilies);

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
        skipFonts: false,
        fontEmbedCSS: '',
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
          if (['script', 'noscript', 'meta', 'title', 'link'].includes(tagName)) {
            return false;
          }
          // Skip stylesheets that might cause CORS issues
          if (node.tagName?.toLowerCase() === 'link' && 
              (node as HTMLLinkElement).rel === 'stylesheet' &&
              (node as HTMLLinkElement).href?.includes('fonts.googleapis.com')) {
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
      
      let errorMessage = 'Export failed';
      if (error instanceof Error) {
        if (error.message.includes('cssRules') || error.message.includes('SecurityError')) {
          errorMessage = 'Font loading issue detected. Trying fallback export method...';
          
          // Attempt fallback export without font optimization
          try {
            const canvas = document.getElementById('text-canvas');
            if (canvas) {
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

              setExportStatus('success');
              setTimeout(() => setExportStatus('idle'), 3000);
              return;
            }
          } catch (fallbackError) {
            console.error('Fallback export also failed:', fallbackError);
            errorMessage = 'Export failed. Please try refreshing and loading fonts before export.';
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