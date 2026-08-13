"use client";

import { useEffect, useState } from "react";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DISMISS_KEY = "bennettconnect:push-dismissed-at";
const DISMISS_DAYS = 7;

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function getSubscription() {
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return {
    registration,
    subscription: await registration.pushManager.getSubscription(),
  };
}

function isDismissedRecently() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY));
  if (!dismissedAt) {
    window.localStorage.removeItem("bennettconnect:push-dismissed");
    return false;
  }

  return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function supportsPush() {
  return Boolean(publicKey && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
}

type PushNotificationPromptProps = {
  mode?: "toast" | "settings";
};

export function PushNotificationPrompt({ mode = "toast" }: PushNotificationPromptProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    let cancelled = false;

    async function checkPushState() {
      if (!supportsPush()) {
        if (!cancelled) {
          setSupported(false);
          setVisible(mode === "settings");
        }
        return;
      }

      if (!cancelled) {
        setPermission(Notification.permission);
      }

      if (mode === "toast" && isDismissedRecently()) {
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) {
          setVisible(mode === "settings");
        }
        return;
      }

      try {
        const { subscription } = await getSubscription();
        if (cancelled) {
          return;
        }
        setEnabled(Boolean(subscription));
        setVisible(mode === "settings" || !subscription);
      } catch {
        if (!cancelled) {
          setVisible(mode === "settings");
        }
      }
    }

    void checkPushState();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  async function enableNotifications() {
    if (!supportsPush()) {
      setSupported(false);
      setVisible(true);
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission !== "granted") {
        setMessage("Notifications were not enabled on this device.");
        setBusy(false);
        return;
      }

      const { registration, subscription: existing } = await getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey!),
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Could not save this device.");
      }

      setMessage("Phone notifications are on for this device.");
      setEnabled(true);
      setVisible(mode === "settings");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible && !message) {
    return null;
  }

  if (mode === "settings") {
    const status = !supported
      ? "This browser cannot receive web push notifications. On iPhone, open Bennett Connect from an installed Home Screen app to use push notifications."
      : permission === "denied"
        ? "Notifications are blocked for this site. Enable them from your browser or phone settings, then come back here."
        : enabled
          ? "Notifications are enabled on this device."
          : "Enable alerts for connection invites and chat messages on this device.";

    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-xl font-black text-zinc-950">Notifications</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{message || status}</p>
        <button
          type="button"
          onClick={enableNotifications}
          disabled={busy || !supported || permission === "denied"}
          className="pressable mt-4 inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
        >
          {busy ? "Enabling..." : enabled ? "Re-check this device" : "Enable notifications"}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-[5.75rem] z-40 mx-auto max-w-md rounded-2xl border border-cyan-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.18)] md:bottom-5">
      {visible ? (
        <>
          <p className="text-sm font-black text-zinc-950">Turn on phone notifications</p>
          <p className="mt-1 text-sm leading-5 text-zinc-600">Get notified for new connection invites and chat messages.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={dismiss} className="pressable rounded-full border border-zinc-300 px-4 py-3 text-sm font-black text-zinc-700">
              Not now
            </button>
            <button type="button" onClick={enableNotifications} disabled={busy} className="pressable rounded-full bg-zinc-950 px-4 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-70">
              {busy ? "Enabling..." : "Enable"}
            </button>
          </div>
        </>
      ) : null}
      {message ? <p className="text-sm font-semibold text-zinc-700">{message}</p> : null}
    </div>
  );
}
