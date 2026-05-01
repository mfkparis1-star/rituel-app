import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Modal } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  source?: string;
};

/**
 * PaywallModal — thin wrapper that routes to /paywall.
 *
 * Phase 11 architecture: paywall UI lives at app/paywall.tsx as a full
 * route page (not a true modal) for better deep-linking and App Store
 * compliance. This component exists for callers that prefer a modal API.
 */
export default function PaywallModal({ visible, onClose, source }: Props) {
  const hasRoutedRef = useRef(false);

  useEffect(() => {
    if (visible && !hasRoutedRef.current) {
      hasRoutedRef.current = true;
      onClose();
      router.push({
        pathname: '/paywall' as any,
        params: source ? { source } : {},
      });
    }
    if (!visible) {
      hasRoutedRef.current = false;
    }
  }, [visible, source, onClose]);

  return <Modal visible={false} transparent />;
}
