import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 180,
  height: 180,
};

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background: "linear-gradient(145deg, #0f172a 0%, #0369a1 60%, #38bdf8 100%)",
          color: "white",
          fontSize: 96,
          fontWeight: 800,
          fontFamily: "Arial, sans-serif",
        }}
      >
        A
      </div>
    ),
    size,
  );
}
