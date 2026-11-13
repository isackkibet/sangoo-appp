import { Droplets } from "lucide-react";
import PhasePreview from "@/components/dapp/PhasePreview";

/* Replaced a mock with invented TVL and trade counts and buttons that did nothing. */
export default function PoolsPage() {
  return (
    <PhasePreview
      Icon={Droplets}
      title="Community pools"
      intro="Add liquidity to SIHU community pools on Avalanche so members can exchange tokens, with fees supporting work around the lake."
      planned={[
        "SIHU / AVAX and SIHU / USDT pools on Avalanche C-Chain.",
        "Clear, live figures for each pool — liquidity, volume and fees — read from the network.",
        "A share of pool fees directed to conservation projects in the basin.",
      ]}
      actions={[
        { href: "/dapp", label: "Connect a wallet" },
        { href: "/portal", label: "Read SIHU news" },
      ]}
    />
  );
}
