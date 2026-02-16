import { ControlTabs } from '@/components/ControlTabs';
import { TextCanvas } from '@/components/TextCanvas';
import { AppProvider } from '@/contexts/AppContext';

export default function Home() {
  return (
    <AppProvider>
      <div className="bg-background text-foreground relative h-screen overflow-hidden">
        <TextCanvas />

        <aside className="pointer-events-none absolute top-3 right-3 left-3 z-30 max-h-[calc(100%-1.5rem)] md:top-5 md:right-auto md:bottom-5 md:max-h-[calc(100%-2.5rem)] md:w-90">
          <div className="pointer-events-auto h-full">
            <div className="h-full max-h-full overflow-hidden">
              <ControlTabs />
            </div>
          </div>
        </aside>
      </div>
    </AppProvider>
  );
}
