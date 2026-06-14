/**
 * notify — evening ritual reminder via expo-notifications.
 *
 * The native module is only present in a dev/production build, not in
 * a JS-only reload of an older binary. So we load it lazily and guard
 * every call: if the module is missing, reminders are silently a
 * no-op and the app keeps working. Real scheduling activates once a
 * build that includes expo-notifications is installed.
 */

type NotificationsModule = typeof import('expo-notifications');

let _mod: NotificationsModule | null | undefined; // undefined = not tried yet
let _handlerSet = false;

function getMod(): NotificationsModule | null {
  if (_mod !== undefined) return _mod;
  try {
    // require so a missing native module throws here (catchable),
    // not at import time of this file.
    _mod = require('expo-notifications') as NotificationsModule;
    if (_mod && !_handlerSet) {
      _mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      _handlerSet = true;
    }
  } catch {
    _mod = null;
  }
  return _mod;
}

export async function ensurePermission(): Promise<boolean> {
  const N = getMod();
  if (!N) return false;
  try {
    const { status } = await N.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await N.requestPermissionsAsync();
    return req.status === 'granted';
  } catch {
    return false;
  }
}

export async function cancelEveningReminder(): Promise<void> {
  const N = getMod();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    // non-fatal
  }
}

export async function scheduleEveningReminder(
  hhmm: string,
  title: string,
  body: string
): Promise<boolean> {
  const N = getMod();
  if (!N) return false;
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return false;
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);

  const ok = await ensurePermission();
  if (!ok) return false;

  try {
    await cancelEveningReminder();
    await N.scheduleNotificationAsync({
      content: { title, body, sound: false, data: { route: '/routine-session' } },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'rituel-evening',
      },
    });
    return true;
  } catch {
    return false;
  }
}
