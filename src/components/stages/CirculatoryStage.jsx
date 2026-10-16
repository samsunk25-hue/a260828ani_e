import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, DragControls, MeshDistortMaterial } from '@react-three/drei';
import Label from '../scene/Label';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

const Chamber = ({ position, color, label, isTarget }) => {
  const mesh = useRef();
  
  useFrame((state) => {
    if (isTarget) {
      mesh.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 5) * 0.5;
    } else {
      mesh.current.material.emissiveIntensity = 0.1;
    }
  });

  return (
    <group position={position}>
      <Box ref={mesh} args={[2.8, 2.8, 2.8]}>
        <meshStandardMaterial 
          color={color} 
          transparent opacity={0.3} 
          emissive={color}
          roughness={0.2}
          depthWrite={false}
        />
      </Box>
      <Label position={[0, 0, 1.5]} fontSize={0.35} color="white" anchorX="center" anchorY="middle">
        {label}
      </Label>
    </group>
  );
};

const Organ = ({ position, color, label, isTarget }) => {
  const mesh = useRef();

  useFrame((state) => {
    mesh.current.rotation.y += 0.01;
    if (isTarget) {
      mesh.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.1);
    } else {
      mesh.current.scale.setScalar(1);
    }
  });

  return (
    <group position={position}>
      <Sphere ref={mesh} args={[1.5, 32, 32]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </Sphere>
      <Label position={[0, -2, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle">
        {label}
      </Label>
    </group>
  );
};

// 세포 안의 미토콘드리아 배치 (위치, 회전)
const MITOCHONDRIA = [
  { pos: [-0.95, 0.55, 0.35], rot: [0.3, 0.2, 0.9] },
  { pos: [1.1, -0.45, 0.25], rot: [0.1, 0.6, -0.7] },
  { pos: [-0.75, -0.75, -0.3], rot: [0.8, 0.1, 0.3] },
  { pos: [0.35, 0.95, -0.45], rot: [0.2, 0.9, 1.3] },
  { pos: [0.9, 0.6, 0.6], rot: [1.1, 0.3, -0.4] },
];

// 작은 소포/리보솜 점들
const VESICLES = [
  [-1.3, 0.1, 0.5], [1.4, 0.2, -0.3], [-0.3, -1.1, 0.6], [0.5, -0.1, 0.9],
  [-1.0, 1.0, -0.2], [1.2, -1.0, 0.4], [0.0, 0.4, -1.0], [-0.5, 0.9, 0.8],
];

const Mitochondrion = ({ pos, rot }) => (
  <group position={pos} rotation={rot}>
    {/* 외막 */}
    <mesh>
      <capsuleGeometry args={[0.17, 0.42, 8, 16]} />
      <meshStandardMaterial color="#ff7a45" emissive="#ff3b1a" emissiveIntensity={0.6} roughness={0.35} />
    </mesh>
    {/* 내막 주름(크리스타) 느낌의 밝은 띠 */}
    {[-0.12, 0.02, 0.16].map((y, i) => (
      <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.025, 6, 16]} />
        <meshStandardMaterial color="#ffd0a8" emissive="#ffb080" emissiveIntensity={0.9} />
      </mesh>
    ))}
  </group>
);

// 동물 세포: 둥근 세포막 + 핵(핵소체) + 미토콘드리아 + 소포
const AnimalCell = ({ position, label, isTarget }) => {
  const inner = useRef();
  const membrane = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (inner.current) {
      inner.current.rotation.y += 0.004;
      inner.current.scale.setScalar(isTarget ? 1 + Math.sin(t * 5) * 0.06 : 1);
    }
    if (membrane.current) {
      membrane.current.emissiveIntensity = isTarget ? 0.35 + Math.sin(t * 5) * 0.25 : 0.15;
    }
  });

  return (
    <group position={position}>
      <group ref={inner}>
        {/* 핵 + 핵소체 */}
        <Sphere args={[0.6, 32, 32]} position={[0.15, 0.05, 0]}>
          <meshStandardMaterial color="#b784ff" emissive="#6a2cff" emissiveIntensity={0.5} roughness={0.45} />
        </Sphere>
        <Sphere args={[0.2, 16, 16]} position={[0.32, 0.2, 0.38]}>
          <meshStandardMaterial color="#4a1a9e" emissive="#2a0a6e" emissiveIntensity={0.6} roughness={0.5} />
        </Sphere>

        {/* 미토콘드리아 */}
        {MITOCHONDRIA.map((m, i) => <Mitochondrion key={i} {...m} />)}

        {/* 소포 / 리보솜 */}
        {VESICLES.map((p, i) => (
          <Sphere key={i} args={[0.07, 10, 10]} position={p}>
            <meshStandardMaterial color="#ffe9a8" emissive="#ffd27a" emissiveIntensity={0.7} />
          </Sphere>
        ))}

        {/* 세포막 (반투명, 살짝 일렁이는 불규칙한 둥근 모양) */}
        <Sphere args={[1.75, 64, 64]} scale={[1.25, 1, 1.05]}>
          <MeshDistortMaterial
            ref={membrane}
            color="#ffd27a"
            emissive="#ff9f43"
            emissiveIntensity={0.15}
            transparent
            opacity={0.32}
            distort={0.16}
            speed={1.4}
            roughness={0.15}
            clearcoat={1}
            depthWrite={false}
          />
        </Sphere>
      </group>

      <Label position={[0, -2.5, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle">
        {label}
      </Label>
    </group>
  );
};

const DraggableBlood = ({ position, isOxygenated, onDrop }) => {
  const setIsDragging = useGameStore(state => state.setIsDragging);
  const mesh = useRef();

  // 마운트 시에만 시작 위치를 적용한다 (DragControls가 matrix를 직접 조작하므로
  // React prop으로 position을 주면 드래그 중 충돌이 생긴다).
  useEffect(() => {
    if (mesh.current) mesh.current.position.set(...position);
  }, [position]);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (mesh.current) {
      const worldPos = new THREE.Vector3();
      mesh.current.getWorldPosition(worldPos);
      
      onDrop(worldPos, () => {
        // Fallback: reset position if wrong
        mesh.current.position.set(...position);
      });
    }
  };

  return (
    <DragControls onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
      <group ref={mesh}>
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial 
            color={isOxygenated ? "#ff1133" : "#1133ff"} 
            emissive={isOxygenated ? "#ff1133" : "#1133ff"} 
            emissiveIntensity={0.8}
            metalness={0.8}
            roughness={0.2}
          />
        </Sphere>
        <Label position={[0, -0.8, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">
          {isOxygenated ? "동맥혈(O2+영양소)" : "정맥혈(CO2+노폐물)"}
        </Label>
      </group>
    </DragControls>
  );
};

const CirculatoryStage = () => {
  const addToInventory = useGameStore(state => state.addToInventory);
  
  // sequence: 0: Lungs -> 1: LA -> 2: LV -> 3: Body -> 4: RA -> 5: RV -> 6: Lungs (End)
  const [step, setStep] = useState(0);
  // 심방/심실 박스 앞면(z≈1.4)보다 앞에 두어 토큰이 항상 가려지지 않게 한다
  const BLOOD_Z = 3;
  const [bloodPos, setBloodPos] = useState([0, 4.5, BLOOD_Z]); // Starts at Lungs
  const [isOxygenated, setIsOxygenated] = useState(true);
  const [feedback, setFeedback] = useState({ text: '', color: '', visible: false });

  const showFeedback = (text, color) => {
    setFeedback({ text, color, visible: true });
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, visible: false }));
    }, 2000);
  };

  // Define target positions for each step
  const pathNodes = [
    { id: 'lungs', pos: [0, 4.5, 0], label: '폐(Lungs)' },       // step 0 (Start/End)
    { id: 'LA', pos: [1.6, 1.6, 0], label: '좌심방(LA)' },        // step 1
    { id: 'LV', pos: [1.6, -1.6, 0], label: '좌심실(LV)' },       // step 2
    { id: 'body', pos: [0, -5.5, 0], label: '세포 (Mitochondria)'},// step 3
    { id: 'RA', pos: [-1.6, 1.6, 0], label: '우심방(RA)' },       // step 4
    { id: 'RV', pos: [-1.6, -1.6, 0], label: '우심실(RV)' }       // step 5
  ];

  const handleDrop = (dropPos, resetPos) => {
    if (step >= 6) return;

    const targetNode = pathNodes[step === 6 ? 0 : step + 1];
    const targetVec = new THREE.Vector3(...targetNode.pos);
    
    // Ignore Z for 2D-like dragging accuracy
    const dropVec = new THREE.Vector3(dropPos.x, dropPos.y, 0);

    if (dropVec.distanceTo(targetVec) < 2.5) {
      // Success! Move to next step
      const nextStep = step + 1;
      setStep(nextStep);
      
      // Update blood position slightly in front of the target so it's visible
      setBloodPos([targetNode.pos[0], targetNode.pos[1], BLOOD_Z]);
      showFeedback(`✅ ${targetNode.label} 도착 성공!`, "#39ff14");

      // Special events at Body (Cells)
      if (nextStep === 3) {
        setIsOxygenated(false);
        addToInventory({ id: 'energy', name: '에너지 (ATP)', icon: '⚡' });
      }

      // Completion
      if (nextStep === 6) {
        // Stage complete!
      }
    } else {
      resetPos();
      showFeedback(`❌ 올바른 순환 경로가 아닙니다! (피는 역류할 수 없습니다)`, "#ff3366");
    }
  };

  return (
    <group position={[0, 0, -2]}>
      {/* Background / Connectors */}
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color="#1a050a" depthWrite={false} />
      </mesh>

      {/* Lungs (Top) */}
      <Organ position={pathNodes[0].pos} color="#ffb3c6" label="폐 (기체 교환)" isTarget={step === 5} />

      {/* Heart Structure (Center) */}
      <group position={[0, 0, 0]}>
        {/* Right Side of Heart (Left on screen) - Deoxygenated */}
        <Chamber position={pathNodes[4].pos} color="#2244ff" label="우심방" isTarget={step === 3} />
        <Chamber position={pathNodes[5].pos} color="#1122aa" label="우심실" isTarget={step === 4} />
        
        {/* Left Side of Heart (Right on screen) - Oxygenated */}
        <Chamber position={pathNodes[1].pos} color="#ff4422" label="좌심방" isTarget={step === 0} />
        <Chamber position={pathNodes[2].pos} color="#aa2211" label="좌심실" isTarget={step === 1} />
        
        {/* Heart separator (Septum) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 6, 3]} />
          <meshStandardMaterial color="#881122" />
        </mesh>
      </group>

      {/* Body Cells / Mitochondria (Bottom) */}
      <AnimalCell position={pathNodes[3].pos} label="온몸의 세포 (미토콘드리아)" isTarget={step === 2} />

      {/* Draggable Blood Token */}
      {step < 6 && (
        <DraggableBlood 
          key={`blood-${step}`}
          position={bloodPos} 
          isOxygenated={isOxygenated} 
          onDrop={handleDrop} 
        />
      )}

      {/* Feedback Text */}
      {feedback.visible && (
        <Label position={[0, 0, 4]} fontSize={0.6} color={feedback.color} anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="black">
          {feedback.text}
        </Label>
      )}

      {/* Success Particle Effect */}
      {step === 6 && (
        <group>
          {Array.from({ length: 30 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 5]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshBasicMaterial color="#ffcc00" />
            </mesh>
          ))}
          <Label position={[0, 0, 3]} fontSize={1} color="#39ff14" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="black">
            순환 성공!
          </Label>
        </group>
      )}
    </group>
  );
};

export default CirculatoryStage;
