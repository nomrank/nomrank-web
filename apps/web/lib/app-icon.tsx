import { ImageResponse } from "next/og";
import { Mark } from "./og-card";

// The app icon: the mark on the plate-dark tile, as in the owner's artwork. Used for the favicon (app/icon.tsx) and the
// home-screen icon (app/apple-icon.tsx); iOS rounds its own corners, so that one is square.
export async function appIcon(size: number, rounded: boolean) {
  return new ImageResponse(
    (
      <div
        style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#17111c", borderRadius: rounded ? size * 0.22 : 0 }}
      >
        <Mark size={size * 0.72} />
      </div>
    ),
    { width: size, height: size },
  );
}
