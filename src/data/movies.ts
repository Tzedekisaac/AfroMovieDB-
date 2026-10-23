import { Movie, UserReview } from '../types';

const RAW_NIGERIAN_MOVIES: Movie[] = [
  {
    id: 'a-tribe-called-judah',
    title: 'A Tribe Called Judah',
    nativeTitle: 'Ẹbí ti a ń pè ní Judah',
    tagline: 'Family is not an option; it is everything.',
    releaseYear: 2023,
    director: 'Funke Akindele & Adeoluwa Owu',
    producer: 'Funke Akindele (FA Scene Productions)',
    leadCast: [
      { actor: 'Funke Akindele', role: 'Jedidah Judah (The Matriarch)' },
      { actor: 'Timini Egbuson', role: 'Pere Judah' },
      { actor: 'Jide Kene Achufusi', role: 'Emeka Judah' },
      { actor: 'Uzee Usman', role: 'Adam Judah' },
      { actor: 'Tobi Makinde', role: 'Shina Judah' },
      { actor: 'Olumide Oworu', role: 'Ejiro Judah' }
    ],
    genres: ['Comedy', 'Crime & Thriller', 'Drama'],
    languages: ['English', 'Nigerian Pidgin', 'Yoruba', 'Igbo', 'Hausa'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 134,
    rating: 8.8,
    ratingCount: 14200,
    boxOffice: '₦1.44 Billion (Highest grossing Nollywood film in cinema history)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/9aMG2ftIFqFAN69FdjovKJY0hsd.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/jX7Mb37fa7JhB9c3acL1evERNwW.jpg',
    synopsis: 'Jedidah Judah is a single mother raising five sons born from five different fathers representing Nigeria’s ethnic diversity. Facing chronic kidney failure and an insurmountable medical bill of ₦18 million, her loyal but fractured sons unite to plan a heist on a luxury mall where Emeka works—only to run into ruthless armed bandits executing an identical robbery at the exact same hour.',
    culturalSignificance: 'The first movie in West African cinematic history to shatter the ₦1 Billion box office benchmark purely from domestic cinema receipts, proving the commercial juggernaut of grassroots Nigerian storytelling.',
    streamingPlatforms: [
      { name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' },
      { name: 'Cinema', badgeColor: 'bg-amber-600', url: 'https://filmhouseng.com' }
    ],
    trailerYoutubeId: 'v8wIe7_xK3U',
    amvcaAwards: ['AMVCA Best Lead Actress Nominee', 'Highest Grossing Film of the Decade (Cinema Exhibitors Association of Nigeria)'],
    quote: {
      text: 'No matter what happens in this life, we are the sons of Jedidah. We stand as one!',
      character: 'Emeka Judah',
      actor: 'Jide Kene Achufusi'
    },
    featured: true,
    boxOfficeChampion: true
  },
  {
    id: 'the-black-book',
    title: 'The Black Book',
    tagline: 'When justice is corrupt, vengeance becomes holy.',
    releaseYear: 2023,
    director: 'Editi Effiong',
    producer: 'Anakle Films',
    leadCast: [
      { actor: 'Richard Mofe-Damijo (RMD)', role: 'Paul Edima (Deacon / Ex-Hitman)' },
      { actor: 'Ade Laoye', role: 'Vic Kalu (Investigative Journalist)' },
      { actor: 'Sam Dede', role: 'Angel' },
      { actor: 'Shaffy Bello', role: 'Big Daddy' },
      { actor: 'Alex Usifo', role: 'General Issa' }
    ],
    genres: ['Action', 'Crime & Thriller', 'Drama'],
    languages: ['English', 'Nigerian Pidgin', 'Hausa'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 124,
    rating: 8.6,
    ratingCount: 18900,
    boxOffice: 'Global #1 on Netflix in over 69 countries within opening week',
    posterUrl: 'https://image.tmdb.org/t/p/w780/kn28W24slBLyGr8ZIZnxNE5YZrY.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/9WxqnP9c29wXd03sALSpxpTx8fk.jpg',
    synopsis: 'After his only son is framed by a corrupt police squad for a high-profile kidnapping and subsequently executed, deacon and former black-ops military operative Paul Edima abandons his vows of peace. Unearthing his sealed black book of state secrets, he dismantles a syndicate reaching into the highest echelons of government.',
    culturalSignificance: 'Funded largely by Nigerian tech executives and founders, setting a gold standard for Nollywood action choreography, atmospheric cinematography in Kaduna and Lagos, and international streaming reach.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'p2wK8fGg01M',
    amvcaAwards: ['AMVCA Best Cinematography Winner', 'Best Sound Design Winner'],
    quote: {
      text: 'I spent twenty-five years asking God to forgive my sins. Do not make me show you what God forgave me for.',
      character: 'Paul Edima',
      actor: 'Richard Mofe-Damijo'
    },
    featured: true,
    boxOfficeChampion: false
  },
  {
    id: 'king-of-boys',
    title: 'King of Boys',
    nativeTitle: 'Ọba Àwọn Ọmọ Ìgboro',
    tagline: 'Power is never given; it is taken.',
    releaseYear: 2018,
    director: 'Kemi Adetiba',
    producer: 'Kemi Adetiba Visuals',
    leadCast: [
      { actor: 'Sola Sobowale', role: 'Eniola Salami (The King of Boys)' },
      { actor: 'Adesua Etomi-Wellington', role: 'Kemi Salami' },
      { actor: 'Reminisce', role: 'Makanaki' },
      { actor: 'Illbliss', role: 'Odogwu Malay' },
      { actor: 'Toni Tones', role: 'Young Eniola Salami' },
      { actor: 'Jide Kosoko', role: 'Alhaji Salami' }
    ],
    genres: ['Crime & Thriller', 'Drama'],
    languages: ['English', 'Yoruba', 'Nigerian Pidgin', 'Igbo'],
    era: 'New Nollywood (2006-2018)',
    runtimeMinutes: 169,
    rating: 9.1,
    ratingCount: 22400,
    boxOffice: '₦245 Million (Cinema record run of 7 consecutive weeks at #1)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/3nO3VboeVLVOwIHMkTRIwTrrKQP.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8lUYBdpIo8ysI9UzVn8Zs1AwB5x.jpg',
    synopsis: 'Eniola Salami is a feared businesswoman, political godmother, and underworld ruler whose political ambitions ignite a brutal turf war. When younger, ruthless mobsters led by Makanaki challenge her supremacy and state authorities close in, she wages an unapologetic, blood-soaked war to defend her throne.',
    culturalSignificance: 'Regarded as a defining masterpiece of modern African cinema, featuring Sola Sobowale in an internationally lauded tour-de-force performance that redefined anti-hero cinema.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: '9g9EpxO1L9c',
    amvcaAwards: ['AMVCA Best Actress in a Drama (Sola Sobowale)', 'AMVCA Best Supporting Actress (Adesua Etomi)'],
    quote: {
      text: 'When you pluck off the head of a chicken, does the body not stumble into the grave? I am Eniola Salami. Sit down!',
      character: 'Eniola Salami',
      actor: 'Sola Sobowale'
    },
    featured: true,
    boxOfficeChampion: false
  },
  {
    id: 'anikulapo',
    title: 'Aníkúlápó',
    nativeTitle: 'Ẹni tó ní ikú ní àpò',
    tagline: 'He who holds death in his pouch shall learn the price of resurrection.',
    releaseYear: 2022,
    director: 'Kunle Afolayan',
    producer: 'Golden Effects Pictures',
    leadCast: [
      { actor: 'Kunle Remi', role: 'Saro (The Aso-Ofi Weaver)' },
      { actor: 'Bimbo Ademoye', role: 'Queen Arolake' },
      { actor: 'Sola Sobowale', role: 'Awarun' },
      { actor: 'Hakeem Kae-Kazim', role: 'Oba Aderoju' },
      { actor: 'Taiwo Hassan (Ogogo)', role: 'Alaafin Ademuyiwa' }
    ],
    genres: ['Epic & Folklore', 'Drama', 'Historical Drama'],
    languages: ['Yoruba'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 142,
    rating: 8.9,
    ratingCount: 16800,
    boxOffice: 'Global Top 10 Non-English Film on Netflix across 24 countries',
    posterUrl: 'https://image.tmdb.org/t/p/w780/xb30hkUpBm23stnVgDJGYGsC0R0.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/gCojEROJs4JUVCCMA4fDFGc8OFc.jpg',
    synopsis: 'In ancient Oyo Empire, an ambitious traveler and cloth weaver named Saro arrives seeking fortune. Entering into a forbidden romance with the young royal Queen Arolake, he is beaten to death. But a mythical bird of death (Akala) resurrects him, bequeathing a magical gourd that conquers mortality. Swollen with pride, Saro begins challenging fate.',
    culturalSignificance: 'Swept the 2023 AMVCA awards winning 5 major honors including Best Movie in Africa, reviving global appetite for pure Yoruba folklore and classical historical epics.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'Wk81k45vP2c',
    amvcaAwards: ['AMVCA Best Overall Movie in Africa (Winner)', 'AMVCA Best Indigenous Language Movie (Winner)', 'Best Costume Design (Winner)'],
    quote: {
      text: 'Akala does not grant life to those who betray the earth that feeds them.',
      character: 'Awarun',
      actor: 'Sola Sobowale'
    },
    featured: true,
    boxOfficeChampion: false
  },
  {
    id: 'jagun-jagun',
    title: 'Jagun Jagun (The Warrior)',
    nativeTitle: 'Jagunjagun: Akikanju jagun ilẹ Yoruba',
    tagline: 'Blood shall water the soil where ambition reigns.',
    releaseYear: 2023,
    director: 'Adebayo Tijani & Tope Adebayo',
    producer: 'Femi Adebayo (Euphoria360)',
    leadCast: [
      { actor: 'Femi Adebayo', role: 'Ogundiji (The Supreme Warlord)' },
      { actor: 'Lateef Adedimeji', role: 'Gbotija (Young Woodcarver Warrior)' },
      { actor: 'Bimbo Ademoye', role: 'Gbogunmi’s Daughter / Iroyinogunkitan' },
      { actor: 'Odunlade Adekola', role: 'Jigan' },
      { actor: 'Ibrahim Yekini (Itele)', role: 'Gbogunmi' }
    ],
    genres: ['Epic & Folklore', 'Action', 'Drama'],
    languages: ['Yoruba'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 134,
    rating: 8.7,
    ratingCount: 13400,
    boxOffice: 'Over 2.1 million viewing hours on Netflix in debut 48 hours',
    posterUrl: 'https://image.tmdb.org/t/p/w780/uPZtE5DSo9VIX2N3NPtmTayhgP8.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/4Yon9Qmg3U4onL0OywXAHSkFTUG.jpg',
    synopsis: 'A ruthless warlord named Ogundiji runs an elite mercenary military academy that kings across Yoruba kingdoms contract to crush rivals. When Gbotija, a determined young warrior who possesses mystical control over trees and wood, enrols to avenge his father, his rising glory stokes Ogundiji’s lethal jealousy.',
    culturalSignificance: 'Set a new benchmark for indigenous Nigerian VFX, practical combat stunts, Yoruba incantations, and swordplay.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'U_k8d0z4W6o',
    amvcaAwards: ['AMVCA Best Indigenous Language Film (Winner)', 'Best Visual Effects Nominee'],
    quote: {
      text: 'The tree hears the whisper of the breeze before the storm tears it down.',
      character: 'Gbotija',
      actor: 'Lateef Adedimeji'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'the-wedding-party',
    title: 'The Wedding Party',
    tagline: 'It takes an entire nation to marry a Nigerian couple.',
    releaseYear: 2016,
    director: 'Kemi Adetiba',
    producer: 'Mo Abudu (Ebonylife Films), FilmOne, Inkblot',
    leadCast: [
      { actor: 'Adesua Etomi', role: 'Dunni Coker' },
      { actor: 'Banky W (Bankole Wellington)', role: 'Dozie Onwuka' },
      { actor: 'Sola Sobowale', role: 'Mrs. Tinuade Coker' },
      { actor: 'Richard Mofe-Damijo', role: 'Chief Felix Onwuka' },
      { actor: 'Iretiola Doyle', role: 'Lady Obianuju Onwuka' },
      { actor: 'Ali Baba', role: 'Bamidele Coker' }
    ],
    genres: ['Romantic Comedy', 'Comedy', 'Drama'],
    languages: ['English', 'Yoruba', 'Igbo', 'Nigerian Pidgin'],
    era: 'New Nollywood (2006-2018)',
    runtimeMinutes: 110,
    rating: 8.5,
    ratingCount: 25100,
    boxOffice: '₦453 Million (First Nigerian film to break ₦400M box office ceiling)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/qJpP0QJZE1Lcxswchana8opO9uW.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/dxknBvE4QZYZlJvV5OwvCpIzSkl.jpg',
    synopsis: 'A high-society Lagos wedding between art teacher Dunni Coker and charming IT entrepreneur Dozie Onwuka threatens to implode as cultural clashes between the boisterous Yoruba mother-of-the-bride and the aristocratic Igbo mother-of-the-groom ignite chaotic misunderstandings, party gatecrashers, and wedding day confessions.',
    culturalSignificance: 'Ignited the modern Nigerian cinema boom, proving Nollywood theatrical releases could compete with Hollywood blockbusters in West Africa.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' },
      { name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' }
    ],
    trailerYoutubeId: '7Psq4Dvdq9g',
    amvcaAwards: ['AMVCA Trailblazer Award', 'Box Office Phenomenon Recognition'],
    quote: {
      text: 'Do not tell me to calm down! When a Coker woman enters the dance floor, even the ground acknowledges her presence!',
      character: 'Mrs. Tinuade Coker',
      actor: 'Sola Sobowale'
    },
    featured: false,
    boxOfficeChampion: true
  },
  {
    id: 'breathe-of-life',
    title: 'Breathe of Life',
    tagline: 'Grace visits those who have forgotten how to breathe.',
    releaseYear: 2023,
    director: 'BB Sasore',
    producer: 'Niyi Akinmolayan & Victoria Akujobi',
    leadCast: [
      { actor: 'Wale Ojo', role: 'Timodore Johnson (Elderly)' },
      { actor: 'Chimezie Imo', role: 'Elijah' },
      { actor: 'Genoveva Umeh', role: 'Anna' },
      { actor: 'Demola Adedoyin', role: 'Young Timodore' },
      { actor: 'Sam Dede', role: 'Chief Gomez' }
    ],
    genres: ['Drama', 'Historical Drama'],
    languages: ['English', 'Yoruba'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 114,
    rating: 9.2,
    ratingCount: 11800,
    boxOffice: 'Prime Video Global Top 10 Original Film',
    posterUrl: 'https://image.tmdb.org/t/p/w780/1hku2QAzbElm3TrYoZEgRqQHMQ5.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/e4oYEH3W0ZI68b0QwkoWsnoBELJ.jpg',
    synopsis: 'In colonial-era Nigeria, Timodore Johnson is a gifted clergyman who speaks multiple languages and holds world records. After a local tyrant murders his family, he withdraws into bitter, misanthropic solitude for decades until an idealistic young Christian named Elijah is hired as his assistant and gently restores his will to live.',
    culturalSignificance: 'Cleaned up the 2024 Africa Magic Viewers’ Choice Awards (AMVCA), taking 5 monumental awards including Best Movie, Best Director, and Best Lead Actor.',
    streamingPlatforms: [
      { name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' }
    ],
    trailerYoutubeId: '7P2N6FmP18Q',
    amvcaAwards: ['AMVCA Best Overall Movie 2024 (Winner)', 'AMVCA Best Director (BB Sasore)', 'AMVCA Best Lead Actor (Wale Ojo)', 'Best Supporting Actor (Chimezie Imo)'],
    quote: {
      text: 'God does not give us pain because He has abandoned us; He gives us pain so we remember to search for the light.',
      character: 'Timodore Johnson',
      actor: 'Wale Ojo'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'living-in-bondage-1992',
    title: 'Living in Bondage (1992)',
    nativeTitle: 'Living in Bondage: Nkọwa nke Ndụ',
    tagline: 'The pact sealed in blood cannot be washed with tears.',
    releaseYear: 1992,
    director: 'Chris Obi Rapu',
    producer: 'Kenneth Nnebue (NEK Video Links)',
    leadCast: [
      { actor: 'Kenneth Okonkwo', role: 'Andy Okeke' },
      { actor: 'Nnenna Nwabueze', role: 'Merit Okeke' },
      { actor: 'Kanayo O. Kanayo', role: 'Chief Omego' },
      { actor: 'Francis Agu', role: 'Ichie Million' },
      { actor: 'Okechukwu Ogunjiofor', role: 'Paul' }
    ],
    genres: ['Drama', 'Crime & Thriller'],
    languages: ['Igbo', 'English'],
    era: 'Golden Era (1992-2005)',
    runtimeMinutes: 160,
    rating: 9.3,
    ratingCount: 31000,
    boxOffice: 'Sold over 1 million VHS tapes in West Africa (Pioneered Nollywood industry)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8zgt8tnLr2WmKYh77unX7kOTVed.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8zgt8tnLr2WmKYh77unX7kOTVed.jpg',
    synopsis: 'Desperate to escape grinding poverty in Lagos, Andy Okeke is lured by his wealthy friend Paul into a secretive esoteric cult where immense riches require the ultimate sacrifice: the life of his beloved, devout wife Merit. Wealth floods into his life, but Merit’s relentless spirit haunts him to madness on the streets of Lagos.',
    culturalSignificance: 'The foundational cornerstone of Nollywood. Its unprecedented commercial explosion on VHS tape birthed Nigeria’s multi-billion-dollar film industry.',
    streamingPlatforms: [
      { name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' },
      { name: 'Africa Magic', badgeColor: 'bg-purple-600', url: 'https://www.dstv.com' }
    ],
    trailerYoutubeId: 'OqK7Qe1pY6c',
    amvcaAwards: ['Nollywood Heritage Cornerstone Honour', 'Pioneer Industry Pillar Award'],
    quote: {
      text: 'Andy, is this what you wanted? Look at me! Andy, look at your Merit!',
      character: 'Ghost of Merit',
      actor: 'Nnenna Nwabueze'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'living-in-bondage-breaking-free',
    title: 'Living in Bondage: Breaking Free',
    tagline: 'The son must pay for what the father bargained.',
    releaseYear: 2019,
    director: 'Ramsey Nouah',
    producer: 'Charles Okpaleke (Play Network Studios)',
    leadCast: [
      { actor: 'Jidekene Achufusi', role: 'Nnamdi Okeke' },
      { actor: 'Ramsey Nouah', role: 'Richard Williams' },
      { actor: 'Kenneth Okonkwo', role: 'Andy Okeke' },
      { actor: 'Enyinna Nwigwe', role: 'Obinna Omego' },
      { actor: 'Munachi Abii', role: 'Kelly Nwankwo' }
    ],
    genres: ['Crime & Thriller', 'Drama'],
    languages: ['English', 'Igbo', 'Nigerian Pidgin'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 150,
    rating: 8.7,
    ratingCount: 15400,
    boxOffice: '₦168 Million (Swept 7 AMVCA Awards in 2020)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8r4t7UW2ZlivGkytgEBy5idkAmV.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/pO1ZqvGCStpZdlWUoaRwLzHjeSu.jpg',
    synopsis: 'Twenty-five years after the fateful events, Andy Okeke’s estranged son Nnamdi hungers for luxury and influence in modern advertising. He encounters enigmatic billionaire Richard Williams, leader of the Brotherhood of the Six. Seduced into the elite circle, Nnamdi discovers that blood sacrifice remains the unpayable currency of power.',
    culturalSignificance: 'Marked Ramsey Nouah’s directorial debut, winning Best Director at the AMVCA and kicking off the nostalgic revival of Nollywood classics.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: '3Gq1Lz7vW4c',
    amvcaAwards: ['AMVCA Best Director (Ramsey Nouah)', 'AMVCA Best Overall Movie 2020', 'Best Lead Actor (Jidekene Achufusi)'],
    quote: {
      text: 'You don’t want to be comfortable, Nnamdi. You want to be gods among men.',
      character: 'Richard Williams',
      actor: 'Ramsey Nouah'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'osuofia-in-london',
    title: 'Osuofia in London',
    tagline: 'When the village goes global, civilization holds its breath.',
    releaseYear: 2003,
    director: 'Kingsley Ogoro',
    producer: 'Kingsley Ogoro (Klink Studios)',
    leadCast: [
      { actor: 'Nkem Owoh', role: 'Osuofia' },
      { actor: 'Mara Derwent', role: 'Samantha' },
      { actor: 'Charles Angiama', role: 'Donatus' },
      { actor: 'Cynthia Okereke', role: 'Osuofia’s First Wife' }
    ],
    genres: ['Comedy'],
    languages: ['Igbo', 'Nigerian Pidgin', 'English'],
    era: 'Golden Era (1992-2005)',
    runtimeMinutes: 105,
    rating: 8.9,
    ratingCount: 38000,
    boxOffice: 'Top-selling Nollywood comedy VHS/VCD release across the African diaspora',
    posterUrl: 'https://image.tmdb.org/t/p/w780/koCjSJgWdb8qCBEX3gg3jWs7v1J.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/koCjSJgWdb8qCBEX3gg3jWs7v1J.jpg',
    synopsis: 'Osuofia, an eccentric and quick-witted villager from rural southeastern Nigeria, travels to London to claim the massive estate left behind by his late brother. When he discovers British inheritance customs clash with traditional Igbo widow-inheritance rites, hilarious cultural pandemonium ensues across the streets of Trafalgar Square and Mayfair.',
    culturalSignificance: 'Turned Nkem Owoh into a pan-African comedy legend and immortalized the theme song "I Go Chop Your Dollar".',
    streamingPlatforms: [
      { name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' },
      { name: 'Africa Magic', badgeColor: 'bg-purple-600', url: 'https://www.dstv.com' }
    ],
    trailerYoutubeId: '6T3V8k1xL9Q',
    amvcaAwards: ['African Movie Academy Award (AMAA) Best Actor in a Leading Role (Nkem Owoh)'],
    quote: {
      text: 'English man say seeing is believing. Me, I say smelling is confirming!',
      character: 'Osuofia',
      actor: 'Nkem Owoh'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'saworoide',
    title: 'Saworoide (Brass Bells)',
    nativeTitle: 'Ṣaworoidẹ: Àyànmọ́ Ìlú Jogbo',
    tagline: 'The brass bell warns: when kings break oaths, the drum summons tragedy.',
    releaseYear: 1999,
    director: 'Tunde Kelani',
    producer: 'Mainframe Film and Television Productions',
    leadCast: [
      { actor: 'Kola Oyewo', role: 'King Lapite' },
      { actor: 'Bukky Wright', role: 'Omobolanle' },
      { actor: 'Lere Paimo', role: 'Balogun' },
      { actor: 'Kunle Afolayan', role: 'Aresejabata' },
      { actor: 'Khabirat Kafidipe', role: 'Araparegangan' },
      { actor: 'Larinde Akinleye', role: 'Lagata' }
    ],
    genres: ['Epic & Folklore', 'Drama', 'Historical Drama'],
    languages: ['Yoruba'],
    era: 'Golden Era (1992-2005)',
    runtimeMinutes: 135,
    rating: 9.4,
    ratingCount: 19200,
    boxOffice: 'Mainframe classic revered as one of the greatest socio-political allegories in African cinema',
    posterUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Saworoide_cover.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/wXZkowdvOEngzlkQuu53TJ6OttA.jpg',
    synopsis: 'In the ancient town of Jogbo, a corrupt royal candidate Lapite eliminates all rivals and refuses the traditional ritual incision required by the gods to prevent tyranny. Looting the town’s timber resources in collaboration with foreign consortiums, he triggers unrest. The youth and traditional drummers unite to play the mystical Saworoide brass drum.',
    culturalSignificance: 'Written by Akinwunmi Isola and directed by master craftsman Tunde Kelani, Saworoide remains the golden standard for African political cinema and cultural preservation.',
    streamingPlatforms: [
      { name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' }
    ],
    trailerYoutubeId: 'eQ8vT5wP94K',
    amvcaAwards: ['Lifetime African Cinema Legend Award', 'FESPACO Official Selection'],
    quote: {
      text: 'He who wears the crown without the sacred covenant shall feel the brass drum split his skull from within.',
      character: 'Ayangalu (Master Drummer)',
      actor: 'Ayantunji Amoo'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'brotherhood',
    title: 'Brotherhood',
    tagline: 'Same blood. Different laws.',
    releaseYear: 2022,
    director: 'Loukman Ali',
    producer: 'Jade Osiberu (Greoh Studios)',
    leadCast: [
      { actor: 'Tobi Bakre', role: 'Akin Adetula' },
      { actor: 'Falz (Folarin Falana)', role: 'Wale Adetula' },
      { actor: 'Basketmouth (Bright Okpocha)', role: 'Shadow' },
      { actor: 'Toni Tones', role: 'Goldie' },
      { actor: 'Ronke Oshodi Oke', role: 'Aunty Adetula' },
      { actor: 'Boma Akpore', role: 'Sanusi' }
    ],
    genres: ['Action', 'Crime & Thriller'],
    languages: ['English', 'Nigerian Pidgin', 'Yoruba'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 120,
    rating: 8.6,
    ratingCount: 16500,
    boxOffice: '₦328 Million (2022 highest grossing cinema film)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/6gHrOhlZtTfBqEPnIHM6B1wYbhb.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/cgdU3wuuiJGAenHaiRc8blTahx3.jpg',
    synopsis: 'Twin brothers Akin and Wale lose their parents to armed robbers on Third Mainland Bridge as young boys. Years later, their paths diametrically diverge: Akin joins the infamous Ojuelegba armed heist crew called the "Ojuju Boys," while Wale joins the elite SWAT anti-robbery tactical police unit tasked with bringing them down dead or alive.',
    culturalSignificance: 'Showcased exhilarating high-stakes action scenes on the waterways of Lagos and Third Mainland Bridge, winning Best Overall Movie at the 2023 AMVCA.',
    streamingPlatforms: [
      { name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' }
    ],
    trailerYoutubeId: '7E2vN4d98Pw',
    amvcaAwards: ['AMVCA Best Actor in a Drama (Tobi Bakre)', 'AMVCA Best Director (Loukman Ali)', 'Best Lighting Designer'],
    quote: {
      text: 'You chose the badge, Wale. I chose survival. Lagos does not care about your feelings.',
      character: 'Akin Adetula',
      actor: 'Tobi Bakre'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'lionheart',
    title: 'Lionheart',
    tagline: 'Strength knows no gender in the seat of legacy.',
    releaseYear: 2018,
    director: 'Genevieve Nnaji',
    producer: 'The Entertainment Network (TEN)',
    leadCast: [
      { actor: 'Genevieve Nnaji', role: 'Adaeze Obiagu' },
      { actor: 'Nkem Owoh', role: 'Uncle Godswill' },
      { actor: 'Pete Edochie', role: 'Chief Ernest Obiagu' },
      { actor: 'Onyeka Onwenu', role: 'Abigail Obiagu' },
      { actor: 'Kanayo O. Kanayo', role: 'Igwe Pascal' },
      { actor: 'Phyno (Chibuzor Nelson Azubuike)', role: 'Obiora Obiagu' }
    ],
    genres: ['Drama', 'Comedy'],
    languages: ['English', 'Igbo'],
    era: 'New Nollywood (2006-2018)',
    runtimeMinutes: 95,
    rating: 8.3,
    ratingCount: 19800,
    boxOffice: 'First Nigerian Netflix Original Film Acquisition ($3.8M estimated worldwide rights)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/ndS2uJ8Sum1qEU0fn5c8tdGAMDe.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/oQb0md9X1S48jwCkYhQzokKzH9z.jpg',
    synopsis: 'When her father Chief Ernest Obiagu falls ill, capable executive Adaeze steps forward to manage the family’s transport giant Lionheart Motors. Shocked when her eccentric uncle Godswill is appointed interim CEO instead, the two must set aside differences to save the debt-ridden bus fleet from being swallowed by a predatory competitor.',
    culturalSignificance: 'Historic milestone as the very first Netflix Original feature from Nigeria and Nigeria’s first-ever official submission to the Academy Awards (Oscars).',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'sK2l8y_4Mqo',
    amvcaAwards: ['Toronto International Film Festival (TIFF) Premiere Selection', 'Black Reel Awards Nominee'],
    quote: {
      text: 'A woman does not become less of a leader because she wears traditional wrappers instead of a suit.',
      character: 'Chief Ernest Obiagu',
      actor: 'Pete Edochie'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'october-1',
    title: 'October 1',
    nativeTitle: 'Oṣù Kẹwàá Ọjọ́ Kìíní',
    tagline: 'Freedom comes at midnight. The killer strikes before.',
    releaseYear: 2014,
    director: 'Kunle Afolayan',
    producer: 'Golden Effects Pictures',
    leadCast: [
      { actor: 'Sadiq Daba', role: 'Inspector Danladi Waziri' },
      { actor: 'Kayode Olaiya (Aderupoko)', role: 'Sergeant Afonja' },
      { actor: 'David Bailie', role: 'Ackerman (District Officer)' },
      { actor: 'Kehinde Bankole', role: 'Miss Tawa' },
      { actor: 'Kanayo O. Kanayo', role: 'Okafor' },
      { actor: 'Femi Adebayo', role: 'Banji' }
    ],
    genres: ['Historical Drama', 'Crime & Thriller'],
    languages: ['English', 'Yoruba', 'Hausa', 'Igbo'],
    era: 'New Nollywood (2006-2018)',
    runtimeMinutes: 145,
    rating: 8.8,
    ratingCount: 14200,
    boxOffice: '₦100+ Million & Pan-African festival acclaim',
    posterUrl: 'https://image.tmdb.org/t/p/w780/bwP6r44YzP58Dxdiupj5NVWgZgT.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/gLrSRy0ZiE2p87sSMTxiPW1Zn2X.jpg',
    synopsis: 'In September 1960, days before Nigeria’s independence from British colonial rule, northern police detective Danladi Waziri is dispatched to the quiet western town of Akote to solve the serial killings of young virgin maidens before the Union Jack is lowered.',
    culturalSignificance: 'Starred veteran broadcaster Sadiq Daba and swept the 2015 AMVCA with 9 wins, setting standard for historical period production design in West Africa.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'bA9R8q1wXco',
    amvcaAwards: ['AMVCA Best Movie of the Year', 'AMVCA Best Actor (Sadiq Daba)', 'AMVCA Best Costume & Art Direction'],
    quote: {
      text: 'Independence is not just raising a flag. If we do not cleanse our guilt, the shadows will rule this nation.',
      character: 'Inspector Waziri',
      actor: 'Sadiq Daba'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'battle-on-buka-street',
    title: 'Battle on Buka Street',
    tagline: 'When two wives cook in the same compound, smoke blinds everyone.',
    releaseYear: 2022,
    director: 'Funke Akindele & Tobi Makinde',
    producer: 'Funke Akindele Network & FilmOne',
    leadCast: [
      { actor: 'Funke Akindele', role: 'Yejide' },
      { actor: 'Mercy Johnson Okojie', role: 'Awele' },
      { actor: 'Sola Sobowale', role: 'Asake (Yejide’s Mother)' },
      { actor: 'Nkem Owoh', role: 'Maduka' },
      { actor: 'Tina Mba', role: 'Eunice (Awele’s Mother)' }
    ],
    genres: ['Comedy', 'Drama'],
    languages: ['Nigerian Pidgin', 'Yoruba', 'Igbo', 'English'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 140,
    rating: 8.5,
    ratingCount: 16700,
    boxOffice: '₦668 Million (Cinema blockbuster that held the all-time box office record until 2023)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/1pfvgpvHl5W9pV5P4dcnqhzMeUk.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/cumzldQS1WVRbxwkKYNVCr41Prr.jpg',
    synopsis: 'A lifelong rivalry between half-sisters Yejide and Awele, daughters of polygamist Maduka, spills over when they open competing local restaurants (Bukas) on the same street corner. Their comedic food wars escalate until their children get caught in dangerous crossfire.',
    culturalSignificance: 'Celebrated the vibrant food cultures, jollof rice debates, street energy, and emotional reconciliations of polygamist Nigerian family dynamics.',
    streamingPlatforms: [
      { name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' }
    ],
    trailerYoutubeId: '9g9EpxO1L9c',
    amvcaAwards: ['Cinema Exhibitors Association of Nigeria Box Office King Award'],
    quote: {
      text: 'My soup does not beg for customers. The aroma speaks seven dialects on this street!',
      character: 'Yejide',
      actor: 'Funke Akindele'
    },
    featured: false,
    boxOfficeChampion: true
  },
  {
    id: 'elesin-oba',
    title: "Elesin Oba: The King's Horseman",
    nativeTitle: 'Ẹlẹ́ṣin Ọba',
    tagline: 'When the horseman falters, the world falls into the abyss.',
    releaseYear: 2022,
    director: 'Biyi Bandele',
    producer: 'Mo Abudu (Ebonylife Studios)',
    leadCast: [
      { actor: 'Odunlade Adekola', role: 'Elesin Oba' },
      { actor: 'Shaffy Bello', role: 'Iyaloja (Mother of the Market)' },
      { actor: 'Deyemi Okanlawon', role: 'Olunde' },
      { actor: 'Mark Elderkin', role: 'Simon Pilkings' },
      { actor: 'Jenny Stead', role: 'Jane Pilkings' }
    ],
    genres: ['Historical Drama', 'Epic & Folklore'],
    languages: ['Yoruba', 'English'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 96,
    rating: 8.2,
    ratingCount: 10400,
    boxOffice: 'TIFF Gala World Premiere & Netflix Global Distribution',
    posterUrl: 'https://image.tmdb.org/t/p/w780/yZvYgbDGIZq8mM4vCBiaVVAdmsR.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/nFNy6p3M5vms2PiOR4plNIkFemV.jpg',
    synopsis: 'Based on the actual historical events of 1946 Oyo and Nobel Laureate Wole Soyinka’s timeless stage masterpiece. Elesin Oba, the King’s Chief Horseman, is obligated by ancient tradition to commit ritual suicide to accompany his deceased Alaafin into the realm of the ancestors. However, he dallies in the market for earthly pleasures, inviting catastrophe.',
    culturalSignificance: 'The final cinematic triumph of acclaimed British-Nigerian novelist and director Biyi Bandele before his untimely passing.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: '7Psq4Dvdq9g',
    amvcaAwards: ['Toronto International Film Festival Official Selection', 'AMVCA Best Costume Design'],
    quote: {
      text: 'Eating the head of the bush-rat is not the same as chewing the tail of the python. Duty is death!',
      character: 'Iyaloja',
      actor: 'Shaffy Bello'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'aki-na-ukwa',
    title: 'Aki na Ukwa',
    nativeTitle: 'Aki na Ukwa (Ndi Mkpọtụ)',
    tagline: 'Small in size, giant in mischief.',
    releaseYear: 2002,
    director: 'Amayo Uzo Philips',
    producer: 'Chukwuka Emelionwu (Kas-Vid)',
    leadCast: [
      { actor: 'Chinedu Ikedieze', role: 'Ebike / Aki' },
      { actor: 'Osita Iheme', role: 'Chinedu / Pawpaw' },
      { actor: 'Amaechi Muonagor', role: 'Mazi Mbakwe' },
      { actor: 'Oby Kechere', role: 'Gladys' }
    ],
    genres: ['Comedy'],
    languages: ['Igbo', 'Nigerian Pidgin', 'English'],
    era: 'Golden Era (1992-2005)',
    runtimeMinutes: 98,
    rating: 9.0,
    ratingCount: 42000,
    boxOffice: 'Multi-million cassette sales; spawned dozens of sequels & global internet meme culture',
    posterUrl: 'https://image.tmdb.org/t/p/w780/g1aFQplweO5aEVdSx5L4GWYDVq7.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/g1aFQplweO5aEVdSx5L4GWYDVq7.jpg',
    synopsis: 'Two mischievous, hyper-intelligent brothers in an Eastern Nigerian village terrorize their long-suffering father, teachers, pastors, and neighbors with endless outrageous pranks, truancy schemes, and hilarious village insubordination.',
    culturalSignificance: 'Launched the legendary comedy duo of "Aki and Pawpaw", who evolved from Nigerian screen favorites into the most globally recognizable reaction meme icons of the 21st century.',
    streamingPlatforms: [
      { name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' },
      { name: 'IROKOtv', badgeColor: 'bg-emerald-600', url: 'https://irokotv.com' }
    ],
    trailerYoutubeId: 'v8wIe7_xK3U',
    amvcaAwards: ['Nollywood Pop Culture Icon Lifetime Achievement'],
    quote: {
      text: 'Papa, beating us every morning before breakfast is not in the constitution of this compound!',
      character: 'Pawpaw',
      actor: 'Osita Iheme'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'blood-sisters',
    title: 'Blood Sisters',
    tagline: 'A bound forged in panic. A secret sealed in blood.',
    releaseYear: 2022,
    director: 'Biyi Bandele & Temidayo Makanjuola',
    producer: 'Mo Abudu (Ebonylife Studios)',
    leadCast: [
      { actor: 'Ini Dima-Okojie', role: 'Sarah Dike' },
      { actor: 'Nancy Isime', role: 'Kemi Sanya' },
      { actor: 'Deyemi Okanlawon', role: 'Kola Ademola' },
      { actor: 'Kate Henshaw', role: 'Uduak Ademola' },
      { actor: 'Gabriel Afolayan', role: 'Femi Ademola' },
      { actor: 'Kehinde Bankole', role: 'Yinka Ademola' }
    ],
    genres: ['Crime & Thriller', 'Drama'],
    languages: ['English', 'Nigerian Pidgin', 'Yoruba'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 210,
    rating: 8.7,
    ratingCount: 17200,
    boxOffice: 'Nigeria’s first 4-part Netflix Original thriller series event',
    posterUrl: 'https://image.tmdb.org/t/p/w780/rlYKNuWvekF6GwmfHNn1c3wCPyX.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/ssNFsHt6eqX6MApCSovD2tk7d3k.jpg',
    synopsis: 'Sarah is engaged to Kola, the charming heir to a cutthroat billionaire pharmaceutical dynasty who is secretly an abusive monster. On the wedding day, Kola violently attacks Sarah in her bridal suite. Her best friend Kemi intervenes to save her life and accidentally shoots Kola dead. Forced on the run through the underworld of Lagos, they are hunted by the ruthless Ademola family.',
    culturalSignificance: 'A watershed moment for high-budget episodic crime drama out of West Africa, sparking nationwide discussions on domestic abuse and solidarity.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: '7P2N6FmP18Q',
    amvcaAwards: ['AMVCA Best Television Series Nominee', 'Best Lead Actress Nominee (Ini Dima-Okojie)'],
    quote: {
      text: 'Whatever happens now, Kemi... we run together, or we burn together.',
      character: 'Sarah Dike',
      actor: 'Ini Dima-Okojie'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'domitilla-1996',
    title: 'Domitilla (1996)',
    tagline: 'The neon lights of Lagos shine on tears no one sees.',
    releaseYear: 1996,
    director: 'Zeb Ejiro',
    producer: 'Zeb Ejiro Productions',
    leadCast: [
      { actor: 'Ann Njemanze', role: 'Domitilla' },
      { actor: 'Sandra Achums', role: 'Judith' },
      { actor: 'Kate Henshaw', role: 'Jenny' },
      { actor: 'Enebeli Elebuwa', role: 'Dr. Charles' },
      { actor: 'Charles Okafor', role: 'John' }
    ],
    genres: ['Drama', 'Crime & Thriller'],
    languages: ['Nigerian Pidgin', 'English'],
    era: 'Golden Era (1992-2005)',
    runtimeMinutes: 110,
    rating: 8.4,
    ratingCount: 15300,
    boxOffice: 'Defining 90s Nollywood video hit that created the urban social realism wave',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8zgt8tnLr2WmKYh77unX7kOTVed.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8zgt8tnLr2WmKYh77unX7kOTVed.jpg',
    synopsis: 'Four young women navigate the harsh survival economy and lavish high-society nightlife of 1990s Lagos. Domitilla works as a nightclub hostess to support her impoverished family, but when a prominent politician dies in her presence, she is framed for murder and thrown into a cold legal fight.',
    culturalSignificance: 'Coined the term "Domitilla" in Nigerian slang and established urban realism as a staple genre of Nollywood storytelling.',
    streamingPlatforms: [
      { name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' }
    ],
    trailerYoutubeId: 'OqK7Qe1pY6c',
    amvcaAwards: ['Nollywood Pioneers Hall of Fame'],
    quote: {
      text: 'Lagos no dey look face. If you weak, the city go swallow you like cold eba.',
      character: 'Domitilla',
      actor: 'Ann Njemanze'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'up-north',
    title: 'Up North',
    tagline: 'Sometimes getting lost is the only way to find yourself.',
    releaseYear: 2018,
    director: 'Tope Oshin',
    producer: 'Inkblot Productions, Anakle Films',
    leadCast: [
      { actor: 'Banky W (Bankole Wellington)', role: 'Bassey Otuekong' },
      { actor: 'Rahama Sadau', role: 'Maryam' },
      { actor: 'Kanayo O. Kanayo', role: 'Chief Otuekong' },
      { actor: 'Adesua Etomi-Wellington', role: 'Zainab' },
      { actor: 'Rekiya Attah', role: 'Principal' }
    ],
    genres: ['Comedy', 'Drama', 'Romantic Comedy'],
    languages: ['English', 'Hausa', 'Nigerian Pidgin'],
    era: 'New Nollywood (2006-2018)',
    runtimeMinutes: 100,
    rating: 8.4,
    ratingCount: 11200,
    boxOffice: '₦94 Million (Celebrated for breathtaking visual tourism of Bauchi State)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/g88uHO6toV6hkT3fkWQJywVVCJY.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/PpM1FahemhmEwumTI4rVifhsua.jpg',
    synopsis: 'A rebellious young billionaire heir Bassey is sent by his strict father to undergo his mandatory National Youth Service Corps (NYSC) year in rural Bauchi State in Northern Nigeria. Far from Lagos nightclubs, he is assigned as a physical education teacher at an all-girls secondary school, where he forms bonds with local students and falls in love with local traditions.',
    culturalSignificance: 'A bridge between southern Nollywood and Kannywood (Northern Hausa cinema), featuring stunning aerial cinematography of Yankari Game Reserve and the historic Bauchi Durbar festival.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'v8wIe7_xK3U',
    amvcaAwards: ['AMVCA Best Director Nominee', 'Best Cinematography Nominee'],
    quote: {
      text: 'You didn’t come to Bauchi to change these girls, Bassey. You came here so they could change you.',
      character: 'Maryam',
      actor: 'Rahama Sadau'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'ayinla',
    title: 'Ayinla',
    nativeTitle: 'Àyìnlá: Ọmọwúrà Àpàlà',
    tagline: 'The songbird who sang with thunder.',
    releaseYear: 2021,
    director: 'Tunde Kelani',
    producer: 'Jade Osiberu & Tunde Kelani',
    leadCast: [
      { actor: 'Lateef Adedimeji', role: 'Ayinla Omowura' },
      { actor: 'Omowumi Dada', role: 'Adelagun' },
      { actor: 'Bimbo Manuel', role: 'Ajala' },
      { actor: 'Kunle Remi', role: 'Bayowa' },
      { actor: 'Bimbo Ademoye', role: 'Queen' }
    ],
    genres: ['Historical Drama', 'Drama'],
    languages: ['Yoruba', 'English'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 110,
    rating: 8.8,
    ratingCount: 9600,
    boxOffice: '₦91 Million theatrical gross; widespread critical praise',
    posterUrl: 'https://image.tmdb.org/t/p/w780/3nBafRrYyUY4rLxeBZD0iZBBCo9.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8rDDV3QXdfotIYJeV16egKOBtHU.jpg',
    synopsis: 'Set in 1970s Abeokuta, the film chronicles the meteoric rise and tragic demise of legendary Apala musical icon Ayinla Omowura. As he prepares for an unprecedented headline European concert tour, fierce rivalries, pride, and an explosive dispute with his trusted lead manager culminate in a fatal brawl at a local beer parlor.',
    culturalSignificance: 'Lateef Adedimeji’s career-defining performance capturing the cadence, swagger, and musical philosophy of southwestern Nigerian traditional music.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: '7P2N6FmP18Q',
    amvcaAwards: ['AMVCA Best Soundtrack / Original Score Winner', 'AMAA Best Production Design'],
    quote: {
      text: 'My music is not for the timid. Apala is the voice of the lion who owns the forest.',
      character: 'Ayinla Omowura',
      actor: 'Lateef Adedimeji'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'citation',
    title: 'Citation',
    tagline: 'Break the silence. Speak truth to power.',
    releaseYear: 2020,
    director: 'Kunle Afolayan',
    producer: 'Golden Effects Pictures',
    leadCast: [
      { actor: 'Temi Otedola', role: 'Moremi Oluwa' },
      { actor: 'Jimmy Jean-Louis', role: 'Prof. Lucien N’Dyare' },
      { actor: 'Joke Silva', role: 'Angela' },
      { actor: 'Gabriel Afolayan', role: 'Koyejo' },
      { actor: 'Ini Edo', role: 'Gloria' }
    ],
    genres: ['Drama'],
    languages: ['English', 'Yoruba', 'French'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 151,
    rating: 8.5,
    ratingCount: 13800,
    boxOffice: 'Ranked #1 on Netflix in Nigeria and Top 10 in several European nations',
    posterUrl: 'https://image.tmdb.org/t/p/w780/k8medyObgY0XTt2dL7BqjxXkqmw.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/vazIlxR1NEh3TS0Dsaz7Ipi14Gm.jpg',
    synopsis: 'Moremi Oluwa, a bright 21-year-old postgraduate student at a prestigious Nigerian university, takes a stand against a charismatic and celebrated academician, Professor Lucien N’Dyare, after he attempts to sexually assault her. Standing before an all-male university disciplinary tribunal, Moremi fights to defend her dignity and expose predatory academic systems.',
    culturalSignificance: 'Addressed the endemic issue of sexual harassment on African university campuses, filmed across Nigeria, Senegal, and Cape Verde.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'bA9R8q1wXco',
    amvcaAwards: ['National Film Award for Best International Film (UK)', 'AMAA Best Actress Nominee'],
    quote: {
      text: 'You thought my silence was weakness. Today, the world will hear my voice.',
      character: 'Moremi Oluwa',
      actor: 'Temi Otedola'
    },
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'gangs-of-lagos',
    title: 'Gangs of Lagos',
    tagline: 'Obalola was born in the streets, but destiny demands more.',
    releaseYear: 2023,
    director: 'Jade Osiberu',
    producer: 'Jade Osiberu & Kemi Lala Akindoju',
    leadCast: [
      { actor: 'Tobi Bakre', role: 'Obalola' },
      { actor: 'Adesua Etomi-Wellington', role: 'Gift' },
      { actor: 'Chike', role: 'Ify' },
      { actor: 'Chioma Chukwuka', role: 'Mama Obalola' },
      { actor: 'Iyabo Ojo', role: 'Yinka' }
    ],
    genres: ['Action', 'Crime & Thriller', 'Drama'],
    languages: ['Nigerian Pidgin', 'Yoruba', 'English'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 124,
    rating: 8.8,
    ratingCount: 16700,
    boxOffice: 'Prime Video Global Top 10 Hit across 30+ countries',
    posterUrl: 'https://image.tmdb.org/t/p/w780/nGwFsB6EXUCr21wzPgtP5juZPSv.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/rPSJAElGxOTko1zK6uIlYnTMFxN.jpg',
    synopsis: 'Growing up on the vibrant and treacherous streets of Isale Eko, Lagos, a group of lifelong friends navigate violent political godfathers and gang wars while trying to survive and protect the people they love.',
    culturalSignificance: 'The very first African Original feature film produced by Prime Video, celebrated for its electrifying action choreography, gritty portrayal of Lagos street politics, and soundtrack.',
    streamingPlatforms: [
      { name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' }
    ],
    trailerYoutubeId: 'c2z1XpGq-f8',
    amvcaAwards: ['AMVCA Best Actor in a Drama (Tobi Bakre)'],
    quote: {
      text: 'If you want to survive in Isale Eko, you must learn to stand firm even when the ground is shaking under your feet.',
      character: 'Obalola',
      actor: 'Tobi Bakre'
    },
    featured: true,
    boxOfficeChampion: false
  },
  {
    id: 'shanty-town',
    title: 'Shanty Town',
    tagline: 'Freedom has a price in the underbelly of Lagos.',
    releaseYear: 2023,
    director: 'Dimeji Ajibola',
    producer: 'Chichi Nworah',
    leadCast: [
      { actor: 'Chidi Mokeme', role: 'Scar' },
      { actor: 'Ini Edo', role: 'Inem' },
      { actor: 'Richard Mofe-Damijo (RMD)', role: 'Chief Fernandez' },
      { actor: 'Nse Ikpe-Etim', role: 'Ene' },
      { actor: 'Sola Sobowale', role: 'Alhaja' }
    ],
    genres: ['Crime & Thriller', 'Drama', 'Action'],
    languages: ['English', 'Nigerian Pidgin', 'Yoruba'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 135,
    rating: 8.7,
    ratingCount: 14900,
    boxOffice: 'Global #1 Trending Nollywood Series/Film on Netflix',
    posterUrl: 'https://image.tmdb.org/t/p/w780/a7jRDMea7ADCtPphb9nOMp2dkgK.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/6qDujYplO8CFrjtgUdqDesidxV.jpg',
    synopsis: 'A ruthless crime boss, Scar, rules the criminal haven of Shanty Town with an iron fist. But when a syndicate of underground women uncover a path to take down the corrupt kingpins running the city, explosive warfare erupts.',
    culturalSignificance: 'Chidi Mokeme delivered an unforgettable, chilling comeback performance as Scar, generating widespread critical acclaim across Africa.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'cK6l0zNq5wM',
    amvcaAwards: ['AMVCA Best Actress in a Drama (Ini Edo Nominee)', 'AMVCA Best Soundtrack'],
    quote: {
      text: 'Nobody leaves Shanty Town alive without settling the bill in blood.',
      character: 'Scar',
      actor: 'Chidi Mokeme'
    },
    featured: true,
    boxOfficeChampion: false
  },
  {
    id: 'king-of-thieves',
    title: 'King of Thieves',
    nativeTitle: 'Agẹṣinkólé',
    tagline: 'When the shadows demand justice, fear wears a crown.',
    releaseYear: 2022,
    director: 'Tope Adebayo & Adebayo Tijani',
    producer: 'Femi Adebayo & Euphoria360 Media',
    leadCast: [
      { actor: 'Femi Adebayo', role: 'Agesinkole' },
      { actor: 'Odunlade Adekola', role: 'King of Ajeromi' },
      { actor: 'Toyin Abraham', role: 'Queen of Ajeromi' },
      { actor: 'Ibrahim Chatta', role: 'Oguntade' }
    ],
    genres: ['Epic & Folklore', 'Action', 'Drama'],
    languages: ['Yoruba', 'English'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 110,
    rating: 8.9,
    ratingCount: 17200,
    boxOffice: '₦320+ Million (Box office pioneer for indigenous Yoruba cinema)',
    posterUrl: 'https://image.tmdb.org/t/p/w780/rtfS7y2XQ0vjTrm6khq508N0Ehk.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/429x9ZU5IQY6L0HGshBGY1LQpjB.jpg',
    synopsis: 'The prosperous kingdom of Ajeromi is thrown into absolute chaos by Agesinkole, an invincible bandit with terrifying supernatural abilities who terrorizes royalty and guards in retribution for ancient betrayals.',
    culturalSignificance: 'A watershed moment for indigenous Yoruba cinema in modern multiplexes, grossing over ₦300 million and catalyzing the new wave of Yoruba folklore cinema.',
    streamingPlatforms: [
      { name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' },
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'yF8g8tJk6tQ',
    amvcaAwards: ['AMVCA Best Indigenous Language Movie (Yoruba)', 'Best Makeup & Costume'],
    featured: false,
    boxOfficeChampion: false
  },
  {
    id: 'lisabi-the-uprising',
    title: 'Lisabi: The Uprising',
    nativeTitle: 'Lísàbí: Ìjàngbònnà',
    tagline: 'One farmer. One vow. The fall of an empire.',
    releaseYear: 2024,
    director: 'Niyi Akinmolayan',
    producer: 'Lateef Adedimeji & Anthill Studios',
    leadCast: [
      { actor: 'Lateef Adedimeji', role: 'Lisabi Agbongbo Akala' },
      { actor: 'Ibrahim Chatta', role: 'Sangodeyi' },
      { actor: 'Bimbo Akintola', role: 'Iyalode' },
      { actor: 'Odunlade Adekola', role: 'Alaafin of Oyo' }
    ],
    genres: ['Epic & Folklore', 'Historical Drama', 'Action'],
    languages: ['Yoruba', 'English'],
    era: 'Modern Global Era (2019-Present)',
    runtimeMinutes: 128,
    rating: 8.9,
    ratingCount: 11500,
    boxOffice: 'Global #1 African Epic on Netflix in 2024',
    posterUrl: 'https://image.tmdb.org/t/p/w780/p63pNkA43NUoQSVjoWJV6B4k8xC.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xf461ETw77oZoKtMoK8NrPAacDb.jpg',
    synopsis: 'In the 18th-century Oyo Empire, the Egba people are subjected to brutal subjugation and heavy tributes by tyrannical imperial emissaries. Lisabi, a humble farmer endowed with mystical endurance, secretly organizes a subterranean network of farmers to spark the legendary uprising for liberty.',
    culturalSignificance: 'A monumental production featuring thousands of traditionally-attired extras, setting a new benchmark for West African historical epic cinema.',
    streamingPlatforms: [
      { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' }
    ],
    trailerYoutubeId: 'Z_o3-kL_vFw',
    amvcaAwards: ['AMVCA Most Anticipated Epic Historical Feature'],
    featured: true,
    boxOfficeChampion: false
  }
];

export const NIGERIAN_MOVIES: Movie[] = RAW_NIGERIAN_MOVIES.map(movie => ({
  ...movie,
  originCountry: ['NG'],
  originalLanguage: movie.originalLanguage || (
    movie.languages?.some(l => l.toLowerCase() === 'yoruba') ? 'yo' :
    movie.languages?.some(l => l.toLowerCase() === 'igbo') ? 'ig' :
    movie.languages?.some(l => l.toLowerCase() === 'hausa') ? 'ha' : 'en'
  ),
  source: 'system' as const,
  isUserAdded: false
}));

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

export const NOL_CULTURE_FACTS = [
  {
    title: 'World #2 by Volume',
    stat: '2,500+ Movies/Yr',
    description: 'Nollywood produces more films annually than Hollywood, second only to India’s Bollywood.'
  },
  {
    title: 'The ₦1 Billion Ceiling',
    stat: '₦1.44B Gross',
    description: 'In 2023, A Tribe Called Judah became the first Nigerian film to cross ₦1 Billion in domestic box office.'
  },
  {
    title: 'The Alaba VHS Roots',
    stat: '1992 Revolution',
    description: 'Nollywood started when Kenneth Nnebue sold blank video cassettes packed with Living in Bondage across Lagos markets.'
  },
  {
    title: 'Global Streaming Era',
    stat: '190+ Countries',
    description: 'Nollywood titles regularly enter the Netflix & Prime Video Global Top 10 lists across the diaspora and Latin America.'
  }
];
