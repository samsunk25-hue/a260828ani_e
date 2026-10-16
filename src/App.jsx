import React from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import MainScene from './components/scene/MainScene';
import IntroScreen from './components/ui/IntroScreen';
import Inventory from './components/ui/Inventory';
import MissionOverlay from './components/ui/MissionOverlay';
import PostGameAssessment from './components/ui/PostGameAssessment';
import TimerDisplay from './components/ui/TimerDisplay';
import StageProgress from './components/ui/StageProgress';

function App() {
  const currentStage = useGameStore(state => state.currentStage);
  const inGame = currentStage !== 'intro' && currentStage !== 'post-game';

  return (
    <div className="app" data-stage={currentStage}>
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
                <StageProgress />
              </div>
              <div className="hud-inventory">
                <Inventory />
              </div>
            </motion.div>
          )}

          {currentStage === 'post-game' && <PostGameAssessment key="post-game" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
