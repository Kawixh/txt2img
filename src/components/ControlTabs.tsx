'use client';

import { Button } from '@/components/ui/button';
import { Move, Palette, Plus, Type } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { BackgroundControls } from './BackgroundControls';
import { FontControls } from './FontControls';
import { PositionControls } from './PositionControls';
import { TextInput } from './TextInput';

type TabId = 'content' | 'styling' | 'layout' | 'background';

type Tab = {
  id: TabId;
  label: string;
  icon: ReactNode;
  component: ReactNode;
};

export function ControlTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('content');

  const tabs: Tab[] = [
    {
      id: 'content',
      label: 'Content',
      icon: <Plus size={16} />,
      component: <TextInput />,
    },
    {
      id: 'styling',
      label: 'Styling',
      icon: <Type size={16} />,
      component: <FontControls />,
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: <Move size={16} />,
      component: <PositionControls />,
    },
    {
      id: 'background',
      label: 'Background',
      icon: <Palette size={16} />,
      component: <BackgroundControls />,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Controls
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center justify-start gap-2"
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-[var(--panel-shadow-soft)]">
          {tabs.find((tab) => tab.id === activeTab)?.component}
        </div>
      </div>
    </div>
  );
}
