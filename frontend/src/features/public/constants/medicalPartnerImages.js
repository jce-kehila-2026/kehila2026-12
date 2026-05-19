import assutaLogo from '../../../assets/images/assuta.png';
import ichilovLogo from '../../../assets/images/ichilov.png';
import barzilaiLogo from '../../../assets/images/barzilai-logo.jpg';
import shamirLogo from '../../../assets/images/shamir.png';
import assutaHero from '../../../assets/images/assuta-building.jpeg';
import ichilovHero from '../../../assets/images/ichilov-building.jpg';
import barzilaiHero from '../../../assets/images/barzilai-building.jpg';
import assafHarofehHero from '../../../assets/images/shamir-building.jpg';

export {
  assutaLogo,
  ichilovLogo,
  barzilaiLogo,
  shamirLogo,
  assutaHero,
  ichilovHero,
  barzilaiHero,
  assafHarofehHero,
};

/** Raw Vite imports — use directly as img src. */
export const MEDICAL_PARTNER_LOGOS = {
  'assuta-ashdod': assutaLogo,
  ichilov: ichilovLogo,
  barzilai: barzilaiLogo,
  'assaf-harofeh': shamirLogo,
};

/** Modal hero imagery only — cards use MEDICAL_PARTNER_LOGOS. */
export const MEDICAL_PARTNER_HERO_IMAGES = {
  'assuta-ashdod': assutaHero,
  ichilov: ichilovHero,
  barzilai: barzilaiHero,
  'assaf-harofeh': assafHarofehHero,
};
