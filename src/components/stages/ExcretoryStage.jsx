import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Text, DragControls } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

const NephronStructure = () => {
  return (
    <group position={[0, 0, -2]}>
      {/* Glomerulus (사구체) */}
      <Sphere args={[1.2, 16, 16]} position={[-4, 1, 0]}>
        <meshStandardMaterial color="#ff2233" wireframe />
      </Sphere>
      <Text position={[-4, 2.5, 0]} fontSize={0.3} color="#ff8888" anchorX="center">
        사구체 (Glomerulus)
      </Text>

      {/* Bowman's Capsule (보먼주머니) */}
      <Sphere args={[1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[-4, 1.2, 0]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial color="#ffcc00" transparent opacity={0.3} side={THREE.DoubleSide} />
      </Sphere>
      <Text position={[-4, -0.5, 0]} fontSize={0.3} color="#ffcc00" anchorX="center">
        보먼주머니
      </Text>

      {/* Renal Tubule (세뇨관) */}
      <Cylinder args={[0.5, 0.5, 8, 32]} position={[0, -1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#ffcc00" transparent opacity={0.3} />
      </Cylinder>
      <Text position={[0, -2, 0]} fontSize={0.3} color="#ffcc00" anchorX="center">
        세뇨관 (Tubule)
      </Text>

      {/* Capillary around Tubule (모세혈관) */}
      <Cylinder args={[0.4, 0.4, 8, 32]} position={[0, -3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#ff2233" transparent opacity={0.5} />
      </Cylinder>
      <Text position={[0, -4, 0]} fontSize={0.3} color="#ff8888" anchorX="center">
        모세혈관 (Capillary)
      </Text>
      
      {/* Urine Collection (집합관으로) */}
      <Text position={[4.5, -1, 0]} fontSize={0.3} color="white" anchorX="center">
        오줌(Urine) 배출 ➔
      </Text>
    </group>
  );
};

const DraggableMolecule = ({ id, position, color, label, size, onDrop, disabled }) => {
  const setIsDragging = useGameStore(state => state.setIsDragging);
  const mesh = useRef();
  const initPos = new THREE.Vector3(...position);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (mesh.current) {
      const isSuccess = onDrop(id, mesh.current.position);
      if (!isSuccess) {
        mesh.current.position.copy(initPos); // Snap back if wrong
      }
    }
  };

  return (
    <DragControls onDragStart={() => !disabled && setIsDragging(true)} onDragEnd={handleDragEnd}>
      <group position={position} ref={mesh}>
        <Sphere args={[size, 16, 16]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </Sphere>
        <Text position={[0, -size - 0.3, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
    </DragControls>
  );
};

const ExcretoryStage = () => {
  const addToInventory = useGameStore(state => state.addToInventory);
  
  // phase 0: 여과(Filtration), phase 1: 재흡수(Reabsorption), phase 2: 완료(Complete)
  const [phase, setPhase] = useState(0);

  // Molecule States
  const [protein, setProtein] = useState({ pos: [-5, 3, 0], status: 'blood' }); // stays in blood
  const [glucose, setGlucose] = useState({ pos: [-4, 3, 0], status: 'blood' }); // filters, then reabsorbs
  const [urea, setUrea] = useState({ pos: [-3, 3, 0], status: 'blood' }); // filters, then excreted

  const handleDrop = (id, dropPos) => {
    const dropVec = new THREE.Vector3(dropPos.x, dropPos.y, 0);

    if (phase === 0) {
      // 1. 여과 (Filtration) 단계
      // 단백질은 여과되지 않고 혈관에 남아야 함.
      // 포도당과 요소는 보먼주머니로 여과되어야 함.
      
      const isBowmansCapsule = dropVec.distanceTo(new THREE.Vector3(-4, -0.5, 0)) < 2.0; // 보먼주머니 영역
      const isBloodVessel = dropVec.distanceTo(new THREE.Vector3(-2, 3, 0)) < 2.0; // 사구체를 지나가는 혈관 영역

      if (id === 'protein' && isBloodVessel) {
        setProtein({ pos: [-2, 3, 0], status: 'filtered' });
        checkPhase0Complete(true, glucose.status === 'filtered', urea.status === 'filtered');
        return true;
      }
      if (id === 'glucose' && isBowmansCapsule) {
        setGlucose({ pos: [-1.5, -1, 0], status: 'filtered' });
        checkPhase0Complete(protein.status === 'filtered', true, urea.status === 'filtered');
        return true;
      }
      if (id === 'urea' && isBowmansCapsule) {
        setUrea({ pos: [-2.5, -1, 0], status: 'filtered' });
        checkPhase0Complete(protein.status === 'filtered', glucose.status === 'filtered', true);
        return true;
      }
    } else if (phase === 1) {
      // 2. 재흡수 (Reabsorption) 단계
      // 포도당은 모세혈관으로 100% 재흡수.
      // 요소는 세뇨관을 따라 집합관(오줌)으로 배출.

      const isCapillary = dropVec.distanceTo(new THREE.Vector3(1, -3, 0)) < 2.0; // 모세혈관 영역
      const isExcretion = dropVec.distanceTo(new THREE.Vector3(4, -1, 0)) < 2.0; // 세뇨관 끝 (오줌) 영역

      if (id === 'glucose' && isCapillary) {
        setGlucose({ pos: [1, -3, 0], status: 'reabsorbed' });
        checkPhase1Complete(true, urea.status === 'excreted');
        return true;
      }
      if (id === 'urea' && isExcretion) {
        setUrea({ pos: [4, -1, 0], status: 'excreted' });
        checkPhase1Complete(glucose.status === 'reabsorbed', true);
        return true;
      }
    }
    return false; // 잘못된 이동
  };

  const checkPhase0Complete = (p, g, u) => {
    if (p && g && u) {
      setTimeout(() => setPhase(1), 1000);
    }
  };

  const checkPhase1Complete = (g, u) => {
    if (g && u) {
      setPhase(2);
      setTimeout(() => {
        addToInventory({ id: 'urea', name: '요소 (노폐물)', icon: '💧' });
      }, 1000);
    }
  };

  return (
    <group>
      <NephronStructure />

      {/* Guide Instructions based on Phase */}
      <Text position={[0, 4, 0]} fontSize={0.5} color="#00f3ff" anchorX="center">
        {phase === 0 ? "1단계: 여과 (사구체 ➔ 보먼주머니)" : phase === 1 ? "2단계: 재흡수 (세뇨관 ➔ 모세혈관)" : "배설 완료!"}
      </Text>
      
      {phase === 0 && (
        <Text position={[0, 3.2, 0]} fontSize={0.25} color="white" anchorX="center">
          단백질은 크기가 커서 여과되지 않고 혈관에 남습니다. 포도당과 요소는 보먼주머니로 여과시키세요.
        </Text>
      )}
      
      {phase === 1 && (
        <Text position={[0, 3.2, 0]} fontSize={0.25} color="white" anchorX="center">
          필요한 영양소(포도당)는 모세혈관으로 100% 재흡수시키고, 노폐물(요소)은 끝까지 배출시키세요.
        </Text>
      )}

      {/* Molecules */}
      <DraggableMolecule id="protein" position={protein.pos} color="#0044ff" label="단백질" size={0.6} onDrop={handleDrop} disabled={protein.status !== 'blood'} />
      <DraggableMolecule id="glucose" position={glucose.pos} color="#ffcc00" label="포도당" size={0.3} onDrop={handleDrop} disabled={glucose.status === 'reabsorbed' || (phase === 0 && glucose.status === 'filtered')} />
      <DraggableMolecule id="urea" position={urea.pos} color="#aaaaaa" label="요소" size={0.2} onDrop={handleDrop} disabled={urea.status === 'excreted' || (phase === 0 && urea.status === 'filtered')} />

      {/* Target Highlights based on Phase */}
      {phase === 0 && (
        <group>
          <mesh position={[-2, 3, -1]}>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshBasicMaterial color="#0044ff" transparent opacity={0.1} />
          </mesh>
          <mesh position={[-4, -0.5, -1]}>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshBasicMaterial color="#ffcc00" transparent opacity={0.1} />
          </mesh>
        </group>
      )}
      {phase === 1 && (
        <group>
          <mesh position={[1, -3, -1]}>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshBasicMaterial color="#ffcc00" transparent opacity={0.1} />
          </mesh>
          <mesh position={[4, -1, -1]}>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshBasicMaterial color="#aaaaaa" transparent opacity={0.1} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default ExcretoryStage;
