export type Address = string;
export type BasisPoints = number;

export const MANIFEST_VERSION = "1.0.0" as const;
export const BPS_DENOMINATOR = 10_000;

export interface TokenMetadata {
  readonly name: string;
  readonly symbol: string;
  readonly uri: string;
  readonly decimals: number;
}

export interface FeeRecipient {
  readonly address: Address;
  readonly basisPoints: BasisPoints;
  readonly label?: string;
}

export interface FeeConfiguration {
  readonly tradeFeeBasisPoints: BasisPoints;
  readonly recipients: readonly FeeRecipient[];
}

export type CurveConfiguration =
  | {
      readonly type: "constant-product";
      readonly virtualTokenReserve: bigint;
      readonly virtualQuoteReserve: bigint;
    }
  | {
      readonly type: "linear";
      readonly initialPrice: bigint;
      readonly slope: bigint;
    };

export interface VestingConfiguration {
  readonly allocation: bigint;
  readonly startTimestamp: number;
  readonly cliffSeconds: number;
  readonly durationSeconds: number;
}

export type GraduationCondition =
  | { readonly type: "quote-reserve"; readonly threshold: bigint }
  | { readonly type: "tokens-sold"; readonly threshold: bigint };

export interface GraduationConfiguration {
  readonly condition: GraduationCondition;
  readonly adapter: Address;
}

export interface LaunchManifest {
  readonly version: typeof MANIFEST_VERSION;
  readonly launch: Address;
  readonly mint: Address;
  readonly creator: Address;
  readonly createdAt: number;
  readonly token: TokenMetadata;
  readonly totalSupply: bigint;
  readonly creatorAllocation: bigint;
  readonly curve: CurveConfiguration;
  readonly fees: FeeConfiguration;
  readonly vesting?: VestingConfiguration;
  readonly graduation: GraduationConfiguration;
  readonly authorities: {
    readonly mintAuthority: null;
    readonly freezeAuthority: null;
    readonly updateAuthority: Address | null;
  };
  readonly security: {
    readonly configurationMutable: false;
    readonly migrationAdapterAllowlisted: true;
  };
  readonly socials?: Readonly<Record<string, string>>;
  readonly modules: readonly string[];
}

export interface CurveState {
  readonly tokenReserve: bigint;
  readonly quoteReserve: bigint;
  readonly tokensSold: bigint;
  readonly graduated: boolean;
}

export interface TradeQuote {
  readonly side: "buy" | "sell";
  readonly amountIn: bigint;
  readonly amountOut: bigint;
  readonly fee: bigint;
  readonly minimumAmountOut: bigint;
  readonly priceImpactBasisPoints: number;
}
