import { ControlTabs } from '@/components/ControlTabs';
import { ExportButton } from '@/components/ExportButton';
import { TextCanvas } from '@/components/TextCanvas';
import { AppProvider } from '@/contexts/AppContext';

export default function Home() {
  return (
    <AppProvider>
      <div className="bg-background container-safe flex min-h-screen flex-col">
        {/* Top Navigation Bar */}
        <header className="">
          <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-purple-600">Glim ✨</h1>
                <p className="text-muted-foreground word-wrap text-sm">
                  Turn words into pure visual energy • No cap fr 🔥
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ExportButton />
              </div>
            </div>
          </div>
        </header>

        <div className="relative flex flex-1">
          {/* Controls Panel */}
          <div className="glass-panel border-border/20 transition-smooth w-80 border-0 border-r sm:w-64 md:w-72 lg:w-80">
            <ControlTabs />
          </div>

          {/* Canvas Area */}
          <div className="container-safe flex-1 p-6">
            <div className="glass-panel border-border/10 h-full rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="mb-3 text-2xl font-bold" data-text="Canvas">
                  Canvas
                </h2>
                <p className="text-muted-foreground word-wrap items-center text-sm">
                  Drag to move • Click to edit • Create magic ✨
                </p>
              </div>
              <TextCanvas />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="glass-panel border-border/20 transition-smooth border-0 border-t py-6">
          <div className="text-muted-foreground mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="animate-pulse-slow word-wrap text-sm">
              Built different with Next.js • React • Tailwind 💜
            </p>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
