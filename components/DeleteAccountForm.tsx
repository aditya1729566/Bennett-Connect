"use client";

import { useState } from "react";
import { PendingSubmitButton } from "./PendingSubmitButton";

type DeleteAccountFormProps = {
  action: (formData: FormData) => void;
};

export function DeleteAccountForm({ action }: DeleteAccountFormProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="pressable inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-4 py-3 text-sm font-black text-red-700 hover:bg-red-50"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="text-sm font-bold leading-6 text-red-800">
        Are you sure? This will delete your Bennett Connect profile and sign you out.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="pressable inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700"
        >
          Cancel
        </button>
        <form action={action}>
          <PendingSubmitButton variant="danger" pendingLabel="Deleting..." className="w-full">
            Yes, delete my account
          </PendingSubmitButton>
        </form>
      </div>
    </div>
  );
}
