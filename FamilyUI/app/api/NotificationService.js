import * as Notifications from "expo-notifications";

// Ask for permissions and configure sound-only notifications
async function registerForPushNotificationsAsync() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") {
      console.log("Permission not granted for notifications!");
      return;
    }
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,  // ❌ No banner or pop-up
      shouldPlaySound: true,   // ✅ Only plays sound
      shouldSetBadge: false,   // ❌ No badge count
    }),
  });
}

export default {
  registerForPushNotificationsAsync,
};
