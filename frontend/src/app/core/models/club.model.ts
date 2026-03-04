export interface Club {
  id?: number;
  name: string;
  description: string;
  objective?: string;
  category: ClubCategory;
  maxMembers: number;
  image?: string; // Base64 encoded image
  status?: ClubStatus;
  createdBy?: number;
  creatorName?: string; // Nom du créateur
  currentMembersCount?: number; // Nombre actuel de membres
  reviewedBy?: number;
  reviewComment?: string;
  suspendedBy?: number; // ID du manager qui a suspendu
  suspensionReason?: string; // Raison de la suspension
  suspendedAt?: string; // Date de suspension
  members?: Member[];
  createdAt?: string;
  updatedAt?: string;
  isFull?: boolean;
}

export enum ClubStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum ClubCategory {
  CONVERSATION = 'CONVERSATION',
  BOOK = 'BOOK',
  DRAMA = 'DRAMA',
  WRITING = 'WRITING',
  GRAMMAR = 'GRAMMAR',
  VOCABULARY = 'VOCABULARY',
  READING = 'READING',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
  PRONUNCIATION = 'PRONUNCIATION',
  BUSINESS = 'BUSINESS',
  ACADEMIC = 'ACADEMIC'
}

export interface Member {
  id?: number;
  rank: RankType;
  userId: number;
  userName?: string; // Nom de l'utilisateur
  clubId?: number;
  joinedAt?: string;
  updatedAt?: string;
}

export enum RankType {
  PRESIDENT = 'PRESIDENT',                      // Président(e)
  VICE_PRESIDENT = 'VICE_PRESIDENT',            // Vice-président(e)
  SECRETARY = 'SECRETARY',                      // Secrétaire
  TREASURER = 'TREASURER',                      // Trésorier(ère)
  COMMUNICATION_MANAGER = 'COMMUNICATION_MANAGER', // Responsable Communication
  EVENT_MANAGER = 'EVENT_MANAGER',              // Responsable Événementiel
  PARTNERSHIP_MANAGER = 'PARTNERSHIP_MANAGER',  // Responsable Partenariats / Sponsoring
  MEMBER = 'MEMBER'                             // Membre
}

export interface CreateClubRequest {
  name: string;
  description: string;
  objective?: string;
  category: ClubCategory;
  maxMembers: number;
  image?: string;
  createdBy?: number;
}

export interface UpdateClubRequest {
  name?: string;
  description?: string;
  objective?: string;
  category?: ClubCategory;
  maxMembers?: number;
  image?: string;
}

export interface ApproveClubRequest {
  reviewerId: number;
  comment?: string;
}

export interface JoinClubRequest {
  userId: number;
}
