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

export type PendingGrant = {
  productId: string;
  amount: number;
  timestamp: number;
};

let configured = false;

export async function configurePurchases(userId: string | null): Promise<boolean> {
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
    } else if (userId) {
      await Purchases.logIn(userId);
    }
    return true;
  } catch (e) {
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
  if (!offering) {
    console.warn('[purchases][debug] getCurrentOffering returned null');
    return null;
  }
  const availableIds = offering.availablePackages.map((p) => p.product.identifier);
  console.log('[purchases][debug] looking for:', productId);
  console.log('[purchases][debug] available product identifiers:', availableIds);
  const pkg = offering.availablePackages.find(
    (p) => p.product.identifier === productId
  );
  if (!pkg) {
    console.warn('[purchases][debug] no match for', productId);
  } else {
    console.log('[purchases][debug] matched package:', pkg.identifier);
  }
  return pkg ?? null;
}

export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  try {
    console.log('[purchases][debug] purchaseProduct called with:', productId);
    const pkg = await findPackageByProductId(productId);
    if (!pkg) {
      return { ok: false, error: 'product_not_found' };
    }
    console.log('[purchases][debug] calling Purchases.purchasePackage with:', pkg.identifier);
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
    console.log('[purchases][debug] purchase OK:', productIdentifier);
    return { ok: true, customerInfo, productIdentifier };
  } catch (e: any) {
    const err = e as PurchasesError;
    console.warn('[purchases][debug] purchase failed full error:', JSON.stringify({
      code: err?.code,
      message: err?.message,
      userCancelled: err?.userCancelled,
      underlyingErrorMessage: (err as any)?.underlyingErrorMessage,
      readableErrorCode: (err as any)?.readableErrorCode,
    }, null, 2));
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

export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (e) {
    console.warn('[purchases] restore failed', e);
    return null;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info;
  } catch (e) {
    console.warn('[purchases] getCustomerInfo failed', e);
    return null;
  }
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
