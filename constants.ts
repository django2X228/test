import { AppEvent, HelpService, District, AccessibilityLevel, EventCategory, HelpCategory } from './types';

export const MOCK_EVENTS: AppEvent[] = [
  {
    id: 'e1',
    title: 'Баскетбол на колясках: Открытая тренировка',
    date: '2023-10-25',
    time: '18:00',
    location: 'СК "Игровой", Ленинградский пр-т',
    district: District.SAO,
    accessibility: AccessibilityLevel.FULL,
    category: EventCategory.ACTIVE,
    description: 'Тренировка для новичков и любителей. Инвентарь предоставляется.',
    registrationLink: 'https://example.com/reg1',
    status: 'approved'
  },
  {
    id: 'e2',
    title: 'Экскурсия "Москва Купеческая" с тифлокомментариями',
    date: '2023-10-26',
    time: '12:00',
    location: 'Музей Москвы',
    district: District.CAO,
    accessibility: AccessibilityLevel.FULL,
    category: EventCategory.CULTURE,
    description: 'Специализированная экскурсия для незрячих и слабовидящих посетителей.',
    registrationLink: 'https://example.com/reg2',
    status: 'approved'
  },
  {
    id: 'e3',
    title: 'Курс "Основы Python" для людей с ОВЗ',
    date: '2023-10-28',
    time: '19:00',
    location: 'Zoom',
    district: District.ONLINE,
    accessibility: AccessibilityLevel.FULL,
    category: EventCategory.EDUCATION,
    description: 'Бесплатный вводный урок от школы "Шанс".',
    registrationLink: 'https://example.com/reg3',
    status: 'approved'
  },
  {
    id: 'e4',
    title: 'Группа поддержки родственников',
    date: '2023-10-27',
    time: '18:30',
    location: 'Центр "Благосфера"',
    district: District.SAO,
    accessibility: AccessibilityLevel.PARTIAL,
    category: EventCategory.SOCIAL,
    description: 'Встреча для общения и обмена опытом ухода за маломобильными людьми.',
    status: 'approved'
  },
  {
    id: 'e5',
    title: 'Инклюзивный театр: Спектакль "Прикосновение"',
    date: '2023-10-29',
    time: '17:00',
    location: 'Театр Наций',
    district: District.CAO,
    accessibility: AccessibilityLevel.FULL,
    category: EventCategory.CULTURE,
    description: 'Спектакль с участием актеров с особенностями развития.',
    registrationLink: 'https://example.com/reg5',
    status: 'approved'
  }
];

export const MOCK_HELP: HelpService[] = [
  {
    id: 'h1',
    orgName: 'Социальное такси',
    helpType: HelpCategory.ACCOMPANIMENT,
    description: 'Перевозка маломобильных граждан к социально значимым объектам.',
    district: 'Все районы',
    contacts: '+7 (495) 123-45-67',
    isFree: false,
    conditions: 'По тарифам МГТ, нужна регистрация в реестре.',
    status: 'approved'
  },
  {
    id: 'h2',
    orgName: 'Фонд "Право на чудо"',
    helpType: HelpCategory.LEGAL,
    description: 'Юридические консультации по оформлению инвалидности и ИПР.',
    district: District.ONLINE,
    contacts: 'help@pravonachudo.ru',
    isFree: true,
    conditions: 'Бесплатно для семей с детьми-инвалидами.',
    status: 'approved'
  },
  {
    id: 'h3',
    orgName: 'Волонтеры "Вместе"',
    helpType: HelpCategory.TECH_HOME,
    description: 'Помощь в покупке продуктов и уборке квартиры.',
    district: District.UAO,
    contacts: '+7 (900) 555-55-55',
    isFree: true,
    conditions: 'Заявка за 2 дня.',
    status: 'approved'
  },
  {
    id: 'h4',
    orgName: 'Психологическая служба МЧС',
    helpType: HelpCategory.PSYCH,
    description: 'Круглосуточный телефон доверия.',
    district: District.ONLINE,
    contacts: '+7 (495) 989-50-50',
    isFree: true,
    conditions: 'Анонимно.',
    status: 'approved'
  },
  {
    id: 'h5',
    orgName: 'Мастерская "Движение"',
    helpType: HelpCategory.TECH_HOME,
    description: 'Ремонт инвалидных колясок и средств реабилитации.',
    district: District.SVAO,
    contacts: '+7 (999) 111-22-33',
    isFree: false,
    conditions: 'Оплата только запчастей, работа бесплатно.',
    status: 'approved'
  }
];
