/**
 * Live verification script against GIWA Sepolia.
 *
 * Exercises the read paths implemented in GiwaClient / DojangManager /
 * GiwaIdManager against the real network. Not covered by `tsc --noEmit`
 * (outside `src/`) or `eslint` - run standalone with `pnpm verify:live`.
 *
 * Never import `../src/index` here - it pulls in the React Native
 * `react-native-get-random-values` polyfill, which is not available
 * under plain Node/tsx.
 */
import type { Address } from 'viem';
import { GiwaClient } from '../src/core/GiwaClient';
import { DojangManager } from '../src/core/DojangManager';
import { GiwaIdManager } from '../src/core/GiwaIdManager';
import { ZERO_ADDRESS } from '../src/constants/contracts';

/**
 * Minimal ambient declaration for the Node `process` global, so this
 * standalone script (no tsconfig, no @types/node) still type-checks.
 * Node itself supplies the real `process` at runtime.
 */
declare const process: { exit(code: number): never };

const UNVERIFIED_ADDRESS: Address = '0x0000000000000000000000000000000000000001';
const RANDOM_LABEL = 'qzqzqzqzqzqz';

let failures = 0;

function pass(label: string): void {
  console.log(`PASS: ${label}`);
}
function fail(label: string, detail: string): void {
  failures += 1;
  console.log(`FAIL: ${label} - ${detail}`);
}
function skip(label: string, reason: string): void {
  console.log(`SKIP: ${label} - ${reason}`);
}
function assertEqual<T>(label: string, actual: T, expected: T): void {
  if (actual === expected) {
    pass(label);
  } else {
    fail(label, `expected ${String(expected)}, got ${String(actual)}`);
  }
}

interface TokenInstance {
  id: string;
  owner: { hash: Address };
  metadata: { name: string };
}

/** Fetch with a single retry (2 attempts total); only used for Blockscout. */
async function fetchWithRetry(url: string): Promise<Response> {
  try {
    return await fetch(url);
  } catch {
    return fetch(url);
  }
}

async function main(): Promise<void> {
  const client = new GiwaClient({ network: 'testnet' });
  const dojang = new DojangManager(client);
  const giwaId = new GiwaIdManager(client);

  // 1. Chain id
  const chainId = await client.verifyChainId();
  assertEqual('verifyChainId().matches', chainId.matches, true);
  assertEqual('verifyChainId().actual', chainId.actual, 91342);

  // 2. Feature readiness
  const { features } = client.getNetworkStatus();
  assertEqual('features.dojang.status', features.dojang.status, 'available');
  assertEqual('features.giwaId.status', features.giwaId.status, 'available');
  assertEqual('features.bridge.status', features.bridge.status, 'partial');
  if (features.bridge.reason) {
    pass('features.bridge.reason non-empty');
  } else {
    fail('features.bridge.reason non-empty', 'reason was empty/undefined');
  }
  assertEqual('features.faucet.status', features.faucet.status, 'available');
  assertEqual('features.flashblocks.status', features.flashblocks.status, 'available');
  assertEqual('features.tokens.status', features.tokens.status, 'available');

  // 3. Contract addresses
  const contracts = client.getContractAddresses();
  const addressChecks: Array<[string, Address]> = [
    ['dojangScroll', contracts.dojangScroll],
    ['attestationIndexer', contracts.attestationIndexer],
    ['upnameRegistry', contracts.upnameRegistry],
    ['l1StandardBridge', contracts.l1StandardBridge],
    ['multicall3', contracts.multicall3],
  ];
  for (const [name, address] of addressChecks) {
    if (address !== ZERO_ADDRESS) {
      pass(`getContractAddresses().${name} non-zero`);
    } else {
      fail(`getContractAddresses().${name} non-zero`, `got ${address}`);
    }
  }

  // 4. Dojang negative path (unverified address)
  const isVerified = await dojang.hasVerifiedAddress(UNVERIFIED_ADDRESS);
  assertEqual('hasVerifiedAddress(unverified) === false', isVerified, false);
  const uid = await dojang.getVerifiedAddressAttestationUid(UNVERIFIED_ADDRESS);
  assertEqual('getVerifiedAddressAttestationUid(unverified) === null', uid, null);
  const attestations = await dojang.getAttestationsForAddress(UNVERIFIED_ADDRESS);
  if (Array.isArray(attestations) && attestations.length === 0) {
    pass('getAttestationsForAddress(unverified) === []');
  } else {
    fail('getAttestationsForAddress(unverified) === []', JSON.stringify(attestations));
  }
  const verifiedBalance = await dojang.getVerifiedBalance(UNVERIFIED_ADDRESS, 60n, 0n);
  assertEqual('getVerifiedBalance(unverified, 60n, 0n) === null', verifiedBalance, null);

  // 5. Discover a live up.id name via Blockscout
  const instancesUrl = `https://sepolia-explorer.giwa.io/api/v2/tokens/${contracts.upnameRegistry}/instances`;
  let firstItem: TokenInstance | null = null;
  try {
    const response = await fetchWithRetry(instancesUrl);
    const body = (await response.json()) as { items?: TokenInstance[] };
    firstItem = body.items?.[0] ?? null;
  } catch {
    firstItem = null;
  }

  const nameChecks = [
    'resolveAddress(name) matches owner',
    'resolveName(owner) matches name',
    'getGiwaId(name).tokenId matches id',
    'isAvailable(name) === false',
    `isAvailable(${RANDOM_LABEL}) === true`,
    'hasVerifiedAddress(owner) === true',
    'getAttestationsForAddress(owner) has verified_address attestation',
    'decodeAttestationData(att) === { type: verified_address, isVerified: true }',
  ];

  if (!firstItem) {
    const reason = 'Blockscout returned no token instances';
    nameChecks.forEach((label) => skip(label, reason));
  } else {
    const { id, owner, metadata } = firstItem;

    const resolvedAddress = await giwaId.resolveAddress(metadata.name);
    assertEqual(
      'resolveAddress(name) matches owner',
      resolvedAddress?.toLowerCase(),
      owner.hash.toLowerCase()
    );
    const resolvedName = await giwaId.resolveName(owner.hash);
    assertEqual('resolveName(owner) matches name', resolvedName, metadata.name);
    const giwaIdInfo = await giwaId.getGiwaId(metadata.name);
    assertEqual('getGiwaId(name).tokenId matches id', giwaIdInfo?.tokenId, BigInt(id));
    const nameAvailable = await giwaId.isAvailable(metadata.name);
    assertEqual('isAvailable(name) === false', nameAvailable, false);
    const randomAvailable = await giwaId.isAvailable(RANDOM_LABEL);
    assertEqual(`isAvailable(${RANDOM_LABEL}) === true`, randomAvailable, true);

    // 6. Dojang positive path for the discovered owner
    const ownerVerified = await dojang.hasVerifiedAddress(owner.hash);
    assertEqual('hasVerifiedAddress(owner) === true', ownerVerified, true);
    const ownerAttestations = await dojang.getAttestationsForAddress(owner.hash);
    const verifiedAddressAttestation = ownerAttestations.find(
      (att) => att.attestationType === 'verified_address'
    );
    if (verifiedAddressAttestation) {
      pass('getAttestationsForAddress(owner) has verified_address attestation');
      const decoded = dojang.decodeAttestationData(verifiedAddressAttestation);
      if (decoded?.type === 'verified_address' && decoded.isVerified === true) {
        pass('decodeAttestationData(att) === { type: verified_address, isVerified: true }');
      } else {
        fail(
          'decodeAttestationData(att) === { type: verified_address, isVerified: true }',
          JSON.stringify(decoded)
        );
      }
    } else {
      fail(
        'getAttestationsForAddress(owner) has verified_address attestation',
        `no verified_address attestation among ${ownerAttestations.length}`
      );
      skip(
        'decodeAttestationData(att) === { type: verified_address, isVerified: true }',
        'no verified_address attestation found for owner'
      );
    }
  }

  console.log('');
  console.log(failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Unhandled error in verify-live:', err);
  process.exit(1);
});
