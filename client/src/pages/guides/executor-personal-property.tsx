import { GuideBlocks, GuidePage } from "@/components/guide-layout";
import { GUIDE_ARTICLES } from "@shared/guide-articles";
import { SEO } from "@shared/seo";

export default function ExecutorPersonalPropertyGuide() {
  const article = GUIDE_ARTICLES.executor;
  return (
    <GuidePage
      page={SEO.executorPersonalProperty}
      kicker={article.kicker}
      headline={article.headline}
      lede={article.lede}
      photo={article.photo}
      faqs={article.faqs}
      related={article.related}
    >
      <GuideBlocks blocks={article.body} />
    </GuidePage>
  );
}
