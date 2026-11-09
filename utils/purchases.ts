import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesError,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const ENTITLEMENT_ID = 'Rituel Pro';

export type PurchaseResult =
  | { ok: true; customerInfo: CustomerInfo; productIdentifier: string; transactionId: string }
  | { ok: false; userCancelled: true }
  | { ok: false; error: string };

let configured = false;
let desiredAccount: string | null | undefined;
let verifiedAccount: string | null | undefined;
let operations: Promise<unknown> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = operations.then(operation);
  operations = next.catch(() => undefined);
  return next;
}

export function configurePurchases(userId: string | null): Promise<boolean> {
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

export async function getCurrentOffering(identifier?: string): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return (identifier ? offerings.all[identifier] : offerings.current) ?? null;
  } catch (e) {
    console.warn('[purchases] getOfferings failed', e);
    return null;
  }
}

export function isCurrentPurchaseAccount(account: string): boolean {
  return desiredAccount === account && verifiedAccount === account;
}

export function purchaseStorePackage(pkg: PurchasesPackage, account: string | null): Promise<PurchaseResult> {
  return enqueue(async () => {
    if (!account || !isCurrentPurchaseAccount(account)) {
      return { ok: false, error: 'account_unavailable' };
    }
    return performPurchase(pkg);
  });
}

async function performPurchase(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo, productIdentifier, transaction } = await Purchases.purchasePackage(pkg);
    return { ok: true, customerInfo, productIdentifier, transactionId: transaction.transactionIdentifier };
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

export function restorePurchases(account: string | null): Promise<CustomerInfo | null> {
  return readForAccount(account, () => Purchases.restorePurchases());
}

export function getCustomerInfo(account: string | null): Promise<CustomerInfo | null> {
  return readForAccount(account, () => Purchases.getCustomerInfo());
}

function readForAccount(account: string | null, read: () => Promise<CustomerInfo>): Promise<CustomerInfo | null> {
  return enqueue(async () => {
    if (!account || !isCurrentPurchaseAccount(account)) return null;
    try {
      const info = await read();
      return desiredAccount === account ? info : null;
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
