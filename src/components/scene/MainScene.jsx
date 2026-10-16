import React, { useEffect, useMemo, useRef } from 'react';
import { OrbitControls, Float } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import IntroStage from '../stages/IntroStage';
import DigestiveStage from '../stages/DigestiveStage';
import RespiratoryStage from '../stages/RespiratoryStage';
import CirculatoryStage from '../stages/CirculatoryStage';
import ExcretoryStage from '../stages/ExcretoryStage';

// 퍼즐 방은 2D 도식에 가깝다. 회전 범위를 좁게 제한해 물질과 구조물의 상대 위치가 크게 틀어지지 않게 한다.
const PUZZLE_ROT = 0.45; // 좌우 ±약 26°
const PUZZLE_TILT = 0.35; // 상하 ±약 20°

const MainScene = () => {
  const currentStage = useGameStore(state => state.currentStage);
  const isDragging = useGameStore(state => state.isDragging);
  const viewResetTick = useGameStore(state => state.viewResetTick);
  const controls = useRef();

  const isPuzzle = currentStage !== 'intro' && currentStage !== 'post-game';

  // 방이 바뀌거나 "시점 초기화"를 누르면 카메라를 처음 위치로 되돌린다
  useEffect(() => {
    controls.current?.reset();
  }, [currentStage, viewResetTick]);

  // 배경 입자 위치는 한 번만 만든다 (리렌더마다 흩어지지 않도록)
  const particles = useMemo(
    () => Array.from({ length: 150 }, () => ({
      pos: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40],
      r: 0.05 + Math.random() * 0.1,
    })),
    []
  );

  return (
    <>
      <color attach="background" args={['#1a050a']} />
      <fog attach="fog" args={['#1a050a', 5, 40]} />
      <ambientLight intensity={0.4} color="#ffb3c6" />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffcccc" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#ff3366" />

      {/* Organic floating particles instead of stars */}
      {particles.map((p, i) => (
        <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2}>
          <mesh position={p.pos}>
            <sphereGeometry args={[p.r, 8, 8]} />
            <meshBasicMaterial color="#ff6688" transparent opacity={0.4} />
          </mesh>
        </Float>
      ))}

      {currentStage === 'intro' && <IntroStage />}
      {currentStage === 'digestive' && <DigestiveStage />}
      {currentStage === 'respiratory' && <RespiratoryStage />}
      {currentStage === 'circulatory' && <CirculatoryStage />}
      {currentStage === 'excretory' && <ExcretoryStage />}

      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        enabled={!isDragging}
        enablePan={false}
        minDistance={4}
        maxDistance={18}
        minAzimuthAngle={isPuzzle ? -PUZZLE_ROT : -Infinity}
        maxAzimuthAngle={isPuzzle ? PUZZLE_ROT : Infinity}
        minPolarAngle={isPuzzle ? Math.PI / 2 - PUZZLE_TILT : 0}
        maxPolarAngle={isPuzzle ? Math.PI / 2 + PUZZLE_TILT : Math.PI}
      />
    </>
  );
};

export default MainScene;
