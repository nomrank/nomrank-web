import { ImageResponse } from "next/og";
import { Mark } from "./og-card";

// The app icon: the fox on the plate-dark tile. The browser-tab icon (app/icon.tsx) shows just the head, which stays
// readable at 16 pixels; the home-screen icon (app/apple-icon.tsx) shows the whole mark. iOS rounds its own corners,
// so that one is square.
export async function appIcon(size: number, rounded: boolean, head = false) {
  return new ImageResponse(
    (
      <div
        style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#17111c", borderRadius: rounded ? size * 0.22 : 0 }}
      >
        <Mark size={size * (head ? 0.78 : 0.74)} head={head} />
      </div>
    ),
    { width: size, height: size },
  );
}
