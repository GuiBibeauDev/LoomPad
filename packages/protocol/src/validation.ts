import { BPS_DENOMINATOR, MANIFEST_VERSION } from "./types.js";
import type { FeeConfiguration, LaunchManifest } from "./types.js";
import { LoomPadError } from "./errors.js";

const MAX_U64 = 18_446_744_073_709_551_615n;
const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const HTTPS_URI = /^https:\/\//i;

function assertU64(value: bigint, field: string): void {
  if (value < 0n || value > MAX_U64) {
    throw new LoomPadError(
      "ARITHMETIC_OVERFLOW",
      `${field} must fit in an unsigned 64-bit integer`
    );
  }
}

export function assertAddress(value: string, field = "address"): void {
  if (!BASE58_ADDRESS.test(value)) {
    throw new LoomPadError("INVALID_ADDRESS", `${field} is not a canonical Solana address`, {
      field
    });
  }
}

export function validateFeeConfiguration(fees: FeeConfiguration): void {
  if (
    !Number.isInteger(fees.tradeFeeBasisPoints) ||
    fees.tradeFeeBasisPoints < 0 ||
    fees.tradeFeeBasisPoints > 1_000
  ) {
    throw new LoomPadError(
      "INVALID_FEE_CONFIGURATION",
      "trade fee must be between 0 and 1,000 basis points"
    );
  }
  if (fees.recipients.length === 0 || fees.recipients.length > 8) {
    throw new LoomPadError(
      "INVALID_FEE_CONFIGURATION",
      "fee routing requires between one and eight recipients"
    );
  }
  const seen = new Set<string>();
  let total = 0;
  for (const recipient of fees.recipients) {
    assertAddress(recipient.address, "fee recipient");
    if (seen.has(recipient.address)) {
      throw new LoomPadError("INVALID_FEE_CONFIGURATION", "fee recipient addresses must be unique");
    }
    seen.add(recipient.address);
    if (!Number.isInteger(recipient.basisPoints) || recipient.basisPoints <= 0) {
      throw new LoomPadError(
        "INVALID_FEE_CONFIGURATION",
        "recipient share must be a positive integer"
      );
    }
    total += recipient.basisPoints;
  }
  if (total !== BPS_DENOMINATOR) {
    throw new LoomPadError(
      "INVALID_FEE_CONFIGURATION",
      "recipient shares must sum to 10,000 basis points",
      { total }
    );
  }
}

export function validateManifest(manifest: LaunchManifest): void {
  if (manifest.version !== MANIFEST_VERSION) {
    throw new LoomPadError(
      "INVALID_MANIFEST",
      `unsupported manifest version: ${manifest.version as string}`
    );
  }
  assertAddress(manifest.launch, "launch");
  assertAddress(manifest.mint, "mint");
  assertAddress(manifest.creator, "creator");
  if (manifest.token.name.trim().length < 1 || manifest.token.name.length > 32) {
    throw new LoomPadError("INVALID_MANIFEST", "token name must contain 1 to 32 characters");
  }
  if (!/^[A-Z0-9]{1,10}$/.test(manifest.token.symbol)) {
    throw new LoomPadError(
      "INVALID_MANIFEST",
      "symbol must contain 1 to 10 uppercase letters or digits"
    );
  }
  if (!HTTPS_URI.test(manifest.token.uri) || manifest.token.uri.length > 200) {
    throw new LoomPadError(
      "INVALID_MANIFEST",
      "metadata URI must be an HTTPS URL of at most 200 characters"
    );
  }
  if (
    !Number.isInteger(manifest.token.decimals) ||
    manifest.token.decimals < 0 ||
    manifest.token.decimals > 9
  ) {
    throw new LoomPadError("INVALID_MANIFEST", "token decimals must be between 0 and 9");
  }
  assertU64(manifest.totalSupply, "totalSupply");
  assertU64(manifest.creatorAllocation, "creatorAllocation");
  if (manifest.totalSupply === 0n || manifest.creatorAllocation > manifest.totalSupply) {
    throw new LoomPadError(
      "INVALID_MANIFEST",
      "supply must be positive and cover the creator allocation"
    );
  }
  if (!Number.isSafeInteger(manifest.createdAt) || manifest.createdAt <= 0) {
    throw new LoomPadError("INVALID_MANIFEST", "createdAt must be a positive Unix timestamp");
  }
  if (
    manifest.authorities.mintAuthority !== null ||
    manifest.authorities.freezeAuthority !== null ||
    manifest.security.configurationMutable ||
    !manifest.security.migrationAdapterAllowlisted
  ) {
    throw new LoomPadError(
      "INVALID_MANIFEST",
      "version 1 requires revoked mint/freeze authorities, immutable configuration, and an allowlisted adapter"
    );
  }
  for (const [name, url] of Object.entries(manifest.socials ?? {})) {
    if (name.length > 32 || !HTTPS_URI.test(url) || url.length > 200) {
      throw new LoomPadError(
        "INVALID_MANIFEST",
        "social metadata must use short keys and HTTPS URLs"
      );
    }
  }
  validateFeeConfiguration(manifest.fees);

  if (manifest.curve.type === "constant-product") {
    assertU64(manifest.curve.virtualTokenReserve, "virtualTokenReserve");
    assertU64(manifest.curve.virtualQuoteReserve, "virtualQuoteReserve");
    if (manifest.curve.virtualTokenReserve === 0n || manifest.curve.virtualQuoteReserve === 0n) {
      throw new LoomPadError("INVALID_CURVE_CONFIGURATION", "virtual reserves must be positive");
    }
  } else {
    assertU64(manifest.curve.initialPrice, "initialPrice");
    assertU64(manifest.curve.slope, "slope");
    if (manifest.curve.initialPrice === 0n) {
      throw new LoomPadError("INVALID_CURVE_CONFIGURATION", "initial price must be positive");
    }
  }

  if (manifest.vesting) {
    assertU64(manifest.vesting.allocation, "vesting allocation");
    if (
      manifest.vesting.allocation !== manifest.creatorAllocation ||
      manifest.vesting.durationSeconds <= 0 ||
      manifest.vesting.cliffSeconds < 0 ||
      manifest.vesting.cliffSeconds > manifest.vesting.durationSeconds
    ) {
      throw new LoomPadError(
        "INVALID_VESTING_CONFIGURATION",
        "vesting must cover the creator allocation with a valid cliff and duration"
      );
    }
  } else if (manifest.creatorAllocation !== 0n) {
    throw new LoomPadError(
      "INVALID_VESTING_CONFIGURATION",
      "a non-zero creator allocation requires vesting"
    );
  }

  assertAddress(manifest.graduation.adapter, "graduation adapter");
  assertU64(manifest.graduation.condition.threshold, "graduation threshold");
  if (manifest.graduation.condition.threshold === 0n) {
    throw new LoomPadError(
      "INVALID_GRADUATION_CONFIGURATION",
      "graduation threshold must be positive"
    );
  }
}
