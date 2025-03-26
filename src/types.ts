export interface ClusterNode {
  gossip: string;
  rpc: string;
  tpu: string;
  pubkey: string;
  version: string;
}

export interface VoteAccount {
  nodePubkey: string;
  activatedStake: number;
  commission: number;
  epochCredits: Array<[number, number, number]>;
  epochVoteAccount: boolean;
  lastVote: number;
  rootSlot: number;
  votePubkey: string;
}

export interface IPInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  org: string;
  timezone: string;
}

export interface ProgramConfigData {
  name?: string;
  website?: string;
  iconUrl?: string;
  details?: string;
  keybaseUsername?: string;
}

export interface ProgramAccount {
  pubkey: string;
  account: {
    data: {
      parsed: {
        info: {
          configData: ProgramConfigData;
          keys: {
            pubkey: string;
            signer: boolean;
          }[];
        };
      };
    };
  };
}

export interface JitoValidator {
  vote_account: string;
  mev_commission_bps: number;
  mev_rewards: number;
  running_jito: boolean;
  active_stake: number;
}

export type Validator = Pick<ClusterNode, "gossip" | "version"> &
  ProgramConfigData &
  Pick<
    VoteAccount,
    "nodePubkey" | "votePubkey" | "activatedStake" | "commission"
  > & {
    programAccount?: string;
    isJito: boolean;
  };

export type ValidatorData = Validator & IPInfo;
