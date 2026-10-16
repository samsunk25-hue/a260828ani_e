import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import IntroStage from '../stages/IntroStage';
import DigestiveStage from '../stages/DigestiveStage';
import RespiratoryStage from '../stages/RespiratoryStage';
import CirculatoryStage from '../stages/CirculatoryStage';
import ExcretoryStage from '../stages/ExcretoryStage';

const MainScene = () => {
  const currentStage = useGameStore(state => state.currentStage);
  const isDragging = useGameStore(state => state.isDragging);

  return (
    <>
      <color attach="background" args={['#1a050a']} />
      <fog attach="fog" args={['#1a050a', 5, 40]} />
      <ambientLight intensity={0.4} color="#ffb3c6" />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffcccc" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#ff3366" />
      
      {/* Organic floating particles instead of stars */}
      {Array.from({ length: 150 }).map((_, i) => (
        <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2}>
          <mesh position={[(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40]}>
            <sphereGeometry args={[0.05 + Math.random() * 0.1, 8, 8]} />
            <meshBasicMaterial color="#ff6688" transparent opacity={0.4} />
          </mesh>
        </Float>
      ))}
      
      {currentStage === 'intro' && <IntroStage />}
      {currentStage === 'digestive' && <DigestiveStage />}
      {currentStage === 'respiratory' && <RespiratoryStage />}
      {currentStage === 'circulatory' && <CirculatoryStage />}
      {currentStage === 'excretory' && <ExcretoryStage />}

      <OrbitControls makeDefault enableDamping dampingFactor={0.05} enabled={!isDragging} />
    </>
  );
};

export default MainScene;
