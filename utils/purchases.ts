import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';

export const initializePurchases = () => {
  if (Platform.OS === 'ios') {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    const key = __DEV__ ? "test_OGlWSWXaFjFTXTSAIQXKPHllehP" : REVENUECAT_IOS_KEY;
    Purchases.configure({ apiKey: key });
  }
};

export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error('RC getOfferings error:', e);
    return null;
  }
};

export const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (!e.userCancelled) throw e;
    return null;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (e) {
    console.error('RC restorePurchases error:', e);
    return null;
  }
};

export const isPremium = (customerInfo: any): boolean => {
  return typeof customerInfo?.entitlements?.active?.['Rituel Pro'] !== 'undefined';
};
