import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { withTimeoutFallback } from "@/lib/async/withTimeout";
import { getProfileById } from "@/lib/data/profiles";
import { notifyUser } from "@/lib/notifications/push";
import { createClient, requireUser } from "@/lib/supabase/server";

type ChatConnection = {
  id: number;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  sender: { username: string; full_name: string; avatar_url: string | null; course: string | null } | null;
  receiver: { username: string; full_name: string; avatar_url: string | null; course: string | null } | null;
};

type MessageRow = {
  id: number;
  connection_request_id: number;
  sender_id: string;
  body: string;
  created_at: string;
};

async function sendMessage(formData: FormData) {
  "use server";

  const user = await requireUser();
  const connectionId = Number(formData.get("connection_id"));
  const body = String(formData.get("body") ?? "").trim();

  if (!connectionId || !body) {
    return;
  }

  const supabase = await createClient();
  const { data: connection } = await withTimeoutFallback(
    supabase
      .from("connection_requests")
      .select("sender_id,receiver_id,status")
      .eq("id", connectionId)
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .maybeSingle(),
    3000,
    "Chat send connection lookup",
    { data: null, error: null },
  );

  if (!connection) {
    return;
  }

  const { error } = await supabase.from("chat_messages").insert({
    connection_request_id: connectionId,
    sender_id: user.id,
    body,
  });

  if (!error) {
    const typedConnection = connection as { sender_id: string; receiver_id: string };
    const receiverId = typedConnection.sender_id === user.id ? typedConnection.receiver_id : typedConnection.sender_id;
    const senderProfile = await getProfileById(supabase, user.id);
    await notifyUser(receiverId, {
      title: `New message from ${senderProfile?.full_name ?? "Bennett Connect"}`,
      body: body.length > 96 ? `${body.slice(0, 93)}...` : body,
      url: `/chat/${connectionId}`,
    });
  }

  revalidatePath(`/chat/${connectionId}`);
  revalidatePath("/chat");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ChatThreadPage({ params }: { params: Promise<{ connectionId: string }> }) {
  const user = await requireUser();
  const { connectionId } = await params;
  const supabase = await createClient();
  const id = Number(connectionId);

  const { data: connectionData } = await withTimeoutFallback(
    supabase
      .from("connection_requests")
      .select("id,sender_id,receiver_id,status,sender:profiles!connection_requests_sender_id_fkey(username,full_name,avatar_url,course),receiver:profiles!connection_requests_receiver_id_fkey(username,full_name,avatar_url,course)")
      .eq("id", id)
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .maybeSingle(),
    4000,
    "Chat thread connection lookup",
    { data: null, error: null },
  );

  if (!connectionData) {
    notFound();
  }

  const connection = connectionData as unknown as ChatConnection;
  const person = connection.sender_id === user.id ? connection.receiver : connection.sender;

  if (!person) {
    notFound();
  }

  const { data: messagesData } = await withTimeoutFallback(
    supabase
      .from("chat_messages")
      .select("id,connection_request_id,sender_id,body,created_at")
      .eq("connection_request_id", id)
      .order("created_at", { ascending: false })
      .limit(80),
    4000,
    "Chat thread messages",
    { data: [], error: null },
  );

  const messages = ((messagesData ?? []) as unknown as MessageRow[]).reverse();

  return (
    <PageShell>
      <main className="mx-auto flex min-h-[calc(100vh-8.75rem)] max-w-3xl flex-col px-3 py-4 sm:min-h-[calc(100vh-64px)] sm:px-4 sm:py-6">
        <header className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <Link href="/chat" className="text-sm font-black text-cyan-700">
            Back to chats
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <ProfileAvatar src={person.avatar_url} name={person.full_name} size="md" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-zinc-950 sm:text-2xl">{person.full_name}</h1>
              <p className="truncate text-sm font-semibold text-zinc-500">{person.course ?? `@${person.username}`}</p>
            </div>
          </div>
        </header>

        <section className="mt-3 flex-1 space-y-3 overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 shadow-sm sm:mt-4 sm:p-4">
          {messages.length > 0 ? (
            messages.map((message) => {
              const mine = message.sender_id === user.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-lg px-4 py-3 sm:max-w-[82%] ${mine ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-900"}`}>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                    <p className={`mt-2 text-[11px] font-semibold ${mine ? "text-white/60" : "text-zinc-500"}`}>{formatTime(message.created_at)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex min-h-64 items-center justify-center text-center">
              <div>
                <h2 className="text-2xl font-black text-zinc-950">Start the conversation</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">Say why you connected and what you want to build, play, learn, or practice together.</p>
              </div>
            </div>
          )}
        </section>

        <form action={sendMessage} className="sticky bottom-[5.25rem] mt-3 rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-[0_16px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:bottom-4 sm:mt-4 sm:rounded-lg sm:p-3">
          <input type="hidden" name="connection_id" value={connection.id} />
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="message-body">
              Message
            </label>
            <textarea
              id="message-body"
              name="body"
              required
              maxLength={1000}
              rows={1}
              placeholder="Write a message..."
              className="min-h-12 flex-1 resize-none rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-cyan-600 sm:rounded-lg"
            />
            <PendingSubmitButton pendingLabel="Sending..." className="self-end px-5">
              Send
            </PendingSubmitButton>
          </div>
        </form>
      </main>
    </PageShell>
  );
}
