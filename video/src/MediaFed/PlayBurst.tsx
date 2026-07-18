import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Play button springs in, pulses expanding rings, then punches out.
export const PlayBurst: React.FC<{ exitFrame: number }> = ({ exitFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const exit = interpolate(frame, [exitFrame, exitFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = enter * (1 + exit * 5);
  const opacity = 1 - exit;

  const rings = [0, 1, 2].map((i) => {
    const ringProgress = interpolate(
      frame,
      [8 + i * 9, 38 + i * 9],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    return {
      key: i,
      r: 90 + ringProgress * 260,
      opacity: (1 - ringProgress) * 0.5,
    };
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div style={{ transform: `scale(${scale})` }}>
        <svg width={400} height={400} viewBox="-200 -200 400 400">
          <defs>
            <linearGradient id="playGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#7C4DFF" />
            </linearGradient>
          </defs>
          {rings.map((ring) => (
            <circle
              key={ring.key}
              r={ring.r}
              fill="none"
              stroke="url(#playGrad)"
              strokeWidth={3}
              opacity={ring.opacity}
            />
          ))}
          <circle r={88} fill="none" stroke="url(#playGrad)" strokeWidth={7} />
          <path
            d="M -22 -42 L 46 0 L -22 42 Z"
            fill="url(#playGrad)"
            strokeLinejoin="round"
            stroke="url(#playGrad)"
            strokeWidth={14}
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
