
import { Event, Role, User, DocumentStatus, PaymentStatus, Belt, RegistrationStatus, Academy } from "./types";

export const MOCK_EVENTS: Event[] = [
  { id: '1', name: 'COPA SOCIAL O FAIXA BRANCA', date: '24 e 25', month: 'JANEIRO', location: 'MIECIMO', registrationLink: 'https://soucompetidor.com.br' },
  { id: '2', name: 'ESTADUAL SOCIAL', date: '28 e 29', month: 'MARÇO', location: 'MIECIMO', registrationLink: 'https://soucompetidor.com.br' },
  { id: '3', name: 'ESTADUAL DAS FAVELAS', date: '25 e 26', month: 'ABRIL', location: 'MIECIMO', registrationLink: 'https://soucompetidor.com.br' },
  { id: '4', name: 'BRASILEIRO SOCIAL', date: '23 e 24', month: 'MAIO', location: 'MIECIMO', registrationLink: 'https://soucompetidor.com.br' },
  { id: '5', name: 'COPA SOCIAL O FAIXA BRANCA', date: '18 e 19', month: 'JULHO', location: 'MIECIMO', registrationLink: 'https://soucompetidor.com.br' },
  { id: '6', name: 'MUNDIAL SOCIAL', date: '19 e 20', month: 'SETEMBRO', location: 'MIECIMO', registrationLink: 'https://soucompetidor.com.br' },
  { id: '7', name: 'SUL AMERICANO SOCIAL', date: '24 e 25', month: 'OUTUBRO', location: 'MIECIMO', registrationLink: 'https://soucompetidor.com.br' },
  { id: '8', name: 'GP OFB 10K', date: '28 e 29', month: 'NOVEMBRO', location: 'MIECIMO', registrationLink: 'https://soucompetidor.com.br' },
];

export const MOCK_ACADEMIES: Academy[] = [
  { id: '1', name: 'Gracie Barra - Centro', ownerId: '101', status: RegistrationStatus.APPROVED, teamName: 'Gracie Barra' },
  { id: '2', name: 'Alliance Jiu Jitsu', ownerId: '102', status: RegistrationStatus.APPROVED, teamName: 'Alliance' },
  { id: '3', name: 'Checkmat', ownerId: '103', status: RegistrationStatus.PENDING, teamName: 'Checkmat' },
  { id: '4', name: 'Nova União', ownerId: '104', status: RegistrationStatus.APPROVED, teamName: 'Nova União' },
];

export const INITIAL_USER: User = {
  id: '1',
  fullName: 'João da Silva',
  email: 'joao@example.com',
  dob: '1990-01-01',
  role: Role.STUDENT,
  isBoardingComplete: false,
  paymentStatus: PaymentStatus.PENDING,
  documents: {
    identity: { status: DocumentStatus.MISSING },
    medical: { status: DocumentStatus.MISSING }
  }
};

export const BRAZIL_STATES = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
];

// Mock Students for Professor View
export const MOCK_STUDENTS_DATA: User[] = [
    { 
        id: '101', 
        fullName: 'Carlos Oliveira', 
        email: 'carlos@email.com',
        dob: '1995-05-20',
        role: Role.STUDENT,
        isBoardingComplete: true,
        paymentStatus: PaymentStatus.PENDING,
        cpf: '123.456.789-00',
        athleteData: { belt: Belt.WHITE }, 
        academy: { name: 'Gracie Barra', isOwner: false, status: RegistrationStatus.PENDING },
        documents: {
            identity: { status: DocumentStatus.PENDING, url: 'doc-url' },
            medical: { status: DocumentStatus.PENDING, url: 'doc-url' }
        }
    },
    { 
        id: '102', 
        fullName: 'Ana Souza', 
        email: 'ana@email.com',
        dob: '1998-12-10',
        role: Role.STUDENT, 
        isBoardingComplete: true,
        paymentStatus: PaymentStatus.PAID,
        cpf: '987.654.321-11',
        athleteData: { belt: Belt.BLUE, blueBeltDate: '2025-01-10' }, 
        academy: { name: 'Alliance', isOwner: false, status: RegistrationStatus.APPROVED },
        documents: {
            identity: { status: DocumentStatus.APPROVED, url: 'doc-url' },
            medical: { status: DocumentStatus.APPROVED, url: 'med-url' }
        }
    },
    { 
        id: '103', 
        fullName: 'Marcos Silva', 
        email: 'marcos@email.com',
        dob: '2000-02-15',
        role: Role.STUDENT, 
        isBoardingComplete: true,
        paymentStatus: PaymentStatus.PAID,
        cpf: '456.789.123-22',
        athleteData: { belt: Belt.WHITE }, 
        academy: { name: 'Checkmat', isOwner: false, status: RegistrationStatus.PENDING },
        documents: {
            identity: { status: DocumentStatus.REJECTED, rejectionReason: 'Foto ilegível', url: 'doc-url' },
            medical: { status: DocumentStatus.PENDING, url: 'med-url' }
        }
    },
];