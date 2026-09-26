import { Hero } from "@/components/home/Hero";
import { Featured } from "@/components/home/Featured";
import { Making } from "@/components/home/Making";
import { Straps } from "@/components/home/Straps";
import { Service } from "@/components/home/Service";
import { Waitlist } from "@/components/home/Waitlist";
import { site } from "@/lib/site";

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  description: site.description,
  logo: `${site.url}/icon.svg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Haddock Lobo, 1.421",
    addressLocality: "São Paulo",
    addressRegion: "SP",
    addressCountry: "BR",
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <Hero />
      <Featured />
      <Making />
      <Straps />
      <Service />
      <Waitlist />
    </>
  );
}
