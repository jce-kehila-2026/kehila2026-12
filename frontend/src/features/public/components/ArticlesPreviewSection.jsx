import { useMemo } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArticleCard from './ArticleCard';
import EmptyState from './EmptyState';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeField } from '../../../i18n/localizeField';
import useHorizontalCardCarousel from '../hooks/useHorizontalCardCarousel';
import '../styles/public-articles-section.css';

export default function ArticlesPreviewSection({ coverage = [] }) {
  const { t, direction, locale } = usePublicLocale();

  // Localize admin-edited press title/description for the current locale.
  const items = useMemo(() => {
    const list = Array.isArray(coverage) ? coverage : [];
    return list.map((item) => ({
      ...item,
      title: localizeField(item.translations?.title ?? item.title, locale),
      description: localizeField(item.translations?.description ?? item.description, locale),
    }));
  }, [coverage, locale]);
  const carousel = useHorizontalCardCarousel({
    cardSelector: '.press-article-card',
    direction,
    itemCount: items.length,
  });

  return (
    <section
      className="public-section public-section--press-articles"
      id="articles"
      aria-labelledby="press-articles-title"
    >
      <div className="press-articles__inner">
        <PublicSectionHeading
          className="press-articles__heading-wrap"
          eyebrow={t('articlesEyebrow')}
          title={t('articlesTitle')}
          titleId="press-articles-title"
          subtitle={t('articlesSubtitle')}
        />

        {items.length ? (
          <div className={[
            'public-stories-slider',
            'press-articles__slider',
            'public-card-carousel',
            !carousel.showControls ? 'public-card-carousel--without-controls' : '',
            carousel.fadeLeft ? 'public-card-carousel--fade-left' : '',
            carousel.fadeRight ? 'public-card-carousel--fade-right' : '',
          ].filter(Boolean).join(' ')}>
            {carousel.showControls ? <button
              type="button"
              className="public-stories-slider__arrow public-stories-slider__arrow--prev public-card-carousel__button"
              onClick={() => carousel.scrollByCards(-1)}
              disabled={!carousel.canScrollPrev}
              aria-label="Previous"
            >
              {direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button> : null}
            <div className="public-stories-slider__track press-articles__track public-card-carousel__track" ref={carousel.scrollerRef}>
              {items.map((article) => (
                <ArticleCard article={article} key={article.id} />
              ))}
            </div>
            {carousel.showControls ? <button
              type="button"
              className="public-stories-slider__arrow public-stories-slider__arrow--next public-card-carousel__button"
              onClick={() => carousel.scrollByCards(1)}
              disabled={!carousel.canScrollNext}
              aria-label="Next"
            >
              {direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </button> : null}
          </div>
        ) : (
          <div className="press-articles__state">
            <EmptyState message={t('emptyArticles')} />
          </div>
        )}
      </div>
    </section>
  );
}
