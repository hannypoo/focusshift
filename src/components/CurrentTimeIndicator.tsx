import { useEffect, useState, useRef } from 'react';

interface CurrentTimeIndicatorProps {
  wakeMinutes: number;
  windDownMinutes: number;
  pixelsPerMinute: number;
}

export default function CurrentTimeIndicator({ wakeMinutes, windDownMinutes, pixelsPerMinute }: CurrentTimeIndicatorProps) {
  const [now, setNow] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    }, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  // Scroll into view on mount
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  if (now < wakeMinutes || now > windDownMinutes) return null;

  const top = (now - wakeMinutes) * pixelsPerMinute;

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
      <div className="flex-1 h-[2px] bg-red-500" />
    </div>
  );
}
