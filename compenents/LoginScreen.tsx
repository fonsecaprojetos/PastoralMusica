import React, { useState } from 'react';
import { Music, Lock, User, Loader2, Database, Mail } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (u: string, p: string) => Promise<boolean>;
  onSeed?: () => Promise<void>;
  showSeed?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSeed, showSeed }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await onLogin(username, password);
      if (!success) {
        setError('Credenciais inválidas. Verifique email e senha.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao fazer login: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!onSeed) return;
    if (!window.confirm("Isso criará os dados iniciais (Admin Master e Comunidades). Continuar?")) return;
    
    setSeedLoading(true);
    try {
      await onSeed();
      alert("Banco de dados inicializado! Use: felipefonseca.projetos@gmail.com / 123456");
      setUsername('felipefonseca.projetos@gmail.com');
      setPassword('123456');
    } catch (e: any) {
      alert("Erro ao inicializar: " + e.message);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parish-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-parish-900 rounded-full flex items-center justify-center shadow-xl shadow-parish-200/50 mb-6">
            <Music className="text-parish-200" size={36} />
          </div>
          <h1 className="text-3xl font-bold text-parish-900 tracking-tight">Pastoral de Música</h1>
          <p className="mt-2 text-parish-600 font-medium text-lg">Santuário Diocesano Santa Rita de Cássia</p>
          <p className="text-sm text-parish-200 font-semibold mt-1">Jundiaí - SP</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-parish-200/30">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-parish-900 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-parish-200" />
                </div>
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-parish-200 rounded-lg focus:ring-2 focus:ring-parish-600 focus:border-transparent transition-all outline-none text-parish-900 placeholder-parish-200/70"
                  placeholder="felipefonseca.projetos@gmail.com"
                  autoCapitalize="none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-parish-900 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-parish-200" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-parish-200 rounded-lg focus:ring-2 focus:ring-parish-600 focus:border-transparent transition-all outline-none text-parish-900 placeholder-parish-200/70"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 border border-red-100">
              <p className="text-sm font-bold text-red-800 text-center">{error}</p>
            </div>
          )}

          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-lg text-parish-50 bg-parish-900 hover:bg-parish-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-parish-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Entrar no Portal'}
            </button>
          </div>
        </form>
        
        {showSeed && (
           <button 
            onClick={handleSeed}
            disabled={seedLoading}
            className="mt-4 w-full text-xs text-parish-400 hover:text-parish-600 flex items-center justify-center gap-2"
           >
             {seedLoading ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
             Inicializar Banco de Dados (Primeiro Acesso)
           </button>
        )}

        <p className="text-center text-xs text-parish-600 mt-8 font-medium opacity-80">
          "A quem Deus ama, Deus prova."
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;