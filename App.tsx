import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/Navigation';
import LoginScreen from './components/LoginScreen';
import MemberCard from './components/MemberCard';
import { 
  Member, AISongSuggestion, User, Community, AppModule, UserStatus, 
  Instrument, PastoralWork, MaritalStatus, MemberStatus, Role, Team, SoundTraining
} from './types';
import { getLiturgicalSuggestions } from './services/geminiService';
import { 
  Plus, Search, Sparkles, Music, Loader2, 
  ArrowLeft, Shield, UserPlus, CheckCircle2, MapPin, AlertTriangle, 
  Trash2, XCircle, Filter, Edit2, Save, Users2, Grip, Database, Lock,
  Heart, Mic2, Calendar
} from 'lucide-react';

// FIREBASE IMPORTS
import { auth, db, firebaseConfig } from './firebaseConfig'; // Added firebaseConfig import
import { initializeApp, deleteApp } from 'firebase/app'; // Added imports for secondary app
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, getAuth, updatePassword } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, getDocs, setDoc, writeBatch } from 'firebase/firestore';

// --- CONSTANTS ---
const DDI_OPTIONS = [
  { code: '+55', flag: '🇧🇷', label: 'Brasil' },
  { code: '+1', flag: '🇺🇸', label: 'EUA' },
  { code: '+351', flag: '🇵🇹', label: 'Portugal' },
  { code: '+39', flag: '🇮🇹', label: 'Itália' },
  { code: '+33', flag: '🇫🇷', label: 'França' },
];

const INITIAL_COMMUNITIES_SEED: Community[] = [
  { id: 'coord', name: 'Coordenação', address: 'Santuário' },
  { id: 'ns_auxiliadora', name: 'Nossa Senhora Auxiliadora', address: 'Comunidade', geo: { lat: -23.1238, lng: -46.92922 } },
  { id: 'ns_gracas', name: 'Nossa Senhora das Graças', address: 'Comunidade', geo: { lat: -23.1075, lng: -46.91839 } },
  { id: 'ns_guadalupe', name: 'Nossa Senhora de Guadalupe', address: 'Comunidade', geo: { lat: -23.137, lng: -46.928 } },
  { id: 'sta_brigida', name: 'Santa Brígida', address: 'Comunidade', geo: { lat: -23.124, lng: -46.935 } },
  { id: 'sta_luzia', name: 'Santa Luzia', address: 'Comunidade', geo: { lat: -23.13853, lng: -46.916 } },
  { id: 'matriz', name: 'Santa Rita', address: 'Santuário Diocesano', geo: { lat: -23.14382, lng: -46.91974 } }, 
  { id: 'sao_francisco', name: 'São Francisco', address: 'Comunidade', geo: { lat: -23.13167, lng: -46.94706 } },
  { id: 'sao_jose', name: 'São José', address: 'Comunidade', geo: { lat: -23.10491, lng: -46.90396 } }
];

// --- APP COMPONENT ---

type View = 'dashboard' | 'members' | 'teams' | 'ai' | 'users' | 'communities' | 'maintenance' | 'sound_training';

const App = () => {
  // --- STATE ---
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentModule, setCurrentModule] = useState<AppModule>(AppModule.LITURGY);
  const [currentView, setView] = useState<View>('dashboard');

  const [users, setUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [soundTrainings, setSoundTrainings] = useState<SoundTraining[]>([]);

  // UI States
  const [liturgyInput, setLiturgyInput] = useState('');
  const [focusInput, setFocusInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISongSuggestion[]>([]);
  const [creatingUser, setCreatingUser] = useState(false);
  
  // Password Change Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Member Management States
  const [filterInstrument, setFilterInstrument] = useState<string>('');
  const [filterPastoral, setFilterPastoral] = useState<string>('');
  const [filterCommunity, setFilterCommunity] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>(''); 
  const [filterECC, setFilterECC] = useState<string>('');   
  const [filterActive, setFilterActive] = useState<string>('yes'); // Default to active members
  const [filterMaritalStatus, setFilterMaritalStatus] = useState<string>(''); // New filter

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<Member>>({
    pastoralWorks: [], instruments: [], isActive: true
  });
  // Phone helper states
  const [phoneDDI, setPhoneDDI] = useState('+55');
  const [phoneBody, setPhoneBody] = useState('');

  // Team Management State
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState<Partial<Team>>({ memberIds: [] });

  // Sound Training State
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<SoundTraining | null>(null);
  const [trainingForm, setTrainingForm] = useState<Partial<SoundTraining>>({ memberIds: [] });

  // User Management State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({ 
    isAdmin: false, 
    allowedModules: [AppModule.LITURGY] 
  });
  
  // Community Management State
  const [newCommunity, setNewCommunity] = useState<Partial<Community>>({});
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [gettingLoc, setGettingLoc] = useState(false);

  // Maintenance View Tab
  const [maintenanceTab, setMaintenanceTab] = useState<'users' | 'members'>('users');

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  // --- FIREBASE LISTENERS ---

  // Helper to ensure communities exist
  const ensureCommunitiesExist = async () => {
    const commRef = collection(db, 'communities');
    const commSnap = await getDocs(commRef);
    if (commSnap.empty) {
      console.log("Communities missing. Auto-seeding...");
      for (const c of INITIAL_COMMUNITIES_SEED) {
        await setDoc(doc(db, "communities", c.id), c);
      }
    }
  };
  
  useEffect(() => {
    // 1. Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extended user profile from Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Wait for Firestore to sync
        const unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
          const isMasterEmail = firebaseUser.email === "felipefonseca.projetos@gmail.com";
          
          if (docSnap.exists()) {
            const userData = { id: docSnap.id, ...docSnap.data() } as User;
            setCurrentUser(userData);
            if (userData.allowedModules.length > 0) {
              setCurrentModule(userData.allowedModules[0]);
            }

            // AUTO-FIX: Check if communities exist if master is logged in
            if (isMasterEmail || userData.isMaster) {
              await ensureCommunitiesExist();
            }

          } else {
            // CRITICAL FIX: User is authenticated but has no profile in Firestore.
            // If it is the Master Admin email, we auto-repair it.
            if (isMasterEmail) {
              console.log("Master Admin profile missing. Auto-repairing...");
              const masterUser: User = {
                id: firebaseUser.uid,
                username: "felipefonseca",
                name: "Felipe Fonseca (Master)",
                password: "", 
                communityId: "coord",
                isAdmin: true,
                isMaster: true,
                allowedModules: [AppModule.LITURGY, AppModule.EDUCATION],
                status: UserStatus.ACTIVE
              };
              await setDoc(userRef, masterUser);
              
              // Also ensure communities exist
              await ensureCommunitiesExist();
            } else {
              // Unknown user without profile
              console.error("User authenticated but no profile found.");
              setCurrentUser(null);
            }
          }
        });
        
        return () => unsubscribeUser();
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    // 2. Data Listeners (Always active if logged in, but for safety lets wrap)
    const unsubCommunities = onSnapshot(collection(db, 'communities'), (snap) => {
      setCommunities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Community)));
    });

    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
    });
    
    const unsubTrainings = onSnapshot(collection(db, 'sound_trainings'), (snap) => {
      setSoundTrainings(snap.docs.map(d => ({ id: d.id, ...d.data() } as SoundTraining)));
    });

    return () => {
      unsubscribeAuth();
      unsubCommunities();
      unsubMembers();
      unsubUsers();
      unsubTeams();
      unsubTrainings();
    };
  }, []);


  // --- ACTIONS ---

  const requestConfirmation = (message: string, action: () => void) => {
    setConfirmation({
      isOpen: true,
      message,
      onConfirm: action
    });
  };

  const handleLogin = async (u: string, p: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, u, p);
      return true;
    } catch (e: any) {
      console.error("Login Error:", e);
      // Re-throw so LoginScreen can show the specific message
      throw new Error(e.code === 'auth/invalid-credential' ? "Email ou senha incorretos." : e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setView('dashboard');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newPassword) return;
    
    setChangingPassword(true);
    try {
       await updatePassword(auth.currentUser, newPassword);
       alert("Senha alterada com sucesso!");
       setNewPassword('');
       setShowPasswordModal(false);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Por segurança, faça login novamente antes de alterar a senha.");
        await handleLogout();
      } else {
        alert("Erro ao alterar senha: " + error.message);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSeedDatabase = async () => {
    // 1. Create Master User in Auth and Firestore
    const masterEmail = "felipefonseca.projetos@gmail.com"; 
    const masterPass = "123456";
    let firebaseUser = null;
    
    try {
      try {
        // Try creating the user first
        const userCred = await createUserWithEmailAndPassword(auth, masterEmail, masterPass);
        firebaseUser = userCred.user;
      } catch (createError: any) {
        if (createError.code === 'auth/email-already-in-use') {
           // User exists, try logging in
           console.log("Admin user exists, attempting login...");
           const loginCred = await signInWithEmailAndPassword(auth, masterEmail, masterPass);
           firebaseUser = loginCred.user;
        } else {
          throw createError;
        }
      }

      if (!firebaseUser) throw new Error("Não foi possível autenticar o usuário Admin.");

      const masterUser: User = {
        id: firebaseUser.uid,
        username: "felipefonseca",
        name: "Felipe Fonseca (Master)",
        password: "", // Not storing password in DB
        communityId: "coord",
        isAdmin: true,
        isMaster: true,
        allowedModules: [AppModule.LITURGY, AppModule.EDUCATION],
        status: UserStatus.ACTIVE
      };

      // Write User Data
      await setDoc(doc(db, "users", firebaseUser.uid), masterUser);

      // Write Communities
      await ensureCommunitiesExist();
      
      console.log("Database seeded successfully");
      return;
    } catch (e: any) {
      console.error("Seeding error:", e);
      // Give a more helpful error message
      if (e.code === 'auth/wrong-password') {
        throw new Error("O usuário Admin já existe, mas a senha padrão não confere. Use a senha correta ou redefina no Firebase.");
      }
      throw e;
    }
  };

  // --- PHONE HELPER FUNCTIONS ---
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
  };

  const handlePhoneBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const currentNumbers = phoneBody.replace(/\D/g, '');
    const newNumbers = val.replace(/\D/g, '');
    if (newNumbers.length <= 11) {
      setPhoneBody(formatPhoneNumber(newNumbers));
    }
  };

  // --- MEMBER ACTIONS ---

  const resetMemberForm = () => {
    setMemberForm({ pastoralWorks: [], instruments: [], isActive: true });
    setPhoneDDI('+55');
    setPhoneBody('');
    setEditingMember(null);
    setShowMemberForm(false);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.communityId) return;

    const fullPhone = `${phoneDDI} ${phoneBody}`;
    const memberData = {
      ...memberForm,
      phone: fullPhone,
      status: editingMember ? editingMember.status : MemberStatus.ACTIVE,
      isActive: memberForm.isActive ?? true // Ensure boolean
    };

    try {
      if (editingMember) {
        await updateDoc(doc(db, 'members', editingMember.id), memberData);
      } else {
        await addDoc(collection(db, 'members'), memberData);
      }
      resetMemberForm();
    } catch (e) {
      alert("Erro ao salvar membro.");
      console.error(e);
    }
  };

  const handleEditMemberClick = (m: Member) => {
    setEditingMember(m);
    let ddi = '+55';
    let body = m.phone;
    if (m.phone && m.phone.includes('+')) {
      const parts = m.phone.split(' ');
      if (parts.length > 1) {
        ddi = parts[0];
        body = parts.slice(1).join(' ');
      }
    }
    setPhoneDDI(ddi);
    setPhoneBody(body);
    setMemberForm({ ...m });
    setShowMemberForm(true);
  };

  const handleDeleteMemberClick = (m: Member) => {
    if (currentUser?.isMaster) {
      requestConfirmation(`Excluir ${m.name} permanentemente?`, async () => {
        await deleteDoc(doc(db, 'members', m.id));
      });
    } else {
      requestConfirmation(`Solicitar exclusão de ${m.name}? O Manager precisará aprovar.`, async () => {
        await updateDoc(doc(db, 'members', m.id), { status: MemberStatus.PENDING_DELETION });
      });
    }
  };

  const handleRestoreMember = async (id: string) => {
    await updateDoc(doc(db, 'members', id), { status: MemberStatus.ACTIVE });
  };

  const toggleSelection = <T,>(list: T[], item: T): T[] => {
    return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  // --- TEAM ACTIONS ---

  const resetTeamForm = () => {
    setTeamForm({ memberIds: [] });
    setEditingTeam(null);
    setShowTeamForm(false);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name || !teamForm.communityId) return;

    try {
      if (editingTeam) {
        await updateDoc(doc(db, 'teams', editingTeam.id), teamForm);
      } else {
        await addDoc(collection(db, 'teams'), teamForm);
      }
      resetTeamForm();
    } catch (e) {
      alert("Erro ao salvar equipe.");
      console.error(e);
    }
  };

  const handleDeleteTeam = (t: Team) => {
    if (currentUser?.isAdmin) {
      requestConfirmation(`Tem certeza que deseja excluir a equipe "${t.name}"?`, async () => {
        await deleteDoc(doc(db, 'teams', t.id));
      });
    } else {
      alert("Apenas administradores podem excluir equipes.");
    }
  };

  // --- SOUND TRAINING ACTIONS ---

  const resetTrainingForm = () => {
    setTrainingForm({ memberIds: [] });
    setEditingTraining(null);
    setShowTrainingForm(false);
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingForm.date || !trainingForm.communityId) return;

    try {
      if (editingTraining) {
        await updateDoc(doc(db, 'sound_trainings', editingTraining.id), trainingForm);
      } else {
        await addDoc(collection(db, 'sound_trainings'), trainingForm);
      }
      resetTrainingForm();
    } catch (e) {
      alert("Erro ao salvar treinamento.");
      console.error(e);
    }
  };

  const handleDeleteTraining = (t: SoundTraining) => {
     requestConfirmation(`Excluir treinamento do dia ${t.date}?`, async () => {
       await deleteDoc(doc(db, 'sound_trainings', t.id));
     });
  };

  // --- COMMUNITY ACTIONS ---

  const handleSaveCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunity.name || !newCommunity.address) return;

    try {
      if (editingCommunity) {
        await updateDoc(doc(db, 'communities', editingCommunity.id), newCommunity);
        setEditingCommunity(null);
      } else {
        await addDoc(collection(db, 'communities'), newCommunity);
      }
      setNewCommunity({});
    } catch (e) {
      alert("Erro ao salvar comunidade.");
      console.error(e);
    }
  };

  const handleEditCommunityClick = (c: Community) => {
    setEditingCommunity(c);
    setNewCommunity({...c});
  };

  const handleDeleteCommunityClick = (c: Community) => {
    const hasMembers = members.some(m => m.communityId === c.id);
    if (hasMembers) {
      alert(`Não é possível excluir a comunidade "${c.name}" pois existem membros vinculados a ela.`);
      return;
    }
    requestConfirmation(`Excluir comunidade ${c.name}?`, async () => {
      await deleteDoc(doc(db, 'communities', c.id));
    });
  };

  const getCurrentLocation = () => {
    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      setNewCommunity({ ...newCommunity, geo: { lat: pos.coords.latitude, lng: pos.coords.longitude }});
      setGettingLoc(false);
    }, (err) => {
      alert("Erro ao obter localização: " + err.message);
      setGettingLoc(false);
    });
  };

  // --- USER ACTIONS ---

  const resetUserForm = () => {
    setNewUser({ isAdmin: false, allowedModules: [AppModule.LITURGY] });
    setEditingUser(null);
  };

  const handleEditUserClick = (u: User) => {
    setEditingUser(u);
    setNewUser({
      name: u.name,
      username: u.username,
      password: '', // Password is not filled for security
      communityId: u.communityId,
      isAdmin: u.isAdmin,
      allowedModules: u.allowedModules
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);

    try {
      if (editingUser) {
        // --- UPDATE EXISTING USER ---
        const updatedData = {
          name: newUser.name,
          communityId: newUser.communityId,
          isAdmin: newUser.isAdmin,
          allowedModules: newUser.allowedModules
          // We do not update 'username' (email) or 'password' directly in Firestore update here for simplicity/security
        };
        
        await updateDoc(doc(db, 'users', editingUser.id), updatedData);
        alert('Usuário atualizado com sucesso!');
        resetUserForm();

      } else {
        // --- CREATE NEW USER ---
        if (!newUser.username || !newUser.password || !newUser.name || !newUser.communityId) {
          alert("Preencha todos os campos obrigatórios.");
          setCreatingUser(false);
          return;
        }

        const email = newUser.username;
        let secondaryApp: any = null;

        try {
          // Initialize a secondary app to create the user without logging out the admin
          secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
          const secondaryAuth = getAuth(secondaryApp);

          // 1. Create User in Secondary Auth
          const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password!);
          
          // 2. Create User Profile in Firestore
          const u: User = {
            id: userCred.user.uid,
            username: email.split('@')[0],
            password: "", // Don't save pass in DB
            name: newUser.name!,
            communityId: newUser.communityId!,
            isAdmin: newUser.isAdmin || false,
            isMaster: false,
            allowedModules: newUser.allowedModules || [AppModule.LITURGY],
            status: UserStatus.ACTIVE
          };

          await setDoc(doc(db, 'users', userCred.user.uid), u);
          
          // 3. Cleanup
          await signOut(secondaryAuth);
          await deleteApp(secondaryApp);
          
          alert('Usuário criado com sucesso!');
          resetUserForm();
        } catch (e: any) {
          console.error(e);
          let msg = e.message;
          if (e.code === 'auth/email-already-in-use') {
            msg = "Este email já está cadastrado no sistema.";
          }
          alert("Erro ao criar usuário: " + msg);
          
          // Attempt cleanup if failed
          if (secondaryApp) {
            try { await deleteApp(secondaryApp); } catch {}
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      alert("Erro na operação: " + e.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUserRequest = (targetUser: User) => {
    if (targetUser.isMaster) {
      alert("O usuário Master não pode ser excluído.");
      return;
    }

    if (currentUser?.isMaster) {
      requestConfirmation(`Tem certeza que deseja excluir ${targetUser.name}? Isso removerá o acesso ao portal, mas o login antigo permanecerá no Firebase Auth até ser removido manualmente no console.`, async () => {
        await deleteDoc(doc(db, 'users', targetUser.id));
      });
    } else {
      requestConfirmation(`Solicitar exclusão de ${targetUser.name}?`, async () => {
        await updateDoc(doc(db, 'users', targetUser.id), { status: UserStatus.PENDING_DELETION });
      });
    }
  };

  const handleRestoreUser = async (id: string) => {
    await updateDoc(doc(db, 'users', id), { status: UserStatus.ACTIVE });
  };

  const handleAiSuggestion = async () => {
    if (!liturgyInput.trim() || !focusInput.trim()) return;
    setAiLoading(true);
    try {
      const suggestions = await getLiturgicalSuggestions(liturgyInput, focusInput);
      setSuggestions(suggestions);
    } catch (error) {
      console.error(error);
      alert('Erro ao buscar sugestões.');
    } finally {
      setAiLoading(false);
    }
  };

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-parish-900">Módulo: {currentModule}</h2>
        <p className="text-parish-600">Visão Geral da Pastoral</p>
      </header>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-parish-200 shadow-sm">
          <span className="text-3xl font-bold text-parish-900 block">{members.filter(m => m.status === MemberStatus.ACTIVE && m.isActive !== false).length}</span>
          <span className="text-sm text-parish-600 font-medium">Membros Ativos</span>
        </div>
        <div className="bg-parish-50 p-6 rounded-xl border border-parish-200 shadow-sm">
          <span className="text-3xl font-bold text-parish-600 block">{communities.length}</span>
          <span className="text-sm text-parish-900 font-medium">Comunidades</span>
        </div>
        {currentModule === AppModule.LITURGY && (
           <div className="bg-white p-6 rounded-xl border border-parish-200 shadow-sm">
            <span className="text-3xl font-bold text-parish-900 block">{teams.length}</span>
            <span className="text-sm text-parish-600 font-medium">Equipes</span>
          </div>
        )}
        <div className="bg-white p-6 rounded-xl border border-parish-200 shadow-sm">
            <span className="text-3xl font-bold text-parish-900 block">{soundTrainings.length}</span>
            <span className="text-sm text-parish-600 font-medium">Treinamentos Som</span>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-parish-900 mb-4 flex items-center gap-2">
           <MapPin size={20} className="text-parish-600" />
           Membros por Comunidade
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {communities.map(c => {
             const count = members.filter(m => m.communityId === c.id && m.status === MemberStatus.ACTIVE && m.isActive !== false).length;
             return (
               <div key={c.id} className="bg-white p-4 rounded-xl border border-parish-200 shadow-sm flex justify-between items-center group hover:border-parish-400 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-parish-800 text-sm truncate">{c.name}</span>
                    <span className="text-[10px] text-parish-400 uppercase font-bold tracking-wider">Membros Ativos</span>
                  </div>
                  <span className="bg-parish-100 text-parish-900 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-sm group-hover:bg-parish-200 group-hover:text-parish-900 transition-colors">
                    {count}
                  </span>
               </div>
             )
          })}
        </div>
      </div>
    </div>
  );

  const renderSoundTraining = () => (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-parish-900 flex items-center gap-2">
           <Mic2 /> Treinamento de Sonorização
         </h2>
         <button onClick={() => { resetTrainingForm(); setShowTrainingForm(!showTrainingForm); }} className="bg-parish-900 text-white p-2 rounded-full shadow-lg hover:bg-parish-800 transition">
           {showTrainingForm ? <XCircle size={24} /> : <Plus size={24} />}
         </button>
      </div>

      {showTrainingForm && (
        <form onSubmit={handleSaveTraining} className="bg-white p-6 rounded-xl shadow-sm border border-parish-200 space-y-4">
           <h3 className="font-bold text-parish-900">{editingTraining ? 'Editar Treinamento' : 'Novo Treinamento'}</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-parish-900 mb-1">Data da Formação</label>
                <input 
                  type="date"
                  required 
                  className="w-full p-2 border border-parish-200 rounded" 
                  value={trainingForm.date || ''} 
                  onChange={e => setTrainingForm({...trainingForm, date: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-parish-900 mb-1">Comunidade</label>
                <select 
                  required 
                  className="w-full p-2 border border-parish-200 rounded" 
                  value={trainingForm.communityId || ''} 
                  onChange={e => setTrainingForm({...trainingForm, communityId: e.target.value})}
                >
                  <option value="">Selecione a Comunidade</option>
                  {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
           </div>
           
           <div>
             <label className="block font-bold text-parish-900 mb-2">Membros Participantes</label>
             <div className="border border-parish-200 rounded-lg max-h-60 overflow-y-auto p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-parish-50">
               {members.filter(m => m.status === MemberStatus.ACTIVE).map(member => (
                 <label key={member.id} className="flex items-center gap-2 p-2 bg-white rounded border border-parish-100 hover:bg-parish-50 cursor-pointer">
                   <input 
                    type="checkbox" 
                    checked={trainingForm.memberIds?.includes(member.id)}
                    onChange={() => setTrainingForm({
                      ...trainingForm, 
                      memberIds: toggleSelection(trainingForm.memberIds || [], member.id)
                    })}
                   />
                   <div className="flex flex-col">
                     <span className={`font-bold text-sm ${member.isActive !== false ? 'text-parish-900' : 'text-gray-400'}`}>
                        {member.name}
                     </span>
                     <span className="text-[10px] text-parish-600">{communities.find(c => c.id === member.communityId)?.name}</span>
                   </div>
                 </label>
               ))}
             </div>
           </div>

           <div className="flex gap-2">
             {editingTraining && (
               <button type="button" onClick={resetTrainingForm} className="w-1/3 bg-parish-200 text-parish-900 py-2 rounded-lg font-bold">Cancelar</button>
             )}
             <button type="submit" className="flex-1 bg-parish-900 text-white py-2 rounded-lg font-bold hover:bg-parish-800">
               {editingTraining ? 'Atualizar' : 'Agendar Treinamento'}
             </button>
           </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {soundTrainings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(training => (
          <div key={training.id} className="bg-white p-5 rounded-xl shadow-sm border border-parish-200 flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-start mb-2">
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-parish-600 uppercase tracking-wide bg-parish-100 px-2 py-0.5 rounded-md self-start mb-1 flex items-center gap-1">
                     <Calendar size={10} />
                     {new Date(training.date).toLocaleDateString('pt-BR')}
                   </span>
                   <h3 className="font-bold text-parish-900 text-lg leading-tight">
                     {communities.find(c => c.id === training.communityId)?.name || 'Local Indefinido'}
                   </h3>
                 </div>
                 
                 <div className="flex gap-1">
                    <button onClick={() => { setEditingTraining(training); setTrainingForm({...training}); setShowTrainingForm(true); }} className="p-1.5 text-parish-600 hover:bg-parish-50 rounded"><Edit2 size={16} /></button>
                    <button onClick={() => handleDeleteTraining(training)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                 </div>
              </div>
              
              <div className="space-y-2 mt-4 pt-2 border-t border-parish-100">
                 <p className="text-xs font-bold text-parish-400 uppercase tracking-wider">Participantes ({training.memberIds.length})</p>
                 <div className="flex flex-wrap gap-1">
                   {training.memberIds.map(mid => {
                     const mem = members.find(m => m.id === mid);
                     return mem ? (
                       <span key={mid} className="text-xs bg-parish-100 text-parish-800 px-2 py-1 rounded-full border border-parish-200">
                         {mem.name.split(' ')[0]}
                       </span>
                     ) : null;
                   })}
                 </div>
              </div>
            </div>
          </div>
        ))}
        {soundTrainings.length === 0 && (
          <div className="col-span-full text-center py-12 text-parish-400 italic">
            Nenhum treinamento agendado.
          </div>
        )}
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-parish-900 flex items-center gap-2"><Users2 /> Gestão de Equipes</h2>
        <button onClick={() => { resetTeamForm(); setShowTeamForm(!showTeamForm); }} className="bg-parish-900 text-white p-2 rounded-full shadow-lg hover:bg-parish-800 transition">
          {showTeamForm ? <XCircle size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {showTeamForm && (
        <form onSubmit={handleSaveTeam} className="bg-white p-6 rounded-xl shadow-sm border border-parish-200 space-y-4">
           <h3 className="font-bold text-parish-900">{editingTeam ? 'Editar Equipe' : 'Nova Equipe'}</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                required 
                placeholder="Nome da Equipe" 
                className="p-2 border border-parish-200 rounded" 
                value={teamForm.name || ''} 
                onChange={e => setTeamForm({...teamForm, name: e.target.value})} 
              />
              <select 
                required 
                className="p-2 border border-parish-200 rounded" 
                value={teamForm.communityId || ''} 
                onChange={e => setTeamForm({...teamForm, communityId: e.target.value})}
              >
                <option value="">Selecione a Comunidade Sede</option>
                {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
           
           <div>
             <label className="block font-bold text-parish-900 mb-2">Membros da Equipe</label>
             <div className="border border-parish-200 rounded-lg max-h-60 overflow-y-auto p-2 grid grid-cols-1 md:grid-cols-2 gap-2 bg-parish-50">
               {members.filter(m => m.status === MemberStatus.ACTIVE).map(member => (
                 <label key={member.id} className="flex items-center gap-2 p-2 bg-white rounded border border-parish-100 hover:bg-parish-50 cursor-pointer">
                   <input 
                    type="checkbox" 
                    checked={teamForm.memberIds?.includes(member.id)}
                    onChange={() => setTeamForm({
                      ...teamForm, 
                      memberIds: toggleSelection(teamForm.memberIds || [], member.id)
                    })}
                   />
                   <div className="flex flex-col">
                     <span className={`font-bold text-sm ${member.isActive !== false ? 'text-parish-900' : 'text-gray-400'}`}>
                        {member.name} {!member.isActive && '(Inativo)'}
                     </span>
                     <span className="text-xs text-parish-600">{member.role} • {communities.find(c => c.id === member.communityId)?.name}</span>
                   </div>
                 </label>
               ))}
             </div>
           </div>

           <div className="flex gap-2">
             {editingTeam && (
               <button type="button" onClick={resetTeamForm} className="w-1/3 bg-parish-200 text-parish-900 py-2 rounded-lg font-bold">Cancelar</button>
             )}
             <button type="submit" className="flex-1 bg-parish-900 text-white py-2 rounded-lg font-bold hover:bg-parish-800">
               {editingTeam ? 'Atualizar Equipe' : 'Salvar Equipe'}
             </button>
           </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-white p-5 rounded-xl shadow-sm border border-parish-200 flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-parish-900 text-lg">{team.name}</h3>
                 {currentUser?.isAdmin && (
                   <div className="flex gap-1">
                      <button onClick={() => { setEditingTeam(team); setTeamForm({...team}); setShowTeamForm(true); }} className="p-1.5 text-parish-600 hover:bg-parish-50 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteTeam(team)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                   </div>
                 )}
              </div>
              <p className="text-xs font-bold text-parish-600 uppercase mb-4 flex items-center gap-1">
                <MapPin size={12} /> {communities.find(c => c.id === team.communityId)?.name}
              </p>
              
              <div className="space-y-2">
                 <p className="text-xs font-bold text-parish-400 uppercase tracking-wider">Integrantes ({team.memberIds.length})</p>
                 <div className="flex flex-wrap gap-1">
                   {team.memberIds.map(mid => {
                     const mem = members.find(m => m.id === mid);
                     return mem ? (
                       <span key={mid} className="text-xs bg-parish-100 text-parish-800 px-2 py-1 rounded-full border border-parish-200">
                         {mem.name.split(' ')[0]}
                       </span>
                     ) : null;
                   })}
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMembers = () => {
    const filteredMembers = members.filter(m => {
      const matchesInst = filterInstrument ? m.instruments.includes(filterInstrument as Instrument) : true;
      const matchesPast = filterPastoral ? m.pastoralWorks.includes(filterPastoral as PastoralWork) : true;
      const matchesComm = filterCommunity ? m.communityId === filterCommunity : true;
      const matchesRole = filterRole ? (m.role || Role.MEMBER) === filterRole : true;
      const matchesECC = filterECC === 'yes' 
        ? m.participatedECC === true 
        : filterECC === 'no' 
          ? !m.participatedECC 
          : true;
      
      const matchesActive = filterActive === 'all' 
          ? true 
          : filterActive === 'yes' 
             ? m.isActive !== false 
             : m.isActive === false;
      
      const matchesMarital = filterMaritalStatus ? m.maritalStatus === filterMaritalStatus : true;

      return matchesInst && matchesPast && matchesComm && matchesRole && matchesECC && matchesActive && matchesMarital && m.status === MemberStatus.ACTIVE;
    });

    return (
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-parish-900">Cadastro de Membros</h2>
          <button onClick={() => { resetMemberForm(); setShowMemberForm(!showMemberForm); }} className="bg-parish-900 text-white p-2 rounded-full shadow-lg hover:bg-parish-800 transition">
            {showMemberForm ? <XCircle size={24} /> : <Plus size={24} />}
          </button>
        </div>

        {showMemberForm && (
          <form onSubmit={handleSaveMember} className="bg-white p-6 rounded-xl shadow-sm border border-parish-200 space-y-4 relative">
             <h3 className="font-bold text-parish-900 mb-4">{editingMember ? 'Editar Membro' : 'Novo Membro'}</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Nome Completo" className="p-2 border border-parish-200 rounded" value={memberForm.name || ''} onChange={e => setMemberForm({...memberForm, name: e.target.value})} />
                <input required placeholder="Email" type="email" className="p-2 border border-parish-200 rounded" value={memberForm.email || ''} onChange={e => setMemberForm({...memberForm, email: e.target.value})} />
                
                {/* PHONE INPUT WITH DDI */}
                <div className="flex gap-2">
                  <select 
                    className="p-2 border border-parish-200 rounded bg-parish-50 w-24 text-sm"
                    value={phoneDDI}
                    onChange={(e) => setPhoneDDI(e.target.value)}
                  >
                    {DDI_OPTIONS.map(opt => (
                      <option key={opt.code} value={opt.code}>{opt.flag} {opt.code}</option>
                    ))}
                  </select>
                  <input 
                    required 
                    placeholder="(XX) XXXXX-XXXX" 
                    className="flex-1 p-2 border border-parish-200 rounded" 
                    value={phoneBody} 
                    onChange={handlePhoneBodyChange} 
                  />
                </div>

                <select required className="p-2 border border-parish-200 rounded" value={memberForm.communityId || ''} onChange={e => setMemberForm({...memberForm, communityId: e.target.value})}>
                  <option value="">Selecione a Comunidade</option>
                  {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select required className="p-2 border border-parish-200 rounded" value={memberForm.role || Role.MEMBER} onChange={e => setMemberForm({...memberForm, role: e.target.value as Role})}>
                  {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select required className="p-2 border border-parish-200 rounded" value={memberForm.maritalStatus || ''} onChange={e => setMemberForm({...memberForm, maritalStatus: e.target.value as MaritalStatus})}>
                  <option value="">Estado Civil</option>
                  {Object.values(MaritalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {memberForm.maritalStatus === MaritalStatus.MARRIED && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={memberForm.participatedECC || false} onChange={e => setMemberForm({...memberForm, participatedECC: e.target.checked})} />
                    <label>Participou do ECC?</label>
                  </div>
                )}
             </div>
             
             <div>
               <p className="font-bold mb-2 text-parish-900">Trabalhos Pastorais</p>
               <div className="flex flex-wrap gap-2">
                 {Object.values(PastoralWork).map(pw => (
                   <button type="button" key={pw} onClick={() => setMemberForm({...memberForm, pastoralWorks: toggleSelection(memberForm.pastoralWorks || [], pw)})}
                     className={`text-xs px-2 py-1 rounded-full border ${memberForm.pastoralWorks?.includes(pw) ? 'bg-parish-600 text-white border-parish-600' : 'bg-parish-50 text-parish-600'}`}>
                     {pw}
                   </button>
                 ))}
               </div>
             </div>

             <div>
               <p className="font-bold mb-2 text-parish-900">Instrumentos</p>
               <div className="flex flex-wrap gap-2">
                 {Object.values(Instrument).map(inst => (
                   <button type="button" key={inst} onClick={() => setMemberForm({...memberForm, instruments: toggleSelection(memberForm.instruments || [], inst)})}
                     className={`text-xs px-2 py-1 rounded-full border ${memberForm.instruments?.includes(inst) ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-parish-50 text-parish-600'}`}>
                     {inst}
                   </button>
                 ))}
               </div>
             </div>
             
             {/* Atividade Checkbox */}
             <div className="bg-parish-50 p-3 rounded-lg border border-parish-100">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={memberForm.isActive !== false} // Default to true if undefined
                   onChange={e => setMemberForm({...memberForm, isActive: e.target.checked})}
                   className="w-5 h-5 text-parish-600 rounded focus:ring-parish-500"
                 />
                 <span className="font-bold text-parish-900">Membro em Atividade?</span>
               </label>
               <p className="text-xs text-parish-600 mt-1 pl-7">Desmarque se o membro estiver afastado ou inativo, mas não excluído.</p>
             </div>

             <div className="flex gap-2">
               {editingMember && (
                 <button type="button" onClick={resetMemberForm} className="w-1/3 bg-parish-200 text-parish-900 py-2 rounded-lg font-bold">Cancelar</button>
               )}
               <button type="submit" className="flex-1 bg-parish-900 text-white py-2 rounded-lg font-bold hover:bg-parish-800">
                 {editingMember ? 'Atualizar Membro' : 'Salvar Membro'}
               </button>
             </div>
          </form>
        )}

        <div className="bg-white border border-parish-200 p-4 rounded-lg flex flex-wrap gap-4 items-center">
           <div className="flex items-center gap-2 text-parish-600"><Filter size={18} /> <span className="font-bold text-sm">Filtros:</span></div>
           <select className="p-1 rounded text-sm border-parish-200 bg-parish-50" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
             <option value="yes">Em Atividade (Ativos)</option>
             <option value="no">Inativos/Afastados</option>
             <option value="all">Todos os Status</option>
           </select>
           <select className="p-1 rounded text-sm border-parish-200 bg-parish-50" value={filterInstrument} onChange={e => setFilterInstrument(e.target.value)}>
             <option value="">Todos Instrumentos</option>
             {Object.values(Instrument).map(i => <option key={i} value={i}>{i}</option>)}
           </select>
           <select className="p-1 rounded text-sm border-parish-200 bg-parish-50" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
             <option value="">Todas Funções</option>
             {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
           </select>
           <select className="p-1 rounded text-sm border-parish-200 bg-parish-50" value={filterMaritalStatus} onChange={e => setFilterMaritalStatus(e.target.value)}>
             <option value="">Todo Estado Civil</option>
             {Object.values(MaritalStatus).map(s => <option key={s} value={s}>{s}</option>)}
           </select>
           <select className="p-1 rounded text-sm border-parish-200 bg-parish-50" value={filterECC} onChange={e => setFilterECC(e.target.value)}>
             <option value="">Status ECC</option>
             <option value="yes">Participou</option>
             <option value="no">Não Participou</option>
           </select>
           <select className="p-1 rounded text-sm border-parish-200 bg-parish-50" value={filterPastoral} onChange={e => setFilterPastoral(e.target.value)}>
             <option value="">Todas Pastorais</option>
             {Object.values(PastoralWork).map(p => <option key={p} value={p}>{p}</option>)}
           </select>
           <select className="p-1 rounded text-sm border-parish-200 bg-parish-50" value={filterCommunity} onChange={e => setFilterCommunity(e.target.value)}>
             <option value="">Todas Comunidades</option>
             {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map(m => (
            <MemberCard 
              key={m.id} 
              member={{...m, community: communities.find(c => c.id === m.communityId)?.name}} 
              canEdit={!!currentUser?.isAdmin}
              onEdit={handleEditMemberClick}
              onDelete={handleDeleteMemberClick}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderAI = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-parish-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" />
            Assistente Litúrgico (IA)
        </h2>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-parish-200 space-y-4">
            <div>
                <label className="block font-bold text-parish-900 mb-1">Celebração</label>
                <input 
                    className="w-full p-2 border border-parish-200 rounded" 
                    placeholder="Ex: Missa de Domingo, Casamento, Adoração"
                    value={liturgyInput}
                    onChange={e => setLiturgyInput(e.target.value)}
                />
            </div>
            <div>
                <label className="block font-bold text-parish-900 mb-1">Foco Litúrgico / Tempo</label>
                <input 
                    className="w-full p-2 border border-parish-200 rounded" 
                    placeholder="Ex: Tempo Comum, Advento, Esperança, Alegria"
                    value={focusInput}
                    onChange={e => setFocusInput(e.target.value)}
                />
            </div>
            <button 
                onClick={handleAiSuggestion} 
                disabled={aiLoading}
                className="w-full bg-parish-900 text-white py-3 rounded-lg font-bold hover:bg-parish-800 flex justify-center items-center gap-2"
            >
                {aiLoading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Gerar Sugestões</>}
            </button>
        </div>

        {suggestions.length > 0 && (
            <div className="space-y-4">
                <h3 className="font-bold text-parish-900 text-lg">Sugestões Geradas</h3>
                {suggestions.map((s, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-parish-200 shadow-sm flex flex-col gap-1">
                         <div className="flex justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-parish-600 bg-parish-50 px-2 py-1 rounded self-start">{s.part}</span>
                         </div>
                         <h4 className="font-bold text-parish-900 text-lg">{s.title}</h4>
                         <p className="text-sm text-parish-600 italic">{s.artist}</p>
                         <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">{s.reasoning}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-parish-900 flex items-center gap-2"><Lock /> Gestão de Usuários</h2>
        
        <form onSubmit={handleSaveUser} className="bg-white p-6 rounded-xl shadow-sm border border-parish-200 space-y-4">
            <h3 className="font-bold text-parish-900">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input 
                   required 
                   placeholder="Email (Login)" 
                   type="email" 
                   disabled={!!editingUser}
                   className={`p-2 border border-parish-200 rounded ${editingUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                   value={newUser.username || ''} 
                   onChange={e => setNewUser({...newUser, username: e.target.value})} 
                 />
                 
                 {/* Hide password field during editing for simplicity as we can't easily update auth password for others */}
                 {!editingUser && (
                   <input 
                     required 
                     placeholder="Senha Inicial" 
                     className="p-2 border border-parish-200 rounded" 
                     value={newUser.password || ''} 
                     onChange={e => setNewUser({...newUser, password: e.target.value})} 
                   />
                 )}
                 
                 <input required placeholder="Nome do Responsável" className="p-2 border border-parish-200 rounded" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                 <select required className="p-2 border border-parish-200 rounded" value={newUser.communityId || ''} onChange={e => setNewUser({...newUser, communityId: e.target.value})}>
                     <option value="">Comunidade Principal</option>
                     {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
            </div>
            <div className="flex gap-4 items-center">
                 <label className="flex items-center gap-2">
                     <input type="checkbox" checked={newUser.isAdmin || false} onChange={e => setNewUser({...newUser, isAdmin: e.target.checked})} />
                     <span className="text-sm">Administrador?</span>
                 </label>
            </div>
            
            <div className="flex gap-2">
              {editingUser && (
                <button type="button" onClick={resetUserForm} className="w-1/3 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold">Cancelar</button>
              )}
              <button disabled={creatingUser} type="submit" className="flex-1 bg-parish-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-parish-800 flex justify-center items-center gap-2">
                  {creatingUser ? <Loader2 className="animate-spin" /> : (editingUser ? <Save size={18} /> : <UserPlus size={18} />)} 
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
            </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.filter(u => u.status === UserStatus.ACTIVE).map(u => (
                <div key={u.id} className="bg-white p-5 rounded-xl shadow-sm border border-parish-200 flex justify-between items-center group">
                     <div>
                         <h3 className="font-bold text-parish-900">{u.name}</h3>
                         <p className="text-sm text-parish-600">{u.username}</p>
                         <div className="flex gap-2 mt-1">
                             {u.isAdmin && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">ADMIN</span>}
                             {u.isMaster && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">MASTER</span>}
                         </div>
                     </div>
                     {!u.isMaster && (
                       <div className="flex gap-2">
                         <button onClick={() => handleEditUserClick(u)} className="p-2 text-parish-600 hover:bg-parish-50 rounded"><Edit2 size={18} /></button>
                         <button onClick={() => handleDeleteUserRequest(u)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                       </div>
                     )}
                </div>
            ))}
        </div>
    </div>
  );

  const renderCommunities = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-parish-900 flex items-center gap-2"><MapPin /> Comunidades</h2>
        
        <form onSubmit={handleSaveCommunity} className="bg-white p-6 rounded-xl shadow-sm border border-parish-200 space-y-4">
            <h3 className="font-bold text-parish-900">{editingCommunity ? 'Editar' : 'Nova'} Comunidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input required placeholder="Nome da Comunidade" className="p-2 border border-parish-200 rounded" value={newCommunity.name || ''} onChange={e => setNewCommunity({...newCommunity, name: e.target.value})} />
                 <input required placeholder="Endereço / Local" className="p-2 border border-parish-200 rounded" value={newCommunity.address || ''} onChange={e => setNewCommunity({...newCommunity, address: e.target.value})} />
                 <input required placeholder="ID (Slug)" disabled={!!editingCommunity} className="p-2 border border-parish-200 rounded bg-gray-50" value={editingCommunity ? editingCommunity.id : newCommunity.id || ''} onChange={e => setNewCommunity({...newCommunity, id: e.target.value})} />
                 
                 <div className="flex gap-2">
                     <button type="button" onClick={getCurrentLocation} disabled={gettingLoc} className="bg-parish-100 text-parish-600 px-3 rounded border border-parish-200 hover:bg-parish-200">
                         {gettingLoc ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                     </button>
                     <div className="flex-1 flex gap-2">
                        <input placeholder="Lat" type="number" step="any" className="w-1/2 p-2 border border-parish-200 rounded" value={newCommunity.geo?.lat || ''} onChange={e => setNewCommunity({...newCommunity, geo: {...newCommunity.geo, lat: parseFloat(e.target.value) || 0, lng: newCommunity.geo?.lng || 0}})} />
                        <input placeholder="Lng" type="number" step="any" className="w-1/2 p-2 border border-parish-200 rounded" value={newCommunity.geo?.lng || ''} onChange={e => setNewCommunity({...newCommunity, geo: {...newCommunity.geo, lng: parseFloat(e.target.value) || 0, lat: newCommunity.geo?.lat || 0}})} />
                     </div>
                 </div>
            </div>
            <div className="flex gap-2">
                {editingCommunity && <button type="button" onClick={() => { setEditingCommunity(null); setNewCommunity({}); }} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold">Cancelar</button>}
                <button type="submit" className="bg-parish-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-parish-800 flex items-center gap-2"><Save size={18} /> Salvar</button>
            </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map(c => (
                <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-parish-200 relative group">
                     <h3 className="font-bold text-parish-900">{c.name}</h3>
                     <p className="text-sm text-parish-600">{c.address}</p>
                     <p className="text-xs text-gray-400 mt-1 font-mono">{c.id}</p>
                     <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEditCommunityClick(c)} className="p-1.5 bg-white text-parish-600 border border-parish-200 rounded shadow-sm hover:bg-parish-50"><Edit2 size={14} /></button>
                         <button onClick={() => handleDeleteCommunityClick(c)} className="p-1.5 bg-white text-red-500 border border-parish-200 rounded shadow-sm hover:bg-red-50"><Trash2 size={14} /></button>
                     </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderMaintenance = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-parish-900 flex items-center gap-2"><AlertTriangle className="text-amber-500" /> Manutenção</h2>
        
        <div className="flex gap-4 border-b border-parish-200">
            <button onClick={() => setMaintenanceTab('users')} className={`pb-2 px-4 font-bold ${maintenanceTab === 'users' ? 'border-b-2 border-parish-600 text-parish-900' : 'text-gray-400'}`}>Usuários Excluídos</button>
            <button onClick={() => setMaintenanceTab('members')} className={`pb-2 px-4 font-bold ${maintenanceTab === 'members' ? 'border-b-2 border-parish-600 text-parish-900' : 'text-gray-400'}`}>Membros Excluídos</button>
        </div>

        {maintenanceTab === 'users' && (
            <div className="space-y-2">
                {users.filter(u => u.status === UserStatus.PENDING_DELETION).map(u => (
                    <div key={u.id} className="bg-red-50 border border-red-200 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-red-900">{u.name}</p>
                            <p className="text-sm text-red-700">{u.username}</p>
                        </div>
                        <button onClick={() => handleRestoreUser(u.id)} className="px-3 py-1 bg-white border border-red-200 text-red-700 rounded shadow-sm hover:bg-red-100 font-bold text-sm">Restaurar</button>
                    </div>
                ))}
                {users.filter(u => u.status === UserStatus.PENDING_DELETION).length === 0 && <p className="text-gray-500 italic">Nenhum usuário na lixeira.</p>}
            </div>
        )}

         {maintenanceTab === 'members' && (
            <div className="space-y-2">
                {members.filter(m => m.status === MemberStatus.PENDING_DELETION).map(m => (
                    <div key={m.id} className="bg-red-50 border border-red-200 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-red-900">{m.name}</p>
                            <p className="text-sm text-red-700">{m.email}</p>
                        </div>
                        <button onClick={() => handleRestoreMember(m.id)} className="px-3 py-1 bg-white border border-red-200 text-red-700 rounded shadow-sm hover:bg-red-100 font-bold text-sm">Restaurar</button>
                    </div>
                ))}
                {members.filter(m => m.status === MemberStatus.PENDING_DELETION).length === 0 && <p className="text-gray-500 italic">Nenhum membro na lixeira.</p>}
            </div>
        )}
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} onSeed={handleSeedDatabase} showSeed={true} />;
  }

  return (
    <div className="flex min-h-screen bg-parish-50 font-sans text-parish-900">
       <Navigation 
          currentView={currentView} 
          setView={setView} 
          currentUser={currentUser} 
          currentModule={currentModule}
          setModule={setCurrentModule}
          onLogout={handleLogout}
          onProfileClick={() => setShowPasswordModal(true)}
       />

       <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto animate-fade-in">
             {currentView === 'dashboard' && renderDashboard()}
             {currentView === 'members' && renderMembers()}
             {currentView === 'teams' && renderTeams()}
             {currentView === 'sound_training' && renderSoundTraining()}
             {currentView === 'ai' && renderAI()}
             {currentView === 'users' && renderUsers()}
             {currentView === 'communities' && renderCommunities()}
             {currentView === 'maintenance' && renderMaintenance()}
          </div>
       </main>

       {/* Password Modal */}
       {showPasswordModal && (
         <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
               <h3 className="font-bold text-lg mb-4">Alterar Senha</h3>
               <input 
                 type="password" 
                 placeholder="Nova Senha" 
                 required 
                 minLength={6}
                 className="w-full p-3 border border-gray-200 rounded-lg mb-4"
                 value={newPassword}
                 onChange={e => setNewPassword(e.target.value)}
               />
               <div className="flex gap-2">
                 <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium">Cancelar</button>
                 <button type="submit" disabled={changingPassword} className="flex-1 py-2 bg-parish-900 text-white rounded-lg font-medium">
                   {changingPassword ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar'}
                 </button>
               </div>
            </form>
         </div>
       )}
       
       {/* Confirmation Modal */}
       {confirmation.isOpen && (
         <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full text-center">
               <AlertTriangle className="mx-auto text-amber-500 mb-4" size={40} />
               <p className="font-bold text-lg mb-6">{confirmation.message}</p>
               <div className="flex gap-2">
                 <button onClick={() => setConfirmation({...confirmation, isOpen: false})} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium">Cancelar</button>
                 <button onClick={() => { confirmation.onConfirm(); setConfirmation({...confirmation, isOpen: false}); }} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium">Confirmar</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default App;