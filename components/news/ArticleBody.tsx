import { formatArticleBodyHtml } from "@/lib/articles/article-body";

export function ArticleBody({
  content,
  title,
}: {
  content: string;
  title?: string | null;
}) {
  const html = formatArticleBodyHtml(content, title);
  if (!html) return null;

  return (
    <div
      className="prose-athopia"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
