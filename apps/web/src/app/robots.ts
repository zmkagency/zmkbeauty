import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://zmkbeauty.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/superadmin/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/*/account",
          "/*/login",
          "/*/register",
          "/*/forgot-password",
          "/*/reset-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
