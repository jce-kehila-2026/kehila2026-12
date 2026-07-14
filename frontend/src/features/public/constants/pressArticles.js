/** Featured external coverage — first three homepage cards link here for now. */
export const PRESS_FEATURED_ARTICLE_URL =
  'https://www.jpost.com/israel-news/culture/article-872861';

export function resolvePressArticleHref(article, index = 0) {
  if (index < 3) {
    return PRESS_FEATURED_ARTICLE_URL;
  }

  const url = String(article?.readMoreUrl || article?.url || article?.link || '').trim();

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return PRESS_FEATURED_ARTICLE_URL;
}
