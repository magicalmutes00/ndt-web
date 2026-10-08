import { Helmet } from "react-helmet-async";
import { useContent } from "../../content/ContentProvider";
import type { RouteKey } from "../../../shared/content/schema.js";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

/**
 * Per-route metadata.
 *
 * Titles and descriptions come from the editable content document, so an admin
 * can change what search engines see without a deploy. The `title`/`description`
 * props remain as an explicit override for the rare case content has no entry.
 */
export function SEO({ title, description, path = "", image, type = "website", publishedTime }: SEOProps) {
  const content = useContent();
  const { settings, seo } = content;

  const entry = path in seo ? seo[path as RouteKey] : undefined;
  const resolvedTitle = title ?? entry?.title;
  const resolvedDescription = description ?? entry?.description ?? settings.description;

  const siteTitle = resolvedTitle
    ? `${resolvedTitle} | ${settings.name}`
    : `${settings.name} — ${settings.tagline}`;
  const siteUrl = `https://${settings.domain}`;
  const url = `${siteUrl}${path}`;
  const shareImage = image ?? entry?.image ?? "/og-image.jpg";
  const shareImageUrl = /^https?:\/\//.test(shareImage) ? shareImage : `${siteUrl}${shareImage}`;

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={shareImageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={settings.name} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={shareImageUrl} />

      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: settings.fullName,
          description: resolvedDescription,
          url,
          ...(path === "/" && {
            telephone: settings.phone,
            email: settings.email,
            address: {
              "@type": "PostalAddress",
              streetAddress: settings.address.line1,
              addressLocality: settings.address.city,
              addressRegion: settings.address.state,
              postalCode: settings.address.pincode,
              addressCountry: settings.address.country,
            },
          }),
        })}
      </script>
    </Helmet>
  );
}
