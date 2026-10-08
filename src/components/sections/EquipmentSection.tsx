"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial as DreiDistort, OrbitControls } from "@react-three/drei";
import { ThreeWrapper } from "../three/ThreeWrapper";
import * as THREE from "three";

function UTDevice({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += (mouse.current.x * 0.5 - mesh.current.rotation.y) * 0.05;
      mesh.current.rotation.x += (-mouse.current.y * 0.3 - mesh.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={mesh}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 0.8, 1.2]} />
          <DreiDistort color="#3A86B7" transparent opacity={0.35} wireframe distort={0.15} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.6, 0.15, 0.8]} />
          <meshBasicMaterial color="#FF7A00" transparent opacity={0.15} />
        </mesh>
        <mesh position={[0.8, 0, 0.4]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
          <meshBasicMaterial color="#FF7A00" transparent opacity={0.25} />
        </mesh>
        <mesh position={[-0.9, 0, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.1]} />
          <meshBasicMaterial color="#FF7A00" transparent opacity={0.35} />
        </mesh>
      </Float>
    </group>
  );
}

function Scene() {
  const mouse = useRef({ x: 0, y: 0 });
  const { pointer } = useThree();

  useFrame(() => {
    mouse.current.x = pointer.x;
    mouse.current.y = pointer.y;
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#FF7A00" />
      <pointLight position={[-5, -3, 2]} intensity={0.4} color="#3A86B7" />
      <UTDevice mouse={mouse} />
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} />
    </>
  );
}

export function EquipmentSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden bg-surface-50">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.01] to-transparent" />
      <div className="industrial-grid absolute inset-0 opacity-20" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[11px] font-mono tracking-widest uppercase mb-4">
            Equipment
          </span>
          <h2 className="font-display text-display-md font-bold tracking-tight mb-4 text-primary">
            Advanced <span className="gradient-text">NDT Equipment</span>
          </h2>
          <p className="text-primary/50 max-w-2xl mx-auto text-lg leading-relaxed">
            Train on industry-standard equipment used worldwide
          </p>
        </motion.div>

        <motion.div style={{ y }} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="glass-card p-6 aspect-square min-h-[300px]">
            <ThreeWrapper>
              <Canvas
                camera={{ position: [0, 0, 4], fov: 40 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
              >
                <Scene />
              </Canvas>
            </ThreeWrapper>
          </div>
          <div className="flex flex-col justify-center space-y-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="glass-card p-6 glass-card-hover"
            >
              <h3 className="font-display font-semibold mb-2 text-primary">Ultrasonic Flaw Detector</h3>
              <p className="text-primary/50 text-sm leading-relaxed">
                Industry-standard equipment including Modsonic and USM 35 for comprehensive UT training.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass-card p-6 glass-card-hover"
            >
              <h3 className="font-display font-semibold mb-2 text-primary">Calibration Blocks</h3>
              <p className="text-primary/50 text-sm leading-relaxed">
                V1, V2 Blocks with 19mm, 75mm, and 12&ldquo; Notch for precise calibration training.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="glass-card p-6 glass-card-hover"
            >
              <h3 className="font-display font-semibold mb-2 text-primary">Industrial Probes</h3>
              <p className="text-primary/50 text-sm leading-relaxed">
                Various probe types for different inspection applications including weld scan, corrosion mapping, and thickness measurement.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
