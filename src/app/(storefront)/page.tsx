import type { Metadata } from "next";

import { TayNguyenHero } from "@/components/home/TayNguyenHero";
import { Hero } from "@/components/home/Hero";
import { CoffeeLines } from "@/components/home/CoffeeLines";
import { PackagingExperience } from "@/components/home/PackagingExperience";
import { SocialConnection } from "@/components/home/SocialConnection";
import { BrandStory } from "@/components/home/BrandStory";
import { FinalCTA } from "@/components/home/FinalCTA";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const HOME_REDESIGN_PHASE_1 = true;

export default function HomePage() {
  const organizationJsonLd = serializeJsonLd(buildOrganizationJsonLd());
  const webSiteJsonLd = serializeJsonLd(buildWebSiteJsonLd());

  if (HOME_REDESIGN_PHASE_1) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: webSiteJsonLd }}
        />
        <TayNguyenHero />
        <CoffeeLines />
        <PackagingExperience />
        <SocialConnection />
      </>
    );
  }

  return (
    <>
      <Hero />
      <CoffeeLines />
      <PackagingExperience />
      <SocialConnection />
      <BrandStory />
      <FinalCTA />
    </>
  );
}
