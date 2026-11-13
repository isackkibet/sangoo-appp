import { Pickaxe } from "lucide-react";
import PhasePreview from "@/components/dapp/PhasePreview";
import { KAI_URL } from "@/services/kaiHubService";

/* Replaced a mock (fake whitelist spots, a 24h countdown, a "claim 100 SIHU" button and random mint ids). */
export default function MinePage() {
  return (
    <PhasePreview
      Icon={Pickaxe}
      title="Mine SIHU"
      intro="Earn SIHU tokens for verified stewardship work around Lake Victoria — planting trees, raising seedlings and checking environmental reports."
      planned={[
        "Rewards for nursery and tree-planting records that Community Forest Associations log on KAI and that are independently verified.",
        "Rewards for careful checks of field photos in SIHU Verify.",
        "Rewards paid to your connected Avalanche wallet once the SIHU token is deployed on-chain.",
      ]}
      actions={[
        { href: "/verify", label: "Verify field photos" },
        { href: `${KAI_URL}/nursery`, label: "Record nursery work on KAI", external: true },
        { href: "/dapp", label: "Back to DApp overview" },
      ]}
    />
  );
}
