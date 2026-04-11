"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  /** End timestamp in seconds (unix). */
  endTime: number;
  /** Called when countdown reaches zero. */
  onEnd?: () => void;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function Countdown({ endTime, onEnd }: CountdownProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endTime - Math.floor(Date.now() / 1000)));

  useEffect(() => {
    if (remaining <= 0) {
      onEnd?.();
      return;
    }

    const timer = setInterval(() => {
      const left = Math.max(0, endTime - Math.floor(Date.now() / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timer);
        onEnd?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, remaining, onEnd]);

  if (remaining <= 0) {
    return <span className="text-red-400 font-medium">Ended</span>;
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <div className="flex gap-2">
      {days > 0 && (
        <div className="rounded-lg bg-gray-800 px-2 py-1 text-center">
          <p className="text-lg font-bold text-white">{days}</p>
          <p className="text-[10px] text-gray-500">DAYS</p>
        </div>
      )}
      <div className="rounded-lg bg-gray-800 px-2 py-1 text-center">
        <p className="text-lg font-bold text-white">{pad(hours)}</p>
        <p className="text-[10px] text-gray-500">HRS</p>
      </div>
      <div className="rounded-lg bg-gray-800 px-2 py-1 text-center">
        <p className="text-lg font-bold text-white">{pad(minutes)}</p>
        <p className="text-[10px] text-gray-500">MIN</p>
      </div>
      <div className="rounded-lg bg-gray-800 px-2 py-1 text-center">
        <p className="text-lg font-bold text-white">{pad(seconds)}</p>
        <p className="text-[10px] text-gray-500">SEC</p>
      </div>
    </div>
  );
}
