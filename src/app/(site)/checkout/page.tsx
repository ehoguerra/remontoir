import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="frame pt-28 pb-24 md:pt-36 md:pb-32">
      <h1 className="display-xl">Finalizar compra</h1>
      <CheckoutForm />
    </div>
  );
}
