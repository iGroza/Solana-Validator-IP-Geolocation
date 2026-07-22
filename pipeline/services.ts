import { axiod } from "axiod";
import ProgressBar from "progressbar";
import { percentageWidget } from "widgets";
import { Config } from "./config.ts";
import {
  ClusterNode,
  IPInfo,
  JitoValidator,
  ProgramAccount,
  Validator,
  VoteAccount,
} from "./types.ts";
import { getMsgStyle, retry } from "./utils.ts";

export class SolanaService {
  constructor(private config: Config) {}

  async getProgramAccounts(): Promise<ProgramAccount[]> {
    return retry(
      async () => {
        const response = await axiod.post(this.config.solanaRpcEndpoint, {
          jsonrpc: "2.0",
          id: 1,
          method: "getProgramAccounts",
          params: [
            "Config1111111111111111111111111111111111111",
            {
              encoding: "jsonParsed",
              filters: [
                {
                  memcmp: {
                    offset: 1,
                    bytes: "Va1idator1nfo111111111111111111111111111111",
                  },
                },
              ],
            },
          ],
        });

        return response.data.result;
      },
      this.config.maxRetries,
      this.config.retryDelay
    );
  }

  async getClusterNodes(): Promise<ClusterNode[]> {
    return retry(
      async () => {
        const response = await axiod.post(this.config.solanaRpcEndpoint, {
          jsonrpc: "2.0",
          id: 1,
          method: "getClusterNodes",
        });
        return response.data.result;
      },
      this.config.maxRetries,
      this.config.retryDelay
    );
  }

  async getVoteAccounts(): Promise<VoteAccount[]> {
    return retry(
      async () => {
        const response = await axiod.post(this.config.solanaRpcEndpoint, {
          jsonrpc: "2.0",
          id: 1,
          method: "getVoteAccounts",
        });
        return response.data?.result?.current;
      },
      this.config.maxRetries,
      this.config.retryDelay
    );
  }

  async getJitoValidators(): Promise<JitoValidator[]> {
    const response = await axiod.get(
      // "https://www.jito.network/api/getKobeValidators"
      "https://kobe.mainnet.jito.network/api/v1/validators"
    );
    return response.data.validators;
  }

  async getValidators(): Promise<Validator[]> {
    const pb = new ProgressBar({
      total: 4,
      widgets: [percentageWidget],
      ...getMsgStyle("Fetching validators data"),
    });

    let progress = 0;
    const [nodes, voteAccounts, programAccounts, jitoValidators] =
      await Promise.all([
        this.getClusterNodes().finally(() => pb.update(++progress)),
        this.getVoteAccounts().finally(() => pb.update(++progress)),
        this.getProgramAccounts().finally(() => pb.update(++progress)),
        this.getJitoValidators().finally(() => pb.update(++progress)),
      ]);

    const validators = nodes.map((node) => {
      const voteAccount = voteAccounts.find(
        (account) => account.nodePubkey === node.pubkey
      );

      if (!voteAccount) return null;

      const programAccount = programAccounts.find(
        (account) =>
          account.account?.data?.parsed?.info?.keys?.[1]?.pubkey ===
          voteAccount.nodePubkey
      );

      const jitoValidator = jitoValidators.find(
        (validator) => validator.vote_account === voteAccount.votePubkey
      );

      const validator: Validator = {
        ...(programAccount?.account?.data?.parsed?.info?.configData || {}),
        nodePubkey: node.pubkey,
        votePubkey: voteAccount.votePubkey,
        activatedStake: voteAccount.activatedStake,
        commission: voteAccount.commission,
        gossip: node.gossip,
        version: node.version,
        programAccount: programAccount?.pubkey,
        isJito: !!jitoValidator,
      };

      return validator;
    });

    pb.finish();
    return validators.filter(
      (validator): validator is Validator => !!validator
    );
  }
}

export class IPInfoService {
  constructor(private config: Config) {}

  async getIPInfo(ip: string): Promise<IPInfo> {
    return retry(
      async () => {
        const response = await axiod.get(
          this.config.ipinfoApiUrl + ip + "?token=" + this.config.ipinfoApiKey
        );
        return response.data;
      },
      this.config.maxRetries,
      this.config.retryDelay
    );
  }
}
