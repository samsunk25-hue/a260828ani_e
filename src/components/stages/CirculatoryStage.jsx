import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Text, DragControls } from '@react-three/drei';
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
      <Text position={[0, 0, 1.5]} fontSize={0.35} color="white" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
};

const Organ = ({ position, color, label, isTarget, isMitochondria }) => {
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
      {isMitochondria ? (
        <Box ref={mesh} args={[3, 1.5, 1.5]} radius={0.5}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </Box>
      ) : (
        <Sphere ref={mesh} args={[1.5, 32, 32]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </Sphere>
      )}
      <Text position={[0, isMitochondria ? -1.5 : -2, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
};

const DraggableBlood = ({ position, isOxygenated, onDrop }) => {
  const setIsDragging = useGameStore(state => state.setIsDragging);
  const mesh = useRef();
  
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
        <Text position={[0, -0.8, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">
          {isOxygenated ? "동맥혈(O2+영양소)" : "정맥혈(CO2+노폐물)"}
        </Text>
      </group>
    </DragControls>
  );
};

const CirculatoryStage = () => {
  const addToInventory = useGameStore(state => state.addToInventory);
  
  // sequence: 0: Lungs -> 1: LA -> 2: LV -> 3: Body -> 4: RA -> 5: RV -> 6: Lungs (End)
  const [step, setStep] = useState(0);
  const [bloodPos, setBloodPos] = useState([0, 4.5, 2]); // Starts at Lungs
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
      setBloodPos([targetNode.pos[0], targetNode.pos[1], 2]);
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
      <Organ position={pathNodes[3].pos} color="#ffcc00" label="온몸의 세포 / 미토콘드리아" isTarget={step === 2} isMitochondria={true} />

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
        <Text position={[0, 0, 4]} fontSize={0.6} color={feedback.color} anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="black">
          {feedback.text}
        </Text>
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
          <Text position={[0, 0, 3]} fontSize={1} color="#39ff14" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="black">
            순환 성공!
          </Text>
        </group>
      )}
    </group>
  );
};

export default CirculatoryStage;
