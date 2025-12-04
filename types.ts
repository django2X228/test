export enum District {
  CAO = 'ЦАО',
  SAO = 'САО',
  SVAO = 'СВАО',
  VAO = 'ВАО',
  UVAO = 'ЮВАО',
  UAO = 'ЮАО',
  UZAO = 'ЮЗАО',
  ZAO = 'ЗАО',
  SZAO = 'СЗАО',
  ZELAO = 'ЗелАО',
  ONLINE = 'Онлайн'
}

export enum AccessibilityLevel {
  FULL = 'Полная (100%)',
  PARTIAL = 'Частичная',
  ASSISTED = 'С помощью',
  NOT_ACCESSIBLE = 'Не доступно'
}

export enum EventCategory {
  ACTIVE = 'Активный досуг',
  EDUCATION = 'Образование',
  CULTURE = 'Культура',
  SOCIAL = 'Встречи/Общение'
}

export enum HelpCategory {
  ACCOMPANIMENT = 'Сопровождение',
  TECH_HOME = 'Бытовая помощь',
  LEGAL = 'Права и документы',
  PSYCH = 'Психология'
}

export interface AppEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  district: District;
  accessibility: AccessibilityLevel;
  category: EventCategory;
  description: string;
  registrationLink?: string;
  contactName?: string;
  contactPhone?: string;
  contactMethods?: string[]; // e.g. ['WhatsApp', 'Telegram']
  status: 'approved' | 'pending';
}

export interface HelpService {
  id: string;
  orgName: string;
  helpType: HelpCategory;
  description: string;
  district: District | 'Все районы';
  contacts: string;
  isFree: boolean;
  conditions: string;
  status: 'approved' | 'pending';
}

export type ViewState = 'events' | 'help' | 'add' | 'assistant';