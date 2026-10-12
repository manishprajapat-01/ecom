import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/api/admin"],
      },
    ],
    sitemap: `${SITE_CONFIG.appUrl}/sitemap.xml`,
  };
}
