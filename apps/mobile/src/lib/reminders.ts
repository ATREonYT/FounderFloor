/**
 * REMINDERS — local notifications, nothing sent from a server. Two of
 * them, both chosen by the founder in Settings: a daily nudge at a time
 * they pick (morning or evening) and the Friday review an hour before the
 * log is due. Off by default; the first switch-on asks the system for
 * permission. On the web there are no local notifications, so every call
 * is a quiet no-op there.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export type DailyTime = "off" | "09:00" | "13:00" | "19:00";
export interface ReminderPrefs {
  daily: DailyTime;
  friday: boolean;
}
export const DEFAULT_REMINDERS: ReminderPrefs = { daily: "off", friday: false };

const native = Platform.OS !== "web";

if (native) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function askPermission(): Promise<boolean> {
  if (!native) return false;
  const have = await Notifications.getPermissionsAsync();
  if (have.granted) return true;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

const DAILY_LINES = [
  "The desk is open. One thing for the company today?",
  "Ines is at the counter. What is the one number this week?",
  "Ten minutes at the stand beats an hour of worrying about it.",
  "Who did you talk to yesterday? Write it in the book.",
];

/** Replace every scheduled reminder with the ones these prefs ask for. */
export async function applyReminders(p: ReminderPrefs): Promise<{ ok: boolean; reason?: string }> {
  if (!native) return { ok: false, reason: "Reminders arrive on the phone, not in the browser." };
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (p.daily === "off" && !p.friday) return { ok: true };
  if (!(await askPermission())) return { ok: false, reason: "Notifications are off for FounderFloor in the phone's Settings." };
  if (p.daily !== "off") {
    const [h, m] = p.daily.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: "FounderFloor", body: DAILY_LINES[new Date().getDate() % DAILY_LINES.length] },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
    });
  }
  if (p.friday) {
    await Notifications.scheduleNotificationAsync({
      content: { title: "Friday review", body: "Five numbers, two minutes. Theo reads the week back after." },
      // expo counts Sunday as 1, so Friday is 6
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 6, hour: 16, minute: 0 },
    });
  }
  return { ok: true };
}
