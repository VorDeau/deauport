import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Stage } from "@react-three/drei";
import { Suspense, type ComponentProps, type ReactNode } from "react";

const FramedStage = Stage as unknown as React.ComponentType<
  ComponentProps<typeof Stage> & { margin?: number }
>;

export default function BoardCanvas({
  children,
  controls = true,
  fitKey,
  steady = false,
  margin,
  autoFit = true,
}: {
  children: ReactNode;
  controls?: boolean;
  margin?: number;
  fitKey?: string | number;
  steady?: boolean;
  autoFit?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0.12, 0.09, 0.12], fov: 40, near: 0.001, far: 10 }}
      gl={{ antialias: true, toneMappingExposure: 0.92 }}
    >
      <ambientLight intensity={0.42} />
      <directionalLight position={[3, 5, 2]} intensity={1.25} />
      <directionalLight position={[-4, 2, -3]} intensity={0.42} />
      <Environment resolution={64}>
        <Lightformer intensity={0.85} position={[0, 5, 0]} scale={[10, 10]} />
        <Lightformer intensity={0.4} position={[-5, 1, -2]} scale={[10, 10]} />
        <Lightformer intensity={0.4} position={[5, 1, 2]} scale={[10, 10]} />
        <Lightformer intensity={0.18} position={[0, -4, 0]} scale={[10, 10]} />
      </Environment>

      <Suspense fallback={null}>
        {autoFit ? (
          <FramedStage
            intensity={0}
            environment={null}
            adjustCamera
            margin={margin}
            center={{ cacheKey: fitKey, disable: steady }}
          >
            {children}
          </FramedStage>
        ) : (
          children
        )}
      </Suspense>
      {controls && (
        <OrbitControls enablePan={false} enableZoom={false} enableRotate makeDefault />
      )}
    </Canvas>
  );
}
