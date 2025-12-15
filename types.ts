export enum AppModule {
  LITURGY = 'Música Litúrgica',
  EDUCATION = 'Formação Musical'
}

export enum UserStatus {
  ACTIVE = 'Ativo',
  PENDING_DELETION = 'Aguardando Exclusão' // For the maintenance queue
}

export interface User {
  id: string;
  username: string; // Unique, case insensitive
  name: string;
  password: string;
  communityId: string; // 'coord' for Manager
  isAdmin: boolean;
  allowedModules: AppModule[];
  status: UserStatus;
  isMaster?: boolean; // True only for 'manager'
}

export interface Community {
  id: string;
  name: string;
  address: string;
  geo?: {
    lat: number;
    lng: number;
  };
}

// Fixed Lists
export enum Role {
  COORDINATOR = 'Coordenador',
  MEMBER = 'Membro'
}

export enum PastoralWork {
  SANTA_MISSA = 'Santa Missa',
  CATEQUESE = 'Catequese',
  LOUVOR_ADORACAO = 'Louvor e Adoração',
  JUVENTUDE = 'Juventude',
  ECC = 'ECC',
  BATISMO = 'Batismo'
}

export enum Instrument {
  BATERIA = 'Bateria',
  CAJON = 'Cajon',
  CONTRA_BAIXO = 'Contra-baixo',
  GUITARRA = 'Guitarra',
  TECLADO_PIANO = 'Teclado/Piano',
  VIOLAO = 'Violão',
  VOZ = 'Voz',
  OUTRO = 'Outro'
}

export enum MaritalStatus {
  SINGLE = 'Solteiro(a)',
  MARRIED = 'Casado(a)',
  DIVORCED = 'Divorciado(a)',
  WIDOWED = 'Viúvo(a)'
}

export enum MemberStatus {
  ACTIVE = 'Ativo',
  PENDING_DELETION = 'Aguardando Exclusão'
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: Role;
  maritalStatus: MaritalStatus;
  participatedECC?: boolean; // Only if married
  pastoralWorks: PastoralWork[];
  instruments: Instrument[];
  otherInstrument?: string; // If 'Outro' is selected
  communityId: string;
  status: MemberStatus;
  isActive: boolean; // New field for "Atividade" checkbox
}

export interface Team {
  id: string;
  name: string;
  communityId: string; // The community this team belongs to (primary)
  memberIds: string[];
}

export interface SoundTraining {
  id: string;
  date: string;
  communityId: string;
  memberIds: string[];
}

// Keeping Liturgy types for the "Liturgy" module logic (AI)
export interface Song {
  id: string;
  title: string;
  artist: string;
  part: string;
}

export interface LiturgyEvent {
  id: string;
  title: string;
  date: string;
  communityId: string;
  songs: Song[];
}

export interface AISongSuggestion {
  part: string;
  title: string;
  artist: string;
  reasoning: string;
}