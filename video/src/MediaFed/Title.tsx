import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const WORD_A = "MEDIA";
const WORD_B = "FED";

// Staggered letter reveal: each letter springs up from below a clip edge.
export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const letters = [...WORD_A, ...WORD_B].map((letter, i) => {
    const delay = i * 3;
    const progress = spring({
      frame: frame - delay,
      fps,
      config: { damping: 14, mass: 0.6 },
    });
    const isFed = i >= WORD_A.length;
    return { letter, progress, isFed, key: i };
  });

  const underline = spring({
    frame: frame - letters.length * 3 - 4,
    fps,
    config: { damping: 16 },
  });

  const glow = interpolate(
    Math.sin(frame / 9),
    [-1, 1],
    [0.35, 0.7],
  );

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          overflow: "hidden",
          padding: "10px 20px",
          whiteSpace: "nowrap",
        }}
      >
        {letters.map(({ letter, progress, isFed, key }) => (
          <span
            key={key}
            style={{
              display: "inline-block",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 800,
              fontSize: 190,
              letterSpacing: "0.02em",
              transform: `translateY(${(1 - progress) * 220}px)`,
              opacity: progress,
              color: isFed ? "transparent" : "white",
              backgroundImage: isFed
                ? "linear-gradient(120deg, #00E5FF 0%, #7C4DFF 100%)"
                : undefined,
              backgroundClip: isFed ? "text" : undefined,
              WebkitBackgroundClip: isFed ? "text" : undefined,
              textShadow: isFed
                ? undefined
                : `0 0 ${40 * glow}px rgba(138,184,255,${glow * 0.5})`,
            }}
          >
            {letter}
          </span>
        ))}
      </div>
      <div
        style={{
          height: 8,
          width: 990,
          margin: "0 auto",
          borderRadius: 4,
          transform: `scaleX(${underline})`,
          background: "linear-gradient(90deg, #00E5FF, #7C4DFF)",
          boxShadow: `0 0 ${30 * glow}px rgba(0,229,255,${glow})`,
        }}
      />
    </div>
  );
};
