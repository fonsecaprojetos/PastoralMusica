import React from 'react';
import { LiturgyEvent } from '../types';
import { Calendar, MapPin, Music4 } from 'lucide-react';

interface EventCardProps {
  event: LiturgyEvent & { community?: string };
  onClick: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-xl shadow-sm border border-parish-200 cursor-pointer hover:border-parish-600 hover:ring-1 hover:ring-parish-600 transition-all group"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-parish-600 uppercase tracking-wide bg-parish-100 px-2 py-0.5 rounded-md self-start mb-1">
            {new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <h3 className="font-bold text-lg text-parish-900 leading-tight group-hover:text-parish-600 transition-colors">{event.title}</h3>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm text-parish-600 mt-3 border-t border-parish-100 pt-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-parish-200" />
          <span>{event.community || 'Local não definido'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Music4 size={16} className="text-amber-600" />
          <span>{event.songs.length} músicas definidas</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;