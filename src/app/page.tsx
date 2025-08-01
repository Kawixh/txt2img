import { TextCanvas } from '@/components/TextCanvas';
import { ControlTabs } from '@/components/ControlTabs';
import { ExportButton } from '@/components/ExportButton';
import { AppProvider } from '@/contexts/AppContext';

export default function Home() {
  return (
    <AppProvider>
      <div className="flex min-h-screen flex-col bg-background container-safe">
        {/* Top Navigation Bar */}
        <header className="glass-panel border-0 border-b border-border/20 transition-smooth">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="animate-float">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Glim ✨
                </h1>
                <p className="text-sm text-muted-foreground word-wrap">
                  Turn words into pure visual energy • No cap fr 🔥
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ExportButton />
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 relative">
          {/* Controls Panel */}
          <div className="w-80 glass-panel border-0 border-r border-border/20 transition-smooth lg:w-80 md:w-72 sm:w-64">
            <ControlTabs />
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-6 container-safe">
            <div className="h-full rounded-2xl glass-panel border-border/10 p-6 transition-smooth animate-bounce-subtle">
              <div className="mb-6">
                <h2 className="mb-3 text-2xl font-bold text-shimmer" data-text="Canvas">
                  Canvas
                </h2>
                <p className="text-sm text-muted-foreground word-wrap">
                  Drag to move • Click to edit • Create magic ✨
                </p>
              </div>
              <TextCanvas />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="glass-panel border-0 border-t border-border/20 py-6 transition-smooth">
          <div className="mx-auto max-w-7xl px-4 text-center text-muted-foreground sm:px-6 lg:px-8">
            <p className="text-sm animate-pulse-slow word-wrap">
              Built different with Next.js • React • Tailwind 💜
            </p>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
