export type SupportType = "Cow" | "Goat" | "Food" | "Money" | "School materials";
export type StudentDepartment = "ACC" | "SOD" | "NIT";
export type UserRole = "admin" | "student" | "guest";

export interface Address {
  sector: string;
  cell: string;
  village: string;
}

export interface Student {
  id?: string;
  name: string;
  email: string;
  telephone: string;
  gender: "Male" | "Female";
  department: StudentDepartment;
  level: string;
  startDate: string;
  endDate: string;
  profileImage: string;
  address: Address;
  isGraduated: boolean;
  emailVerified?: boolean;
  documents?: string[];
  createdAt?: any;
}

export interface Family {
  id?: string;
  name: string;
  username: string;
  telephone: string;
  address: Address;
  createdAt?: any;
}

export interface Cow {
  id?: string;
  cowNumber: string;
  dateReceived: string;
  purchaseAmount: number;
  parentCowId: string;
  calves: number;
  value: number;
  medicineExpenses: number;
  otherExpenses: number;
  createdAt?: any;
}

export interface Announcement {
  id?: string;
  title: string;
  description: string;
  images: string[];
  published: boolean;
  createdAt: any;
}

export interface Comment {
  id?: string;
  name: string;
  email: string;
  message: string;
  createdAt: any;
  status: "pending" | "read" | "resolved";
  senderUserId?: string;
  targetUserId?: string; // If null, it's for everyone or admins
  targetRole?: UserRole; // e.g., "admin"
}

export interface Share {
  id?: string;
  userId: string;
  userName: string;
  amount: number; // Minimum 3000
  shareDate: any;
  expiryDate: any; // 3 years after shareDate
  status: "active" | "expired";
  createdAt: any;
}

export interface SupportRecord {
  id?: string;
  beneficiaryName: string;
  telephone: string;
  address: string;
  date: string;
  supportType: SupportType;
  createdAt?: any;
}

export enum Role {
  USER = "user",
  MODEL = "model"
}

export interface Message {
  role: Role;
  content: string;
  timestamp: number;
}
