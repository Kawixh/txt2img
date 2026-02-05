import { ControlTabs } from '@/components/ControlTabs';
import { ExportButton } from '@/components/ExportButton';
import { TextCanvas } from '@/components/TextCanvas';
import { AppProvider } from '@/contexts/AppContext';

export default function Home() {
  return (
    <AppProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <header className="shrink-0 border-b border-border/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Glim Studio
              </p>
              <h1 className="font-display text-3xl text-foreground">Text to Image</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Craft typography-first visuals with precise controls and export-ready output.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton />
            </div>
          </div>
        </header>

        <div className="mx-auto grid h-full max-w-7xl flex-1 min-h-0 grid-cols-1 items-stretch gap-6 overflow-hidden px-6 py-6 lg:grid-cols-[320px_1fr]">
          <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--panel-shadow)]">
            <ControlTabs />
          </aside>

          <main className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[var(--panel-shadow)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">Canvas</h2>
                <p className="text-muted-foreground text-sm">
                  Drag to move, click to edit, and refine every detail.
                </p>
              </div>
              <div className="rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                Live preview
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <TextCanvas />
            </div>
          </main>
        </div>

        <footer className="shrink-0 border-t border-border/70">
          <div className="text-muted-foreground mx-auto max-w-7xl px-6 py-6 text-xs">
            Designed for focused typographic exploration — clean, precise, and export-ready.
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
