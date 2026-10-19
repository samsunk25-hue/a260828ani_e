import { create } from 'zustand';
import { resetQuizHistory } from '../data/quiz';

// Stages: 'intro', 'digestive', 'respiratory', 'circulatory', 'excretory', 'post-game'
// Modes:  'easy' (안내·힌트·표시 제공, 시간 기록) | 'hard' (생명력·패널티·퀴즈 관문·점수)

export const HARD_RULES = {
  hp: 100,
  drainPerSec: 0.15,   // 가만히 있어도 생명력이 서서히 감소 (약 11분이면 0)
  missPenalty: 8,      // 잘못된 드롭
  hintCost: 10,        // 힌트 열람
  quizPenalty: 10,     // 퀴즈 오답
  quizHeal: 15,        // 퀴즈 통과 시 회복
  hitScore: 100,       // 정답 1회 기본 점수 (콤보 배수 적용)
  quizScore: 200,      // 퀴즈 통과 점수
  hpBonusPerPoint: 10, // 종료 시 남은 생명력 1당 점수
  timeBonusWindowSec: 600, // 이 시간 안에 끝내면 남은 초당 2점
};

const LS_BOARD = 'escapeLeaderboard';
const LS_CLEARED = 'escapeClearedEasy';

const loadJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '') ?? fallback;
  } catch {
    return fallback;
  }
};
const saveJson = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장 불가 환경 */ }
};

const freshRun = () => ({
  inventory: [], // Array of collected keyword objects: { id, name, icon }
  hp: HARD_RULES.hp,
  score: 0,
  combo: 0,
  maxCombo: 0,
  misses: 0,
  isGameOver: false,
  finalTime: null,
  finalScore: null,
  pendingResult: null, // 탈출 직후, 랭킹 등록 여부를 고르기 전까지의 결과
  isDragging: false,
});

const clampHp = (v) => Math.max(0, Math.min(HARD_RULES.hp, v));

const applyHp = (state, delta, extra = {}) => {
  const hp = clampHp(state.hp + delta);
  return { ...extra, hp, isGameOver: hp <= 0 };
};

export const useGameStore = create((set) => ({
  currentStage: 'intro',
  nickname: '',
  mode: 'easy',
  startTime: null,
  leaderboard: loadJson(LS_BOARD, []),     // 이 기기에 저장된 기록
  clearedEasy: loadJson(LS_CLEARED, []),   // 이 기기에서 쉬움 모드를 통과한 별명들 (어려움 해금)
  viewResetTick: 0, // 증가할 때마다 카메라 시점을 초기화한다
  ...freshRun(),

  setNickname: (name) => set({ nickname: name }),
  setMode: (mode) => set({ mode }),
  resetView: () => set((state) => ({ viewResetTick: state.viewResetTick + 1 })),

  startGame: () => {
    resetQuizHistory();
    set({ ...freshRun(), currentStage: 'digestive', startTime: Date.now() });
  },

  // 게임 오버 후 같은 별명·난이도로 처음부터 다시
  retryRun: () => {
    resetQuizHistory();
    set({ ...freshRun(), currentStage: 'digestive', startTime: Date.now() });
  },

  /** 탈출 시각을 확정하고 결과를 계산한다. 기록 저장은 publishResult에서 선택적으로. */
  finishGame: () => set((state) => {
    if (!state.startTime || state.finalTime) return state;
    const endTime = Date.now();
    const duration = endTime - state.startTime;

    let finalScore = 0;
    if (state.mode === 'hard') {
      const seconds = Math.floor(duration / 1000);
      const timeBonus = Math.max(0, HARD_RULES.timeBonusWindowSec - seconds) * 2;
      finalScore = Math.round(state.score + Math.round(state.hp) * HARD_RULES.hpBonusPerPoint + timeBonus);
    }

    const pendingResult = {
      nickname: state.nickname.trim() || '이름 없음',
      time: duration,
      date: endTime,
      mode: state.mode,
      score: finalScore,
      maxCombo: state.maxCombo,
    };

    // 쉬움 모드 완주는 랭킹 등록과 상관없이 어려움 모드 해금 조건으로 기록한다
    let clearedEasy = state.clearedEasy;
    if (state.mode === 'easy') {
      const key = pendingResult.nickname.toLowerCase();
      if (!clearedEasy.map(n => n.toLowerCase()).includes(key)) {
        clearedEasy = [...clearedEasy, pendingResult.nickname];
        saveJson(LS_CLEARED, clearedEasy);
      }
    }

    return { finalTime: duration, finalScore: state.mode === 'hard' ? finalScore : null, pendingResult, clearedEasy };
  }),

  /** 결과를 이 기기의 기록에 남긴다 (전체 랭킹 전송은 호출한 쪽에서 API로). */
  saveResultLocally: () => set((state) => {
    if (!state.pendingResult) return state;
    const updated = [...state.leaderboard, state.pendingResult].sort((a, b) => a.time - b.time);
    saveJson(LS_BOARD, updated);
    return { leaderboard: updated };
  }),

  clearPendingResult: () => set({ pendingResult: null }),

  setIsDragging: (dragging) => set({ isDragging: dragging }),

  setStage: (stage) => set({ currentStage: stage }),

  addToInventory: (item) => set((state) => {
    if (!state.inventory.find(i => i.id === item.id)) {
      return { inventory: [...state.inventory, item] };
    }
    return state;
  }),

  /* ---------- 어려움 모드 전용 (쉬움 모드에서는 아무 일도 하지 않는다) ---------- */
  registerHit: () => set((state) => {
    if (state.mode !== 'hard' || state.isGameOver) return state;
    const combo = state.combo + 1;
    return {
      combo,
      maxCombo: Math.max(state.maxCombo, combo),
      score: state.score + HARD_RULES.hitScore * combo,
    };
  }),

  registerMiss: () => set((state) => {
    if (state.mode !== 'hard' || state.isGameOver) return state;
    return applyHp(state, -HARD_RULES.missPenalty, { combo: 0, misses: state.misses + 1 });
  }),

  changeHp: (delta) => set((state) => {
    if (state.mode !== 'hard' || state.isGameOver) return state;
    return applyHp(state, delta);
  }),

  addScore: (points) => set((state) => {
    if (state.mode !== 'hard' || state.isGameOver) return state;
    return { score: state.score + points };
  }),

  resetGame: () => set({
    ...freshRun(),
    currentStage: 'intro',
    nickname: '',
    startTime: null,
  }),
}));
