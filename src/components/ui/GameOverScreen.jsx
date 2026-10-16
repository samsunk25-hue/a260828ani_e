import React from 'react';
import { motion } from 'framer-motion';
import { Skull, RotateCcw, Home } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatTime } from '../../utils/time';

const STAGE_NAME = {
  digestive: '소화의 방',
  respiratory: '호흡의 방',
  circulatory: '순환의 방',
  excretory: '배설의 방',
  'post-game': '최종 과제',
};

const GameOverScreen = () => {
  const currentStage = useGameStore(state => state.currentStage);
  const score = useGameStore(state => state.score);
  const maxCombo = useGameStore(state => state.maxCombo);
  const misses = useGameStore(state => state.misses);
  const startTime = useGameStore(state => state.startTime);
  const retryRun = useGameStore(state => state.retryRun);
  const resetGame = useGameStore(state => state.resetGame);

  const elapsed = startTime ? Date.now() - startTime : 0;

  return (
    <motion.div className="modal-backdrop dark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="glass glass-strong gameover"
        role="dialog"
        aria-modal="true"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="gameover-icon">
          <Skull size={40} />
        </div>
        <h1 className="gameover-title">거인이 쓰러졌습니다</h1>
        <p className="gameover-desc">
          생명력이 모두 소진되었습니다. 세포호흡이 멈추면 에너지가 만들어지지 않아 생명 활동이 중단됩니다.
          <br />
          다시 도전해 거인을 살려 보세요!
        </p>

        <dl className="gameover-stats">
          <div><dt>도달한 방</dt><dd>{STAGE_NAME[currentStage] || '-'}</dd></div>
          <div><dt>점수</dt><dd>{score.toLocaleString()}점</dd></div>
          <div><dt>최고 콤보</dt><dd>×{maxCombo}</dd></div>
          <div><dt>실수</dt><dd>{misses}회</dd></div>
          <div><dt>경과 시간</dt><dd className="mono">{formatTime(elapsed)}</dd></div>
        </dl>

        <div className="gameover-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={retryRun}>
            <RotateCcw size={18} />
            처음부터 다시 도전
          </button>
          <button type="button" className="btn" onClick={resetGame}>
            <Home size={18} />
            메인 화면으로
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameOverScreen;
