import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BoraCopa",
    short_name: "BoraCopa",
    description: "O bolão da firma · Copa 2026",
    start_url: "/home",
    display: "standalone",
    background_color: "#f5f3ef",
    theme_color: "#15803d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
