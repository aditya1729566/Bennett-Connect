import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { withTimeoutFallback } from "@/lib/async/withTimeout";
import { createClient, requireUser } from "@/lib/supabase/server";

type ConversationRow = {
  id: number;
  sender_id: string;
  receiver_id: string;
  sender: { username: string; full_name: string; avatar_url: string | null; course: string | null } | null;
  receiver: { username: string; full_name: string; avatar_url: string | null; course: string | null } | null;
};

type LastMessageRow = {
  connection_request_id: number;
  body: string;
  created_at: string;
};

function formatTime(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ChatPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await withTimeoutFallback(
    supabase
      .from("connection_requests")
      .select("id,sender_id,receiver_id,sender:profiles!connection_requests_sender_id_fkey(username,full_name,avatar_url,course),receiver:profiles!connection_requests_receiver_id_fkey(username,full_name,avatar_url,course)")
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })
      .limit(40),
    4000,
    "Chat conversation list",
    { data: [], error: null },
  );

  const conversations = (data ?? []) as unknown as ConversationRow[];
  const conversationIds = conversations.map((conversation) => conversation.id);
  const { data: messages } =
    conversationIds.length > 0
      ? await withTimeoutFallback(
          supabase
            .from("chat_messages")
            .select("connection_request_id,body,created_at")
            .in("connection_request_id", conversationIds)
            .order("created_at", { ascending: false })
            .limit(80),
          3500,
          "Latest chat messages",
          { data: [], error: null },
        )
      : { data: [] };

  const latestByConnection = new Map<number, LastMessageRow>();
  ((messages ?? []) as unknown as LastMessageRow[]).forEach((message) => {
    if (!latestByConnection.has(message.connection_request_id)) {
      latestByConnection.set(message.connection_request_id, message);
    }
  });

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="mb-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">Chat</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl">Talk after you connect.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">Messages are available only between students with an accepted connection.</p>
        </div>

        <section className="space-y-3">
          {conversations.length > 0 ? (
            conversations.map((conversation) => {
              const person = conversation.sender_id === user.id ? conversation.receiver : conversation.sender;
              const latest = latestByConnection.get(conversation.id);

              if (!person) {
                return null;
              }

              return (
                <Link
                  key={conversation.id}
                  href={`/chat/${conversation.id}`}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-cyan-300 sm:gap-4"
                >
                  <ProfileAvatar src={person.avatar_url} name={person.full_name} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-black text-zinc-950">{person.full_name}</span>
                    <span className="mt-1 block truncate text-sm font-semibold text-zinc-500">
                      {latest ? latest.body : person.course ?? `@${person.username}`}
                    </span>
                  </span>
                  <span className="hidden text-xs font-semibold text-zinc-400 sm:block">{formatTime(latest?.created_at)}</span>
                </Link>
              );
            })
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
              <h2 className="text-2xl font-black text-zinc-950">No chats yet</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Accept a connection request first, then your conversation will appear here.</p>
              <Link href="/connections" className="mt-5 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white">
                View connections
              </Link>
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
