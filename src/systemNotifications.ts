import { Platform } from 'react-native';

let Notifications: any = null;

try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications not available:', e);
}

// 1. Configure how notifications appear when app is foregrounded
if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (err) {
    console.warn('Failed to set notification handler:', err);
  }
}

// 2. Setup Android Notification Channels
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android' || !Notifications) return;

  try {
    // Channel for Order Updates (High priority, sound, vibration)
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'تحديثات الطلبات',
      description: 'إشعارات فورية بحالة طلبك من طيور الرشيدي (قيد التجهيز، خرج للتوصيل، تم التسليم)',
      importance: Notifications.AndroidImportance?.MAX ?? 5,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0E2F65',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // Channel for Promotions & Discounts
    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'عروض وخصومات الرشيدي',
      description: 'أحدث عروض التوفير الأسبوعية وكوبونات الخصم الحصرية',
      importance: Notifications.AndroidImportance?.HIGH ?? 4,
      vibrationPattern: [0, 200, 150, 200],
      lightColor: '#D97706',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // Channel for General App Notices
    await Notifications.setNotificationChannelAsync('default', {
      name: 'تنبيهات عامة',
      description: 'تنبيهات عامة عن مواعيد العمل والفروع',
      importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
      showBadge: true,
    });
  } catch (err) {
    console.warn('Error creating notification channels:', err);
  }
}

// 3. Request Permission from User
export async function requestNotificationPermission(): Promise<{ granted: boolean; status: string }> {
  if (!Notifications || typeof Notifications.getPermissionsAsync !== 'function') {
    return { granted: false, status: 'unsupported' };
  }

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || current.status === 'granted') {
      await setupNotificationChannels();
      return { granted: true, status: 'granted' };
    }

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    const isGranted = requested.granted || requested.status === 'granted';
    if (isGranted) {
      await setupNotificationChannels();
    }
    return { granted: isGranted, status: requested.status };
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return { granted: false, status: 'error' };
  }
}

// 4. Send Instant Native System Notification (shows in status bar & lock screen)
export async function triggerDeviceNotification({
  title,
  body,
  data = {},
  channelId = 'orders',
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: 'orders' | 'promotions' | 'default';
}): Promise<string | null> {
  if (!Notifications || typeof Notifications.scheduleNotificationAsync !== 'function') {
    return null;
  }

  try {
    await setupNotificationChannels();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        vibrate: [0, 250, 250, 250],
        priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
        data,
      },
      trigger: null, // trigger immediately
    });
    return id;
  } catch (err) {
    console.warn('Failed to schedule device notification:', err);
    return null;
  }
}
