/**
 * Share card helper (Phase 16E E2 + E3).
 *
 * Captures a React Native view at 1080×1920 (Instagram Stories ratio)
 * and surfaces the iOS share sheet via expo-sharing. The captured PNG
 * is written to the document directory with a meaningful filename so
 * the share preview reads cleanly.
 */
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Alert } from 'react-native';

export async function captureAndShare(
  ref: React.RefObject<any>,
  filenamePrefix: string
): Promise<boolean> {
  try {
    if (!ref.current) return false;

    const tmpUri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      width: 1080,
      height: 1920,
      result: 'tmpfile',
    });

    // Always use the temp file directly. The rename-to-document-dir
    // step was a nicety for the share-sheet filename preview but
    // depends on a stable Paths.document.uri at module-init time,
    // which has been the source of crashes. Temp file works for share.
    const shareUri = tmpUri.startsWith('file://') ? tmpUri : `file://${tmpUri}`;

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Partage indisponible', 'Le partage n\u2019est pas disponible sur cet appareil.');
      return false;
    }

    await Sharing.shareAsync(shareUri, {
      mimeType: 'image/png',
      dialogTitle: 'Partager',
    });
    return true;
  } catch {
    Alert.alert('Erreur', 'Impossible de partager pour le moment.');
    return false;
  }
}
