import { TextCanvas } from '@/components/TextCanvas';
import { ControlTabs } from '@/components/ControlTabs';
import { ExportButton } from '@/components/ExportButton';
import { AppProvider } from '@/contexts/AppContext';

export default function Home() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Text to Image Converter
                </h1>
                <p className="text-sm text-gray-600">
                  Create beautiful text-based images with custom styling
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ExportButton />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Controls Panel */}
          <div className="w-80 border-r bg-white shadow-sm">
            <ControlTabs />
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-6">
            <div className="h-full rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  Canvas
                </h2>
                <p className="text-sm text-gray-600">
                  Click and drag text elements to reposition them. Click on a
                  text element to select and edit it.
                </p>
              </div>
              <TextCanvas />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t bg-white py-4">
          <div className="mx-auto max-w-7xl px-4 text-center text-gray-600 sm:px-6 lg:px-8">
            <p className="text-sm">Built with Next.js, React, and Tailwind CSS</p>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
