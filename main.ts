import { axiod } from "https://deno.land/x/axiod/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import ProgressBar, {
  StyleFn,
} from "https://deno.land/x/progressbar@v0.2.0/progressbar.ts";
import { bar } from "https://deno.land/x/progressbar@v0.2.0/styles.ts";

import { percentageWidget } from "https://deno.land/x/progressbar@v0.2.0/widgets.ts";

const solanaRpcEndpoint = "https://api.mainnet-beta.solana.com";
const ipinfoApiUrl = "https://ipinfo.io/";

interface ClusterNode {
  gossip: string;
  rpc: string;
  tpu: string;
  pubkey: string;
}

interface VoteAccount {
  nodePubkey: string;
  activatedStake: number;
  commission: number;
  epochCredits: Array<[number, number, number]>;
  epochVoteAccount: boolean;
  lastVote: number;
  rootSlot: number;
  votePubkey: string;
}

interface IPInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  org: string;
  timezone: string;
}

interface ValidatorData extends IPInfo {
  pubkey: string;
  activatedStake: number;
  rpc: boolean;
}

function getMsgStyle(msg: string) {
  return {
    style: (...args: Parameters<StyleFn>) =>
      `${bar(...args)} ${colors.bold(msg)}`,
  };
}

async function getClusterNodes(): Promise<ClusterNode[]> {
  const pb = new ProgressBar({
    total: 1,
    widgets: [percentageWidget],
    ...getMsgStyle("Fetching Solana cluster nodes"),
  });
  await pb.update(0);

  try {
    const response = await axiod.post(solanaRpcEndpoint, {
      jsonrpc: "2.0",
      id: 1,
      method: "getClusterNodes",
    });

    await pb.update(1);
    await pb.finish();
    return response.data.result;
  } catch (error) {
    if (error instanceof Error) {
      await pb.update(0);
      await pb.finish();
      console.error(
        colors.red(`Error fetching cluster nodes: ${error.message}`),
      );
    }
    throw error;
  }
}

async function getVoteAccounts() {
  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "getVoteAccounts",
  };

  const response = await fetch(solanaRpcEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP Error! Status: ${response.status}`);
  }

  const data = await response.json();
  const activatedStake: Record<string, number> = {};
  const validatorPubkeys = data.result.current.map((account: VoteAccount) => {
    activatedStake[account.nodePubkey] = account.activatedStake;
    return account.nodePubkey;
  });
  return { validatorPubkeys, activatedStake };
}

async function getIPInfo(ip: string, apiKey: string): Promise<IPInfo> {
  const response = await axiod.get(ipinfoApiUrl + ip + "?token=" + apiKey);
  return response.data;
}

async function main() {
  const apiKey = Deno.env.get("IPINFO_API_KEY");

  if (!apiKey) {
    console.error(
      colors.red(
        "IPINFO_API_KEY environment variable is required to run this script.\nPlease visit https://ipinfo.io/signup to get an API key.",
      ),
    );
    return;
  }

  try {
    const nodes = await getClusterNodes();
    const { validatorPubkeys, activatedStake } = await getVoteAccounts();
    const validNodes = nodes.filter(
      (node) => node.gossip && validatorPubkeys.includes(node.pubkey),
    );

    const pb = new ProgressBar({
      total: validNodes.length,
      widgets: [percentageWidget],
      ...getMsgStyle("Fetching IP data"),
    });

    const validatorData: ValidatorData[] = [];
    let processed = 0;
    let errors = 0;

    const batchSize = 5;
    for (let i = 0; i < validNodes.length; i += batchSize) {
      const batch = validNodes.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (node) => {
          try {
            if (!node.gossip) return;

            const ip = node.gossip.split(":")[0];
            const info = await getIPInfo(ip, apiKey);

            validatorData.push({
              ip: info.ip,
              city: info.city || "Unknown",
              region: info.region || "Unknown",
              country: info.country || "Unknown",
              loc: info.loc || "Unknown",
              org: info.org || "Unknown",
              timezone: info.timezone || "Unknown",
              pubkey: node.pubkey,
              activatedStake: activatedStake[node.pubkey],
              rpc: !!node.rpc,
            });
          } catch {
            errors++;
          } finally {
            processed++;
            await pb.update(processed);
          }
        }),
      );
    }
    await pb.finish();

    const csvPb = new ProgressBar({
      total: 1,
      widgets: [percentageWidget],
      ...getMsgStyle("Saving data to CSV file"),
    });

    await csvPb.update(0);

    const csvHeaders = [
      "IP",
      "City",
      "Region",
      "Country",
      "Loc",
      "Hosting",
      "Timezone",
      "Pubkey",
      "ActivatedStake",
      "RPC"
    ];    

    const csvRows = [csvHeaders.join(",")];
    const sortedValidatorData = validatorData.sort((a, b) =>
      a.pubkey.localeCompare(b.pubkey)
    );
    for (const data of sortedValidatorData) {
      const row = [
        data.ip,
        data.city.replace(/,/g, " "),
        data.region.replace(/,/g, " "),
        data.country,
        data.loc.replace(/,/g, " "),
        data.org.replace(/,/g, " "),
        data.timezone.replace(/,/g, " "),
        data.pubkey,
        data.activatedStake,
        data.rpc,
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");
    const csvFilePath = join(Deno.cwd(), "solana_validators.csv");

    try {
      await Deno.writeTextFile(csvFilePath, csvContent);
      await csvPb.update(1);
    } catch (error) {
      await csvPb.update(0);
      console.error(colors.red(`Error saving CSV file: ${error}`));
    }
    await csvPb.finish();

    console.log("\n" + colors.bold("Summary:"));
    console.log(`${colors.green("✓")} Total nodes retrieved: ${colors.bold(String(nodes.length))}`);
    console.log(`${colors.green("✓")} Validator nodes: ${colors.bold(String(validNodes.length))}`);
    console.log(`${colors.green("✓")} Successfully geolocated IPs: ${colors.bold(String(validatorData.length))}`);

    if (validatorData.length < validNodes.length) {
      console.log(`${colors.yellow("!")} Failed to process: ${colors.bold(String(validNodes.length - validatorData.length))} nodes`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(colors.red(`Fatal error: ${error.message}`));
    }
  } finally {
    Deno.stdout.write(new TextEncoder().encode("\x1b[?25h"));
  }
}

await main();
