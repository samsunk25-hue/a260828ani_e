import React, { useEffect } from 'react';
import { HeartPulse, Flame, Star } from 'lucide-react';
import { useGameStore, HARD_RULES } from '../../store/useGameStore';

/** 어려움 모드 HUD: 거인 생명력(서서히 감소), 점수, 콤보 */
const VitalityBar = () => {
  const hp = useGameStore(state => state.hp);
  const score = useGameStore(state => state.score);
  const combo = useGameStore(state => state.combo);
  const isGameOver = useGameStore(state => state.isGameOver);
  const changeHp = useGameStore(state => state.changeHp);

  // 1초마다 생명력이 조금씩 줄어든다
  useEffect(() => {
    if (isGameOver) return;
    const id = setInterval(() => changeHp(-HARD_RULES.drainPerSec), 1000);
    return () => clearInterval(id);
  }, [isGameOver, changeHp]);

  const pct = Math.max(0, Math.min(100, (hp / HARD_RULES.hp) * 100));
  const level = pct > 50 ? 'ok' : pct > 25 ? 'warn' : 'danger';

  return (
    <div className={`glass vitality ${level}`} aria-label="거인 생명력과 점수">
      <div className="vitality-row">
        <span className="vitality-label">
          <HeartPulse size={14} />
          거인 생명력
        </span>
        <span className="vitality-value">{Math.ceil(hp)}</span>
      </div>
      <div className="vitality-track" role="progressbar" aria-valuenow={Math.ceil(hp)} aria-valuemin={0} aria-valuemax={HARD_RULES.hp}>
        <div className="vitality-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="vitality-stats">
        <span className="stat">
          <Star size={13} />
          {score.toLocaleString()}점
        </span>
        <span className={`stat combo ${combo >= 2 ? 'hot' : ''}`}>
          <Flame size={13} />
          콤보 ×{combo}
        </span>
      </div>
    </div>
  );
};

export default VitalityBar;
