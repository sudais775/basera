import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const PARTICLE_COUNT = 40;

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const x = random(`px-${i}`) * width;
    const startY = random(`py-${i}`) * height;
    const size = 1 + random(`ps-${i}`) * 3;
    const speed = 0.3 + random(`pv-${i}`) * 0.7;
    const y = ((startY - frame * speed) % height + height) % height;
    const opacity =
      (0.15 + random(`po-${i}`) * 0.35) *
      interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
    return { x, y, size, opacity, key: i };
  });

  const gradientShift = interpolate(frame, [0, durationInFrames], [0, 25]);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 120% at ${50 + gradientShift * 0.3}% ${30 + gradientShift * 0.2}%, #131329 0%, #0a0a14 55%, #050508 100%)`,
        }}
      />
      {/* subtle grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(124,77,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(70% 70% at 50% 50%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(70% 70% at 50% 50%, black 0%, transparent 100%)",
        }}
      />
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {particles.map((p) => (
          <circle
            key={p.key}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill="#8ab8ff"
            opacity={p.opacity}
          />
        ))}
      </svg>
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(90% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
