import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshWobbleMaterial, DragControls } from '@react-three/drei';
import Label from '../scene/Label';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

// 원자 색 (교과서 분자 모형 관례: 산소 빨강, 탄소 검정, 질소 파랑)
const ATOM = {
  O: { color: '#ff4d4d', emissive: '#ff1a1a', radius: 0.28 },
  C: { color: '#3a3a3a', emissive: '#111111', radius: 0.32 },
  N: { color: '#4d7cff', emissive: '#1a3dff', radius: 0.28 },
};

const GAS_INFO = {
  o2: { ko: '산소', formula: 'O2' },
  co2: { ko: '이산화탄소', formula: 'CO2' },
  n2: { ko: '질소', formula: 'N2' },
};

const Atom = ({ type, position }) => {
  const a = ATOM[type];
  return (
    <Sphere args={[a.radius, 24, 24]} position={position}>
      <meshStandardMaterial color={a.color} emissive={a.emissive} emissiveIntensity={0.45} roughness={0.3} metalness={0.1} />
    </Sphere>
  );
};

// 결합: 두 원자 사이를 잇는 가는 막대 (count=2 이중, 3 삼중)
const BOND_OFFSETS = { 1: [0], 2: [-0.07, 0.07], 3: [-0.11, 0, 0.11] };
const DoubleBond = ({ from, to, count = 2 }) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const len = a.distanceTo(b);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    b.clone().sub(a).normalize()
  );
  return (
    <group position={mid} quaternion={quat}>
      {(BOND_OFFSETS[count] || BOND_OFFSETS[2]).map((z, i) => (
        <mesh key={i} position={[0, 0, z]}>
          <cylinderGeometry args={[0.045, 0.045, len, 10]} />
          <meshStandardMaterial color="#f2f2f2" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
};

// N≡N (어려움 모드의 함정 기체: 교환되지 않는다)
const N2Molecule = () => (
  <group>
    <DoubleBond from={[-0.26, 0, 0]} to={[0.26, 0, 0]} count={3} />
    <Atom type="N" position={[-0.26, 0, 0]} />
    <Atom type="N" position={[0.26, 0, 0]} />
  </group>
);

// O=O
const O2Molecule = () => (
  <group>
    <DoubleBond from={[-0.26, 0, 0]} to={[0.26, 0, 0]} />
    <Atom type="O" position={[-0.26, 0, 0]} />
    <Atom type="O" position={[0.26, 0, 0]} />
  </group>
);

// O=C=O (직선형)
const CO2Molecule = () => (
  <group>
    <DoubleBond from={[-0.72, 0, 0]} to={[0, 0, 0]} />
    <DoubleBond from={[0, 0, 0]} to={[0.72, 0, 0]} />
    <Atom type="O" position={[-0.72, 0, 0]} />
    <Atom type="C" position={[0, 0, 0]} />
    <Atom type="O" position={[0.72, 0, 0]} />
  </group>
);

// 천천히 회전하는 분자 (라벨 포함). 어려움 모드에서는 화학식만 표시한다.
const Molecule = ({ kind, position, showLabel = true }) => {
  const mode = useGameStore(state => state.mode);
  const spin = useRef();
  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.6;
  });
  const info = GAS_INFO[kind];
  const label = mode === 'hard' ? info.formula : `${info.ko} ${info.formula}`;
  return (
    <group position={position}>
      <group ref={spin} rotation={[0.25, 0, 0]}>
        {kind === 'o2' ? <O2Molecule /> : kind === 'n2' ? <N2Molecule /> : <CO2Molecule />}
      </group>
      {showLabel && (
        <Label
          position={[0, -0.62, 0.4]}
          fontSize={0.24}
          color="white"
          outlineWidth={0.035}
          outlineColor="#000000"
        >
          {label}
        </Label>
      )}
    </group>
  );
};

const AlveolusCluster = () => {
  const group = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05); // Breathing effect
  });

  // grape-like cluster
  const spheres = [
    [0, 0, 0], [1.2, 0.5, 0], [-1.2, -0.5, 0],
    [0, 1.2, 0.5], [0, -1.2, -0.5], [0.8, -0.8, 0.8], [-0.8, 0.8, -0.8],
  ];

  return (
    <group ref={group}>
      {spheres.map((pos, i) => (
        <Sphere key={i} args={[1.2, 32, 32]} position={pos}>
          {/* 반투명 + depthWrite off: 안쪽/뒤쪽의 분자가 가려지지 않는다 */}
          <MeshWobbleMaterial color="#ffd6d6" factor={0.1} speed={2} transparent opacity={0.55} roughness={0.4} depthWrite={false} />
        </Sphere>
      ))}
    </group>
  );
};

const DraggableGas = ({ id, kind, initialPosition, onDrop }) => {
  const setIsDragging = useGameStore(state => state.setIsDragging);
  const mesh = useRef();
  const [round, setRound] = useState(0);

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (mesh.current) {
      const worldPos = new THREE.Vector3();
      mesh.current.getWorldPosition(worldPos);
      const isSuccess = onDrop(id, worldPos);
      // 실패하면 DragControls를 리마운트해 원래 자리로 되돌린다 (성공 시엔 부모가 언마운트)
      if (!isSuccess) setRound(r => r + 1);
    }
  };

  return (
    <DragControls key={round} dragLimits={[undefined, undefined, [0, 0]]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <group position={initialPosition} ref={mesh}>
        <Molecule kind={kind} position={[0, 0, 0]} />
      </group>
    </DragControls>
  );
};

const RespiratoryStage = () => {
  const addToInventory = useGameStore(state => state.addToInventory);
  const mode = useGameStore(state => state.mode);
  const registerHit = useGameStore(state => state.registerHit);
  const registerMiss = useGameStore(state => state.registerMiss);
  const isHard = mode === 'hard';
  const [placed, setPlaced] = useState({ o2_1: false, o2_2: false, co2_1: false, co2_2: false });

  const handleDrop = (id, position) => {
    // 토큰을 카메라 쪽(z 앞)으로 빼 두었으므로 판정은 화면 평면(x, y) 거리만 본다
    const distFromCenter = Math.hypot(position.x, position.y);
    let ok = false;

    if (id.startsWith('o2')) {
      ok = distFromCenter > 3.0;
    } else if (id.startsWith('co2')) {
      ok = distFromCenter < 2.5;
    }
    // 질소(n2)는 교환되지 않는 기체: 어디로 옮겨도 실수

    if (ok) {
      setPlaced(prev => {
        const next = { ...prev, [id]: true };
        if (next.o2_1 && next.o2_2 && next.co2_1 && next.co2_2) completeStage();
        return next;
      });
      registerHit();
      return true;
    }
    registerMiss();
    return false;
  };

  const completeStage = () => {
    setTimeout(() => {
      addToInventory({ id: 'oxygen', name: '산소', icon: 'mol:o2' });
      addToInventory({ id: 'co2', name: '이산화탄소', icon: 'mol:co2' });
    }, 500);
  };

  return (
    <group>
      <AlveolusCluster />

      {/* Capillary wrapping around */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 4, -Math.PI / 6, 0]}>
        <torusGeometry args={[4.5, 0.8, 16, 100, Math.PI * 1.5]} />
        <meshStandardMaterial color="#880022" transparent opacity={0.55} roughness={0.3} depthWrite={false} />
      </mesh>

      {/* Guide Texts */}
      <Label position={[0, 3.1, 2.5]} fontSize={0.4} color="#ffb3c6" outlineWidth={0.03} outlineColor="#000000">
        폐포 (Alveolus)
      </Label>
      <Label position={[4.5, 3.1, 2.5]} fontSize={0.4} color="#ff5c86" outlineWidth={0.03} outlineColor="#000000">
        모세혈관 (Capillary)
      </Label>

      {/* Static Gases (Representing non-diffused remaining gases for density) */}
      <Molecule kind="o2" position={[0.9, -0.7, 2.6]} showLabel={false} />
      <Molecule kind="o2" position={[-0.4, 1.1, 2.4]} showLabel={false} />
      <Molecule kind="co2" position={[4.4, -1.0, 1.2]} showLabel={false} />
      <Molecule kind="co2" position={[5.1, 1.0, 1.0]} showLabel={false} />

      {/* Draggable Gases: 폐포/모세혈관 앞쪽(z+)에 두어 항상 보이게 한다 */}
      {!placed.o2_1 && <DraggableGas id="o2_1" kind="o2" initialPosition={[0.2, 0.5, 3.2]} onDrop={handleDrop} />}
      {!placed.o2_2 && <DraggableGas id="o2_2" kind="o2" initialPosition={[-1.0, -0.5, 3.0]} onDrop={handleDrop} />}

      {!placed.co2_1 && <DraggableGas id="co2_1" kind="co2" initialPosition={[4.6, 0.2, 1.6]} onDrop={handleDrop} />}
      {!placed.co2_2 && <DraggableGas id="co2_2" kind="co2" initialPosition={[3.8, 1.7, 1.6]} onDrop={handleDrop} />}

      {/* 어려움 모드 함정: 질소는 폐포와 혈액 사이에서 교환되지 않는다 */}
      {isHard && <DraggableGas id="n2_1" kind="n2" initialPosition={[-1.4, 1.2, 3.1]} onDrop={handleDrop} />}
      {isHard && <DraggableGas id="n2_2" kind="n2" initialPosition={[5.4, -1.4, 1.6]} onDrop={handleDrop} />}

      {/* Success Visual Feedback: 도착한 쪽에 분자가 남는다 */}
      {placed.o2_1 && <Molecule kind="o2" position={[4.5, 1.0, 1.6]} showLabel={false} />}
      {placed.o2_2 && <Molecule kind="o2" position={[3.5, 2.0, 1.6]} showLabel={false} />}
      {placed.co2_1 && <Molecule kind="co2" position={[0.0, 1.5, 3.0]} showLabel={false} />}
      {placed.co2_2 && <Molecule kind="co2" position={[0.6, 0.6, 3.0]} showLabel={false} />}

      {/* Success Effect */}
      {placed.o2_1 && placed.o2_2 && placed.co2_1 && placed.co2_2 && (
        <group>
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#ff4d4d' : '#dddddd'} />
            </mesh>
          ))}
          <Label position={[0, -3.5, 2]} fontSize={0.6} color="#39ff14" outlineWidth={0.04} outlineColor="#000000">
            ✅ 밀도(농도) 평형 도달! 기체 교환 완료!
          </Label>
        </group>
      )}
    </group>
  );
};

export default RespiratoryStage;
