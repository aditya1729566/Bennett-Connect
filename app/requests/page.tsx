import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InterestBadge } from "@/components/InterestBadge";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { RequestCard } from "@/components/RequestCard";
import { interestOptions, requestCategories } from "@/lib/data/options";
import { slugify } from "@/lib/data/slug";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { NeedRequest } from "@/types/domain";

type RawRequest = {
  id: number;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: NeedRequest["status"];
  expires_at: string | null;
  created_at: string;
  profiles: NeedRequest["author"];
  request_interests?: { interests: { id: number; name: string; slug: string } | null }[];
};

function present<T>(value: T | null | undefined): value is T {
  return Boolean(value);
}

function mapRequest(row: RawRequest): NeedRequest {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    expires_at: row.expires_at,
    created_at: row.created_at,
    author: row.profiles,
    interests: row.request_interests?.map((item) => item.interests).filter(present) ?? [],
  };
}

async function createRequest(formData: FormData) {
  "use server";

  const user = await requireUser();
  const supabase = await createClient();
  const selectedInterestSlugs = formData.getAll("interests").map(String);

  const { data: request, error } = await supabase
    .from("requests")
    .insert({
      user_id: user.id,
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      category: String(formData.get("category") ?? "Other"),
      expires_at: String(formData.get("expires_at") ?? "") || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/requests?error=${encodeURIComponent(error.message)}`);
  }

  const { data: interests } = await supabase.from("interests").select("id, slug").in("slug", selectedInterestSlugs);
  if (request && interests && interests.length > 0) {
    await supabase.from("request_interests").insert(interests.map((interest) => ({ request_id: request.id, interest_id: interest.id })));
  }

  revalidatePath("/requests");
}

async function respondInterested(formData: FormData) {
  "use server";

  const user = await requireUser();
  const requestId = Number(formData.get("request_id"));
  const supabase = await createClient();

  await supabase.from("request_responses").upsert({ request_id: requestId, user_id: user.id, status: "interested" }, { onConflict: "request_id,user_id" });
  revalidatePath("/requests");
}

async function reportRequest(formData: FormData) {
  "use server";

  const user = await requireUser();
  const requestId = Number(formData.get("request_id"));
  const reason = String(formData.get("reason") ?? "other");
  const supabase = await createClient();

  await supabase.from("reports").insert({ reporter_id: user.id, request_id: requestId, reason });
  redirect("/requests?reported=1");
}

export default async function RequestsPage({ searchParams }: { searchParams?: Promise<{ error?: string; reported?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("requests")
    .select("id,user_id,title,description,category,status,expires_at,created_at,profiles(username,full_name,avatar_url,course,graduation_year),request_interests(interests(id,name,slug))")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  const requests = ((data ?? []) as unknown as RawRequest[]).map(mapRequest);

  return (
    <PageShell>
      <main className="mx-auto grid max-w-6xl gap-5 px-3 py-5 sm:px-4 sm:py-8 lg:grid-cols-[380px_1fr]">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">Find Someone</p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl">I need someone for...</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">Post a clear request when you need a teammate, practice partner, builder, or collaborator.</p>
          </div>

          {params?.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{params.error}</p> : null}
          {params?.reported ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Request report received.</p> : null}

          <form action={createRequest} className="mt-4 space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:mt-5 sm:p-5">
            <label className="block text-sm font-bold text-zinc-700">
              Category
              <select name="category" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600">
                {requestCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Title
              <input name="title" required maxLength={90} placeholder="Need frontend developer" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Description
              <textarea name="description" required rows={4} placeholder="We're building a campus navigation app for a hackathon." className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Expiry time
              <input name="expires_at" type="datetime-local" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <div>
              <p className="text-sm font-bold text-zinc-700">Relevant interests</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {interestOptions.slice(0, 14).map((interest) => (
                  <label key={interest} className="cursor-pointer rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 has-checked:border-cyan-500 has-checked:bg-cyan-50 has-checked:text-cyan-800">
                    <input type="checkbox" name="interests" value={slugify(interest)} className="sr-only" />
                    {interest}
                  </label>
                ))}
              </div>
            </div>
            <PendingSubmitButton pendingLabel="Posting..." className="w-full">
              Post request
            </PendingSubmitButton>
          </form>
        </section>

        <section className="space-y-3 sm:space-y-4">
          {requests.length > 0 ? (
            requests.map((request) => (
              <div key={request.id}>
                <RequestCard
                  request={request}
                  action={
                    request.user_id === user.id ? (
                      <div className="flex flex-wrap gap-2">
                        <InterestBadge tone="quiet">Your request</InterestBadge>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <form action={respondInterested}>
                          <input type="hidden" name="request_id" value={request.id} />
                          <PendingSubmitButton pendingLabel="Sending..." className="w-full">
                            I&apos;m interested
                          </PendingSubmitButton>
                        </form>
                        <form action={reportRequest} className="flex gap-2">
                          <input type="hidden" name="request_id" value={request.id} />
                          <input type="hidden" name="reason" value="other" />
                          <PendingSubmitButton variant="light" pendingLabel="Reporting...">
                            Report
                          </PendingSubmitButton>
                        </form>
                      </div>
                    )
                  }
                />
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
              <h2 className="text-2xl font-black text-zinc-950">No active requests</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Be the first to ask for a teammate, practice partner, or collaborator.</p>
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
