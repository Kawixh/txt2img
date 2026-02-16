import { ControlTabs } from '@/components/ControlTabs';
import { TextCanvas } from '@/components/TextCanvas';
import { AppProvider } from '@/contexts/AppContext';

export default function Home() {
  return (
    <AppProvider>
      <div className="bg-background text-foreground relative h-screen overflow-hidden">
        <div className="h-full md:pl-[23.5rem]">
          <TextCanvas />
        </div>

        <aside className="pointer-events-none absolute inset-x-3 top-3 z-30 max-h-[56vh] md:inset-y-4 md:left-4 md:right-auto md:max-h-none md:w-[22rem]">
          <div className="pointer-events-auto h-full overflow-hidden">
            <ControlTabs />
          </div>
        </aside>
      </div>
    </AppProvider>
  );
}
