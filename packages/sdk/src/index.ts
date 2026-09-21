import {
  graduationProgress,
  quoteBuy,
  validateManifest,
  vestedAmount,
  type Address,
  type CurveState,
  type LaunchManifest,
  type TradeQuote
} from "@loompad/protocol";

export interface LaunchAccount {
  readonly manifest: LaunchManifest;
  readonly state: CurveState;
}

export interface CreateLaunchRequest {
  readonly manifest: LaunchManifest;
}

export interface TradeRequest {
  readonly launch: Address;
  readonly trader: Address;
  readonly amountIn: bigint;
  readonly minimumAmountOut: bigint;
}

export interface LoomPadTransport {
  readonly getLaunch: (address: Address) => Promise<LaunchAccount | null>;
  readonly listLaunches: () => Promise<readonly LaunchAccount[]>;
  readonly submitCreate: (request: CreateLaunchRequest) => Promise<string>;
  readonly submitBuy: (request: TradeRequest) => Promise<string>;
  readonly submitSell: (request: TradeRequest) => Promise<string>;
}

export interface LoomPadClientOptions {
  readonly transport: LoomPadTransport;
  readonly defaultSlippageBasisPoints?: number;
}

export class LoomPadClient {
  readonly #transport: LoomPadTransport;
  readonly #slippage: number;

  public constructor(options: LoomPadClientOptions) {
    this.#transport = options.transport;
    this.#slippage = options.defaultSlippageBasisPoints ?? 100;
  }

  public async createLaunch(manifest: LaunchManifest): Promise<string> {
    validateManifest(manifest);
    return this.#transport.submitCreate({ manifest });
  }

  public async getLaunch(address: Address): Promise<LaunchAccount> {
    const launch = await this.#transport.getLaunch(address);
    if (!launch) throw new Error(`Launch not found: ${address}`);
    validateManifest(launch.manifest);
    return launch;
  }

  public listLaunches(): Promise<readonly LaunchAccount[]> {
    return this.#transport.listLaunches();
  }

  public estimateBuy(
    launch: LaunchAccount,
    quoteAmount: bigint,
    slippageBasisPoints = this.#slippage
  ): TradeQuote {
    return quoteBuy(
      launch.manifest.curve,
      launch.state,
      quoteAmount,
      launch.manifest.fees,
      slippageBasisPoints
    );
  }

  public async buy(
    launch: LaunchAccount,
    trader: Address,
    quoteAmount: bigint,
    slippageBasisPoints = this.#slippage
  ): Promise<string> {
    const quote = this.estimateBuy(launch, quoteAmount, slippageBasisPoints);
    return this.#transport.submitBuy({
      launch: launch.manifest.launch,
      trader,
      amountIn: quoteAmount,
      minimumAmountOut: quote.minimumAmountOut
    });
  }

  public sell(request: TradeRequest): Promise<string> {
    if (request.amountIn <= 0n || request.minimumAmountOut < 0n)
      throw new Error("Trade amounts are invalid");
    return this.#transport.submitSell(request);
  }

  public getGraduationProgress(launch: LaunchAccount): number {
    return graduationProgress(launch.manifest.graduation, launch.state);
  }

  public getVestedCreatorTokens(
    launch: LaunchAccount,
    timestamp = Math.floor(Date.now() / 1_000)
  ): bigint {
    return launch.manifest.vesting ? vestedAmount(launch.manifest.vesting, timestamp) : 0n;
  }
}

export * from "@loompad/protocol";
