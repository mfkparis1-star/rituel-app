/**
 * Share card helper (Phase 16E E2 + E3).
 *
 * Captures a React Native view at 1080×1920 (Instagram Stories ratio)
 * and surfaces the iOS share sheet via expo-sharing. The captured PNG
 * is written to the document directory with a meaningful filename so
 * the share preview reads cleanly.
 */
import { Paths, File } from 'expo-file-system';
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

    // Move to a stable path with a meaningful name so the share preview
    // reads "Rituel · {feature}.png" rather than a hashed temp name.
    const stamp = Date.now();
    const destPath = `${Paths.document.uri}${filenamePrefix}-${stamp}.png`;
    let shareUri = tmpUri.startsWith('file://') ? tmpUri : `file://${tmpUri}`;
    try {
      const src = new File(tmpUri.startsWith('file://') ? tmpUri : `file://${tmpUri}`);
      const dest = new File(destPath);
      if (dest.exists) dest.delete();
      src.copy(dest);
      shareUri = destPath;
    } catch {
      // If copy fails (rare), share the temp file directly.
    }

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
