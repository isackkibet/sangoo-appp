import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { articleService } from "@/services/articleService";
import { Article } from "@/constants/articles";
import ArticleAudio from "./ArticleActions";
import AskSIHU from "@/components/portal/AskSIHU";
import RelatedStories from "@/components/portal/RelatedStories";
import ArticleProgress from "@/components/portal/ArticleProgress";
import ArticleTOC from "@/components/portal/ArticleTOC";
import ArticleFooter from "@/components/portal/ArticleFooter";

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
    title: `${article.title} | Sango Information Hub`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.image],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
    authors: [{ name: article.author }],
  };
}

function readingMinutes(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await articleService.getArticleById(id);

  if (!article) {
    notFound();
  }

  // A blank line separates paragraphs; single line breaks stay inside one.
  const paragraphs = article.content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const readTime = readingMinutes(article.content);
  const allArticles = await articleService.getArticles().catch(() => [] as Article[]);

  // Build a table of contents from any explicit headings in the content.
  // Content is plain text; headings are only included when present so we never
  // fabricate structure that the author did not write.
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  paragraphs.forEach((p, index) => {
    const trimmed = p.trim();
    if (
      trimmed.length > 0 &&
      trimmed.length < 90 &&
      !trimmed.endsWith(".") &&
      !trimmed.endsWith("?") &&
      !trimmed.endsWith(":")
    ) {
      headings.push({
        id: `heading-${index}`,
        text: trimmed,
        level: trimmed.length < 45 ? 2 : 3,
      });
    }
  });

  return (
    <div className="bg-white min-h-screen selection:bg-primary/20 selection:text-slate-900">
      {/* Top reading progress bar */}
      <ArticleProgress />

      {/* Breadcrumb */}
      <nav className="container mx-auto px-4 lg:px-8 max-w-7xl py-3 mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
          <li>
            <Link
              href="/portal"
              className="text-slate-600 hover:text-sky-700 transition-colors"
            >
              <ChevronLeft size={15} className="mr-1" aria-hidden="true" />
              All news
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">
            /
          </li>
          <li>
            <span className="text-slate-900 truncate">{article.category}</span>
          </li>
        </ol>
      </nav>

      <main className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {/* Article header + hero in a single-column editorial masthead */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                article.category.toLowerCase().includes("environ") ||
                article.category.toLowerCase().includes("green") ||
                article.category.toLowerCase().includes("blue")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/30 dark:bg-sky-900/20 dark:text-sky-300"
              }`}
            >
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-500">
              <Clock size={13} aria-hidden="true" />
              {readTime} min read
            </span>
          </div>

          <h1 className="font-heading text-[36px] sm:text-[48px] md:text-[56px] font-bold text-slate-950 leading-[1.12] mb-6 tracking-tight dark:text-white">
            {article.title}
          </h1>

          <p className="text-[19px] md:text-[21px] leading-relaxed text-slate-600 mb-8 dark:text-slate-300">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-5 border-t border-slate-200 pt-6 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold dark:bg-slate-800 dark:text-slate-300">
                {article.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[14px] font-bold text-slate-900 leading-none dark:text-white">
                  {article.author}
                </div>
                <div className="text-[12px] text-slate-500 leading-none">Sango Information Hub</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={13} aria-hidden="true" />
                {article.time}
              </span>
            </div>
          </div>
        </header>

        {/* Hero image */}
        <figure className="my-12 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
            priority
          />
        </figure>
      </main>

      {/* Editorial reading layout: main column + sidebar */}
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main reading column (~740px equivalent) */}
          <main className="lg:col-span-8 xl:col-span-9">
            <article className="prose prose-lg max-w-none text-slate-800 dark:text-slate-200 leading-[1.8]">
              <header className="mb-10">
                <h2 className="font-heading text-[28px] font-bold text-slate-950 leading-[1.25] mb-4 tracking-tight dark:text-white">
                  {article.title}
                </h2>
                <p className="text-[17px] md:text-[19px] text-slate-600 leading-relaxed dark:text-slate-400">
                  {article.excerpt}
                </p>
              </header>

              {paragraphs.map((p, index) => {
                const heading = headings.find((h) => h.id === `heading-${index}`);
                if (heading) {
                  return (
                    <h3
                      key={index}
                      id={heading.id}
                      className="font-heading text-[22px] font-bold text-slate-950 leading-[1.3] mt-12 mb-4 tracking-tight dark:text-white"
                    >
                      {heading.text}
                    </h3>
                  );
                }
                return (
                  <p key={index} className="mb-7 whitespace-pre-line">
                    {p}
                  </p>
                );
              })}
            </article>

            {/* Audio experience */}
            <ArticleAudio title={article.title} text={article.content} />

            {/* Ask SIHU AI */}
            <AskSIHU
              title={article.title}
              excerpt={article.excerpt}
              content={article.content}
              language="en"
            />
          </main>

          {/* Sidebar: TOC + related stories */}
          <aside className="lg:col-span-4 xl:col-span-3">
            {headings.length > 0 && (
              <ArticleTOC headings={headings} className="sticky top-[110px]" />
            )}
            <RelatedStories articles={allArticles} currentId={article.id} language="en" />
          </aside>
        </div>
      </div>

      <ArticleFooter title={article.title} />
    </div>
  );
}
