import { publicHomeContentLocales } from './publicHomeContentLocales';
import { DEFAULT_PUBLIC_LOCALE } from './publicHomeTranslations';
import { localizeField } from '../../../i18n/localizeField';

/**
 * Returns Hebrew source when locale is Hebrew; otherwise the localized string.
 * @param {'he' | 'ar' | 'en'} locale
 * @param {string} hebrewValue
 * @param {string | undefined} localizedValue
 */
export function pickLocalized(locale, hebrewValue, localizedValue) {
  if (locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return hebrewValue;
  }

  const localized = typeof localizedValue === 'string' ? localizedValue.trim() : '';
  return localized || hebrewValue;
}

function getLocalePack(locale) {
  if (locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return null;
  }

  return publicHomeContentLocales[locale] ?? null;
}

function localizePopupSections(sections, localizedSections, locale) {
  if (!Array.isArray(sections) || !Array.isArray(localizedSections)) {
    return sections;
  }

  return sections.map((section, index) => {
    const localized = localizedSections[index];
    if (!section || !localized) {
      return section;
    }

    return {
      ...section,
      label: pickLocalized(locale, section.label, localized.label),
      text: pickLocalized(locale, section.text, localized.text),
    };
  });
}

/**
 * @param {object} aboutUs
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeAboutUs(aboutUs, locale) {
  if (!aboutUs || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return aboutUs;
  }

  const pack = getLocalePack(locale);
  if (!pack?.about) {
    return aboutUs;
  }

  const { about } = pack;

  return {
    ...aboutUs,
    paragraph: pickLocalized(locale, aboutUs.paragraph, about.paragraph),
    cards: Array.isArray(aboutUs.cards)
      ? aboutUs.cards.map((card, index) => {
          const localizedCard = about.cards?.[index];
          if (!localizedCard) {
            return card;
          }

          return {
            ...card,
            title: pickLocalized(locale, card.title, localizedCard.title),
            description: pickLocalized(locale, card.description, localizedCard.description),
          };
        })
      : aboutUs.cards,
  };
}

/**
 * @param {Array<{ id?: string, label?: string, note?: string }>} statistics
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeStatistics(statistics, locale) {
  if (!Array.isArray(statistics) || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return statistics;
  }

  const pack = getLocalePack(locale);
  if (!pack?.statistics) {
    return statistics;
  }

  return statistics.map((statistic) => {
    const key = statistic?.id;
    const localized = key ? pack.statistics[key] : null;

    if (!localized) {
      return statistic;
    }

    return {
      ...statistic,
      label: pickLocalized(locale, statistic.label, localized.label),
      note: pickLocalized(locale, statistic.note, localized.note),
    };
  });
}

/**
 * @param {object} card
 * @param {number} index
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeLearnTogetherCard(card, index, locale) {
  if (!card || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return card;
  }

  const pack = getLocalePack(locale);
  const localized =
    pack?.learnTogether?.cards?.[card.id] ??
    Object.values(pack?.learnTogether?.cards ?? {})[index];

  if (!localized) {
    return card;
  }

  const popup = card.popup && typeof card.popup === 'object' ? card.popup : {};
  const localizedPopup = localized.popup ?? {};

  return {
    ...card,
    title: pickLocalized(locale, card.title, localized.title),
    description: pickLocalized(locale, card.description, localized.description),
    popup: {
      ...popup,
      title: pickLocalized(locale, popup.title, localizedPopup.title),
      paragraph: pickLocalized(locale, popup.paragraph, localizedPopup.paragraph),
      sections: localizePopupSections(popup.sections, localizedPopup.sections, locale),
    },
  };
}

/**
 * @param {object} learnTogether
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeLearnTogether(learnTogether, locale) {
  if (!learnTogether || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return learnTogether;
  }

  const pack = getLocalePack(locale);
  if (!pack?.learnTogether) {
    return learnTogether;
  }

  const { learnTogether: lt } = pack;

  return {
    ...learnTogether,
    eyebrow: pickLocalized(locale, learnTogether.eyebrow, lt.eyebrow),
    title: pickLocalized(locale, learnTogether.title, lt.title),
    paragraph: pickLocalized(locale, learnTogether.paragraph, lt.paragraph),
    cards: Array.isArray(learnTogether.cards)
      ? learnTogether.cards.map((card, index) => localizeLearnTogetherCard(card, index, locale))
      : learnTogether.cards,
  };
}

/**
 * @param {Array<{ id?: string, role?: string, description?: string }>} members
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeTeamStories(members, locale) {
  if (!Array.isArray(members) || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return members;
  }

  const pack = getLocalePack(locale);
  if (!pack?.teamStories) {
    return members;
  }

  const storyKeys = Object.keys(pack.teamStories);

  return members.map((member, index) => {
    const localized = (member?.id && pack.teamStories[member.id]) || pack.teamStories[storyKeys[index]] || null;

    if (!localized) {
      return member;
    }

    return {
      ...member,
      role: pickLocalized(locale, member.role, localized.role),
      description: pickLocalized(locale, member.description, localized.description),
    };
  });
}

/**
 * @param {Array<{ id?: string, name?: string, role?: string, description?: string }>} members
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeTeamStaff(members, locale) {
  if (!Array.isArray(members) || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return members;
  }

  const pack = getLocalePack(locale);

  return members.map((member) => {
    const packEntry = (pack?.teamStaff && member?.id) ? pack.teamStaff[member.id] : null;

    // Nothing to localize this member with — leave the Hebrew source.
    if (!packEntry && !member?.translations) {
      return member;
    }

    // Prefer Azure translations on the doc; fall back to the hand pack, then
    // source. Personal names are not Azure-translated (only the hand pack may).
    const fromAzure = (field) => localizeField(member?.translations?.[field], locale);

    return {
      ...member,
      name: pickLocalized(locale, member.name, packEntry?.name),
      role: fromAzure('role') || pickLocalized(locale, member.role, packEntry?.role),
      description: fromAzure('description') || pickLocalized(locale, member.description, packEntry?.description),
    };
  });
}

/**
 * @param {Array<{ id?: string, title?: string, description?: string, dateLabel?: string, location?: string }>} events
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeEvents(events, locale) {
  if (!Array.isArray(events) || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return events;
  }

  const pack = getLocalePack(locale);
  const eventKeys = pack?.events ? Object.keys(pack.events) : [];

  return events.map((event, index) => {
    const packEntry = pack?.events
      ? (event?.id && pack.events[event.id]) || pack.events[eventKeys[index]] || null
      : null;

    // Nothing to localize this event with — leave it as the Hebrew source.
    if (!packEntry && !event?.translations) {
      return event;
    }

    // Prefer Azure-stored translations on the doc; fall back to the hand-written
    // pack, then to the Hebrew source.
    const fromAzure = (field) => localizeField(event?.translations?.[field], locale);

    return {
      ...event,
      title: fromAzure('title') || pickLocalized(locale, event.title, packEntry?.title),
      description: fromAzure('description') || pickLocalized(locale, event.description, packEntry?.description),
      dateLabel: pickLocalized(locale, event.dateLabel, packEntry?.dateLabel),
      location: fromAzure('location') || pickLocalized(locale, event.location, packEntry?.location),
    };
  });
}

/**
 * @param {Array<{ id?: string, title?: string, description?: string }>} articles
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeArticles(articles, locale) {
  if (!Array.isArray(articles) || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return articles;
  }

  const pack = getLocalePack(locale);
  if (!pack?.articles) {
    return articles;
  }

  const articleKeys = Object.keys(pack.articles);

  return articles.map((article, index) => {
    const localized = (article?.id && pack.articles[article.id]) || pack.articles[articleKeys[index]] || null;

    if (!localized) {
      return article;
    }

    return {
      ...article,
      title: pickLocalized(locale, article.title, localized.title),
      description: pickLocalized(locale, article.description, localized.description),
    };
  });
}

/**
 * @param {Array<{ id?: string, title?: string, description?: string }>} features
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeDonationFeatures(features, locale) {
  if (!Array.isArray(features) || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return features;
  }

  const pack = getLocalePack(locale);
  if (!pack?.donationFeatures) {
    return features;
  }

  return features.map((feature) => {
    const localized = feature?.id ? pack.donationFeatures[feature.id] : null;

    if (!localized) {
      return feature;
    }

    return {
      ...feature,
      title: pickLocalized(locale, feature.title, localized.title),
      description: pickLocalized(locale, feature.description, localized.description),
    };
  });
}

/**
 * @param {object} partner
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeMedicalPartner(partner, locale) {
  if (!partner || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return partner;
  }

  const pack = getLocalePack(locale);
  const localized = partner?.id ? pack?.medicalPartners?.[partner.id] : null;

  if (!localized) {
    return partner;
  }

  const localizedServices = Array.isArray(partner.services)
    ? partner.services.map((service) => {
        const serviceLocale = service?.id ? localized.services?.[service.id] : null;

        if (!serviceLocale) {
          return service;
        }

        return {
          ...service,
          label: pickLocalized(locale, service.label, serviceLocale.label),
        };
      })
    : partner.services;

  return {
    ...partner,
    name: pickLocalized(locale, partner.name, localized.name),
    shortDescription: pickLocalized(locale, partner.shortDescription, localized.shortDescription),
    longDescription: pickLocalized(locale, partner.longDescription, localized.longDescription),
    heroQuote: pickLocalized(locale, partner.heroQuote, localized.heroQuote),
    heroAlt: pickLocalized(locale, partner.heroAlt, localized.heroAlt),
    hours: pickLocalized(locale, partner.hours, localized.hours),
    address: pickLocalized(locale, partner.address, localized.address),
    services: localizedServices,
  };
}

/**
 * @param {object} contact
 * @param {'he' | 'ar' | 'en'} locale
 */
export function localizeContactContent(contact, locale) {
  if (!contact || locale === DEFAULT_PUBLIC_LOCALE || locale === 'he') {
    return contact;
  }

  const pack = getLocalePack(locale);
  if (!pack?.contact) {
    return contact;
  }

  const { contact: localized } = pack;

  return {
    ...contact,
    eyebrow: pickLocalized(locale, contact.eyebrow, localized.eyebrow),
    title: pickLocalized(locale, contact.title, localized.title),
    description: pickLocalized(locale, contact.description, localized.description),
  };
}
