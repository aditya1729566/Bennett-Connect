import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InterestBadge } from "@/components/InterestBadge";
import { PageShell } from "@/components/PageShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { RequestCard } from "@/components/RequestCard";
import { withTimeoutFallback } from "@/lib/async/withTimeout";
import { interestOptions, requestCategories } from "@/lib/data/options";
import { slugify } from "@/lib/data/slug";
import { createAdminClient, createClient, requireUser } from "@/lib/supabase/server";
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
  const adminSupabase = createAdminClient();
  const selectedInterestSlugs = formData.getAll("interests").map(String);
  const customInterest = String(formData.get("custom_interest") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const expiresAt = String(formData.get("expires_at") ?? "");

  if (title.length < 4 || title.length > 90) {
    redirect("/requests?error=Use%20a%20request%20title%20between%204%20and%2090%20characters.");
  }

  if (description.length < 10 || description.length > 1000) {
    redirect("/requests?error=Use%20a%20description%20between%2010%20and%201000%20characters.");
  }

  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    redirect("/requests?error=Pick%20a%20future%20expiry%20time.");
  }

  const { data: request, error } = await supabase
    .from("requests")
    .insert({
      user_id: user.id,
      title,
      description,
      category: String(formData.get("category") ?? "Other"),
      expires_at: expiresAt || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/requests?error=${encodeURIComponent(error.message)}`);
  }

  let interestSlugs = [...new Set(selectedInterestSlugs)];
  const selectedSlugSet = new Set(interestSlugs);
  const knownSelectedInterests = interestOptions
    .filter((interest) => selectedSlugSet.has(slugify(interest)))
    .map((interest) => ({ name: interest, slug: slugify(interest) }));

  if (knownSelectedInterests.length > 0) {
    await adminSupabase.from("interests").upsert(knownSelectedInterests, { onConflict: "slug" });
  }

  if (customInterest) {
    const customSlug = slugify(customInterest);
    await adminSupabase.from("interests").upsert({ name: customInterest, slug: customSlug }, { onConflict: "slug" });
    interestSlugs = [...new Set([...interestSlugs, customSlug])];
  }

  const { data: interests } = await adminSupabase.from("interests").select("id, slug").in("slug", interestSlugs);
  if (request && interests && interests.length > 0) {
    await supabase.from("request_interests").insert(interests.map((interest) => ({ request_id: request.id, interest_id: interest.id })));
  }

  revalidatePath("/requests");
  redirect("/requests?posted=1");
}

async function respondInterested(formData: FormData) {
  "use server";

  const user = await requireUser();
  const requestId = Number(formData.get("request_id"));
  const supabase = await createClient();

  if (!requestId) {
    redirect("/requests?error=Choose%20a%20valid%20request.");
  }

  const { data: request } = await withTimeoutFallback(supabase.from("requests").select("user_id").eq("id", requestId).maybeSingle(), 3000, "Request owner lookup", { data: null, error: null });

  if (request?.user_id === user.id) {
    redirect("/requests?error=You%20cannot%20respond%20to%20your%20own%20request.");
  }

  const { error } = await supabase.from("request_responses").upsert({ request_id: requestId, user_id: user.id, status: "interested" }, { onConflict: "request_id,user_id" });

  if (error) {
    redirect(`/requests?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/requests");
  redirect("/requests?interested=1");
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

export default async function RequestsPage({ searchParams }: { searchParams?: Promise<{ error?: string; reported?: string; posted?: string; interested?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await withTimeoutFallback(
    supabase
      .from("requests")
      .select("id,user_id,title,description,category,status,expires_at,created_at,profiles(username,full_name,avatar_url,course,graduation_year),request_interests(interests(id,name,slug))")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30),
    4500,
    "Active requests list",
    { data: [], error: null },
  );

  const requests = ((data ?? []) as unknown as RawRequest[]).map(mapRequest);

  return (
    <PageShell>
      <main className="mx-auto grid max-w-6xl gap-5 px-3 py-5 sm:px-4 sm:py-8 lg:grid-cols-[380px_1fr]">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="motion-rise rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700 sm:text-sm">Find Someone</p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-4xl">I need someone for...</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">Post a clear request when you need a teammate, practice partner, builder, or collaborator.</p>
          </div>

          {params?.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{params.error}</p> : null}
          {params?.reported ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Request report received.</p> : null}
          {params?.posted ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Request posted. Students can respond now.</p> : null}
          {params?.interested ? <p className="mt-4 rounded-lg bg-cyan-50 p-3 text-sm font-semibold text-cyan-800">Interest sent to the request owner.</p> : null}

          <form action={createRequest} className="motion-rise mt-4 space-y-4 rounded-lg border border-zinc-200 bg-white/92 p-4 shadow-sm backdrop-blur sm:mt-5 sm:p-5">
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
              <input name="title" required minLength={4} maxLength={90} placeholder="Need frontend developer" className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
            </label>
            <label className="block text-sm font-bold text-zinc-700">
              Description
              <textarea name="description" required minLength={10} maxLength={1000} rows={4} placeholder="We're building a campus navigation app for a hackathon." className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-cyan-600" />
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
              <input name="custom_interest" placeholder="Add an interest if yours is missing" className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-cyan-600" />
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
            <div className="motion-rise rounded-lg border border-zinc-200 bg-white/92 p-6 text-center shadow-sm backdrop-blur">
              <h2 className="text-2xl font-black text-zinc-950">No active requests</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Be the first to ask for a teammate, practice partner, or collaborator.</p>
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
