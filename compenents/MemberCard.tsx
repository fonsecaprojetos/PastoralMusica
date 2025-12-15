import React from 'react';
import { Member, Role } from '../types';
import { User, Music, Phone, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

interface MemberCardProps {
  member: Member & { community?: string };
  onEdit: (m: Member) => void;
  onDelete: (m: Member) => void;
  canEdit: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onEdit, onDelete, canEdit }) => {
  const role = member.role || Role.MEMBER;
  const isActive = member.isActive !== false; // Default to true if undefined

  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border ${isActive ? 'border-parish-200' : 'border-gray-200 bg-gray-50 opacity-80'} flex flex-col gap-3 hover:shadow-md transition-shadow hover:border-parish-600 relative group`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-full ${!isActive ? 'bg-gray-200 text-gray-500' : role === Role.COORDINATOR ? 'bg-parish-600 text-white' : 'bg-parish-50 text-parish-600'}`}>
            <User size={20} />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${isActive ? 'text-parish-900' : 'text-gray-500'}`}>{member.name}</h3>
            <p className="text-xs text-parish-600 font-medium">{member.community || 'Comunidade'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
           <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${role === Role.COORDINATOR ? 'bg-amber-100 text-amber-800' : 'bg-parish-100 text-parish-600'}`}>
             {role}
           </span>
           <span className={`flex items-center gap-1 text-[10px] font-bold ${isActive ? 'text-green-600' : 'text-red-500'}`}>
             {isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
             {isActive ? 'Ativo' : 'Inativo'}
           </span>
        </div>
      </div>
      
      <div className="mt-2 flex flex-col gap-1.5 text-sm text-parish-600">
        {member.instruments && member.instruments.length > 0 && (
          <div className="flex items-center gap-2">
            <Music size={14} className="text-parish-600" />
            <span className="italic">{member.instruments.join(', ')}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-parish-200" />
          <span>{member.phone}</span>
        </div>
      </div>

      {canEdit && (
        <div className="pt-3 mt-1 border-t border-parish-100 flex justify-end gap-2">
          <button 
            type="button"
            onClick={() => onEdit(member)}
            className="p-1.5 text-parish-600 hover:bg-parish-50 rounded cursor-pointer z-10"
            title="Editar"
          >
            <Edit2 size={16} className="pointer-events-none" />
          </button>
          <button 
            type="button"
            onClick={() => onDelete(member)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer z-10"
            title="Excluir"
          >
            <Trash2 size={16} className="pointer-events-none" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberCard;