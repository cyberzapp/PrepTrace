import { Subject, AttendanceLog, UserSettings, UserProfile, FocusLog } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL_STORAGE_KEY = '@preptrace_api_base_url';

// Default backend URL (change localhost to local IP for physical device testing if needed)
let API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.29.138:5000/api';

export const getApiBaseUrl = () => API_BASE_URL;

export const setApiBaseUrl = async (url: string) => {
  API_BASE_URL = url.endsWith('/') ? url.slice(0, -1) : url;
  await AsyncStorage.setItem(API_URL_STORAGE_KEY, API_BASE_URL);
};

export const initApiConfig = async () => {
  const savedUrl = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
  if (savedUrl) {
    API_BASE_URL = savedUrl;
  }
};

const getHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiService = {
  // Check backend server health
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Authenticate Google Token with Express Server
  async authenticateGoogleToken(idToken: string, userProfile?: any): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ idToken, userProfile }),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('AUTH_EXPIRED');
      const err = await res.json().catch(() => ({ error: 'Authentication failed' }));
      throw new Error(err.error || 'Backend Google Authentication failed');
    }
    return res.json();
  },

  // Fetch all user subjects from Firestore
  async fetchSubjects(token: string): Promise<Subject[]> {
    const res = await fetch(`${API_BASE_URL}/subjects`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('AUTH_EXPIRED');
      throw new Error('Failed to fetch subjects from backend');
    }
    const data = await res.json();
    return data.subjects || [];
  },

  // Save subject to Firestore
  async saveSubject(subject: Partial<Subject>, token: string): Promise<Subject> {
    const res = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(subject),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('AUTH_EXPIRED');
      throw new Error('Failed to save subject to backend');
    }
    const data = await res.json();
    return data.subject;
  },

  // Delete subject from Firestore
  async deleteSubject(id: string, token: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok && (res.status === 401 || res.status === 403)) throw new Error('AUTH_EXPIRED');
    return res.ok;
  },

  // Fetch all attendance logs from Firestore
  async fetchLogs(token: string): Promise<AttendanceLog[]> {
    const res = await fetch(`${API_BASE_URL}/logs`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('AUTH_EXPIRED');
      throw new Error('Failed to fetch logs from backend');
    }
    const data = await res.json();
    return data.logs || [];
  },

  // Save attendance log to Firestore
  async saveLog(log: Partial<AttendanceLog>, token: string): Promise<AttendanceLog> {
    const res = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(log),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('AUTH_EXPIRED');
      throw new Error('Failed to save attendance log to backend');
    }
    const data = await res.json();
    return data.log;
  },

  // Delete attendance log from Firestore
  async deleteLog(id: string, token: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/logs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok && (res.status === 401 || res.status === 403)) throw new Error('AUTH_EXPIRED');
    return res.ok;
  },

  // Fetch settings from Firestore
  async fetchSettings(token: string): Promise<UserSettings> {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('AUTH_EXPIRED');
      throw new Error('Failed to fetch settings from backend');
    }
    const data = await res.json();
    return data.settings;
  },

  // Update settings in Firestore
  async updateSettings(settings: Partial<UserSettings>, token: string): Promise<UserSettings> {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('AUTH_EXPIRED');
      throw new Error('Failed to update settings in backend');
    }
    const data = await res.json();
    return data.settings;
  },

  // Batch sync offline app data to Firestore
  async syncAllData(
    payload: { subjects: Subject[]; logs: AttendanceLog[]; focusLogs: FocusLog[]; settings: UserSettings; reset?: boolean },
    token: string
  ): Promise<{ subjects: Subject[]; logs: AttendanceLog[]; focusLogs: FocusLog[]; settings: UserSettings }> {
    const res = await fetch(`${API_BASE_URL}/sync`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('AUTH_EXPIRED');
      throw new Error('Failed to sync data with backend');
    }
    const data = await res.json();
    return {
      subjects: data.subjects || [],
      logs: data.logs || [],
      focusLogs: data.focusLogs || [],
      settings: data.settings,
    };
  },
};
