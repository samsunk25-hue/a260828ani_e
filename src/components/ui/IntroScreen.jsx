import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, MousePointer2, Trophy, Medal } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatTime, formatDate } from '../../utils/time';

const systems = [
  { num: 1, label: '소화계', color: 'var(--orange)' },
  { num: 2, label: '호흡계', color: 'var(--cyan)' },
  { num: 3, label: '순환계', color: 'var(--red)' },
  { num: 4, label: '배설계', color: 'var(--amber)' },
];

const MAX_ROWS = 10;

const RankingCard = ({ leaderboard }) => {
  const rows = leaderboard.slice(0, MAX_ROWS);

  return (
    <section className="glass glass-strong ranking-card" aria-labelledby="ranking-title">
      <header className="ranking-head">
        <h2 id="ranking-title">
          <Trophy size={18} />
          명예의 전당
        </h2>
        <span className="ranking-sub">방탈출 기록 · 빠른 순</span>
      </header>

      {rows.length === 0 ? (
        <div className="ranking-empty">
          <Medal size={28} />
          <p>아직 기록이 없어요.<br />첫 번째 탈출자가 되어 보세요!</p>
        </div>
      ) : (
        <div className="leaderboard ranking-table">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>탐험대원</th>
                <th className="right">탈출 시간</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record, index) => (
                <tr key={`${record.date}-${index}`} className={index === 0 ? 'top' : ''}>
                  <td>
                    <span className="rank">
                      {index + 1}위
                      {index === 0 && <Trophy size={13} />}
                    </span>
                  </td>
                  <td>
                    <div className="ranking-name">{record.nickname || '이름 없음'}</div>
                    <div className="ranking-date">{formatDate(record.date)}</div>
                  </td>
                  <td className="right mono">{formatTime(record.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {leaderboard.length > MAX_ROWS && (
        <p className="ranking-more">외 {leaderboard.length - MAX_ROWS}명의 기록</p>
      )}
    </section>
  );
};

const IntroScreen = () => {
  const nickname = useGameStore(state => state.nickname);
  const setNickname = useGameStore(state => state.setNickname);
  const startGame = useGameStore(state => state.startGame);
  const leaderboard = useGameStore(state => state.leaderboard);
  const ready = nickname.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ready) startGame();
  };

  return (
    <motion.div
      className="intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="intro-layout">
        <motion.div
          className="glass glass-strong intro-card"
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -16, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="intro-eyebrow">
            <span className="dot" />
            거인 생명 유지 장치 · 비상 상황
          </div>

          <h1 className="intro-title text-gradient">세포 발전소를 가동하라!</h1>

          <p className="intro-desc">
            탐험대 여러분, 거인의 몸속으로 진입했습니다.
            <br />
            거인이 쓰러지기 전에 네 개의 방을 차례로 통과하며
            <br />
            세포호흡을 성공시켜 에너지를 생성하세요.
          </p>

          <div className="system-chips">
            {systems.map(s => (
              <span key={s.num} className="chip" style={{ '--chip': s.color }}>
                <span className="num">{s.num}</span>
                {s.label}
              </span>
            ))}
          </div>

          <form className="intro-form" onSubmit={handleSubmit}>
            <input
              className="input"
              type="text"
              placeholder="탐험대원 별명을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!ready}>
              <Rocket size={18} />
              탐험 시작 · 소화계 진입
            </button>
          </form>

          <p className="intro-hint">
            <MousePointer2 size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            시작하면 타이머가 켜져요 · 배경을 드래그하면 거인의 몸속을 둘러볼 수 있어요
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <RankingCard leaderboard={leaderboard} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default IntroScreen;
