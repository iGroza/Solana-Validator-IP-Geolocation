import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import ProgressBar from "progressbar";
import { percentageWidget } from "widgets";

import { defaultConfig } from "./config.ts";
import { IPInfoService, SolanaService } from "./services.ts";
import { getMsgStyle, sanitizeCsvValue } from "./utils.ts";
import { ValidatorData } from "./types.ts";

async function saveToCsv(data: ValidatorData[], outputFile: string) {
  const csvHeaders = [
    "IP",
    "City",
    "Region",
    "Country",
    "Loc",
    "Hosting",
    "HostingCompanyId",
    "Timezone",
    "Name",
    "Website",
    "IconUrl",
    "Details",
    "KeybaseUsername",
    "ActivatedStake",
    "Commission",
    "NodePubkey",
    "VotePubkey",
    "ProgramAccount",
    "ValidatorVersion",
    "IsJito",
  ];

  const csvRows = [csvHeaders.join(",")];
  const sortedData = data.sort((a, b) =>
    a.votePubkey.localeCompare(b.votePubkey)
  );

  for (const row of sortedData) {
    const hostingCompanyName = row.org.split(" ").slice(1).join(" ");
    const hostingCompanyId = row.org.split(" ")[0];

    const values = [
      row.ip,
      sanitizeCsvValue(row.city),
      sanitizeCsvValue(row.region),
      row.country,
      sanitizeCsvValue(row.loc),
      sanitizeCsvValue(hostingCompanyName),
      sanitizeCsvValue(hostingCompanyId),
      sanitizeCsvValue(row.timezone),
      sanitizeCsvValue(row.name),
      sanitizeCsvValue(row.website),
      sanitizeCsvValue(row.iconUrl),
      sanitizeCsvValue(row.details),
      sanitizeCsvValue(row.keybaseUsername),
      row.activatedStake,
      row.commission,
      row.nodePubkey,
      row.votePubkey,
      row.programAccount,
      row.version,
      row.isJito,
    ];
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  await Deno.writeTextFile(outputFile, csvContent);
}

async function main() {
  if (!defaultConfig.ipinfoApiKey) {
    console.error(
      colors.red(
        "IPINFO_API_KEY environment variable is required to run this script.\nPlease visit https://ipinfo.io/signup to get an API key."
      )
    );
    return;
  }

  try {
    const solanaService = new SolanaService(defaultConfig);
    const ipInfoService = new IPInfoService(defaultConfig);

    const validNodes = await solanaService.getValidators();
    console.log(`Found ${validNodes.length} validators`);

    const pb = new ProgressBar({
      total: validNodes.length,
      widgets: [percentageWidget],
      ...getMsgStyle("Fetching IP data"),
    });

    const validatorData: ValidatorData[] = [];
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < validNodes.length; i += defaultConfig.batchSize) {
      const batch = validNodes.slice(i, i + defaultConfig.batchSize);

      await Promise.all(
        batch.map(async (node) => {
          try {
            const ip = node.gossip.split(":")[0];
            const info = await ipInfoService.getIPInfo(ip);

            validatorData.push({
              ip: info.ip,
              city: info.city || "Unknown",
              region: info.region || "Unknown",
              country: info.country || "Unknown",
              loc: info.loc || "Unknown",
              org: info.org || "Unknown",
              timezone: info.timezone || "Unknown",
              ...node,
            });
          } catch {
            errors++;
          } finally {
            processed++;
            await pb.update(processed);
          }
        })
      );
    }
    await pb.finish();

    const csvPb = new ProgressBar({
      total: 1,
      widgets: [percentageWidget],
      ...getMsgStyle("Saving data to CSV file"),
    });

    await csvPb.update(0);
    await saveToCsv(validatorData, defaultConfig.outputFile);
    await csvPb.update(1);
    await csvPb.finish();

    console.log("\n" + colors.bold("Summary:"));
    console.log(
      `${colors.green("✓")} Validator nodes: ${colors.bold(
        String(validNodes.length)
      )}`
    );
    console.log(
      `${colors.green("✓")} Successfully geolocated IPs: ${colors.bold(
        String(validatorData.length)
      )}`
    );

    if (validatorData.length < validNodes.length) {
      console.log(
        `${colors.yellow("!")} Failed to process: ${colors.bold(
          String(validNodes.length - validatorData.length)
        )} nodes`
      );
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
