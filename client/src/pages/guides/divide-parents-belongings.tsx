import { GuideBlocks, GuidePage } from "@/components/guide-layout";
import { GUIDE_ARTICLES } from "@shared/guide-articles";
import { SEO } from "@shared/seo";

export default function DivideParentsBelongingsGuide() {
  const article = GUIDE_ARTICLES.divideParents;
  return (
    <GuidePage
      page={SEO.divideParentsBelongings}
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
