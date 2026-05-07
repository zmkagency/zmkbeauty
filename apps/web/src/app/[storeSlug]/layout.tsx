import { Metadata } from "next";
import StoreLayoutShell from "@/components/StoreLayoutShell";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zmkbeauty.com";

const DAY_MAP: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

async function fetchStore(slug: string) {
  try {
    const res = await fetch(`${API_URL}/tenants/slug/${slug}`, { next: { revalidate: 3600 } });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

async function fetchReviews(tenantId: string) {
  try {
    const res = await fetch(`${API_URL}/reviews/tenant/${tenantId}`, { next: { revalidate: 1800 } });
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string }> }): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);

  const storeName =
    store?.name ||
    storeSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description =
    store?.seoDescription ||
    store?.shortDescription ||
    `${storeName} — ${store?.city || "Türkiye"}'de online randevu alın. Hizmetler, fiyatlar ve müsait saatler tek tıkla.`;
  const canonical = `${SITE_URL}/${storeSlug}`;

  return {
    title: store?.seoTitle || `${storeName} | Online Randevu`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${storeName} | Online Randevu`,
      description,
      type: "website",
      url: canonical,
      images: store?.coverImage ? [{ url: store.coverImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} | Online Randevu`,
      description,
    },
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);
  const reviews = store?.id ? await fetchReviews(store.id) : [];

  const aggregateRating =
    reviews.length > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: (
            reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length
          ).toFixed(1),
          reviewCount: reviews.length,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  const offers =
    store?.services?.map((s: any) => ({
      "@type": "Offer",
      name: s.name,
      price: Number(s.price),
      priceCurrency: s.currency || "TRY",
      availability: "https://schema.org/InStock",
      itemOffered: {
        "@type": "Service",
        name: s.name,
        description: s.description || undefined,
      },
    })) || [];

  // JSON-LD LocalBusiness / BeautySalon Schema
  const jsonLd = store
    ? {
        "@context": "https://schema.org",
        "@type": "BeautySalon",
        "@id": `${SITE_URL}/${storeSlug}#business`,
        name: store.name,
        description: store.description || store.shortDescription,
        url: `${SITE_URL}/${storeSlug}`,
        telephone: store.phone || undefined,
        email: store.email || undefined,
        address: store.address
          ? {
              "@type": "PostalAddress",
              streetAddress: store.address,
              addressLocality: store.district || store.city,
              addressRegion: store.city,
              addressCountry: "TR",
            }
          : undefined,
        geo:
          store.latitude && store.longitude
            ? {
                "@type": "GeoCoordinates",
                latitude: store.latitude,
                longitude: store.longitude,
              }
            : undefined,
        image: store.coverImage || store.logo || undefined,
        logo: store.logo || undefined,
        priceRange: "₺₺",
        currenciesAccepted: "TRY",
        paymentAccepted: "Credit Card, Debit Card, Cash",
        sameAs: store.socialLinks
          ? Object.values(store.socialLinks).filter(Boolean)
          : undefined,
        openingHoursSpecification: store.workingHours
          ? Object.entries(store.workingHours)
              .filter(([_, v]) => v !== null && (v as any)?.open && (v as any)?.close)
              .map(([day, hours]: [string, any]) => ({
                "@type": "OpeningHoursSpecification",
                dayOfWeek: DAY_MAP[day] || day,
                opens: hours?.open,
                closes: hours?.close,
              }))
          : undefined,
        aggregateRating,
        makesOffer: offers.length > 0 ? offers : undefined,
      }
    : null;

  // Breadcrumb structured data — helps Google show breadcrumb in results
  const breadcrumbLd = store
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Anasayfa", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: store.city || "Mağazalar",
            item: `${SITE_URL}/?city=${encodeURIComponent(store.city || "")}`,
          },
          { "@type": "ListItem", position: 3, name: store.name, item: `${SITE_URL}/${storeSlug}` },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      {store ? (
        <StoreLayoutShell
          storeSlug={storeSlug}
          storeName={store.name}
          themeColor={store.themeColor}
        >
          {children}
        </StoreLayoutShell>
      ) : (
        children
      )}
    </>
  );
}
