import { Landmark } from "lucide-react";
import PhasePreview from "@/components/dapp/PhasePreview";

/* Replaced a mock with invented APYs and TVLs (and Hedera vaults on an Avalanche app) whose buttons did nothing. */
export default function VaultsPage() {
  return (
    <PhasePreview
      Icon={Landmark}
      title="Vaults"
      intro="Save SIHU and USDT over time in simple, transparent vaults."
      planned={[
        "Savings vaults for SIHU and USDT on Avalanche C-Chain.",
        "Returns, risks and the rules behind them published before any vault opens — no invented yields.",
        "Withdraw at any time to your own wallet.",
      ]}
      actions={[
        { href: "/dapp", label: "Connect a wallet" },
        { href: "/#contact", label: "Ask the SIHU team" },
      ]}
    />
  );
}
