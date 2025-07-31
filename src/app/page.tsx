import { BackgroundControls } from '@/components/BackgroundControls';
import { ExportControls } from '@/components/ExportControls';
import { FontControls } from '@/components/FontControls';
import { PositionControls } from '@/components/PositionControls';
import { TextCanvas } from '@/components/TextCanvas';
import { TextInput } from '@/components/TextInput';
import { AppProvider } from '@/contexts/AppContext';

export default function Home() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Text to Image Converter
            </h1>
            <p className="mt-1 text-gray-600">
              Create beautiful text-based images with custom styling and
              backgrounds
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Controls Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 max-h-[calc(100vh-10rem)] space-y-6 overflow-y-auto pr-2">
                <TextInput />
                <FontControls />
                <PositionControls />
                <BackgroundControls />
                <ExportControls />
              </div>
            </div>

            {/* Canvas Area */}
            <div className="lg:col-span-3">
              <div className="rounded-lg border bg-white p-6 shadow-sm">
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
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 text-center text-gray-600 sm:px-6 lg:px-8">
            <p>Built with Next.js, React, and Tailwind CSS</p>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
