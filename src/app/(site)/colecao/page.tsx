import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionFallback, CollectionView } from "@/components/product/CollectionView";

export const metadata: Metadata = {
  title: "Coleção",
  description: "Oito relógios mecânicos de corda manual e quatro pulseiras, montados à mão no Vallée de Joux.",
  alternates: { canonical: "/colecao" },
};

export default function CollectionPage() {
  return (
    <>
      <header className="frame pt-32 pb-10 md:pt-40 md:pb-14">
        <h1 className="display-xl">Coleção</h1>
        <p className="lede mt-5">
          Oito relógios de corda manual e quatro pulseiras, todos montados à mão em Le Sentier e regulados em cinco
          posições.
        </p>
      </header>
      <Suspense fallback={<CollectionFallback />}>
        <CollectionView />
      </Suspense>
    </>
  );
}
