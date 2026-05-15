import type { MetadataRoute } from "next"
import { PROPERTIES } from "@/lib/properties"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://daromiaicha.mbstn.com"
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...PROPERTIES.filter((p) => p.active).map((p) => ({
      url: `${base}/bien/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ]
}
