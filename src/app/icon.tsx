import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 512,
  height: 512,
};

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 96,
          background: "linear-gradient(145deg, #0f172a 0%, #0369a1 60%, #38bdf8 100%)",
          color: "white",
          fontSize: 210,
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
