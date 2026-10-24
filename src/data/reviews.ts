import { UserReview } from '../types';

export const INITIAL_REVIEWS: UserReview[] = [
  {
    id: 'rev-1',
    movieId: 'a-tribe-called-judah',
    userName: 'Chidi Okafor',
    rating: 9,
    comment: 'Funke Akindele once again proved why she rules Nigerian cinema. The emotional bond between the five brothers gave me goosebumps! A true masterpiece.',
    createdAt: '2024-01-14',
    userLocation: 'Lagos, Nigeria'
  },
  {
    id: 'rev-2',
    movieId: 'the-black-book',
    userName: 'Amina Bello',
    rating: 10,
    comment: 'RMD delivered the performance of a lifetime. The cinematography in Kaduna and the fight scenes are Hollywood-standard yet authentically Nigerian.',
    createdAt: '2023-10-02',
    userLocation: 'Abuja, Nigeria'
  },
  {
    id: 'rev-3',
    movieId: 'king-of-boys',
    userName: 'Folake Adeyemi',
    rating: 10,
    comment: 'Sola Sobowale as Eniola Salami is iconic! "Sit down!" will forever be quoted. Kemi Adetiba created pure cinema history here.',
    createdAt: '2023-08-20',
    userLocation: 'London, UK'
  },
  {
    id: 'rev-4',
    movieId: 'breathe-of-life',
    userName: 'Emeka Nwosu',
    rating: 10,
    comment: 'I cried like a baby. The pacing, the score, the message of redemption. One of the best movies Nollywood has ever produced.',
    createdAt: '2024-02-05',
    userLocation: 'Enugu, Nigeria'
  },
  {
    id: 'rev-5',
    movieId: 'saworoide',
    userName: 'Babatunde Alao',
    rating: 10,
    comment: 'Tunde Kelani’s Saworoide is timeless. Every Nigerian leader should be made to watch this film once every year. The music is sublime.',
    createdAt: '2023-11-19',
    userLocation: 'Ibadan, Nigeria'
  }
];
