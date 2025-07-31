import { AppProvider } from '@/contexts/AppContext'
import { TextCanvas } from '@/components/TextCanvas'
import { TextInput } from '@/components/TextInput'
import { FontControls } from '@/components/FontControls'
import { BackgroundControls } from '@/components/BackgroundControls'
import { ExportControls } from '@/components/ExportControls'

export default function Home() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Text to Image Converter
            </h1>
            <p className="text-gray-600 mt-1">
              Create beautiful text-based images with custom styling and backgrounds
            </p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Controls Panel */}
            <div className="lg:col-span-1 space-y-6">
              <TextInput />
              <FontControls />
              <BackgroundControls />
              <ExportControls />
            </div>

            {/* Canvas Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Canvas
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Click and drag text elements to reposition them. Click on a text element to select and edit it.
                  </p>
                </div>
                <TextCanvas />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
            <p>Built with Next.js, React, and Tailwind CSS</p>
          </div>
        </footer>
      </div>
    </AppProvider>
  )
}
