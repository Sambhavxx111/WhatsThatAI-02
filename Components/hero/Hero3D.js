'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, RoundedBox } from '@react-three/drei'
import { useMemo, useRef } from 'react'

function ParticleField() {
  const points = useRef(null)
  const count = 700

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3)

    for (let index = 0; index < count; index += 1) {
      array[index * 3] = (Math.random() - 0.5) * 16
      array[index * 3 + 1] = (Math.random() - 0.5) * 10
      array[index * 3 + 2] = (Math.random() - 0.5) * 10
    }

    return array
  }, [])

  useFrame((state) => {
    if (!points.current) return
    points.current.rotation.y = state.clock.elapsedTime * 0.03
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.06
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#c4b5fd" size={0.024} transparent opacity={0.58} sizeAttenuation />
    </points>
  )
}

function FloatingPanels() {
  const group = useRef(null)

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 0.09
  })

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1.1}>
        <RoundedBox args={[1.65, 1.05, 0.18]} radius={0.18} smoothness={6} position={[-2.6, 1.1, -1.4]}>
          <MeshDistortMaterial color="#7dd3fc" roughness={0.18} metalness={0.45} transparent opacity={0.28} distort={0.14} speed={1.8} />
        </RoundedBox>
      </Float>

      <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1.5}>
        <RoundedBox args={[1.2, 1.8, 0.18]} radius={0.22} smoothness={6} position={[2.35, 0.2, -1.9]}>
          <MeshDistortMaterial color="#818cf8" roughness={0.18} metalness={0.42} transparent opacity={0.24} distort={0.16} speed={1.5} />
        </RoundedBox>
      </Float>

      <Float speed={1.1} rotationIntensity={0.4} floatIntensity={0.9}>
        <mesh position={[0.4, -1.65, -2.1]}>
          <torusGeometry args={[0.7, 0.1, 18, 60]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.18} metalness={0.7} roughness={0.18} />
        </mesh>
      </Float>
    </group>
  )
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(125,211,252,0.16),transparent_22%),radial-gradient(circle_at_80%_16%,rgba(99,102,241,0.18),transparent_22%),radial-gradient(circle_at_58%_78%,rgba(255,255,255,0.06),transparent_26%)]" />
      <Canvas camera={{ position: [0, 0, 6], fov: 48 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[2, 3, 4]} intensity={1.1} color="#ffffff" />
        <pointLight position={[-4, 1, 2]} intensity={1.2} color="#7dd3fc" />
        <pointLight position={[4, -2, 1]} intensity={0.9} color="#8b5cf6" />
        <ParticleField />
        <FloatingPanels />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.16),rgba(2,6,23,0.54)_58%,rgba(2,6,23,0.96))]" />
    </div>
  )
}
