import { type ReactNode } from 'react';
import BottomNav from './BottomNav';
import ChatBubble from './ChatBubble';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex flex-col bg-slate-950">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Chat bubble (upper-right floating) */}
      <ChatBubble />

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}
