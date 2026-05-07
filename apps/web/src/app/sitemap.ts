import { MetadataRoute } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: "https://zmkbeauty.com", lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: "https://zmkbeauty.com/login", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: "https://zmkbeauty.com/register", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: "https://zmkbeauty.com/kvkk", lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: "https://zmkbeauty.com/privacy", lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: "https://zmkbeauty.com/terms", lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  // Fetch all active tenants for dynamic store pages
  let storePages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/tenants`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const tenants = await res.json();
      storePages = (tenants || []).flatMap((tenant: any) => [
        {
          url: `https://zmkbeauty.com/${tenant.slug}`,
          lastModified: new Date(tenant.updatedAt),
          changeFrequency: "daily" as const,
          priority: 0.9,
        },
        {
          url: `https://zmkbeauty.com/${tenant.slug}/services`,
          lastModified: new Date(tenant.updatedAt),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        },
        {
          url: `https://zmkbeauty.com/${tenant.slug}/booking`,
          lastModified: new Date(tenant.updatedAt),
          changeFrequency: "daily" as const,
          priority: 0.8,
        },
        {
          url: `https://zmkbeauty.com/${tenant.slug}/profile`,
          lastModified: new Date(tenant.updatedAt),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        },
        {
          url: `https://zmkbeauty.com/${tenant.slug}/contact`,
          lastModified: new Date(tenant.updatedAt),
          changeFrequency: "monthly" as const,
          priority: 0.5,
        },
      ]);
    }
  } catch {}

  return [...staticPages, ...storePages];
}
