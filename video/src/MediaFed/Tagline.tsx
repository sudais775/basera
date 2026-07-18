import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const Tagline: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const tracking = interpolate(frame, [0, 25], [0.9, 0.42], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        textAlign: "center",
        fontFamily: "Helvetica, Arial, sans-serif",
        fontWeight: 400,
        fontSize: 44,
        letterSpacing: `${tracking}em`,
        color: "rgba(255,255,255,0.85)",
        opacity,
        // letter-spacing adds a trailing gap; nudge to keep it optically centered
        paddingLeft: `${tracking}em`,
      }}
    >
      VIDEO EDITING AGENCY
    </div>
  );
};
