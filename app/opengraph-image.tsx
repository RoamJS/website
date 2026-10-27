import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "RoamJS — A better way to work in Roam. More flow. Less friction.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const OpenGraphImage = async (): Promise<ImageResponse> => {
  const source = await readFile(
    join(process.cwd(), "public/roamjs-logo.svg"),
    "utf8",
  );
  // ImageResponse's SVG decoder needs sRGB equivalents of the header logo's colors.
  const logo = source
    .replaceAll("oklch(68.5% 0.169 237.323)", "#00a6f4")
    .replaceAll("oklch(75% 0.183 55.934)", "#ff8904");

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "64px 76px",
        background: "#17191c",
        color: "#f5f5f4",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* ImageResponse embeds the local brand asset without a network request. */}
        <img
          src={`data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`}
          width={90}
          height={90}
          alt=""
        />
        <span style={{ fontSize: 48, fontWeight: 700 }}>RoamJS</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -3,
          }}
        >
          <span>A better way</span>
          <span>to work in Roam.</span>
        </div>
        <div style={{ fontSize: 32, color: "#b7b9be" }}>
          More flow. Less friction.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          color: "#b7b9be",
        }}
      >
        <span>The RoamJS plugin library</span>
        <span>roamjs.com</span>
      </div>
    </div>,
    size,
  );
};

export default OpenGraphImage;
