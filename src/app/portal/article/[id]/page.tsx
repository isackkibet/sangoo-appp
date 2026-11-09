import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleService } from "@/services/articleService";
import { Article } from "@/constants/articles";
import { Clock, ChevronLeft, ArrowRight } from "lucide-react";
import ArticleActions from "./ArticleActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const articles = await articleService.getArticles();
  return articles.map((article) => ({
    id: article.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await articleService.getArticleById(id);

  if (!article) return { title: "Article Not Found" };

  return {
    title: `${article.title} | Sango Hub`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await articleService.getArticleById(id);

  if (!article) {
    notFound();
  }

  // A blank line separates paragraphs; single line breaks stay inside one.
  const paragraphs = article.content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const more: Article[] = (await articleService.getArticles().catch(() => [] as Article[])).filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <article className="bg-white min-h-screen pt-[72px] pb-24 selection:bg-sky-100 selection:text-sky-900">
      {/* Breadcrumb */}
      <div className="border-b border-slate-100 bg-slate-50/60">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl flex items-center gap-3 h-12 text-[14px]">
          <Link href="/portal" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-sky-700 transition-colors">
            <ChevronLeft size={18} /> All news
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 truncate">{article.category}</span>
        </div>
      </div>

      {/* Title */}
      <header className="container mx-auto px-4 lg:px-8 max-w-3xl pt-10 md:pt-14 pb-8">
        <div className="flex items-center gap-3 text-[14px] font-semibold">
          <span className="text-sky-700">{article.category}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="flex items-center gap-1.5 text-slate-500"><Clock size={14} /> {article.time}</span>
        </div>
        <h1 className="font-heading text-[30px] sm:text-4xl md:text-[46px] font-bold text-slate-900 leading-[1.15] mt-4">
          {article.title}
        </h1>
        <p className="text-[19px] md:text-[21px] text-slate-600 leading-relaxed mt-5">{article.excerpt}</p>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-sky-50 flex items-center justify-center text-sky-700 font-bold text-lg border border-sky-100">
                {article.author.charAt(0)}
              </div>
              <div>
                <div className="text-[15px] font-semibold text-slate-900">{article.author}</div>
                <div className="text-[13px] text-slate-500">Sango Information Hub</div>
              </div>
            </div>
            <ArticleActions title={article.title} text={article.content} />
          </div>
      </header>

      {/* Picture */}
      <div className="container mx-auto px-0 md:px-4 lg:px-8 max-w-5xl mb-12">
        <div className="aspect-[16/9] md:aspect-[2/1] md:rounded-3xl overflow-hidden relative bg-slate-100">
          <Image src={article.image || "/images/lake-victoria-bg.png"} alt={article.title} fill priority sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
        </div>
      </div>

      {/* Story */}
      <div className="container mx-auto px-4 lg:px-8 max-w-[44rem]">
        <div className="space-y-6 text-[18px] md:text-[19px] leading-[1.8] text-slate-800">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">{p}</p>
          ))}
        </div>

        <div className="mt-14 p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[15px] text-slate-600 leading-relaxed">
            Sango Information Hub is a community media initiative for the environment and development of the Lake Victoria Basin.
          </p>
          <ArticleActions title={article.title} text={article.content} />
        </div>
      </div>

      {/* More stories */}
      {more.length > 0 && (
        <section className="container mx-auto px-4 lg:px-8 max-w-6xl mt-20">
          <div className="flex items-end justify-between border-b border-slate-200 pb-4 mb-8">
            <h2 className="font-heading text-[26px] font-bold text-slate-900">More stories</h2>
            <Link href="/portal" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-sky-700 hover:text-sky-900">All news <ArrowRight size={15} /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {more.map((a) => (
              <Link key={a.id} href={`/portal/article/${a.id}`} className="group block">
                <div className="aspect-[16/10] rounded-2xl overflow-hidden relative bg-slate-100">
                  <Image src={a.image || "/images/lake-victoria-bg.png"} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <p className="text-[13px] font-semibold text-sky-700 mt-4">{a.category}</p>
                <h3 className="font-heading text-[18px] font-bold text-slate-900 leading-snug mt-1 group-hover:text-sky-700 transition-colors line-clamp-2">{a.title}</h3>
                <p className="text-[13px] text-slate-500 mt-2">{a.author} · {a.time}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
