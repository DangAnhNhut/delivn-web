import { TayNguyenHero } from "@/components/home/TayNguyenHero";
import { Hero } from "@/components/home/Hero";
import { CoffeeLines } from "@/components/home/CoffeeLines";
import { PackagingExperience } from "@/components/home/PackagingExperience";
import { SocialConnection } from "@/components/home/SocialConnection";
import { BrandStory } from "@/components/home/BrandStory";
import { FinalCTA } from "@/components/home/FinalCTA";

const HOME_REDESIGN_PHASE_1 = true;

export default function HomePage() {
  if (HOME_REDESIGN_PHASE_1) {
    return (
      <>
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
