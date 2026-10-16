import React from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import MainScene from './components/scene/MainScene';
import IntroScreen from './components/ui/IntroScreen';
import Inventory from './components/ui/Inventory';
import MissionOverlay from './components/ui/MissionOverlay';
import PostGameAssessment from './components/ui/PostGameAssessment';
import TimerDisplay from './components/ui/TimerDisplay';
import StageProgress from './components/ui/StageProgress';
import VitalityBar from './components/ui/VitalityBar';
import GameOverScreen from './components/ui/GameOverScreen';

function App() {
  const currentStage = useGameStore(state => state.currentStage);
  const mode = useGameStore(state => state.mode);
  const isGameOver = useGameStore(state => state.isGameOver);
  const resetView = useGameStore(state => state.resetView);
  const inGame = currentStage !== 'intro' && currentStage !== 'post-game';
  const isHard = mode === 'hard';

  return (
    <div className="app" data-stage={currentStage} data-mode={mode}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <MainScene />
      </Canvas>
      <div className="vignette" />

      <div className="overlay-container">
        <AnimatePresence mode="wait">
          {currentStage === 'intro' && <IntroScreen key="intro" />}

          {inGame && (
            <motion.div
              key="hud"
              className="hud"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="hud-mission">
                <MissionOverlay />
              </div>
              <div className="hud-status">
                <TimerDisplay />
                {isHard && <VitalityBar />}
                <StageProgress />
                <button type="button" className="btn btn-ghost view-reset" onClick={resetView} title="카메라를 처음 위치로">
                  <RotateCcw size={14} />
                  시점 초기화
                </button>
              </div>
              <div className="hud-inventory">
                <Inventory />
              </div>
            </motion.div>
          )}

          {currentStage === 'post-game' && <PostGameAssessment key="post-game" />}
        </AnimatePresence>

        <AnimatePresence>
          {isHard && isGameOver && <GameOverScreen key="gameover" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
