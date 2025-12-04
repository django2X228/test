import { AppEvent, HelpService } from '../types';
import { MOCK_EVENTS, MOCK_HELP } from '../constants';

/**
 * DATABASE SERVICE
 * 
 * 1. Create Google Sheet (sheets.new)
 * 2. Extensions > Apps Script > Paste code provided in instructions.
 * 3. Deploy as Web App (Who has access: ANYONE).
 * 4. Paste URL below.
 */

// ВСТАВЬТЕ СЮДА ССЫЛКУ НА ВАШ СКРИПТ (которая заканчивается на /exec)
const API_URL = "https://script.google.com/macros/s/AKfycbxi4ocFzh01XKYDOSqikVSGuBHLfzhTG59qirnAWP8Wd2mMhwi6vZXRLTb4II8Vmf9-ug/exec"; 

export interface DatabaseData {
  events: AppEvent[];
  help: HelpService[];
}

class DatabaseService {
  
  // --- REMOTE API MODE (Google Sheets) ---
  
  private async fetchFromApi(): Promise<DatabaseData | null> {
    if (!API_URL) return null;
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Network response was not ok');
      const rawData = await response.json();
      return this.cleanIncomingData(rawData);
    } catch (error) {
      console.error("DB Fetch Error:", error);
      return null;
    }
  }

  // Очищает данные, приходящие из Google Таблиц
  private cleanIncomingData(data: any): DatabaseData {
    
    // Хелпер для Даты: Конвертируем UTC из Google в Московское время
    const cleanDate = (val: any): string => {
      if (!val) return '';
      const strVal = String(val);
      
      // Если это ISO строка с датой (содержит T или Z), конвертируем в МСК
      if (strVal.includes('T') || strVal.includes('Z')) {
        try {
          const date = new Date(strVal);
          // 'en-CA' дает формат YYYY-MM-DD
          return new Intl.DateTimeFormat('en-CA', { 
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(date);
        } catch (e) {
          // Если дата некорректная, возвращаем как есть (обрезая до 10 символов)
          return strVal.substring(0, 10);
        }
      }
      // Если это просто текст "2025-12-03"
      return strVal.substring(0, 10);
    };

    // Хелпер для Времени: Конвертируем UTC из Google в Московское время
    const cleanTime = (val: any): string => {
      if (!val) return '';
      const strVal = String(val);
      
      // Если это ISO строка
      if (strVal.includes('T') || strVal.includes('Z')) {
        try {
           const date = new Date(strVal);
           // 'ru-RU' дает формат ЧЧ:ММ
           return new Intl.DateTimeFormat('ru-RU', {
             timeZone: 'Europe/Moscow',
             hour: '2-digit',
             minute: '2-digit'
           }).format(date);
        } catch (e) {
           // Fallback: ищем паттерн ЧЧ:ММ
           const match = strVal.match(/(\d{2}:\d{2})/);
           return match ? match[1] : strVal.substring(0, 5);
        }
      }
      
      // Если это просто текст "12:00"
      const simpleMatch = strVal.match(/(\d{2}:\d{2})/);
      return simpleMatch ? simpleMatch[1] : strVal.substring(0, 5);
    };

    // Безопасный map, чтобы одна ошибка не ломала всю загрузку
    const safeMapEvents = (list: any[]): AppEvent[] => {
      if (!Array.isArray(list)) return [];
      return list.map(e => {
        try {
          return {
            ...e,
            id: String(e.id || Date.now()), // Гарантируем строковый ID
            date: cleanDate(e.date),
            time: cleanTime(e.time),
            // Принудительно в строку
            contactPhone: String(e.contactPhone || ''),
            contactName: String(e.contactName || ''),
            registrationLink: String(e.registrationLink || ''),
            // Парсим массив методов, если он пришел строкой "[...]"
            contactMethods: typeof e.contactMethods === 'string' && e.contactMethods.startsWith('[') 
              ? JSON.parse(e.contactMethods) 
              : (Array.isArray(e.contactMethods) ? e.contactMethods : [])
          };
        } catch (err) {
          console.warn('Skipping corrupted event:', e);
          return null;
        }
      }).filter((e): e is AppEvent => e !== null);
    };

    const safeMapHelp = (list: any[]): HelpService[] => {
      if (!Array.isArray(list)) return [];
      return list.map(h => {
        try {
          return {
            ...h,
            id: String(h.id || Date.now()), // Гарантируем строковый ID
            contacts: String(h.contacts || '') // Гарантируем строку
          };
        } catch (err) {
          console.warn('Skipping corrupted help:', h);
          return null;
        }
      }).filter((h): h is HelpService => h !== null);
    };

    return {
      events: safeMapEvents(data.events || []),
      help: safeMapHelp(data.help || [])
    };
  }

  // Приводит данные к единому стандарту перед отправкой
  private normalizeData(data: DatabaseData): DatabaseData {
    const normalizeEvent = (e: any): AppEvent => ({
      id: String(e.id || ''),
      title: e.title || '',
      date: e.date || '',
      time: e.time || '',
      location: e.location || '',
      district: e.district || '',
      accessibility: e.accessibility || '',
      category: e.category || '',
      description: e.description || '',
      registrationLink: String(e.registrationLink || ''),
      contactName: String(e.contactName || ''),
      contactPhone: String(e.contactPhone || ''),
      contactMethods: e.contactMethods || [],
      status: e.status || 'pending'
    });

    const normalizeHelp = (h: any): HelpService => ({
      id: String(h.id || ''),
      orgName: h.orgName || '',
      helpType: h.helpType || '',
      description: h.description || '',
      district: h.district || '',
      contacts: String(h.contacts || ''),
      isFree: h.isFree !== undefined ? h.isFree : false,
      conditions: h.conditions || '',
      status: h.status || 'pending'
    });

    return {
      events: data.events.map(normalizeEvent),
      help: data.help.map(normalizeHelp)
    };
  }

  private async saveToApi(data: DatabaseData): Promise<boolean> {
    if (!API_URL) return false;
    try {
      const cleanData = this.normalizeData(data);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(cleanData)
      });
      return response.ok;
    } catch (error) {
      console.error("DB Save Error:", error);
      return false;
    }
  }

  // --- LOCAL FALLBACK MODE ---
  
  private loadFromFallback(): DatabaseData {
    try {
      const events = localStorage.getItem('invahelp_events');
      const help = localStorage.getItem('invahelp_services');
      return {
        events: events ? JSON.parse(events) : MOCK_EVENTS,
        help: help ? JSON.parse(help) : MOCK_HELP
      };
    } catch (e) {
      return { events: MOCK_EVENTS, help: MOCK_HELP };
    }
  }

  private saveToFallback(data: DatabaseData) {
    localStorage.setItem('invahelp_events', JSON.stringify(data.events));
    localStorage.setItem('invahelp_services', JSON.stringify(data.help));
  }

  // --- PUBLIC METHODS ---

  async load(): Promise<DatabaseData> {
    const cloudData = await this.fetchFromApi();
    // Используем данные из облака, только если загрузка прошла успешно и вернула объект
    if (cloudData) {
       return cloudData;
    }
    console.warn("Using Local Storage (API Fetch failed or returned null)");
    return this.loadFromFallback();
  }

  async overrideCloudData(data: DatabaseData): Promise<boolean> {
    if (!API_URL) {
      alert("Ошибка: URL скрипта не настроен в services/db.ts");
      return false;
    }
    return this.saveToApi(data);
  }

  async saveEvent(event: AppEvent, currentEvents: AppEvent[], currentHelp: HelpService[]): Promise<AppEvent[]> {
    let newEvents = [...currentEvents];
    const index = newEvents.findIndex(e => e.id === event.id);
    if (index >= 0) newEvents[index] = event;
    else newEvents.push(event);

    const fullData = { events: newEvents, help: currentHelp };
    
    this.saveToFallback(fullData);
    this.saveToApi(fullData); 
    
    return newEvents;
  }

  async saveHelp(service: HelpService, currentEvents: AppEvent[], currentHelp: HelpService[]): Promise<HelpService[]> {
    let newHelp = [...currentHelp];
    const index = newHelp.findIndex(h => h.id === service.id);
    if (index >= 0) newHelp[index] = service;
    else newHelp.push(service);

    const fullData = { events: currentEvents, help: newHelp };

    this.saveToFallback(fullData);
    this.saveToApi(fullData);

    return newHelp;
  }

  async deleteItem(id: string, type: 'event' | 'help', currentEvents: AppEvent[], currentHelp: HelpService[]): Promise<{events: AppEvent[], help: HelpService[]}> {
    let newEvents = [...currentEvents];
    let newHelp = [...currentHelp];

    if (type === 'event') newEvents = newEvents.filter(e => e.id !== id);
    else newHelp = newHelp.filter(h => h.id !== id);

    const fullData = { events: newEvents, help: newHelp };
    
    this.saveToFallback(fullData);
    this.saveToApi(fullData);

    return fullData;
  }
}

export const db = new DatabaseService();