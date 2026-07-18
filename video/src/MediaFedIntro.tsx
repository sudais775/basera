import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background } from "./MediaFed/Background";
import { PlayBurst } from "./MediaFed/PlayBurst";
import { Title } from "./MediaFed/Title";
import { Tagline } from "./MediaFed/Tagline";

const TITLE_START = 48;
const TAGLINE_START = 92;

export const MediaFedIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // White flash on the "cut" where the play button punches out
  const flash = interpolate(
    frame,
    [TITLE_START - 4, TITLE_START, TITLE_START + 6],
    [0, 0.85, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames - 2],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#050508" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <Background />
        <Sequence durationInFrames={TITLE_START + 8}>
          <PlayBurst exitFrame={TITLE_START - 8} />
        </Sequence>
        <Sequence from={TITLE_START}>
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: 48,
            }}
          >
            <Title />
            <Sequence from={TAGLINE_START - TITLE_START} layout="none">
              <Tagline />
            </Sequence>
          </AbsoluteFill>
        </Sequence>
        <AbsoluteFill
          style={{ backgroundColor: "white", opacity: flash }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
