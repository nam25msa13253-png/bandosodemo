import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db, schema as s } from "@/db";
import { PageHeader } from "@/components/site/PageHeader";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

const get = (slug: string) =>
  db.query.announcements.findFirst({
    where: and(eq(s.announcements.slug, slug), eq(s.announcements.published, true)),
    with: { village: true },
  });

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = await get((await params).slug);
  return a ? { title: a.title, description: a.summary ?? a.content.slice(0, 160) } : {};
}

export default async function AnnouncementDetail({ params }: { params: Params }) {
  const a = await get((await params).slug);
  if (!a) notFound();
  return (
    <>
      <PageHeader title={a.title} crumbs={[{ href: "/thong-bao", label: "Thông báo" }, { label: a.title }]} />
      <article className="mx-auto max-w-3xl px-4 py-6">
        <div className="card p-5 md:p-8">
          <p className="text-sm text-slate-500">
            {formatDate(a.publishedAt, true)} · {a.village?.name ?? "Toàn phường"}
          </p>
          {a.summary && <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-800">{a.summary}</p>}
          <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{a.content}</div>
        </div>
        <Link href="/thong-bao" className="btn btn-outline mt-4">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>
      </article>
    </>
  );
}
