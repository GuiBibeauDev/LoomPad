export type LoomPadErrorCode =
  | "INVALID_ADDRESS"
  | "INVALID_MANIFEST"
  | "INVALID_FEE_CONFIGURATION"
  | "INVALID_CURVE_CONFIGURATION"
  | "INVALID_VESTING_CONFIGURATION"
  | "INVALID_GRADUATION_CONFIGURATION"
  | "ARITHMETIC_OVERFLOW"
  | "INSUFFICIENT_LIQUIDITY"
  | "SLIPPAGE_EXCEEDED";

export class LoomPadError extends Error {
  public constructor(
    public readonly code: LoomPadErrorCode,
    message: string,
    public readonly details: Readonly<Record<string, unknown>> = {}
  ) {
    super(message);
    this.name = "LoomPadError";
  }
}
