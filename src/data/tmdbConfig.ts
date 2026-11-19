import type { StreamingPlatform } from '../types.ts';

export function readEnvVar(name: string): string {
  const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
  if (metaEnv && typeof metaEnv[name] === 'string') {
    return metaEnv[name]!.trim();
  }
  if (typeof process !== 'undefined' && process.env && typeof process.env[name] === 'string') {
    return process.env[name]!.trim();
  }
  return '';
}

export const TMDB_API_KEY =
  readEnvVar('VITE_TMDB_API_KEY') || readEnvVar('TMDB_API_KEY');
export const TMDB_BASE_URL =
  readEnvVar('VITE_TMDB_BASE_URL') || 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE =
  readEnvVar('VITE_TMDB_IMAGE_BASE') || 'https://image.tmdb.org/t/p';

export const TMDB_RESULT_PAGE_LIMIT = 500;
export const TMDB_NOLLYWOOD_KEYWORD_IDS = '207317|263548';
export const NIGERIAN_INDIGENOUS_LANGUAGE_CODES = 'yo|ig|ha|pcm';
export const DEFAULT_MOVIE_RUNTIME_MINUTES = 105;

// Tiered LocalStorage Cache Keys & TTLs
export const CACHE_PREFIX = 'afromoviedb_cache_';
export const MOVIE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
export const PERSON_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
export const SEARCH_TTL_MS = 2 * 60 * 60 * 1000; // 2 Hours
export const LAST_RELEASE_SYNC_KEY = 'afromoviedb_last_release_sync_time';
export const RELEASE_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours (Daily)

const tmdbHeadshotUrl = (filePath: string) => `${TMDB_IMAGE_BASE}/w500${filePath}`;

// Curated verified high-resolution TMDb profile headshots for renowned Nollywood directors & actors
export const KNOWN_PERSON_HEADSHOTS: Record<string, string> = {
  'funke akindele': tmdbHeadshotUrl('/cjV3OUS14Mkbg6GILTZBSO2ovtD.jpg'),
  'richard mofe-damijo': tmdbHeadshotUrl('/ycEuQzNuKwTNiCniVR2X8YbPUWP.jpg'),
  'richard mofe-damijo (rmd)': tmdbHeadshotUrl('/ycEuQzNuKwTNiCniVR2X8YbPUWP.jpg'),
  'editi effiong': tmdbHeadshotUrl('/vjFRJEb2chBzwaA2tYeDCujuxmq.jpg'),
  'kemi adetiba': tmdbHeadshotUrl('/tiqrAogVqMTu3TC6lqIQhfTKseS.jpg'),
  'kunle afolayan': tmdbHeadshotUrl('/1pDeg5kVulTBLqrJuw2LkvfDJ5i.jpg'),
  'genevieve nnaji': tmdbHeadshotUrl('/hok4307uT1KoRAkPAyAukZjxCZJ.jpg'),
  'ramsey nouah': tmdbHeadshotUrl('/yHA9WfTrv70pQL1aWLegLFz7U6I.jpg'),
  'timini egbuson': tmdbHeadshotUrl('/cI1LWYIVu1CYVRkARjawktcFkL6.jpg'),
  'bimbo ademoye': tmdbHeadshotUrl('/qRjPXsuTm0jDUOSeBnF1sdJ6g8H.jpg'),
  'ade laoye': tmdbHeadshotUrl('/6oNvenBDraDXtsqRC2hJtUXpq9H.jpg'),
  'sam dede': tmdbHeadshotUrl('/3wRHFT3elJdv2mCRnE5YFvGDA8s.jpg'),
  'shaffy bello': tmdbHeadshotUrl('/lPZnFa19grkg9ijw22d11mZKvE0.jpg'),
  'alex usifo': tmdbHeadshotUrl('/hHk1y2cD9IksH405MJHV0obRT7f.jpg'),
  'alex usifo omiagbo': tmdbHeadshotUrl('/hHk1y2cD9IksH405MJHV0obRT7f.jpg'),
  'kelechi udegbe': tmdbHeadshotUrl('/Atjpbfrs8g9SwtWBk0BHEO7gyzX.jpg'),
  'taiwo ajai-lycett': tmdbHeadshotUrl('/wM0B2mfBZvc19BFVEnl9Od4Uxqd.jpg'),
  'ireti doyle': tmdbHeadshotUrl('/hzBv9eiamRCOix7ImNQjUgyQOFc.jpg'),
  'bimbo akintola': tmdbHeadshotUrl('/kHONQj6avaxannhDhEgJPKNm3m9.jpg'),
  'femi branch': tmdbHeadshotUrl('/36StBYl9Ss4dLOCdCbywxZHvZQF.jpg'),
  'bimbo manuel': tmdbHeadshotUrl('/fv5ou8VCz2cgm8W1nqAnAA6dsFC.jpg'),
  'norbert young': tmdbHeadshotUrl('/7MfOeFrxdggkHXRMV6mnVlxuSPB.jpg'),
  'ikechukwu onunaku': tmdbHeadshotUrl('/jQQtzvq2mFfuPtCAA0rF0l59Wcg.jpg'),
  'kemi lala akindoju': tmdbHeadshotUrl('/8QOST78lqWueU0DDJpWWvEoj0z4.jpg'),
  'sola sobowale': tmdbHeadshotUrl('/3nO3VboeVLVOwIHMkTRIwTrrKQP.jpg'),
  'adesua etomi': tmdbHeadshotUrl('/qJpP0QJZE1Lcxswchana8opO9uW.jpg'),
  'adesua etomi-wellington': tmdbHeadshotUrl('/qJpP0QJZE1Lcxswchana8opO9uW.jpg'),
  'jide kene achufusi': tmdbHeadshotUrl('/jX7Mb37fa7JhB9c3acL1evERNwW.jpg')
};

export const PLATFORM_PRESETS: Record<'netflix' | 'prime' | 'youtube' | 'africaMagic', StreamingPlatform> = {
  netflix: { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' },
  prime: { name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' },
  youtube: { name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' },
  africaMagic: { name: 'Africa Magic', badgeColor: 'bg-purple-600', url: 'https://www.dstv.com' }
};

// TMDb Genre ID mapping
export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Epic & Folklore',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime & Thriller',
  99: 'Historical Drama',
  18: 'Drama',
  10751: 'Drama',
  14: 'Epic & Folklore',
  36: 'Historical Drama',
  27: 'Crime & Thriller',
  10402: 'Drama',
  9648: 'Crime & Thriller',
  10749: 'Romantic Comedy',
  878: 'Action',
  10770: 'Drama',
  53: 'Crime & Thriller',
  10752: 'Historical Drama',
  37: 'Action'
};

export const POPULAR_NIGERIAN_WEB_SUGGESTIONS = [
  'Gangs of Lagos',
  'Shanty Town',
  'King of Thieves',
  'Sugar Rush',
  'Lisabi: The Uprising',
  "House of Ga'a",
  'Merry Men',
  'Omo Ghetto: The Saga',
  'Far From Home',
  'Ijakumo',
  'A Sunday Affair',
  'Namaste Wahala',
  'A Tribe Called Judah',
  'Anikulapo',
  'The Black Book',
  'Jagun Jagun'
];

/**
 * Curated iconic Nollywood milestone queries spanning multi-decade historical eras:
 * 1990s, 2000s, 2010s, 2020s (and 1980s legacy roots).
 */
export const CLASSIC_QUERIES_BY_ERA: Record<string, string[]> = {
  '1980s Era': ['Aiye', 'Jaiyesimi', 'Kada River', 'Papa Ajasco', 'Mosebolatan', 'Kannakanna'],
  '1990s Era': [
    'Living in Bondage', 'Glamour Girls', 'Saworoide', 'Nneka The Pretty Serpent',
    'Domitilla', 'Hostages', 'Thunderbolt', 'Ti Oluwa Ni Ile', 'Mortal Inheritance',
    'Diamond Ring', 'Karishika', 'Scores to Settle', 'Igodo', 'Blood Money', 'Sakobi',
    'Owo Blow', 'Rattle Snake', 'Silent Night', 'Most Wanted', 'Taboo', 'Died Wretched'
  ],
  '2000s Era': [
    'Osuofia in London', 'Aki na Ukwa', 'Issakaba', 'The Figurine', 'Irapada',
    'Dangerous Twins', 'Jenifa', 'Games Men Play', 'Keeping Faith', 'Blood Sister',
    'Out of Bounds', 'Last Burial', 'State of Emergency', 'Oracle', 'Sharon Stone',
    'Egg of Life', 'Festival of Fire', "Beyonce: The President's Daughter", 'Emotional Crack'
  ],
  '2010s Era': [
    'The Wedding Party', 'Fifty', 'October 1', 'Taxi Driver',
    'Chief Daddy', 'King of Boys', 'Lionheart', 'Merry Men', 'The Bling Lagosians',
    'Isoken', 'Up North', 'Sugar Rush', 'The Mirror Boy', 'Phone Swap', 'Anchor Baby',
    'Maami', 'Half of a Yellow Sun', 'Dry', 'Oloture'
  ],
  '2020s Era': [
    'Anikulapo', 'The Black Book', 'Jagun Jagun', 'King of Thieves', 'Gangs of Lagos',
    'Shanty Town', 'Lisabi: The Uprising', "House of Ga'a", 'Omo Ghetto: The Saga',
    'A Tribe Called Judah', 'Breath of Life', 'Mami Wata', 'Ijakumo', 'Battle on Buka Street',
    'Blood Sisters', 'Far From Home', 'Afamefuna'
  ]
};

export const HISTORICAL_SWEEP_ERAS: ReadonlyArray<{ label: string; gte: string; lte: string }> = [
  { label: '1990s Era', gte: '1990-01-01', lte: '1999-12-31' },
  { label: '2000s Era', gte: '2000-01-01', lte: '2009-12-31' },
  { label: '2010s Era', gte: '2010-01-01', lte: '2019-12-31' },
  { label: '2020s Era', gte: '2020-01-01', lte: '2029-12-31' },
  { label: '1980s Era', gte: '1980-01-01', lte: '1989-12-31' }
];
