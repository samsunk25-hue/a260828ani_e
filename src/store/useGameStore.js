import { create } from 'zustand';

// Stages: 'intro', 'digestive', 'respiratory', 'circulatory', 'excretory', 'post-game'
export const useGameStore = create((set, get) => ({
  currentStage: 'intro',
  nickname: '',
  startTime: null,
  finalTime: null,
  leaderboard: JSON.parse(localStorage.getItem('escapeLeaderboard') || '[]'),
  inventory: [], // Array of collected keyword objects: { id: string, name: string, icon: string }
  missionStatus: {
    digestiveCompleted: false,
    respiratoryCompleted: false,
    circulatoryCompleted: false,
    excretoryCompleted: false,
  },
  isDragging: false,
  
  setNickname: (name) => set({ nickname: name }),
  
  startGame: () => set({ 
    currentStage: 'digestive', 
    startTime: Date.now(), 
    finalTime: null 
  }),
  
  finishGame: () => set((state) => {
    if (!state.startTime || state.finalTime) return state;
    const endTime = Date.now();
    const duration = endTime - state.startTime;
    const newRecord = { nickname: state.nickname, time: duration, date: endTime };
    const updatedLeaderboard = [...state.leaderboard, newRecord].sort((a, b) => a.time - b.time);
    localStorage.setItem('escapeLeaderboard', JSON.stringify(updatedLeaderboard));
    
    return { finalTime: duration, leaderboard: updatedLeaderboard };
  }),

  setIsDragging: (dragging) => set({ isDragging: dragging }),
  
  setStage: (stage) => set({ currentStage: stage }),
  
  addToInventory: (item) => set((state) => {
    if (!state.inventory.find(i => i.id === item.id)) {
      return { inventory: [...state.inventory, item] };
    }
    return state;
  }),
  
  completeMission: (mission) => set((state) => ({
    missionStatus: { ...state.missionStatus, [mission]: true }
  })),

  resetGame: () => set({
    currentStage: 'intro',
    nickname: '',
    startTime: null,
    finalTime: null,
    inventory: [],
    missionStatus: {
      digestiveCompleted: false,
      respiratoryCompleted: false,
      circulatoryCompleted: false,
      excretoryCompleted: false,
    }
  })
}));
