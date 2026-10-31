import type { MetadataRoute } from "next";

// What a phone needs to put Nomrank on the home screen: the name, the dark plate colour behind the splash, and the fox.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nomrank",
    short_name: "Nomrank",
    description: "Rate the dish, not the place.",
    start_url: "/",
    display: "standalone",
    background_color: "#17111c",
    theme_color: "#17111c",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
