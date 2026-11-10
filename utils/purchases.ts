import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesError,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PENDING_GRANTS_KEY = 'rituel_pending_grants_v1';
const ENTITLEMENT_ID = 'Rituel Pro';

export type PurchaseResult =
  | { ok: true; customerInfo: CustomerInfo; productIdentifier: string }
  | { ok: false; userCancelled: true }
  | { ok: false; error: string };

export type RestoreResult =
  | { status: 'success'; customerInfo: CustomerInfo }
  | { status: 'unavailable' }
  | { status: 'account_changed' };

export type PendingGrant = {
  productId: string;
  amount: number;
  timestamp: number;
};

let configured = false;
let desiredAccount: string | null | undefined;
let verifiedAccount: string | null | undefined;
let accountRevision = 0;
let operations: Promise<unknown> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = operations.then(operation);
  operations = next.catch(() => undefined);
  return next;
}

export function configurePurchases(userId: string | null): Promise<boolean> {
  if (desiredAccount !== userId) accountRevision += 1;
  desiredAccount = userId;
  return enqueue(() => synchronizeAccount(userId));
}

async function synchronizeAccount(userId: string | null): Promise<boolean> {
  if (desiredAccount !== userId) return false;
  try {
    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    if (!apiKey || !apiKey.startsWith('appl_')) {
      console.warn('[purchases] Missing or invalid RevenueCat iOS API key');
      return false;
    }
    if (Platform.OS !== 'ios') {
      console.warn('[purchases] Currently only iOS is supported');
      return false;
    }
    if (!configured) {
      Purchases.configure({ apiKey, appUserID: userId || undefined });
      configured = true;
    }
    if (userId !== null) {
      if (await Purchases.getAppUserID() !== userId) await Purchases.logIn(userId);
    } else if (!await Purchases.isAnonymous()) {
      await Purchases.logOut();
    }
    verifiedAccount = userId;
    return desiredAccount === userId;
  } catch (e) {
    verifiedAccount = undefined;
    console.warn('[purchases] configure failed', e);
    return false;
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.warn('[purchases] getOfferings failed', e);
    return null;
  }
}

export async function findPackageByProductId(
  productId: string
): Promise<PurchasesPackage | null> {
  const offering = await getCurrentOffering();
  if (!offering) return null;
  const pkg = offering.availablePackages.find(
    (p) => p.product.identifier === productId
  );
  return pkg ?? null;
}

export async function purchaseProduct(productId: string, account: string | null): Promise<PurchaseResult> {
  const pkg = await findPackageByProductId(productId);
  return pkg ? purchaseStorePackage(pkg, account) : { ok: false, error: 'product_not_found' };
}

export function isCurrentPurchaseAccount(account: string | null): boolean {
  return !!account && desiredAccount === account && verifiedAccount === account;
}

async function ensurePurchaseAccount(account: string | null): Promise<boolean> {
  if (!account || desiredAccount !== account) return false;
  return verifiedAccount === account || synchronizeAccount(account);
}

export function purchaseStorePackage(pkg: PurchasesPackage, account: string | null): Promise<PurchaseResult> {
  return enqueue(async () => {
    if (!await ensurePurchaseAccount(account) || !isCurrentPurchaseAccount(account)) {
      return { ok: false, error: 'account_unavailable' };
    }
    return performPurchase(pkg);
  });
}

async function performPurchase(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
    return { ok: true, customerInfo, productIdentifier };
  } catch (e: any) {
    const err = e as PurchasesError;
    if (err?.userCancelled) {
      return { ok: false, userCancelled: true };
    }
    const code = err?.code || 'unknown';
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { ok: false, userCancelled: true };
    }
    return { ok: false, error: `${code}: ${err?.message || 'unknown'}` };
  }
}

export function restorePurchasesWithStatus(account: string | null): Promise<RestoreResult> {
  const revision = accountRevision;
  const accountChanged = () => !account || desiredAccount !== account || revision !== accountRevision;
  return enqueue(async () => {
    if (accountChanged()) return { status: 'account_changed' };
    const ready = await ensurePurchaseAccount(account);
    if (accountChanged()) return { status: 'account_changed' };
    if (!ready) return { status: 'unavailable' };

    try {
      const customerInfo = await Purchases.restorePurchases();
      return accountChanged() ? { status: 'account_changed' } : { status: 'success', customerInfo };
    } catch {
      return accountChanged() ? { status: 'account_changed' } : { status: 'unavailable' };
    }
  });
}

export async function restorePurchases(account: string | null): Promise<CustomerInfo | null> {
  const result = await restorePurchasesWithStatus(account);
  return result.status === 'success' ? result.customerInfo : null;
}

export function getCustomerInfo(account: string | null): Promise<CustomerInfo | null> {
  return readForAccount(account, () => Purchases.getCustomerInfo());
}

function readForAccount(account: string | null, read: () => Promise<CustomerInfo>): Promise<CustomerInfo | null> {
  return enqueue(async () => {
    if (!await ensurePurchaseAccount(account) || !isCurrentPurchaseAccount(account)) return null;
    try {
      const info = await read();
      return isCurrentPurchaseAccount(account) ? info : null;
    } catch (error) {
      console.warn('[purchases] customer info unavailable', error);
      return null;
    }
  });
}

export function hasActivePremium(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function addPendingGrant(grant: PendingGrant): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_GRANTS_KEY);
    const list: PendingGrant[] = raw ? JSON.parse(raw) : [];
    list.push(grant);
    await AsyncStorage.setItem(PENDING_GRANTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[purchases] addPendingGrant failed', e);
  }
}

export async function readPendingGrants(): Promise<PendingGrant[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_GRANTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function clearPendingGrants(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_GRANTS_KEY);
  } catch {}
}

export async function flushPendingGrants(
  applyGrant: (grant: PendingGrant) => Promise<boolean>
): Promise<{ flushed: number; remaining: number }> {
  const grants = await readPendingGrants();
  if (grants.length === 0) return { flushed: 0, remaining: 0 };
  const remaining: PendingGrant[] = [];
  let flushed = 0;
  for (const g of grants) {
    try {
      const ok = await applyGrant(g);
      if (ok) flushed += 1;
      else remaining.push(g);
    } catch {
      remaining.push(g);
    }
  }
  if (remaining.length === 0) {
    await AsyncStorage.removeItem(PENDING_GRANTS_KEY);
  } else {
    await AsyncStorage.setItem(PENDING_GRANTS_KEY, JSON.stringify(remaining));
  }
  return { flushed, remaining: remaining.length };
}
