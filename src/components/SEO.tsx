import React, { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  canonicalUrl?: string;
  schemaData?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = "Official platform of BatoTutariGito NGO, driving youth education, student sponsorships, cow distribution initiatives, and community support in Rwanda.",
  keywords = "BatoTutariGito, Rwanda NGO, community sponsorship, student sponsorship, cow project, family support, Rubengera",
  ogType = "website",
  ogImage = "/logo.png",
  canonicalUrl,
  schemaData,
}) => {
  useEffect(() => {
    // Dynamic page title update
    const defaultSuffix = " | BatoTutariGito Rwanda";
    const fullTitle = title.includes("BatoTutariGito") ? title : `${title}${defaultSuffix}`;
    document.title = fullTitle;

    // Update Meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);

    // Update Meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.setAttribute("name", "keywords");
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute("content", keywords);

    // Update Open Graph tags
    const ogTags = [
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:image", content: ogImage },
      { property: "og:type", content: ogType },
    ];

    ogTags.forEach((tag) => {
      let element = document.querySelector(`meta[property="${tag.property}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", tag.property);
        document.head.appendChild(element);
      }
      element.setAttribute("content", tag.content);
    });

    // Update Twitter Card tags
    const twitterTags = [
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ];

    twitterTags.forEach((tag) => {
      let element = document.querySelector(`meta[name="${tag.name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", tag.name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", tag.content);
    });

    // Dynamic schema JSON-LD injection
    let jsonLdScript = document.getElementById("json-ld-structured-data") as HTMLScriptElement | null;
    if (schemaData) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement("script");
        jsonLdScript.id = "json-ld-structured-data";
        jsonLdScript.type = "application/ld+json";
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(schemaData);
    } else {
      if (jsonLdScript) {
        jsonLdScript.remove();
      }
    }

    // Dynamic canonical link injection
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", canonicalUrl);
    } else {
      if (canonical) {
        canonical.remove();
      }
    }
  }, [title, description, keywords, ogType, ogImage, canonicalUrl, schemaData]);

  return null;
};
