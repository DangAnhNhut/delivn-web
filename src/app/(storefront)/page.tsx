import { Hero } from "@/components/home/Hero";
import { CoffeeLines } from "@/components/home/CoffeeLines";
import { PackagingExperience } from "@/components/home/PackagingExperience";
import { BrandStory } from "@/components/home/BrandStory";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CoffeeLines />
      <PackagingExperience />
      <BrandStory />
      <FinalCTA />
    </>
  );
}

