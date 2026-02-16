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
        description: 'Manage layer order and quick edits',
        icon: Layers2,
        component: <LayerControls />,
      },
      {
        id: 'content',
        label: 'Add',
        description: 'Insert text, shapes, and images',
        icon: Plus,
        component: <TextInput />,
      },
      {
        id: 'styling',
        label: 'Text',
        description: 'Typography and styling controls',
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
    <div className="bg-card/95 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 shadow-(--panel-shadow)">
      <div className="border-b border-border/60 px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
              Canvas Studio
            </p>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Design Controls
            </h2>
          </div>
          <ExportButton className="h-8 px-3" />
        </div>

        <div className="mt-3 grid grid-cols-5 gap-1 rounded-xl bg-muted/55 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={cn(
                  'h-auto min-h-12 flex-col gap-1 rounded-lg px-1 py-2 text-[11px] font-medium',
                  isActive
                    ? 'border border-border/70 bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/70',
                )}
                onClick={() => setActiveTab(tab.id)}
                title={`${tab.label}: ${tab.description}`}
                aria-label={`${tab.label}: ${tab.description}`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-border/60 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{activeTabConfig.label}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {activeTabConfig.description}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">{activeTabConfig.component}</div>
    </div>
  );
}
