import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Float, MeshDistortMaterial, MeshWobbleMaterial, Box, Torus } from '@react-three/drei';
import Label from '../scene/Label';
import * as THREE from 'three';

// 더 복잡하고 꼬불꼬불한 소장/대장 커브
const createIntestineCurve = () => {
  class IntestineCurve extends THREE.Curve {
    getPoint(t, optionalTarget = new THREE.Vector3()) {
      // 좀 더 불규칙하고 촘촘한 코일 형태
      const x = Math.sin(t * Math.PI * 14) * 1.2 + Math.sin(t * Math.PI * 4) * 0.5;
      const y = -t * 3.5;
      const z = Math.cos(t * Math.PI * 10) * 0.8 + Math.cos(t * Math.PI * 3) * 0.4;
      return optionalTarget.set(x, y, z);
    }
  }
  return new IntestineCurve();
};

// 고품질 장기 재질 설정 (Physical Material for realistic fleshy/glassy look)
const OrganMaterial = ({ color, emissive, transparent, opacity, transmission, roughness, clearcoat }) => (
  <meshPhysicalMaterial 
    color={color} 
    emissive={emissive || '#000000'}
    transparent={transparent || false}
    opacity={opacity || 1}
    transmission={transmission || 0} // 유리 같은 반투명도
    thickness={1.5} // 부피감
    roughness={roughness !== undefined ? roughness : 0.3}
    metalness={0.1}
    clearcoat={clearcoat !== undefined ? clearcoat : 0.8}
    clearcoatRoughness={0.2}
  />
);

const IntroStage = () => {
  const heartRef = useRef();
  const lungsRef = useRef();
  const intestineCurve = useMemo(() => createIntestineCurve(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // 심장 박동 (더 역동적인 2단 고동)
    if (heartRef.current) {
      const beat = Math.pow(Math.sin(t * 6), 4);
      heartRef.current.scale.setScalar(1 + beat * 0.15);
    }
    
    // 폐 호흡 (부드러운 팽창)
    if (lungsRef.current) {
      lungsRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
    }
  });

  return (
    <group position={[0, -1, -5]}>
      
      {/* 1. 거인의 몸체 (홀로그램 스타일의 아웃라인) */}
      <mesh position={[0, 1.5, 0]}>
        <capsuleGeometry args={[3.8, 9, 32, 64]} />
        <meshPhysicalMaterial 
          color="#00f3ff" 
          transparent opacity={0.03} 
          transmission={0.9} 
          roughness={0.1}
          wireframe
        />
      </mesh>
      
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.1}>
        <group position={[0, 2, 0]}>
          
          {/* 2. 호흡계 (Lungs) - 다중 엽(Lobe) 구조로 디테일업 */}
          <group ref={lungsRef} position={[0, 2.8, -0.8]}>
            {/* 기관지 (Trachea) */}
            <Cylinder args={[0.2, 0.2, 1.5, 16]} position={[0, 1.5, 0]}>
              <OrganMaterial color="#ffccdd" roughness={0.7} />
            </Cylinder>
            
            {/* 좌폐 (상엽/하엽 분리 표현) */}
            <group position={[-1.6, 0, 0]}>
              <Sphere args={[0.9, 32, 32]} position={[0.2, 0.5, 0]} scale={[1, 1.3, 0.8]} rotation={[0, 0, -0.3]}>
                <OrganMaterial color="#ff77aa" transmission={0.4} opacity={0.9} roughness={0.5} />
              </Sphere>
              <Sphere args={[0.95, 32, 32]} position={[-0.1, -0.6, 0]} scale={[1, 1.2, 0.8]} rotation={[0, 0, -0.1]}>
                <OrganMaterial color="#ff6699" transmission={0.4} opacity={0.9} roughness={0.5} />
              </Sphere>
            </group>

            {/* 우폐 (상/중/하엽 분리 표현) */}
            <group position={[1.6, 0, 0]}>
              <Sphere args={[0.85, 32, 32]} position={[-0.2, 0.6, 0]} scale={[1, 1.2, 0.8]} rotation={[0, 0, 0.3]}>
                <OrganMaterial color="#ff77aa" transmission={0.4} opacity={0.9} roughness={0.5} />
              </Sphere>
              <Sphere args={[0.85, 32, 32]} position={[0, 0, 0.1]} scale={[1.1, 1, 0.9]} rotation={[0, 0, 0.1]}>
                <OrganMaterial color="#ff88bb" transmission={0.4} opacity={0.9} roughness={0.5} />
              </Sphere>
              <Sphere args={[0.9, 32, 32]} position={[0.1, -0.6, 0]} scale={[1, 1.2, 0.8]} rotation={[0, 0, 0.1]}>
                <OrganMaterial color="#ff6699" transmission={0.4} opacity={0.9} roughness={0.5} />
              </Sphere>
            </group>
            
            <Label position={[0, -2, 0.5]} fontSize={0.25} color="#ff99bb">호흡계</Label>
          </group>

          {/* 3. 순환계 (Heart) - 심방/심실 및 주요 혈관 디테일업 */}
          <group ref={heartRef} position={[0, 1.8, 0.6]}>
            {/* 좌/우심실 (Main body) */}
            <Sphere args={[0.7, 64, 64]} position={[0.1, -0.2, 0]} scale={[1.1, 1.3, 1]}>
              <MeshDistortMaterial color="#dd0011" emissive="#330000" distort={0.3} speed={6} roughness={0.3} clearcoat={1} />
            </Sphere>
            {/* 우심방 */}
            <Sphere args={[0.4, 32, 32]} position={[-0.5, 0.4, 0.2]} scale={[1, 1, 0.8]}>
              <OrganMaterial color="#1122aa" roughness={0.4} />
            </Sphere>
            {/* 좌심방 */}
            <Sphere args={[0.35, 32, 32]} position={[0.4, 0.5, -0.2]} scale={[1, 1, 0.8]}>
              <OrganMaterial color="#cc1122" roughness={0.4} />
            </Sphere>
            
            {/* 대동맥궁 (Aortic Arch) */}
            <Torus args={[0.4, 0.15, 16, 64, Math.PI]} position={[0, 0.8, 0]} rotation={[0, 0, 0]}>
              <OrganMaterial color="#ff1122" />
            </Torus>
            {/* 대정맥 (Vena Cava) */}
            <Cylinder args={[0.15, 0.15, 1.5, 16]} position={[-0.5, 1, -0.2]}>
              <OrganMaterial color="#1133ff" />
            </Cylinder>
            
            {/* 고동치는 붉은 빛 */}
            <pointLight position={[0, 0, 1]} intensity={0.5} color="#ff0000" distance={3} />
            <Label position={[0, -1.2, 0]} fontSize={0.25} color="#ff3344">순환계</Label>
          </group>

          {/* 4. 소화계 (Liver, Stomach, Intestines) */}
          <group position={[0, -0.2, 0.2]}>
            {/* 식도 */}
            <Cylinder args={[0.12, 0.12, 2.5, 16]} position={[0, 1.5, -0.5]}>
              <OrganMaterial color="#ffbb99" />
            </Cylinder>
            
            {/* 간 (Liver) - 우측 상단에 거대한 적갈색 덩어리 추가 */}
            <Sphere args={[1.2, 32, 32]} position={[0.5, 0.5, -0.2]} scale={[1.3, 0.7, 1]} rotation={[0, 0, 0.2]}>
              <OrganMaterial color="#662211" roughness={0.8} clearcoat={0.5} />
            </Sphere>

            {/* 위 (Stomach) - 좌측에 강낭콩 형태 */}
            <Sphere args={[0.8, 32, 32]} position={[-0.8, 0.1, 0.3]} scale={[1.2, 0.8, 0.7]} rotation={[0, 0, -0.5]}>
              <OrganMaterial color="#dd7733" roughness={0.4} clearcoat={0.8} />
            </Sphere>

            {/* 소장/대장 (Intestines) - 촘촘한 코일 구조 */}
            <mesh position={[0, -0.5, 0.2]}>
              <tubeGeometry args={[intestineCurve, 128, 0.35, 16, false]} />
              <MeshWobbleMaterial color="#cc8844" factor={0.2} speed={1.5} roughness={0.5} />
            </mesh>
            
            <Label position={[0, -4.5, 0.5]} fontSize={0.25} color="#ddaa55">소화계 (간, 위, 장)</Label>
          </group>

          {/* 5. 배설계 (Kidneys & Bladder) */}
          <group position={[0, -1.2, -1.2]}>
            {/* 좌측 신장 & 부신(Adrenal Gland) */}
            <group position={[-1.2, 0, 0]}>
              <Sphere args={[0.5, 32, 32]} scale={[0.8, 1.3, 0.6]} rotation={[0, 0.2, 0.2]}>
                <OrganMaterial color="#882211" roughness={0.6} />
              </Sphere>
              <Sphere args={[0.2, 16, 16]} position={[0, 0.7, 0]} scale={[1, 0.5, 1]}>
                <OrganMaterial color="#ffcc00" roughness={0.8} />
              </Sphere>
            </group>
            
            {/* 우측 신장 & 부신 */}
            <group position={[1.2, 0, 0]}>
              <Sphere args={[0.5, 32, 32]} scale={[0.8, 1.3, 0.6]} rotation={[0, -0.2, -0.2]}>
                <OrganMaterial color="#882211" roughness={0.6} />
              </Sphere>
              <Sphere args={[0.2, 16, 16]} position={[0, 0.7, 0]} scale={[1, 0.5, 1]}>
                <OrganMaterial color="#ffcc00" roughness={0.8} />
              </Sphere>
            </group>

            {/* 요관 (Ureters) */}
            <Cylinder args={[0.08, 0.08, 2.5, 16]} position={[-0.8, -1.2, 0]} rotation={[0, 0, -0.3]}>
              <OrganMaterial color="#ffddaa" />
            </Cylinder>
            <Cylinder args={[0.08, 0.08, 2.5, 16]} position={[0.8, -1.2, 0]} rotation={[0, 0, 0.3]}>
              <OrganMaterial color="#ffddaa" />
            </Cylinder>

            {/* 방광 (Bladder) */}
            <Sphere args={[0.6, 32, 32]} position={[0, -2.2, 0.5]} scale={[1, 0.8, 0.9]}>
              <OrganMaterial color="#ffaa88" transmission={0.5} opacity={0.9} roughness={0.4} />
            </Sphere>
            
            <Label position={[0, -3.2, 0]} fontSize={0.25} color="#cc6655">배설계 (신장, 방광)</Label>
          </group>
          
        </group>
      </Float>
    </group>
  );
};

export default IntroStage;
