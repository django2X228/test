import React, { useState, useEffect } from 'react';
import { Search, Calendar, HeartHandshake, PlusCircle, Bot, X, Lock, Check, Trash2, Edit2, LogOut, AlertTriangle, Phone, MessageCircle, Upload, Database, Loader2, RefreshCw } from 'lucide-react';
import { ViewState, District, AppEvent, HelpService, AccessibilityLevel, EventCategory, HelpCategory } from './types';
import { EventCard } from './components/EventCard';
import { HelpCard } from './components/HelpCard';
import { searchWithGemini } from './services/geminiService';
import { db } from './services/db';
import { MOCK_EVENTS, MOCK_HELP } from './constants';

// --- НАСТРОЙКИ АДМИНКИ ---
// Измените эти данные перед деплоем!
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin' 
};

// --- Components ---

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (seed: boolean) => void;
  itemCount: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onSync, itemCount, status, errorMessage }) => {
  if (!isOpen) return null;

  const isDatabaseEmpty = itemCount === 0;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-600" />
            Синхронизация с облаком
          </h3>
          {status !== 'loading' && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Отправляем данные в Google Таблицу...</p>
            <p className="text-xs text-slate-400 mt-2">Не закрывайте окно</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 mb-2">Готово!</p>
            <p className="text-center text-slate-600 mb-6">Данные успешно сохранены в вашей таблице.</p>
            <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">
              Закрыть
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 mb-2">Ошибка</p>
            <p className="text-center text-slate-600 mb-6 text-sm px-4">
              Не удалось отправить данные. <br/>
              {errorMessage || 'Проверьте URL скрипта и подключение к интернету.'}
            </p>
            <button onClick={onClose} className="w-full py-3 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300">
              Закрыть
            </button>
          </div>
        )}

        {status === 'idle' && (
          <div className="space-y-4">
            {isDatabaseEmpty ? (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
                <p className="text-amber-800 font-medium text-sm mb-1">⚠️ База данных на сайте сейчас пуста.</p>
                <p className="text-amber-700 text-xs">
                  Это нормально при первом запуске. Вы можете загрузить готовый набор тестовых данных (события и помощь), чтобы проверить работу сайта.
                </p>
              </div>
            ) : (
              <p className="text-slate-600 text-sm mb-4">
                На сайте сейчас <strong>{itemCount}</strong> записей. Вы хотите перезаписать ими данные в Google Таблице?
              </p>
            )}

            <div className="flex flex-col gap-3">
              {isDatabaseEmpty ? (
                <button 
                  onClick={() => onSync(true)}
                  className="w-full flex items-center justify-center py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Загрузить тестовые данные
                </button>
              ) : (
                <button 
                  onClick={() => onSync(false)}
                  className="w-full flex items-center justify-center py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Синхронизировать ({itemCount})
                </button>
              )}
              
              <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800 py-2">
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- Data State ---
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [helpServices, setHelpServices] = useState<HelpService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Initialize Data from DB ---
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const data = await db.load();
      if (data.events) setEvents(data.events);
      if (data.help) setHelpServices(data.help);
      setIsLoading(false);
    };
    initData();
  }, []);

  // --- UI State ---
  const [activeView, setActiveView] = useState<ViewState>('events');
  const [activeDistrict, setActiveDistrict] = useState<District | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- Admin/Auth State ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [adminTab, setAdminTab] = useState<'requests' | 'events' | 'help'>('requests');
  
  // --- Edit/Create/Delete State ---
  const [editingItem, setEditingItem] = useState<Partial<AppEvent> | Partial<HelpService> | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(true); // true = event, false = help
  const [isSuggestionMode, setIsSuggestionMode] = useState(false); // If true, showing public suggestion form
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'event' | 'help'} | null>(null);

  // --- Sync Modal State ---
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState('');

  // --- Gemini State ---
  const [isThinking, setIsThinking] = useState(false);
  const [geminiResult, setGeminiResult] = useState<{
    eventIds: string[];
    helpIds: string[];
    reasoning: string;
  } | null>(null);

  // --- Filtering Logic (Shows only APPROVED items for public views) ---
  const filteredEvents = events.filter(e => {
    if (e.status !== 'approved') return false; 
    
    // 1. Filter by Smart Search (if active)
    if (geminiResult) {
       // Convert both to string to ensure matching works even if Sheet returns numbers
       const searchIds = (geminiResult.eventIds || []).map(String);
       if (!searchIds.includes(String(e.id))) return false;
    }

    // 2. Filter by District (Always apply if selected)
    if (activeDistrict !== 'All' && e.district !== activeDistrict) return false;
    
    return true;
  });

  const filteredHelp = helpServices.filter(h => {
    if (h.status !== 'approved') return false;
    
    // 1. Filter by Smart Search (if active)
    if (geminiResult) {
      // Convert both to string to ensure matching works even if Sheet returns numbers
      const searchIds = (geminiResult.helpIds || []).map(String);
      if (!searchIds.includes(String(h.id))) return false;
    }

    // 2. Filter by District (Always apply if selected)
    if (activeDistrict !== 'All' && h.district !== 'Все районы' && h.district !== activeDistrict) return false;
    
    return true;
  });

  // --- Admin Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === ADMIN_CREDENTIALS.username && loginForm.password === ADMIN_CREDENTIALS.password) {
      setIsAdmin(true);
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setActiveView('events');
  };

  const openSyncModal = () => {
    setSyncStatus('idle');
    setSyncError('');
    setIsSyncModalOpen(true);
  };

  const performSync = async (seed: boolean) => {
    setSyncStatus('loading');
    
    let dataToSync = { events, help: helpServices };
    
    if (seed) {
      // User requested to seed mock data
      dataToSync = { events: MOCK_EVENTS, help: MOCK_HELP };
    }

    try {
      const success = await db.overrideCloudData(dataToSync);
      if (success) {
        setSyncStatus('success');
        // Update local state if we seeded
        if (seed) {
          setEvents(MOCK_EVENTS);
          setHelpServices(MOCK_HELP);
        }
      } else {
        setSyncStatus('error');
        setSyncError('Сервер вернул ошибку. Проверьте настройки скрипта (Разрешения: Anyone).');
      }
    } catch (e) {
      setSyncStatus('error');
      setSyncError('Сетевая ошибка при соединении с Google.');
    }
  };

  const approveItem = async (id: string, type: 'event' | 'help') => {
    if (type === 'event') {
      const item = events.find(e => e.id === id);
      if (item) {
        const updatedEvents = await db.saveEvent({ ...item, status: 'approved' }, events, helpServices);
        setEvents(updatedEvents);
      }
    } else {
      const item = helpServices.find(h => h.id === id);
      if (item) {
        const updatedHelp = await db.saveHelp({ ...item, status: 'approved' }, events, helpServices);
        setHelpServices(updatedHelp);
      }
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    const result = await db.deleteItem(itemToDelete.id, itemToDelete.type, events, helpServices);
    setEvents(result.events);
    setHelpServices(result.help);
    
    setItemToDelete(null);
  };

  const startEdit = (item: AppEvent | HelpService, type: 'event' | 'help') => {
    setEditingItem(item);
    setIsEditingEvent(type === 'event');
    setIsSuggestionMode(false);
  };

  const startSuggestion = (type: 'event' | 'help') => {
    if (type === 'event') {
      setEditingItem({ 
        category: EventCategory.SOCIAL, 
        accessibility: AccessibilityLevel.FULL, 
        district: District.ONLINE,
        contactMethods: [] 
      });
    } else {
      setEditingItem({ 
        helpType: HelpCategory.ACCOMPANIMENT, 
        district: District.ONLINE, 
        isFree: true 
      });
    }
    setIsEditingEvent(type === 'event');
    setIsSuggestionMode(true);
  };

  const toggleContactMethod = (method: string) => {
    const currentEvent = editingItem as AppEvent;
    const methods = currentEvent.contactMethods || [];
    if (methods.includes(method)) {
      setEditingItem({ ...currentEvent, contactMethods: methods.filter(m => m !== method) });
    } else {
      setEditingItem({ ...currentEvent, contactMethods: [...methods, method] });
    }
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Validation for Events: Require either Link or Phone
    if (isEditingEvent) {
       const evt = editingItem as AppEvent;
       // Safety check: force fields to string to avoid "trim is not a function" error if numbers passed
       const registrationLink = String(evt.registrationLink || '');
       const contactPhone = String(evt.contactPhone || '');

       if (!registrationLink.trim() && !contactPhone.trim()) {
          alert('Для события необходимо указать ссылку на регистрацию или контактный телефон.');
          return;
       }
    }

    const newItem = { 
      ...editingItem, 
      id: editingItem.id || Date.now().toString(),
      status: isAdmin ? (editingItem.status || 'approved') : 'pending' // Admin edits stay approved, users -> pending
    };

    if (isEditingEvent) {
       const updatedEvents = await db.saveEvent(newItem as AppEvent, events, helpServices);
       setEvents(updatedEvents);
    } else {
       const updatedHelp = await db.saveHelp(newItem as HelpService, events, helpServices);
       setHelpServices(updatedHelp);
    }

    setEditingItem(null);
    if (isSuggestionMode) {
      alert('Спасибо! Ваша заявка отправлена на модерацию.');
      setIsSuggestionMode(false);
    }
  };

  // --- Gemini Search ---
  const clearSearch = () => {
    setGeminiResult(null);
    setSearchQuery('');
    setActiveDistrict('All');
  };

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    
    // We only send APPROVED items to the AI
    const approvedEvents = events.filter(e => e.status === 'approved');
    const approvedHelp = helpServices.filter(h => h.status === 'approved');

    const result = await searchWithGemini(searchQuery, approvedEvents, approvedHelp);
    
    setGeminiResult({
      eventIds: result.relevantEventIds || [],
      helpIds: result.relevantHelpIds || [],
      reasoning: result.reasoning
    });
    
    if (result.relevantEventIds?.length > 0 && (!result.relevantHelpIds || result.relevantHelpIds.length === 0)) setActiveView('events');
    else if (result.relevantHelpIds?.length > 0 && (!result.relevantEventIds || result.relevantEventIds.length === 0)) setActiveView('help');
    
    setIsThinking(false);
  };

  // --- Renders ---

  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center gap-4">
          
          {/* Left Group: Logo & Navigation */}
          <div className="flex items-center gap-6 lg:gap-8 flex-shrink-0">
            {/* Logo */}
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center cursor-pointer" onClick={() => setActiveView('events')}>
              <span className="bg-brand-600 text-white rounded px-1.5 py-0.5 mr-2 text-sm tracking-tighter">IH</span>
              <div className="flex flex-col leading-none">
                <span>INHELP</span>
                <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest ml-0.5">Москва</span>
              </div>
            </h1>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <button 
                onClick={() => setActiveView('events')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeView === 'events' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-brand-600'}`}
              >
                События
              </button>
              <button 
                onClick={() => setActiveView('help')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeView === 'help' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                Помощь
              </button>
              <button 
                onClick={() => setActiveView('add')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeView === 'add' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {isAdmin ? 'Админка' : 'Добавить'}
              </button>
            </div>
          </div>

          {/* Right Side: District Filter & Assistant - Pushed to right with ml-auto */}
          <div className="ml-auto flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
             {activeView !== 'add' && activeView !== 'assistant' && (
               <div className="flex items-center">
                 <select 
                   value={activeDistrict} 
                   onChange={(e) => setActiveDistrict(e.target.value as District | 'All')}
                   className="bg-slate-100 border-none text-sm rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-brand-500 outline-none max-w-[140px] md:max-w-none"
                 >
                   <option value="All">Все районы</option>
                   {Object.values(District).map(d => (
                     <option key={d} value={d}>{d}</option>
                   ))}
                 </select>
                 {geminiResult && (
                   <button onClick={clearSearch} className="ml-2 bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full flex items-center flex-shrink-0 hover:bg-red-100">
                     Сброс <X className="w-3 h-3 ml-1"/>
                   </button>
                 )}
               </div>
             )}

             <button 
               onClick={() => setActiveView('assistant')}
               className={`p-2 rounded-full transition-colors flex-shrink-0 ${activeView === 'assistant' ? 'bg-brand-100 text-brand-600 shadow-inner' : 'bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-600'}`}
               title="Умный помощник"
             >
                <Bot className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>
    </header>
  );

  const renderDeleteConfirmation = () => {
    if (!itemToDelete) return null;
    return (
      <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-fade-in text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
             <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Удалить запись?</h3>
          <p className="text-sm text-slate-600 mb-6">Это действие нельзя отменить. Запись будет удалена из базы данных.</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setItemToDelete(null)}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
            >
              Отмена
            </button>
            <button 
              onClick={confirmDelete}
              className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderForm = () => {
    if (!editingItem) return null;
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold">
               {isSuggestionMode ? 'Предложить' : 'Редактировать'} {isEditingEvent ? 'Событие' : 'Помощь'}
             </h3>
             <button onClick={() => setEditingItem(null)}><X className="w-6 h-6 text-slate-400" /></button>
          </div>
          <form onSubmit={saveItem} className="space-y-4">
            {isEditingEvent ? (
              <>
                <input placeholder="Название" required className="w-full p-2 border rounded" value={(editingItem as AppEvent).title || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value} as AppEvent)} />
                <textarea placeholder="Описание" required className="w-full p-2 border rounded" value={(editingItem as AppEvent).description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value} as AppEvent)} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" required className="p-2 border rounded" value={(editingItem as AppEvent).date || ''} onChange={e => setEditingItem({...editingItem, date: e.target.value} as AppEvent)} />
                  <input type="time" required className="p-2 border rounded" value={(editingItem as AppEvent).time || ''} onChange={e => setEditingItem({...editingItem, time: e.target.value} as AppEvent)} />
                </div>
                <input placeholder="Место" required className="w-full p-2 border rounded" value={(editingItem as AppEvent).location || ''} onChange={e => setEditingItem({...editingItem, location: e.target.value} as AppEvent)} />
                <select className="w-full p-2 border rounded" value={(editingItem as AppEvent).district || ''} onChange={e => setEditingItem({...editingItem, district: e.target.value as District} as AppEvent)}>
                  {Object.values(District).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="w-full p-2 border rounded" value={(editingItem as AppEvent).category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value as EventCategory} as AppEvent)}>
                   {Object.values(EventCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="w-full p-2 border rounded" value={(editingItem as AppEvent).accessibility || ''} onChange={e => setEditingItem({...editingItem, accessibility: e.target.value as AccessibilityLevel} as AppEvent)}>
                   {Object.values(AccessibilityLevel).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                
                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-semibold text-slate-600 mb-2">Контакты (заполните минимум одно поле)</p>
                  <input placeholder="Ссылка на регистрацию (URL)" className="w-full p-2 border rounded mb-2" value={(editingItem as AppEvent).registrationLink || ''} onChange={e => setEditingItem({...editingItem, registrationLink: e.target.value} as AppEvent)} />
                  
                  <div className="flex gap-2 items-center mb-2">
                    <input placeholder="Телефон" className="flex-1 p-2 border rounded" value={(editingItem as AppEvent).contactPhone || ''} onChange={e => setEditingItem({...editingItem, contactPhone: e.target.value} as AppEvent)} />
                  </div>

                  <input placeholder="Имя контактного лица (необязательно)" className="w-full p-2 border rounded mb-2" value={(editingItem as AppEvent).contactName || ''} onChange={e => setEditingItem({...editingItem, contactName: e.target.value} as AppEvent)} />
                  
                  <div className="flex gap-4 text-sm text-slate-700">
                    <span className="text-xs text-slate-500 pt-1">Мессенджеры:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(editingItem as AppEvent).contactMethods?.includes('WhatsApp') || false} 
                        onChange={() => toggleContactMethod('WhatsApp')}
                      /> WhatsApp
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(editingItem as AppEvent).contactMethods?.includes('Telegram') || false} 
                        onChange={() => toggleContactMethod('Telegram')}
                      /> Telegram
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <>
                <input placeholder="Организация" required className="w-full p-2 border rounded" value={(editingItem as HelpService).orgName || ''} onChange={e => setEditingItem({...editingItem, orgName: e.target.value} as HelpService)} />
                <textarea placeholder="Описание помощи" required className="w-full p-2 border rounded" value={(editingItem as HelpService).description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value} as HelpService)} />
                <input placeholder="Контакты (Телефон/Email)" required className="w-full p-2 border rounded" value={(editingItem as HelpService).contacts || ''} onChange={e => setEditingItem({...editingItem, contacts: e.target.value} as HelpService)} />
                 <select className="w-full p-2 border rounded" value={(editingItem as HelpService).district || ''} onChange={e => setEditingItem({...editingItem, district: e.target.value as District} as HelpService)}>
                  <option value="Все районы">Все районы</option>
                  {Object.values(District).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="w-full p-2 border rounded" value={(editingItem as HelpService).helpType || ''} onChange={e => setEditingItem({...editingItem, helpType: e.target.value as HelpCategory} as HelpService)}>
                   {Object.values(HelpCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Условия (например, паспорт)" required className="w-full p-2 border rounded" value={(editingItem as HelpService).conditions || ''} onChange={e => setEditingItem({...editingItem, conditions: e.target.value} as HelpService)} />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={(editingItem as HelpService).isFree || false} onChange={e => setEditingItem({...editingItem, isFree: e.target.checked} as HelpService)} />
                  Бесплатно
                </label>
              </>
            )}
            <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700">
              {isSuggestionMode ? 'Отправить на модерацию' : 'Сохранить'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderAdminPanel = () => {
    const pendingEvents = events.filter(e => e.status === 'pending');
    const pendingHelp = helpServices.filter(h => h.status === 'pending');
    const pendingCount = pendingEvents.length + pendingHelp.length;

    return (
      <div className="pb-20 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Админ-панель</h2>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 flex items-center gap-2">
             <span className="hidden md:inline">Выйти</span> <LogOut className="w-5 h-5"/>
          </button>
        </div>
        
        {/* DATABASE SYNC SECTION */}
        <div className="bg-slate-200 rounded-lg p-4 mb-6 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
             <div className="flex items-center gap-2 text-slate-700 font-bold text-sm mb-1">
               <Database className="w-4 h-4" />
               Управление Базой Данных
             </div>
             <p className="text-xs text-slate-500 leading-snug">
               Вставьте URL скрипта в файл кода. Эта кнопка отправит все текущие данные (включая тестовые) в вашу Google Таблицу.
             </p>
          </div>
          <button 
            onClick={openSyncModal}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2 bg-slate-800 text-white rounded-md text-sm font-semibold hover:bg-slate-900 transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Экспорт базы в облако
          </button>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
           <button onClick={() => setAdminTab('requests')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${adminTab === 'requests' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
             Заявки {pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingCount}</span>}
           </button>
           <button onClick={() => setAdminTab('events')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${adminTab === 'events' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>События</button>
           <button onClick={() => setAdminTab('help')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${adminTab === 'help' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Помощь</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {adminTab === 'requests' && (
             <>
               {pendingCount === 0 && <div className="col-span-full text-center text-slate-400 py-10">Новых заявок нет</div>}
               {pendingEvents.map(e => (
                 <div key={e.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm flex flex-col h-full">
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Событие</span>
                     <div className="flex gap-2">
                        <button onClick={() => approveItem(e.id, 'event')} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setItemToDelete({id: e.id, type: 'event'})} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><X className="w-4 h-4"/></button>
                     </div>
                   </div>
                   <h4 className="font-bold">{e.title}</h4>
                   <p className="text-sm text-slate-600 mb-2 flex-1">{e.description}</p>
                   <button onClick={() => startEdit(e, 'event')} className="text-xs text-brand-600 underline mt-2 text-left">Редактировать</button>
                 </div>
               ))}
               {pendingHelp.map(h => (
                 <div key={h.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm flex flex-col h-full">
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Помощь</span>
                     <div className="flex gap-2">
                        <button onClick={() => approveItem(h.id, 'help')} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setItemToDelete({id: h.id, type: 'help'})} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><X className="w-4 h-4"/></button>
                     </div>
                   </div>
                   <h4 className="font-bold">{h.orgName}</h4>
                   <p className="text-sm text-slate-600 mb-2 flex-1">{h.description}</p>
                   <button onClick={() => startEdit(h, 'help')} className="text-xs text-brand-600 underline mt-2 text-left">Редактировать</button>
                 </div>
               ))}
             </>
           )}

           {adminTab === 'events' && events.filter(e => e.status === 'approved').map(e => (
              <div key={e.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between h-full">
                 <div className="mb-2">
                   <h4 className="font-bold text-sm">{e.title}</h4>
                   <p className="text-xs text-slate-500">{e.date}</p>
                 </div>
                 <div className="flex gap-2 justify-end mt-auto pt-2 border-t border-slate-50">
                    <button onClick={() => startEdit(e, 'event')} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => setItemToDelete({id: e.id, type: 'event'})} className="p-2 bg-red-50 text-red-500 rounded hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                 </div>
              </div>
           ))}

           {adminTab === 'help' && helpServices.filter(h => h.status === 'approved').map(h => (
              <div key={h.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between h-full">
                 <div className="mb-2">
                   <h4 className="font-bold text-sm">{h.orgName}</h4>
                   <p className="text-xs text-slate-500">{h.helpType}</p>
                 </div>
                 <div className="flex gap-2 justify-end mt-auto pt-2 border-t border-slate-50">
                    <button onClick={() => startEdit(h, 'help')} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => setItemToDelete({id: h.id, type: 'help'})} className="p-2 bg-red-50 text-red-500 rounded hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                 </div>
              </div>
           ))}
        </div>
      </div>
    );
  };

  const renderAddOrLogin = () => {
    if (isAdmin) return renderAdminPanel();

    return (
      <div className="flex flex-col min-h-[60vh] justify-center max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-100 text-center mb-8">
           <h2 className="text-2xl font-bold text-slate-900 mb-6">Предложить в каталог</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => startSuggestion('event')} className="flex flex-col md:flex-row items-center justify-center p-6 md:p-8 bg-brand-50 border border-brand-100 rounded-xl hover:bg-brand-100 transition-colors text-brand-700 font-bold gap-3">
               <Calendar className="w-8 h-8 md:w-6 md:h-6" /> 
               <span>Добавить Событие</span>
             </button>
             <button onClick={() => startSuggestion('help')} className="flex flex-col md:flex-row items-center justify-center p-6 md:p-8 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors text-indigo-700 font-bold gap-3">
               <HeartHandshake className="w-8 h-8 md:w-6 md:h-6" /> 
               <span>Предложить Помощь</span>
             </button>
           </div>
        </div>

        <div className="mt-auto pt-8 border-t border-slate-200">
           {!loginForm.username && !loginForm.password && (
              <button 
                onClick={() => setLoginForm({ username: ' ', password: '' })} // Hack to show form
                className="w-full text-center text-slate-400 text-sm hover:text-brand-600 transition-colors flex items-center justify-center gap-1"
              >
                <Lock className="w-3 h-3"/> Вход для администратора
              </button>
           )}
           
           {(loginForm.username || loginForm.password) !== undefined && loginForm.username !== '' && (
              <form onSubmit={handleLogin} className="bg-slate-50 p-6 rounded-xl animate-fade-in max-w-sm mx-auto">
                 <h3 className="text-sm font-bold text-slate-700 mb-3 text-center">Вход в админку</h3>
                 <input 
                   type="text" 
                   placeholder="Логин" 
                   className="w-full mb-2 p-2 rounded border border-slate-200 text-sm"
                   onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                 />
                 <input 
                   type="password" 
                   placeholder="Пароль" 
                   className="w-full mb-4 p-2 rounded border border-slate-200 text-sm"
                   onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                 />
                 <button type="submit" className="w-full py-2 bg-slate-800 text-white rounded text-sm font-bold hover:bg-slate-900 transition-colors">Войти</button>
              </form>
           )}
        </div>
      </div>
    );
  };

  const renderAssistant = () => (
    <div className="min-h-[60vh] flex flex-col justify-center max-w-2xl mx-auto">
       <div className="text-center mb-8">
         <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
            <Bot className="w-10 h-10" />
         </div>
         <h2 className="text-2xl font-bold text-slate-900 mb-2">Умный Помощник</h2>
         <p className="text-slate-500 px-4">
           Напишите, что вы ищете. Я подберу подходящие варианты.
         </p>
       </div>

       <form onSubmit={handleSmartSearch} className="relative mb-8">
         <textarea
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           placeholder="Например: Хочу в театр на коляске в центре..."
           className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none text-slate-800 placeholder:text-slate-400"
         />
         <button 
            disabled={isThinking || !searchQuery}
            type="submit"
            className={`absolute bottom-4 right-4 px-6 py-2 rounded-xl font-bold text-white transition-all
              ${isThinking || !searchQuery ? 'bg-slate-300 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-200'}
            `}
         >
           {isThinking ? 'Думаю...' : 'Найти'}
         </button>
       </form>

       {geminiResult && (
          <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm animate-fade-in">
             <h3 className="font-bold text-indigo-900 mb-2">Результат поиска:</h3>
             <p className="text-slate-700 mb-4">{geminiResult.reasoning}</p>
             <div className="flex gap-2">
                <button 
                  onClick={() => setActiveView('events')}
                  className="flex-1 py-2 bg-brand-50 text-brand-700 rounded-lg font-medium text-sm text-center hover:bg-brand-100 transition-colors"
                >
                  События ({geminiResult.eventIds.length})
                </button>
                <button 
                  onClick={() => setActiveView('help')}
                  className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm text-center hover:bg-indigo-100 transition-colors"
                >
                  Помощь ({geminiResult.helpIds.length})
                </button>
             </div>
          </div>
       )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      {renderHeader()}
      {renderForm()}
      {renderDeleteConfirmation()}
      
      <SyncModal 
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSync={performSync}
        itemCount={events.length + helpServices.length}
        status={syncStatus}
        errorMessage={syncError}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400">Загрузка данных...</div>
        ) : (
          <>
            {activeView === 'events' && (
              <div className="space-y-4">
                 {geminiResult && <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 text-sm text-brand-800 mb-6 max-w-3xl mx-auto text-center">🤖 {geminiResult.reasoning}</div>}
                 
                 {filteredEvents.length === 0 ? (
                    <p className="text-center text-slate-400 py-10">Событий не найдено</p>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredEvents.map(event => <EventCard key={event.id} event={event} />)}
                    </div>
                 )}
              </div>
            )}
            
            {activeView === 'help' && (
              <div className="space-y-4">
                 {geminiResult && <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 text-sm text-brand-800 mb-6 max-w-3xl mx-auto text-center">🤖 {geminiResult.reasoning}</div>}
                 
                 {filteredHelp.length === 0 ? (
                    <p className="text-center text-slate-400 py-10">Помощи не найдено</p>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredHelp.map(service => <HelpCard key={service.id} service={service} />)}
                    </div>
                 )}
              </div>
            )}

            {activeView === 'add' && renderAddOrLogin()}
            {activeView === 'assistant' && renderAssistant()}
          </>
        )}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 md:hidden">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setActiveView('events')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'events' ? 'text-brand-600' : 'text-slate-400'}`}>
            <Calendar className="w-6 h-6" /><span className="text-[10px] font-bold">События</span>
          </button>
          
          <button onClick={() => setActiveView('help')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'help' ? 'text-brand-600' : 'text-slate-400'}`}>
            <HeartHandshake className="w-6 h-6" /><span className="text-[10px] font-bold">Помощь</span>
          </button>

          <button onClick={() => setActiveView('add')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeView === 'add' ? 'text-brand-600' : 'text-slate-400'}`}>
            <PlusCircle className="w-6 h-6" /><span className="text-[10px] font-bold">{isAdmin ? 'Админка' : 'Добавить'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;