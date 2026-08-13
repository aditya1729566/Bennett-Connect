import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

type PushPayload = {
  title: string;
  body: string;
  url: string;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:hello@bennettconnect.com";

function isPushConfigured() {
  return Boolean(vapidPublicKey && vapidPrivateKey);
}

export async function notifyUser(userId: string, payload: PushPayload) {
  if (!isPushConfigured()) {
    return;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!);

  const supabase = createAdminClient();
  const { data } = await supabase.from("push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", userId);
  const subscriptions = (data ?? []) as unknown as PushSubscriptionRow[];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : null;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        }
      }
    }),
  );
}
