import React from 'react';
import { Phone, MapPin, HeartHandshake, Banknote, ShieldCheck, Mail } from 'lucide-react';
import { HelpService } from '../types';

interface HelpCardProps {
  service: HelpService;
}

export const HelpCard: React.FC<HelpCardProps> = ({ service }) => {
  // Защита от пустых данных (чтобы приложение не падало)
  if (!service) return null;

  // Принудительно приводим к строке, так как из базы/JSON может прийти число
  const contacts = String(service.contacts || '');
  const isEmail = contacts.includes('@');
  
  // Если это телефон - чистим от всего кроме цифр и плюса
  // Если email - оставляем как есть
  const linkHref = isEmail ? `mailto:${contacts}` : `tel:${contacts.replace(/[^\d+]/g, '')}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow border-l-4 border-l-indigo-500 h-full flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-slate-900">{service.orgName || 'Без названия'}</h3>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md ml-2 flex-shrink-0">
          {service.helpType || 'Помощь'}
        </span>
      </div>

      <p className="text-slate-700 text-sm mb-4 flex-1">{service.description || 'Описание отсутствует'}</p>

      <div className="space-y-2 text-sm mt-auto">
        <div className="flex items-center text-slate-600">
          <MapPin className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
          {service.district || 'Район не указан'}
        </div>
        
        <div className="flex items-center text-slate-600">
           {service.isFree ? (
             <div className="flex items-center text-green-600 font-medium">
               <HeartHandshake className="w-4 h-4 mr-2" />
               Бесплатно
             </div>
           ) : (
             <div className="flex items-center text-amber-600 font-medium">
               <Banknote className="w-4 h-4 mr-2" />
               Платно / Частично
             </div>
           )}
        </div>

        <div className="flex items-start text-slate-500 text-xs bg-slate-50 p-2 rounded">
          <ShieldCheck className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />
          <span>{service.conditions || 'Условия не указаны'}</span>
        </div>
      </div>

      {contacts && (
        <a
          href={linkHref}
          className="mt-4 w-full flex items-center justify-center py-2.5 border border-indigo-200 text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
        >
          {isEmail ? <Mail className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
          {contacts}
        </a>
      )}
    </div>
  );
};