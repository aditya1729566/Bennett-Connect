import Link from "next/link";
import { revalidatePath } from "next/cache";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { withTimeoutFallback } from "@/lib/async/withTimeout";
import { createClient, requireUser } from "@/lib/supabase/server";

type ConnectionRow = {
  id: number;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  sender: { username: string; full_name: string; avatar_url: string | null; course: string | null } | null;
  receiver: { username: string; full_name: string; avatar_url: string | null; course: string | null } | null;
};

async function updateConnection(formData: FormData) {
  "use server";

  const user = await requireUser();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  const supabase = await createClient();

  if (["accepted", "rejected", "blocked"].includes(status)) {
    await supabase.from("connection_requests").update({ status }).eq("id", id).eq("receiver_id", user.id);
  }

  revalidatePath("/connections");
}

function PersonLine({ profile, chatHref }: { profile: ConnectionRow["sender"]; chatHref?: string }) {
  if (!profile) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link href={`/profile/${profile.username}`} className="flex min-w-0 items-center gap-3">
        <ProfileAvatar src={profile.avatar_url} name={profile.full_name} size="sm" />
        <span className="min-w-0">
          <span className="block truncate font-black text-zinc-950">{profile.full_name}</span>
          <span className="block truncate text-sm font-semibold text-zinc-500">{profile.course ?? `@${profile.username}`}</span>
        </span>
      </Link>
      {chatHref ? (
        <Link href={chatHref} className="pressable shrink-0 rounded-full bg-zinc-950 px-3 py-2 text-center text-xs font-black text-white sm:w-auto">
          Chat
        </Link>
      ) : null}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-5 text-sm font-semibold text-zinc-500">{children}</p>;
}

export default async function ConnectionsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await withTimeoutFallback(
    supabase
      .from("connection_requests")
      .select("id,sender_id,receiver_id,status,sender:profiles!connection_requests_sender_id_fkey(username,full_name,avatar_url,course),receiver:profiles!connection_requests_receiver_id_fkey(username,full_name,avatar_url,course)")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })
      .limit(80),
    4000,
    "Connections list",
    { data: [], error: null },
  );

  const rows = (data ?? []) as unknown as ConnectionRow[];
  const received = rows.filter((row) => row.receiver_id === user.id && row.status === "pending");
  const sent = rows.filter((row) => row.sender_id === user.id && row.status === "pending");
  const accepted = rows.filter((row) => row.status === "accepted");

  return (
    <PageShell>
      <main className="mx-auto w-full min-w-0 max-w-4xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="motion-rise mb-5 rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">Connections</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl">People who said yes.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">Handle incoming requests and keep track of accepted campus connections.</p>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          <section className="motion-rise min-w-0 rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:p-5">
            <h2 className="text-xl font-black text-zinc-950">Received</h2>
            <div className="mt-4 space-y-3">
              {received.length > 0 ? (
                received.map((row) => (
                  <div key={row.id} className="min-w-0 rounded-lg bg-zinc-50 p-3">
                    <PersonLine profile={row.sender} />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <form action={updateConnection}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <PendingSubmitButton variant="light" pendingLabel="Rejecting..." className="w-full px-3 py-2 text-xs">
                          Reject
                        </PendingSubmitButton>
                      </form>
                      <form action={updateConnection}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="status" value="accepted" />
                        <PendingSubmitButton pendingLabel="Accepting..." className="w-full px-3 py-2 text-xs">
                          Accept
                        </PendingSubmitButton>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <Empty>No incoming requests yet.</Empty>
              )}
            </div>
          </section>

          <section className="motion-rise min-w-0 rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:p-5">
            <h2 className="text-xl font-black text-zinc-950">Sent</h2>
            <div className="mt-4 space-y-3">
              {sent.length > 0 ? sent.map((row) => <PersonLine key={row.id} profile={row.receiver} />) : <Empty>No pending sent requests.</Empty>}
            </div>
          </section>

          <section className="motion-rise min-w-0 rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:p-5">
            <h2 className="text-xl font-black text-zinc-950">Accepted</h2>
            <div className="mt-4 space-y-3">
              {accepted.length > 0
                ? accepted.map((row) => <PersonLine key={row.id} profile={row.sender_id === user.id ? row.receiver : row.sender} chatHref={`/chat/${row.id}`} />)
                : <Empty>Accepted connections will appear here.</Empty>}
            </div>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
