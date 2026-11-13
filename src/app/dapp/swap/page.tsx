import { ArrowLeftRight } from "lucide-react";
import PhasePreview from "@/components/dapp/PhasePreview";

/* Replaced a mock swap form with a hard-coded rate and a Swap button that did nothing. */
export default function SwapPage() {
  return (
    <PhasePreview
      Icon={ArrowLeftRight}
      title="Swap"
      intro="Exchange AVAX, SIHU and USDT directly from your wallet."
      planned={[
        "Swaps between AVAX, SIHU and USDT at live on-chain prices.",
        "Price impact and network fees shown before you confirm.",
        "Works with the SIHU wallet, Core and MetaMask.",
      ]}
      actions={[
        { href: "/dapp", label: "Connect a wallet" },
        { href: "/ai", label: "Ask SIHU AI" },
      ]}
    />
  );
}
