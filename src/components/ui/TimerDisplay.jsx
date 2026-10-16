import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

const pad = (n) => String(n).padStart(2, '0');

const splitTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    main: `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`,
    ms: pad(Math.floor((ms % 1000) / 10)),
  };
};

const TimerDisplay = () => {
  const startTime = useGameStore(state => state.startTime);
  const finalTime = useGameStore(state => state.finalTime);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime || finalTime) return;
    let frame;
    const tick = () => {
      setElapsed(Date.now() - startTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [startTime, finalTime]);

  if (!startTime) return null;

  const { main, ms } = splitTime(finalTime ?? elapsed);

  return (
    <div className="glass timer" role="timer" aria-label="경과 시간">
      <Timer size={20} />
      <span>
        {main}
        <span className="ms">.{ms}</span>
      </span>
    </div>
  );
};

export default TimerDisplay;
