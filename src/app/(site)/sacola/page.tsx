import type { Metadata } from "next";
import { BagView } from "@/components/cart/BagView";

export const metadata: Metadata = {
  title: "Sacola",
  robots: { index: false, follow: true },
};

export default function BagPage() {
  return (
    <div className="frame pt-28 pb-24 md:pt-36 md:pb-32">
      <h1 className="display-xl">Sacola</h1>
      <BagView />
    </div>
  );
}
