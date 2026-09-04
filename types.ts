export enum Role {
  STUDENT = 'STUDENT',
  PROFESSOR = 'PROFESSOR',
  GESTOR = 'GESTOR',
  ADMIN = 'ADMIN'
}

export enum Belt {
  WHITE = 'Branca',
  GREY = 'Cinza',
  YELLOW = 'Amarela',
  ORANGE = 'Laranja',
  GREEN = 'Verde',
  BLUE = 'Azul',
  PURPLE = 'Roxa',
  BROWN = 'Marrom',
  BLACK = 'Preta',
  BLACK_1 = 'Preta 1º Grau',
  BLACK_2 = 'Preta 2º Grau',
  BLACK_3 = 'Preta 3º Grau',
  BLACK_4 = 'Preta 4º Grau',
  BLACK_5 = 'Preta 5º Grau',
  BLACK_6 = 'Preta 6º Grau',
  RED_BLACK = 'Vermelha e Preta',
  RED_WHITE = 'Vermelha e Branca',
  RED = 'Vermelha'
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum CertificatePaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum CertificateDeliveryStatus {
  WAITING_PAYMENT = 'WAITING_PAYMENT',
  PRODUCING = 'PRODUCING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum DocumentStatus {
  MISSING = 'MISSING',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export enum AnnualMembershipType {
  INITIAL = 'INITIAL',
  RENEWAL = 'RENEWAL'
}

export enum AnnualMembershipStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum AnnualMembershipPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXEMPT = 'EXEMPT',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum AnnualMembershipTransactionType {
  INITIAL = 'INITIAL',
  RENEWAL = 'RENEWAL',
  MANUAL = 'MANUAL'
}

export enum AnnualMembershipTransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED'
}

export type AnnualMembershipOwner =
  | { profileId: string; dependentId: null }
  | { profileId: null; dependentId: string };

export type AnnualMembership = AnnualMembershipOwner & {
  id: string;
  membershipPeriod: number;
  membershipType: AnnualMembershipType;
  status: AnnualMembershipStatus;
  paymentStatus: AnnualMembershipPaymentStatus;
  validFrom: string | null;
  validUntil: string | null;
  activatedAt: string | null;
  exemptionReason: string | null;
  exemptionGrantedBy: string | null;
  exemptionGrantedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface AnnualMembershipSnapshot {
  id: string;
  membershipId: string;
  revision: number;
  fullName: string;
  photoPath: string | null;
  federationId: number | null;
  dateOfBirth: string | null;
  belt: string | null;
  academyName: string | null;
  responsibleName: string | null;
  validFrom: string | null;
  validUntil: string | null;
  issuedAt: string;
  snapshotData: Record<string, unknown>;
}

export interface AnnualMembershipTransaction {
  id: string;
  membershipId: string;
  transactionType: AnnualMembershipTransactionType;
  provider: string;
  externalId: string | null;
  idempotencyKey: string | null;
  status: AnnualMembershipTransactionStatus;
  amountCents: number;
  plan: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export interface UserDocument {
  url?: string;
  status: DocumentStatus;
  rejectionReason?: string;
  lastUpdated?: string;
}

export interface ProfileChangeRequest {
  id: string;
  userId: string;
  fieldGroup: 'BELT' | 'PERSONAL';
  oldData: any;
  newData: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AcademyChangeRequest {
  id: string;
  academyId: string;
  oldData: any;
  newData: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Dependent {
  id: string;
  parentId: string;
  fullName: string;
  dob: string;
  gender?: string;
  cpf?: string;
  phone?: string; 
  nationality?: string;
  address?: {
    zip: string;
    street: string;
    city: string;
    state: string;
    number: string;
    complement?: string;
  };
  federationId?: number;
  belt: Belt;
  profileImageUrl?: string;
  academyId?: string;
  academyStatus: RegistrationStatus;
  paymentStatus: PaymentStatus;
  paymentConfirmedAt?: string;
  isFederationApproved: boolean;
  isIdCardPrinted?: boolean;
  documents: {
    identity: UserDocument;
    medical: UserDocument;
    belt: UserDocument;
    profile?: UserDocument;
  };
  created_at?: string;
}

export interface User {
  id: string;
  federationId?: number;
  fullName: string;
  email: string;
  dob: string;
  role: Role;
  isBoardingComplete: boolean;
  profileImage?: string;
  registrationDate?: string; 
  paymentConfirmedAt?: string;
  isFederationApproved?: boolean;
  isIdCardPrinted?: boolean;
  
  nationality?: string;
  cpf?: string;
  phone?: string; 
  cnpj?: string;
  gender?: string;
  paymentStatus: PaymentStatus;
  paymentPlan?: 'DIGITAL' | 'PRINTED';
  theme?: 'light' | 'dark';
  
  isDependent?: boolean;
  parentName?: string;

  address?: {
    zip: string;
    street: string;
    city: string;
    state: string;
    number: string;
    complement?: string;
  };
  
  athleteData?: {
    belt: Belt;
    [key: string]: any; 
  };
  
  documents: {
    identity: UserDocument;
    medical?: UserDocument;
    profile?: UserDocument;
    belt?: UserDocument;
  };

  // ID da academia para facilitar edições
  academyId?: string;
  academy?: {
    isOwner: boolean;
    name: string;
    federationId?: string;
    phone?: string;
    address?: string;
    status: RegistrationStatus;
  };

  ownedAcademies?: {
    id: string;
    name: string;
    status: RegistrationStatus;
  }[];

  pendingRequests?: ProfileChangeRequest[];
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  month: string;
  category?: string;
  imageUrl?: string;
  registrationLink?: string;
  startDate?: string;
}

export interface Academy {
  id: string;
  name: string;
  teamName?: string;
  ownerId: string;
  ownerName?: string;
  cnpj?: string;
  federationId?: string;

  responsibleCpf?: string;
  phone?: string;
  address?: {
    zip: string;
    street: string;
    city: string;
    state: string;
    number: string;
    complement?: string;
  };
  blackBeltCertificate?: UserDocument;
  identityDocument?: UserDocument;
  status: RegistrationStatus;
  deleted?: string;
  pendingChangeRequest?: AcademyChangeRequest;
}

export interface AcademyCertificate {
  id: string;
  academyId: string;
  ownerId: string;
  amount: number;
  statusPayment: CertificatePaymentStatus;
  statusDelivery: CertificateDeliveryStatus;
  billingId?: string;
  phone?: string;
  createdAt: string;
  paidAt?: string;
  academy?: Academy;
  owner?: {
    fullName: string;
  };
}
