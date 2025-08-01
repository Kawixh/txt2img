'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Move, Palette, Plus, Type } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { BackgroundControls } from './BackgroundControls';
import { FontControls } from './FontControls';
import { PositionControls } from './PositionControls';
import { TextInput } from './TextInput';

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
      <div className="glass-panel border-border/20 grid grid-cols-4 gap-2 border-0 border-b p-3">
        {tabs.map((tab, index) => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant={activeTab === tab.id ? 'gradient' : 'glass'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="group relative flex h-16 flex-col gap-2 text-xs"
            >
              <motion.div
                animate={{
                  scale: activeTab === tab.id ? 1.1 : 1,
                  rotate: activeTab === tab.id ? [0, -5, 5, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {tab.icon}
              </motion.div>
              <span className="word-wrap hidden font-medium sm:block">
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="container-safe max-h-[calc(100vh-12rem)] flex-1 overflow-y-auto p-4">
        <Card className="glass-panel rounded-2xl border-0 shadow-none">
          <CardContent className="p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {tabs.find((tab) => tab.id === activeTab)?.component}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
