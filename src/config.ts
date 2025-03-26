export interface Config {
  solanaRpcEndpoint: string;
  ipinfoApiUrl: string;
  ipinfoApiKey: string;
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  outputFile: string;
}

export const defaultConfig: Config = {
  solanaRpcEndpoint: "https://api.mainnet-beta.solana.com",
  ipinfoApiUrl: "https://ipinfo.io/",
  ipinfoApiKey: Deno.env.get("IPINFO_API_KEY") || "",
  batchSize: 5,
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  outputFile: "solana_validators.csv",
}; 