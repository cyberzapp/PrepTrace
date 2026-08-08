export type AttendanceStatus = 'live' | 'recorded' | 'revision' | 'missed';

export type SubjectCategory = 'core' | 'math' | 'aptitude' | 'elective' | 'general';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  token?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  isBackendConnected: boolean;
  error: string | null;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacher: string;
  totalLectures: number;
  completedLectures: number;
  isActive: boolean;
  category: SubjectCategory;
  color: string;
  targetCompletionDate?: string;
  notes?: string;
  updatedAt?: string;
}

export interface AttendanceLog {
  id: string;
  subjectId: string;
  subjectName: string;
  lectureNumber: number;
  date: string; // ISO String: YYYY-MM-DDTHH:mm:ss.sssZ
  status: AttendanceStatus;
  notes?: string;
}

export interface FocusLog {
  id: string;
  durationMinutes: number;
  date: string; // ISO String
  strictMode: boolean;
  completed: boolean;
}

export interface UserSettings {
  branch: string;
  dailyTargetLectures: number;
  streakCount: number;
  lastLoggedDate: string | null;
  targetExamDate: string; // YYYY-MM-DD format
  onboardingCompleted: boolean;
  points?: number;
  focusBreaksToday?: number;
  updatedAt?: string;
}

export interface PresetSubject {
  name: string;
  code: string;
  teacher: string;
  totalLectures: number;
  category: SubjectCategory;
  color: string;
}

export interface BranchPreset {
  id: string;
  name: string;
  code: string;
  description: string;
  subjects: PresetSubject[];
}

export interface BackupData {
  version: string;
  exportedAt: string;
  subjects: Subject[];
  logs: AttendanceLog[];
  focusLogs: FocusLog[];
  settings: UserSettings;
}