import React from 'react';
import { Users, Sparkles, LayoutDashboard, Settings, LogOut, BookOpen, Music, MapPin, AlertTriangle, Users2, Lock, Edit, Mic2 } from 'lucide-react';
import { User, AppModule } from '../types';

type View = 'dashboard' | 'members' | 'teams' | 'ai' | 'users' | 'communities' | 'maintenance' | 'sound_training';

interface NavigationProps {
  currentView: View;
  setView: (view: View) => void;
  currentUser: User | null;
  currentModule: AppModule;
  setModule: (mod: AppModule) => void;
  onLogout: () => void;
  onProfileClick: () => void; // New prop
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  setView, 
  currentUser, 
  currentModule,
  setModule,
  onLogout,
  onProfileClick
}) => {
  
  const getNavItems = () => {
    const items = [];
    
    // Common items
    items.push({ id: 'dashboard', label: 'Início', icon: LayoutDashboard });

    if (currentModule === AppModule.LITURGY) {
      items.push({ id: 'teams', label: 'Equipes', icon: Users2 });
      items.push({ id: 'sound_training', label: 'Treinamento Som', icon: Mic2 });
      items.push({ id: 'ai', label: 'IA Litúrgica', icon: Sparkles });
    }

    if (currentModule === AppModule.EDUCATION) {
      items.push({ id: 'dashboard', label: 'Aulas (Em breve)', icon: BookOpen });
    }

    // Always available for authorized users
    items.push({ id: 'members', label: 'Membros', icon: Users });

    return items;
  };

  const navItems = getNavItems() as {id: View, label: string, icon: any}[];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-parish-900 text-parish-50 h-screen fixed left-0 top-0 p-4 border-r border-parish-800 z-50">
        <div className="mb-6 flex items-center gap-3 px-2 pt-2">
          <div className="w-8 h-8 bg-parish-600 rounded-lg flex items-center justify-center shadow-lg shadow-black/20 shrink-0">
            <Music4Icon className="text-parish-100" size={20} />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-parish-50 leading-tight">Pastoral de Música</h1>
            <h2 className="text-[10px] text-parish-200 leading-tight mt-0.5">Santuário Diocesano Santa Rita de Cássia</h2>
          </div>
        </div>
        
        <button 
          onClick={onProfileClick}
          className="w-full text-left px-4 py-3 mb-4 bg-parish-800/50 rounded-xl border border-parish-600/30 hover:bg-parish-800 transition-colors group relative"
        >
          <div className="flex justify-between items-center">
             <div className="overflow-hidden">
               <p className="text-xs text-parish-200 uppercase tracking-wider font-semibold">Olá, {currentUser?.username}</p>
               <p className="font-medium text-sm truncate text-parish-50 mt-0.5">{currentUser?.name}</p>
             </div>
             <Edit size={14} className="text-parish-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="absolute top-full left-0 w-full text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
             <span className="text-[10px] bg-black text-white px-2 py-1 rounded">Alterar Senha</span>
          </div>
        </button>

        {/* Module Switcher */}
        {currentUser && currentUser.allowedModules.length > 1 && (
          <div className="mb-6 flex p-1 bg-parish-800 rounded-lg">
            <button
              onClick={() => setModule(AppModule.LITURGY)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${currentModule === AppModule.LITURGY ? 'bg-parish-600 text-white shadow-sm' : 'text-parish-200 hover:text-white'}`}
            >
              Liturgia
            </button>
            <button
              onClick={() => setModule(AppModule.EDUCATION)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${currentModule === AppModule.EDUCATION ? 'bg-parish-600 text-white shadow-sm' : 'text-parish-200 hover:text-white'}`}
            >
              Formação
            </button>
          </div>
        )}

        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-parish-800 text-white shadow-md border border-parish-600' 
                  : 'text-parish-200 hover:bg-parish-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={currentView === item.id ? 'text-parish-200' : ''} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}

          <div className="my-2 border-t border-parish-800"></div>
          
          {/* Admin Section */}
          {currentUser?.isAdmin && (
            <>
               <button
               onClick={() => setView('users')}
               className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                 currentView === 'users'
                   ? 'bg-parish-800 text-white shadow-md border border-parish-600' 
                   : 'text-parish-200 hover:bg-parish-800 hover:text-white'
               }`}
             >
               <Settings size={20} className={currentView === 'users' ? 'text-parish-200' : ''} />
               <span className="font-medium text-sm">Usuários</span>
             </button>
             
             {currentUser.isMaster && (
               <>
                 <button
                  onClick={() => setView('communities')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    currentView === 'communities'
                      ? 'bg-parish-800 text-white shadow-md border border-parish-600' 
                      : 'text-parish-200 hover:bg-parish-800 hover:text-white'
                  }`}
                >
                  <MapPin size={20} className={currentView === 'communities' ? 'text-parish-200' : ''} />
                  <span className="font-medium text-sm">Comunidades</span>
                </button>
                <button
                  onClick={() => setView('maintenance')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    currentView === 'maintenance'
                      ? 'bg-parish-800 text-white shadow-md border border-parish-600' 
                      : 'text-parish-200 hover:bg-parish-800 hover:text-white'
                  }`}
                >
                  <AlertTriangle size={20} className={currentView === 'maintenance' ? 'text-amber-500' : 'text-amber-600'} />
                  <span className="font-medium text-sm">Manutenção</span>
                </button>
               </>
             )}
            </>
          )}
        </nav>

        <button 
          onClick={onLogout}
          className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg text-parish-200 hover:bg-parish-800 hover:text-parish-100 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-parish-200 px-4 py-2 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] text-parish-600">
        <button
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 ${
            currentView === 'dashboard' ? 'text-parish-900' : 'text-parish-200'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium">Início</span>
        </button>
        
        {currentModule === AppModule.LITURGY && (
           <button
           onClick={() => setView('teams')}
           className={`flex flex-col items-center gap-1 p-2 ${
             currentView === 'teams' ? 'text-parish-900' : 'text-parish-200'
           }`}
         >
           <Users2 size={20} />
           <span className="text-[10px] font-medium">Equipes</span>
         </button>
        )}

        <button
          onClick={() => setView('members')}
          className={`flex flex-col items-center gap-1 p-2 ${
            currentView === 'members' ? 'text-parish-900' : 'text-parish-200'
          }`}
        >
          <Users size={20} />
          <span className="text-[10px] font-medium">Membros</span>
        </button>

        {currentUser?.isAdmin ? (
          <button
            onClick={() => setView('users')}
            className={`flex flex-col items-center gap-1 p-2 ${
              currentView === 'users' ? 'text-parish-900' : 'text-parish-200'
            }`}
          >
            <Settings size={20} />
            <span className="text-[10px] font-medium">Admin</span>
          </button>
        ) : (
          <button
            onClick={onProfileClick}
            className={`flex flex-col items-center gap-1 p-2 text-parish-200`}
          >
            <Lock size={20} />
            <span className="text-[10px] font-medium">Senha</span>
          </button>
        )}
        <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 p-2 text-parish-900 opacity-60"
          >
            <LogOut size={20} />
            <span className="text-[10px] font-medium">Sair</span>
          </button>
      </nav>
    </>
  );
};

const Music4Icon = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export default Navigation;