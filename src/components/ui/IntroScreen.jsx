import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, MousePointer2, Trophy, Medal, Leaf, Flame, Check, Lock, LockOpen, Globe, RefreshCw, WifiOff } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatTime, formatDate } from '../../utils/time';
import { rankRecords, MODE_LABEL, hasClearedEasy } from '../../utils/ranking';
import { fetchTopScores, TOP_N } from '../../services/leaderboardApi';

const systems = [
  { num: 1, label: '소화계', color: 'var(--orange)' },
  { num: 2, label: '호흡계', color: 'var(--cyan)' },
  { num: 3, label: '순환계', color: 'var(--red)' },
  { num: 4, label: '배설계', color: 'var(--amber)' },
];

const MODES = [
  {
    id: 'easy',
    label: '쉬움',
    icon: Leaf,
    tagline: '차근차근 배우기',
    points: ['목표 위치가 깜빡이며 안내', '힌트 무료', '탈출 시간 기록'],
  },
  {
    id: 'hard',
    label: '어려움',
    icon: Flame,
    tagline: '거인을 살려라!',
    points: ['거인 생명력이 계속 줄어듦 · 실수하면 더 감소', '안내 표시 없음 · 힌트는 생명력 소모', '효소 이름 직접 입력 · 관문 퀴즈 · 점수와 콤보'],
  },
];

/** 전체 사용자 상위 5명 (난이도별). 네트워크 실패 시 이 기기의 기록으로 대체. */
export const GlobalRankingCard = ({ initialMode, highlightDate }) => {
  const localBoard = useGameStore(state => state.leaderboard);
  const [tab, setTab] = useState(initialMode);
  const [state, setState] = useState({ loading: true, error: false, rows: [] });
  const [reloadTick, setReloadTick] = useState(0);
  const isHard = tab === 'hard';

  useEffect(() => {
    let alive = true;
    setState(s => ({ ...s, loading: true, error: false }));
    fetchTopScores(tab, TOP_N)
      .then(rows => { if (alive) setState({ loading: false, error: false, rows }); })
      .catch(() => { if (alive) setState({ loading: false, error: true, rows: rankRecords(localBoard, tab).slice(0, TOP_N) }); });
    return () => { alive = false; };
    // localBoard는 실패 시 대체용이라 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reloadTick]);

  return (
    <section className="glass glass-strong ranking-card" aria-labelledby="ranking-title">
      <header className="ranking-head">
        <h2 id="ranking-title">
          <Trophy size={18} />
          명예의 전당
          <span className="ranking-scope"><Globe size={12} /> 전체 TOP {TOP_N}</span>
        </h2>
        <div className="ranking-tabs" role="tablist">
          {Object.keys(MODE_LABEL).map(m => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={tab === m}
              className={`ranking-tab ${tab === m ? 'active' : ''}`}
              onClick={() => setTab(m)}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
        <span className="ranking-sub">{isHard ? '점수 높은 순 (동점이면 빠른 순)' : '탈출 시간 빠른 순'}</span>
      </header>

      {state.error && (
        <div className="ranking-offline">
          <WifiOff size={13} />
          전체 랭킹을 불러오지 못했습니다. 이 기기의 기록을 대신 보여줍니다.
          <button type="button" className="btn btn-ghost" onClick={() => setReloadTick(t => t + 1)}>
            <RefreshCw size={13} /> 다시 시도
          </button>
        </div>
      )}

      {state.loading ? (
        <div className="ranking-empty">
          <RefreshCw size={24} className="spin" />
          <p>전체 랭킹을 불러오는 중…</p>
        </div>
      ) : state.rows.length === 0 ? (
        <div className="ranking-empty">
          <Medal size={28} />
          <p>아직 {MODE_LABEL[tab]} 기록이 없어요.<br />첫 번째 탈출자가 되어 보세요!</p>
        </div>
      ) : (
        <div className="leaderboard ranking-table">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>탐험대원</th>
                {isHard && <th className="right">점수</th>}
                <th className="right">시간</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((record, index) => (
                <tr
                  key={record.id || `${record.date}-${index}`}
                  className={`${index === 0 ? 'top' : ''} ${highlightDate && record.date === highlightDate ? 'me' : ''}`}
                >
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
                  {isHard && <td className="right mono">{(record.score ?? 0).toLocaleString()}</td>}
                  <td className="right mono">{formatTime(record.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const IntroScreen = () => {
  const nickname = useGameStore(state => state.nickname);
  const setNickname = useGameStore(state => state.setNickname);
  const mode = useGameStore(state => state.mode);
  const setMode = useGameStore(state => state.setMode);
  const startGame = useGameStore(state => state.startGame);
  const leaderboard = useGameStore(state => state.leaderboard);
  const clearedEasy = useGameStore(state => state.clearedEasy);
  const ready = nickname.trim().length > 0;

  // 어려움 모드는 같은 별명으로 쉬움 모드를 통과한 뒤에만 도전할 수 있다
  const hardUnlocked = hasClearedEasy(leaderboard, nickname, clearedEasy);
  const effectiveMode = mode === 'hard' && !hardUnlocked ? 'easy' : mode;
  const isHard = effectiveMode === 'hard';

  const pickMode = (id) => {
    if (id === 'hard' && !hardUnlocked) return;
    setMode(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ready) return;
    if (mode !== effectiveMode) setMode(effectiveMode); // 잠긴 어려움 모드는 쉬움으로 시작
    startGame();
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

          <div className="mode-select" role="radiogroup" aria-label="난이도 선택">
            {MODES.map(m => {
              const Icon = m.icon;
              const active = effectiveMode === m.id;
              const locked = m.id === 'hard' && !hardUnlocked;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-disabled={locked}
                  className={`mode-card ${m.id} ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}
                  onClick={() => pickMode(m.id)}
                  title={locked ? '쉬움 모드를 먼저 통과하면 열립니다' : undefined}
                >
                  <span className="mode-head">
                    <Icon size={16} />
                    <strong>{m.label}</strong>
                    <em>{m.tagline}</em>
                    {locked ? (
                      <Lock size={14} className="mode-check" />
                    ) : active ? (
                      <Check size={14} strokeWidth={3} className="mode-check" />
                    ) : null}
                  </span>
                  <ul>
                    {m.points.map(p => <li key={p}>{p}</li>)}
                  </ul>
                  {m.id === 'hard' && (
                    <span className={`mode-lock-note ${locked ? '' : 'open'}`}>
                      {locked ? (
                        <><Lock size={11} /> 같은 별명으로 쉬움 모드를 통과하면 열려요</>
                      ) : (
                        <><LockOpen size={11} /> 쉬움 통과 확인됨 · 도전 가능</>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
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
            <button type="submit" className={`btn btn-primary btn-lg btn-block ${isHard ? 'btn-hard' : ''}`} disabled={!ready}>
              {isHard ? <Flame size={18} /> : <Rocket size={18} />}
              {isHard ? '어려움 모드로 탐험 시작' : '쉬움 모드로 탐험 시작'}
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
          <GlobalRankingCard initialMode={effectiveMode} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default IntroScreen;
