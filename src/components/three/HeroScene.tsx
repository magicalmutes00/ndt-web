"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Box, Torus, Cylinder } from "@react-three/drei";
import * as THREE from "three";

function IndustrialParticles({ count = 200 }) {
  const mesh = useRef<THREE.Points>(null!);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 15;
  }

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#FF7A00"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function PipelineStructure() {
  return (
    <group>
      {Array.from({ length: 6 }).map((_, i) => (
        <Cylinder
          key={`pipe-${i}`}
          args={[0.06, 0.08, 2 + Math.random() * 3, 8]}
          position={[
            (Math.random() - 0.5) * 10,
            Math.random() * 2 - 4,
            (Math.random() - 0.5) * 8 - 4,
          ]}
          rotation={[
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            0,
          ]}
        >
          <MeshDistortMaterial
            color="#3A86B7"
            transparent
            opacity={0.15}
            wireframe
            distort={0.1}
          />
        </Cylinder>
      ))}
    </group>
  );
}

function FloatingGeometry() {
  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <Sphere args={[0.8, 32, 32]} position={[-3, 1, -5]}>
          <MeshDistortMaterial
            color="#FF7A00"
            transparent
            opacity={0.12}
            distort={0.3}
            wireframe
          />
        </Sphere>
      </Float>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <Box args={[1, 0.05, 0.05]} position={[2.5, -0.5, -4]} rotation={[0, 0, Math.PI / 4]}>
          <meshBasicMaterial color="#FF7A00" transparent opacity={0.08} />
        </Box>
        <Box args={[1, 0.05, 0.05]} position={[2.5, -1, -4]} rotation={[0, 0, -Math.PI / 6]}>
          <meshBasicMaterial color="#3A86B7" transparent opacity={0.06} />
        </Box>
      </Float>
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.4}>
        <Torus args={[0.6, 0.03, 16, 32]} position={[0, 2, -6]}>
          <meshBasicMaterial color="#3A86B7" transparent opacity={0.08} />
        </Torus>
      </Float>
    </group>
  );
}

function WeldingSparks() {
  const sparksRef = useRef<THREE.Points>(null!);
  const sparkPositions = new Float32Array(30 * 3);

  for (let i = 0; i < 30; i++) {
    sparkPositions[i * 3] = (Math.random() - 0.5) * 0.5;
    sparkPositions[i * 3 + 1] = Math.random() * 0.5;
    sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }

  useFrame((_, delta) => {
    if (sparksRef.current) {
      const pos = sparksRef.current.geometry.attributes.position;
      for (let i = 0; i < 30; i++) {
        const arr = pos.array;
        arr[i * 3] += (Math.random() - 0.5) * delta * 0.5;
        arr[i * 3 + 1] += delta * 0.3;
        arr[i * 3 + 2] += (Math.random() - 0.5) * delta * 0.5;
        if (arr[i * 3 + 1] > 1) arr[i * 3 + 1] = 0;
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <points ref={sparksRef} position={[0.5, -1.5, -3]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[sparkPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#FF7A00" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function Scene() {
  const { mouse } = useThree();
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x += (mouse.y * 0.05 - groupRef.current.rotation.x) * 0.02;
      groupRef.current.rotation.y += (mouse.x * 0.05 - groupRef.current.rotation.y) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#FF7A00" />
      <pointLight position={[-5, -3, 2]} intensity={0.3} color="#3A86B7" />
      <IndustrialParticles />
      <PipelineStructure />
      <FloatingGeometry />
      <WeldingSparks />
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 50 }}
      dpr={[1, 1.5]}
      style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene />
    </Canvas>
  );
}
