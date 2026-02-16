'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Layers2, Move, Palette, Plus, Type } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { BackgroundControls } from './BackgroundControls';
import { ExportButton } from './ExportButton';
import { FontControls } from './FontControls';
import { LayerControls } from './LayerControls';
import { PositionControls } from './PositionControls';
import { TextInput } from './TextInput';

type TabId = 'layers' | 'content' | 'styling' | 'layout' | 'background';

type Tab = {
  id: TabId;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  component: ReactNode;
};

export function ControlTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('layers');

  const tabs = useMemo<Tab[]>(
    () => [
      {
        id: 'layers',
        label: 'Layers',
        description: 'Stack order and text editing',
        icon: Layers2,
        component: <LayerControls />,
      },
      {
        id: 'content',
        label: 'Add',
        description: 'Create new text layers',
        icon: Plus,
        component: <TextInput />,
      },
      {
        id: 'styling',
        label: 'Type',
        description: 'Font and styling controls',
        icon: Type,
        component: <FontControls />,
      },
      {
        id: 'layout',
        label: 'Layout',
        description: 'Position and wrapping',
        icon: Move,
        component: <PositionControls />,
      },
      {
        id: 'background',
        label: 'Canvas',
        description: 'Background, size and templates',
        icon: Palette,
        component: <BackgroundControls />,
      },
    ],
    [],
  );

  const activeTabConfig = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
    [activeTab, tabs],
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-[22px] bg-card/75 shadow-[var(--panel-shadow)] backdrop-blur">
      <div className="flex shrink-0 flex-col items-center gap-2 border-r border-border/40 bg-background/65 p-2">
        <div className="w-full rounded-xl bg-primary/12 px-2 py-2 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Glim Studio
          </p>
        </div>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                'size-10 rounded-xl',
                activeTab !== tab.id && 'text-muted-foreground',
              )}
              onClick={() => setActiveTab(tab.id)}
              title={`${tab.label}: ${tab.description}`}
              aria-label={`${tab.label}: ${tab.description}`}
            >
              <Icon size={16} />
            </Button>
          );
        })}

        <div className="mt-auto pt-1">
          <ExportButton iconOnly />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b border-border/35 px-4 py-3">
          <h2 className="font-display text-lg text-foreground">{activeTabConfig.label}</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {activeTabConfig.description}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTabConfig.component}
        </div>
      </div>
    </div>
  );
}
