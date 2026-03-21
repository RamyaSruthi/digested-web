import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Digested",
    short_name: "Digested",
    description: "Save, organize, and digest links that matter",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7F77DD",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    // share_target is not in Next.js types yet, cast to avoid TS error
    ...({
      share_target: {
        action: "/api/share",
        method: "GET",
        params: { title: "title", text: "text", url: "url" },
      },
    } as Record<string, unknown>),
  };
}
