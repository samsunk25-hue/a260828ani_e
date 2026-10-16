import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshWobbleMaterial, DragControls, Html } from '@react-three/drei';
import Label from '../scene/Label';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

const TargetFood = ({ position, emoji, label, visible }) => {
  const mesh = useRef();
  
  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.getElapsedTime();
    mesh.current.position.y = position[1] + Math.sin(t * 3 + position[0]) * 0.2;
  });

  if (!visible) return null;

  return (
    <group position={position} ref={mesh}>
      <Html center transform sprite>
        <div style={{ fontSize: '120px', filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.5))', pointerEvents: 'none', userSelect: 'none' }}>
          {emoji}
        </div>
      </Html>
      <Label position={[0, -1.8, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {label}
      </Label>
    </group>
  );
};

const DraggableEnzyme = ({ position, color, label, onDrop }) => {
  const setIsDragging = useGameStore(state => state.setIsDragging);
  const mesh = useRef();
  const [initialPos] = useState(() => new THREE.Vector3(...position));

  // 리렌더링 시 DragControls와 React 간의 위치(matrix) 충돌을 방지하기 위해 
  // 컴포넌트 마운트 시에만 위치를 수동으로 설정합니다.
  React.useEffect(() => {
    if (mesh.current) {
      mesh.current.position.copy(initialPos);
    }
  }, [initialPos]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (mesh.current) {
      const worldPos = new THREE.Vector3();
      mesh.current.getWorldPosition(worldPos);
      
      onDrop(worldPos);
      
      // 드롭 후 원래 위치로 복귀 (DragControls 버그 방지를 위해 부모에서 key 변경으로 리마운트 유도)
      mesh.current.position.copy(initialPos);
    }
  };

  return (
    <DragControls onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <group ref={mesh}>
        <Sphere args={[0.4, 32, 32]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
        </Sphere>
        <Label position={[0, -0.7, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">
          {label}
        </Label>
      </group>
    </DragControls>
  );
};

const DigestiveStage = () => {
  const addToInventory = useGameStore(state => state.addToInventory);
  
  const [molecules, setMolecules] = useState({
    starch: { step: 0, visible: true, position: [-4, 0, 0] }, // step 0: 녹말, step 1: 엿당
    protein: { step: 0, visible: true, position: [0, 0, 0] }, // step 0: 단백질, step 1: 폴리펩타이드
    fat: { step: 0, visible: true, position: [4, 0, 0] }      // step 0: 지방
  });

  const moleculesRef = useRef(molecules);
  React.useEffect(() => {
    moleculesRef.current = molecules;
  }, [molecules]);

  const handleDrop = (enzymeType, dropPosition) => {
    const dropVec = new THREE.Vector3(dropPosition.x, dropPosition.y, 0);
    const state = moleculesRef.current;
    
    // Starch Logic (아밀레이스 -> 아밀레이스)
    if (state.starch.visible) {
      const targetPos = new THREE.Vector3(state.starch.position[0], state.starch.position[1], 0);
      if (dropVec.distanceTo(targetPos) < 4.0 && enzymeType === 'amylase') {
        if (state.starch.step === 0) {
          setMolecules(prev => ({ ...prev, starch: { ...prev.starch, step: 1 } }));
        } else if (state.starch.step === 1) {
          setMolecules(prev => ({ ...prev, starch: { ...prev.starch, visible: false } }));
          addToInventory({ id: 'glucose', name: '포도당', icon: '🥨' });
        }
      }
    }

    // Protein Logic (펩신 -> 트립신)
    if (state.protein.visible) {
      const targetPos = new THREE.Vector3(state.protein.position[0], state.protein.position[1], 0);
      if (dropVec.distanceTo(targetPos) < 4.0) {
        if (enzymeType === 'pepsin' && state.protein.step === 0) {
          setMolecules(prev => ({ ...prev, protein: { ...prev.protein, step: 1 } }));
        } else if (enzymeType === 'trypsin' && state.protein.step === 1) {
          setMolecules(prev => ({ ...prev, protein: { ...prev.protein, visible: false } }));
          addToInventory({ id: 'amino_acid', name: '아미노산', icon: '🥓' });
        }
      }
    }

    // Fat Logic (쓸개즙 -> 라이페이스)
    if (state.fat.visible) {
      const targetPos = new THREE.Vector3(state.fat.position[0], state.fat.position[1], 0);
      if (dropVec.distanceTo(targetPos) < 4.0) {
        if (enzymeType === 'bile' && state.fat.step === 0) {
          setMolecules(prev => ({ ...prev, fat: { ...prev.fat, step: 1 } }));
        } else if (enzymeType === 'lipase' && state.fat.step === 1) {
          setMolecules(prev => ({ ...prev, fat: { ...prev.fat, visible: false } }));
          addToInventory({ id: 'fatty_acid', name: '지방산', icon: '🧀' });
        }
      }
    }
  };

  return (
    <group>
      {/* Organic Tunnel Environment (Stomach/Intestine) */}
      <mesh position={[0, 0, -10]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[8, 6, 40, 32, 10, true]} />
        <MeshWobbleMaterial color="#881122" side={THREE.BackSide} factor={0.1} speed={1} roughness={0.7} />
      </mesh>
      
      {/* Target Foods */}
      <TargetFood 
        visible={molecules.starch.visible}
        position={molecules.starch.position} 
        emoji={molecules.starch.step === 0 ? "🍞" : "🥨"} 
        label={molecules.starch.step === 0 ? "녹말 (빵)" : "엿당 (프레첼)"} 
      />
      <TargetFood 
        visible={molecules.protein.visible}
        position={molecules.protein.position} 
        emoji={molecules.protein.step === 0 ? "🥩" : "🥓"} 
        label={molecules.protein.step === 0 ? "단백질 (고기)" : "중간산물 (베이컨)"} 
      />
      <TargetFood 
        visible={molecules.fat.visible}
        position={molecules.fat.position} 
        emoji={molecules.fat.step === 0 ? "🧀" : "🧈"} 
        label={molecules.fat.step === 0 ? "지방 (치즈)" : "유화된 지방 (버터)"} 
      />

      {/* Draggable Enzymes */}
      <DraggableEnzyme 
        key={`amylase1-${molecules.starch.step}`}
        position={[-6.25, 3.5, 0]} 
        color="#39ff14" 
        label="아밀레이스" 
        onDrop={(pos) => handleDrop('amylase', pos)} 
      />
      <DraggableEnzyme 
        key={`amylase2-${molecules.starch.step}`}
        position={[-3.75, 3.5, 0]} 
        color="#39ff14" 
        label="아밀레이스" 
        onDrop={(pos) => handleDrop('amylase', pos)} 
      />
      <DraggableEnzyme 
        key={`pepsin-${molecules.protein.step}`}
        position={[-1.25, 3.5, 0]} 
        color="#ff3366" 
        label="펩신" 
        onDrop={(pos) => handleDrop('pepsin', pos)} 
      />
      <DraggableEnzyme 
        key={`trypsin-${molecules.protein.step}`}
        position={[1.25, 3.5, 0]} 
        color="#00ccff" 
        label="트립신" 
        onDrop={(pos) => handleDrop('trypsin', pos)} 
      />
      <DraggableEnzyme 
        key={`bile-${molecules.fat.step}`}
        position={[3.75, 3.5, 0]} 
        color="#adff2f" 
        label="쓸개즙" 
        onDrop={(pos) => handleDrop('bile', pos)} 
      />
      <DraggableEnzyme 
        key={`lipase-${molecules.fat.step}`}
        position={[6.25, 3.5, 0]} 
        color="#ffcc00" 
        label="라이페이스" 
        onDrop={(pos) => handleDrop('lipase', pos)} 
      />
    </group>
  );
};

export default DigestiveStage;
