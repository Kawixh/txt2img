'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Type, Move, Palette } from 'lucide-react';
import { TextInput } from './TextInput';
import { FontControls } from './FontControls';
import { PositionControls } from './PositionControls';
import { BackgroundControls } from './BackgroundControls';

type TabId = 'content' | 'styling' | 'layout' | 'background';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

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
      {/* Tab Navigation */}
      <div className="grid grid-cols-4 gap-1 border-b bg-white p-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="flex h-16 flex-col gap-1 text-xs"
          >
            {tab.icon}
            <span className="hidden sm:block">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-h-[calc(100vh-12rem)] flex-1 overflow-y-auto p-4">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            {tabs.find((tab) => tab.id === activeTab)?.component}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
