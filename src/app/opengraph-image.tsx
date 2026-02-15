import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #0ea5e9 55%, #e0f2fe 100%)",
          color: "#ffffff",
          padding: "64px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          AgentLink
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "900px" }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>Discover Trusted AI Agents</div>
          <div style={{ fontSize: 34, opacity: 0.95 }}>Profiles, protocols, reviews, MCP and A2A readiness.</div>
        </div>
        <div style={{ fontSize: 26, opacity: 0.9 }}>www.agent-l.ink</div>
      </div>
    ),
    {
      ...size,
    },
  );
}
