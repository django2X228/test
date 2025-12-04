import React from 'react';
import { Calendar, MapPin, Clock, ExternalLink, Accessibility, Phone, User, MessageCircle, Send } from 'lucide-react';
import { AppEvent } from '../types';

interface EventCardProps {
  event: AppEvent;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  // Helper to ensure absolute URLs
  const getSafeUrl = (url?: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <div>
            <span className="inline-block px-2 py-1 text-xs font-semibold text-brand-700 bg-brand-50 rounded-md mb-2">
              {event.category}
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{event.title}</h3>
          </div>
          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center whitespace-nowrap ml-2 flex-shrink-0">
            <Accessibility className="w-3 h-3 mr-1" />
            {event.accessibility === 'Полная (100%)' ? '100%' : event.accessibility}
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
            <span>{event.location} <span className="text-slate-400">({event.district})</span></span>
          </div>
        </div>

        <p className="mt-4 text-slate-700 text-sm flex-1">{event.description}</p>

        {/* Unified Contact Section */}
        <div className="mt-5 space-y-3 pt-4 border-t border-slate-50">
          
          {/* Contact Info Row */}
          {(event.contactName || (event.contactMethods && event.contactMethods.length > 0)) && (
            <div className="flex flex-col gap-2">
               {event.contactName && (
                 <div className="flex items-center text-sm text-slate-600">
                    <User className="w-4 h-4 mr-2 text-slate-400" />
                    <span>Контакт: <span className="font-medium text-slate-900">{event.contactName}</span></span>
                 </div>
               )}
               
               <div className="flex flex-wrap gap-2">
                  {event.contactMethods?.includes('WhatsApp') && (
                    <span className="flex items-center px-3 py-1.5 bg-[#25D366]/10 text-[#075E54] rounded-full border border-[#25D366]/20 text-xs font-bold transition-colors">
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> 
                      WhatsApp
                    </span>
                  )}
                  {event.contactMethods?.includes('Telegram') && (
                    <span className="flex items-center px-3 py-1.5 bg-[#0088cc]/10 text-[#0088cc] rounded-full border border-[#0088cc]/20 text-xs font-bold transition-colors">
                       <Send className="w-3 h-3 mr-1.5" />
                       Telegram
                    </span>
                  )}
               </div>
            </div>
          )}

          {/* Buttons Stack */}
          <div className="flex flex-col gap-2 pt-1 mt-auto">
            {event.contactPhone && (
              <a 
                href={`tel:${event.contactPhone}`} 
                className="w-full flex items-center justify-center py-3 border-2 border-brand-100 bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 hover:border-brand-200 transition-colors"
              >
                <Phone className="w-4 h-4 mr-2" />
                Позвонить: {event.contactPhone}
              </a>
            )}

            {event.registrationLink && (
              <a
                href={getSafeUrl(event.registrationLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Регистрация / Подробнее
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};