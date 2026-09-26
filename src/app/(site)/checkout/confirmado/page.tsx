import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

export default function ConfirmedPage() {
  return (
    <div className="frame pt-28 pb-24 md:pt-36 md:pb-32">
      <OrderConfirmation />
    </div>
  );
}
