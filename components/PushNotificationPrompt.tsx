"use client";

import { useEffect, useState } from "react";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function getSubscription() {
  const registration = await navigator.serviceWorker.register("/sw.js");
  return {
    registration,
    subscription: await registration.pushManager.getSubscription(),
  };
}

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return;
    }

    if (window.localStorage.getItem("bennettconnect:push-dismissed") === "1") {
      return;
    }

    if (Notification.permission === "denied") {
      return;
    }

    getSubscription()
      .then(({ subscription }) => setVisible(!subscription && Notification.permission !== "granted"))
      .catch(() => setVisible(false));
  }, []);

  async function enableNotifications() {
    if (!publicKey) {
      setMessage("Notifications are not configured yet.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const permission = await Notification.requestPermission();
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
          applicationServerKey: urlBase64ToUint8Array(publicKey),
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
      setVisible(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    window.localStorage.setItem("bennettconnect:push-dismissed", "1");
    setVisible(false);
  }

  if (!visible && !message) {
    return null;
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
