import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { Subject, AttendanceLog, UserSettings, AttendanceStatus, BackupData, SyncStatus, FocusLog } from '../types';
import { BRANCH_PRESETS } from '../constants/presets';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

interface AppContextType {
  subjects: Subject[];
  logs: AttendanceLog[];
  focusLogs: FocusLog[];
  settings: UserSettings;
  isLoading: boolean;
  syncStatus: SyncStatus;
  
  // Actions
  quickLogAttendance: (subjectId: string) => Promise<void>;
  logAttendance: (
    subjectId: string,
    status: AttendanceStatus,
    notes?: string,
    customLectNum?: number
  ) => Promise<void>;
  addFocusLog: (log: Omit<FocusLog, 'id'>) => Promise<void>;
  
  toggleSubjectActive: (subjectId: string) => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id' | 'completedLectures'>) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  
  loadBranchPreset: (presetId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  
  syncWithCloud: () => Promise<boolean>;
  exportData: () => Promise<void>;
  importData: (jsonContent: string) => Promise<boolean>;
  resetAllData: () => Promise<void>;
}

const STORAGE_KEYS = {
  SUBJECTS: '@preptrace_subjects_v2',
  LOGS: '@preptrace_logs_v2',
  FOCUS_LOGS: '@preptrace_focus_logs_v1',
  SETTINGS: '@preptrace_settings_v2',
};

const DEFAULT_SETTINGS: UserSettings = {
  branch: 'CS',
  dailyTargetLectures: 4,
  streakCount: 0,
  lastLoggedDate: null,
  targetExamDate: '2027-02-06',
  onboardingCompleted: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated, refreshAuthToken, signOut } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncedAt: null,
    isBackendConnected: false,
    error: null,
  });

  // Initial Load from AsyncStorage
  useEffect(() => {
    loadInitialData();
  }, []);

  // When user logs in or auth state changes, perform Firestore cloud sync
  useEffect(() => {
    if (isAuthenticated && token) {
      syncWithCloud();
    }
  }, [isAuthenticated, token]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [savedSubjects, savedLogs, savedSettings, savedFocusLogs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SUBJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.FOCUS_LOGS),
      ]);

      let initialSubs: Subject[] = [];
      if (savedSubjects) {
        initialSubs = JSON.parse(savedSubjects);
      } else {
        // Load default CS preset if first launch
        const csPreset = BRANCH_PRESETS.find((p) => p.id === 'cs');
        if (csPreset) {
          initialSubs = csPreset.subjects.map((sub, idx) => ({
            ...sub,
            id: `subj_init_${idx}_${Date.now()}`,
            completedLectures: 0,
            isActive: idx < 4,
          }));
          await AsyncStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(initialSubs));
        }
      }
      setSubjects(initialSubs);

      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }

      if (savedFocusLogs) {
        setFocusLogs(JSON.parse(savedFocusLogs));
      }

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      // Check Express backend connectivity
      const isConnected = await apiService.checkHealth();
      setSyncStatus((prev) => ({ ...prev, isBackendConnected: isConnected }));
    } catch (error) {
      console.error('Error loading data from AsyncStorage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cloud Firestore Sync Operation
  const syncWithCloud = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

      const isConnected = await apiService.checkHealth();
      if (!isConnected) {
        setSyncStatus((prev) => ({
          ...prev,
          isSyncing: false,
          isBackendConnected: false,
          error: 'Express backend unreachable (running offline mode)',
        }));
        return false;
      }

      // Read latest state from AsyncStorage to avoid React stale closure bugs
      const [subsStr, logsStr, focusLogsStr, settingsStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SUBJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.FOCUS_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      const currentSubjects = subsStr ? JSON.parse(subsStr) : subjects;
      const currentLogs = logsStr ? JSON.parse(logsStr) : logs;
      const currentFocusLogs = focusLogsStr ? JSON.parse(focusLogsStr) : focusLogs;
      const currentSettings = settingsStr ? JSON.parse(settingsStr) : settings;

      const synced = await apiService.syncAllData(
        { subjects: currentSubjects, logs: currentLogs, focusLogs: currentFocusLogs, settings: currentSettings },
        token
      );

      if (synced.subjects && synced.subjects.length > 0) {
        setSubjects(synced.subjects);
        await AsyncStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(synced.subjects));
      }

      if (synced.logs) {
        setLogs(synced.logs);
        await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(synced.logs));
      }

      if (synced.focusLogs) {
        setFocusLogs(synced.focusLogs);
        await AsyncStorage.setItem(STORAGE_KEYS.FOCUS_LOGS, JSON.stringify(synced.focusLogs));
      }

      if (synced.settings) {
        setSettings(synced.settings);
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(synced.settings));
      }

      const nowIso = new Date().toISOString();
      setSyncStatus({
        isSyncing: false,
        lastSyncedAt: nowIso,
        isBackendConnected: true,
        error: null,
      });

      return true;
    } catch (err: any) {
      if (err.message === 'AUTH_EXPIRED') {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          return await syncWithCloud(); // Retry sync once
        }
        return false;
      }
      
      console.warn('Cloud sync error:', err.message);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err.message || 'Sync failed',
      }));
      return false;
    }
  };

  // Helper to persist subjects
  const saveSubjectsState = async (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    await AsyncStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(newSubjects));
  };

  // Helper to persist logs
  const saveLogsState = async (newLogs: AttendanceLog[]) => {
    setLogs(newLogs);
    await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(newLogs));
  };

  // Helper to persist settings state locally
  const saveSettingsState = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  };

  // Helper to update settings, save locally, update widget, and sync
  const updateSettings = async (newSettingsData: Partial<UserSettings>) => {
    try {
      const newSettings = { ...settings, ...newSettingsData };
      setSettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      
      // Update Android Widget if points changed
      if (Platform.OS === 'android' && ((newSettingsData as any).points !== undefined || (newSettingsData as any).streakCount !== undefined)) {
        try {
          const { requestWidgetUpdate } = require('react-native-android-widget');
          const { WidgetPreview } = require('../widget/WidgetPreview');
          
          requestWidgetUpdate({
            widgetName: 'PrepTraceWidget',
            renderWidget: () => require('react').createElement(WidgetPreview, { 
              points: (newSettings as any).points || 0,
              streakCount: (newSettings as any).streakCount || 0
            }),
          });
        } catch (e) {
          console.log('Failed to update widget', e);
        }
      }

      await syncWithCloud();
    } catch (error: any) {
      if (error.message === 'AUTH_EXPIRED') {
        await refreshAuthToken();
      } else {
        console.error('Failed to update settings:', error);
      }
      throw error;
    }
  };

  const addFocusLog = async (logData: Omit<FocusLog, 'id'>) => {
    const newLog: FocusLog = {
      ...logData,
      id: `flog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    const updated = [newLog, ...focusLogs];
    setFocusLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.FOCUS_LOGS, JSON.stringify(updated));
    // Trigger updateSettings to save points immediately
    if (token) {
      // Async sync
      apiService.syncAllData({ subjects, logs, focusLogs: updated, settings }, token).catch((e) => {
        if (e.message === 'AUTH_EXPIRED') refreshAuthToken();
      });
    }
  };

  // Update Daily Streak
  const updateStreakLogic = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    let newStreak = settings.streakCount;

    if (settings.lastLoggedDate !== todayStr) {
      if (!settings.lastLoggedDate) {
        newStreak = 1;
      } else {
        const lastDate = new Date(settings.lastLoggedDate);
        const today = new Date(todayStr);
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      }

      const updatedSettings: UserSettings = {
        ...settings,
        streakCount: newStreak,
        lastLoggedDate: todayStr,
      };
      await saveSettingsState(updatedSettings);

      if (token) {
        apiService.updateSettings(updatedSettings, token).catch((e) => {
          if (e.message === 'AUTH_EXPIRED') refreshAuthToken();
        });
      }
    }
  };

  // 1-Click Fast Attendance Log
  const quickLogAttendance = async (subjectId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const targetSub = subjects.find((s) => s.id === subjectId);
      if (!targetSub) return;

      const nextLectNum = targetSub.completedLectures + 1;

      const updatedSubjects = subjects.map((sub) =>
        sub.id === subjectId
          ? { ...sub, completedLectures: Math.min(sub.totalLectures, sub.completedLectures + 1) }
          : sub
      );

      const newLog: AttendanceLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        subjectId,
        subjectName: targetSub.name,
        lectureNumber: nextLectNum,
        date: new Date().toISOString(),
        status: 'live',
      };

      const updatedLogs = [newLog, ...logs];

      await Promise.all([
        saveSubjectsState(updatedSubjects),
        saveLogsState(updatedLogs),
        updateStreakLogic(),
      ]);

      // Async Firestore update
      if (token) {
        const updatedTarget = updatedSubjects.find((s) => s.id === subjectId);
        if (updatedTarget) {
          apiService.saveSubject(updatedTarget, token).catch((e) => {
            if (e.message === 'AUTH_EXPIRED') signOut();
          });
        }
        apiService.saveLog(newLog, token).catch((e) => {
          if (e.message === 'AUTH_EXPIRED') signOut();
        });
      }
    } catch (err) {
      console.error('Error during quickLogAttendance:', err);
    }
  };

  // 2-Click Custom Attendance Log
  const logAttendance = async (
    subjectId: string,
    status: AttendanceStatus,
    notes?: string,
    customLectNum?: number
  ) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const targetSub = subjects.find((s) => s.id === subjectId);
      if (!targetSub) return;

      const lectNum = customLectNum ?? (targetSub.completedLectures + 1);

      const updatedSubjects = subjects.map((sub) =>
        sub.id === subjectId
          ? { ...sub, completedLectures: Math.max(sub.completedLectures, lectNum) }
          : sub
      );

      const newLog: AttendanceLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        subjectId,
        subjectName: targetSub.name,
        lectureNumber: lectNum,
        date: new Date().toISOString(),
        status,
        notes,
      };

      const updatedLogs = [newLog, ...logs];

      await Promise.all([
        saveSubjectsState(updatedSubjects),
        saveLogsState(updatedLogs),
        updateStreakLogic(),
      ]);

      if (token) {
        const updatedTarget = updatedSubjects.find((s) => s.id === subjectId);
        if (updatedTarget) {
          apiService.saveSubject(updatedTarget, token).catch((e) => {
            if (e.message === 'AUTH_EXPIRED') signOut();
          });
        }
        apiService.saveLog(newLog, token).catch((e) => {
          if (e.message === 'AUTH_EXPIRED') signOut();
        });
      }
    } catch (err) {
      console.error('Error during logAttendance:', err);
    }
  };

  // Toggle Active/Inactive status
  const toggleSubjectActive = async (subjectId: string) => {
    await Haptics.selectionAsync();
    const updated = subjects.map((s) => (s.id === subjectId ? { ...s, isActive: !s.isActive } : s));
    await saveSubjectsState(updated);

    if (token) {
      const target = updated.find((s) => s.id === subjectId);
      if (target) {
        apiService.saveSubject(target, token).catch((e) => {
          if (e.message === 'AUTH_EXPIRED') refreshAuthToken();
        });
      }
    }
  };

  // Add Custom Subject
  const addSubject = async (subjectData: Omit<Subject, 'id' | 'completedLectures'>) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newSubject: Subject = {
      ...subjectData,
      id: `subj_${Date.now()}`,
      completedLectures: 0,
    };
    await saveSubjectsState([...subjects, newSubject]);

    if (token) {
      apiService.saveSubject(newSubject, token).catch((e) => {
        if (e.message === 'AUTH_EXPIRED') refreshAuthToken();
      });
    }
  };

  // Update Subject
  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const updated = subjects.map((s) => (s.id === id ? { ...s, ...updates } : s));
    await saveSubjectsState(updated);

    if (token) {
      const target = updated.find((s) => s.id === id);
      if (target) {
        apiService.saveSubject(target, token).catch((e) => {
          if (e.message === 'AUTH_EXPIRED') signOut();
        });
      }
    }
  };

  // Delete Subject
  const deleteSubject = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const updated = subjects.filter((s) => s.id !== id);
    const updatedLogs = logs.filter((l) => l.subjectId !== id);
    await Promise.all([saveSubjectsState(updated), saveLogsState(updatedLogs)]);

    if (token) {
      apiService.deleteSubject(id, token).catch((e) => {
        if (e.message === 'AUTH_EXPIRED') refreshAuthToken();
      });
    }
  };

  // Load Preset
  const loadBranchPreset = async (presetId: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const preset = BRANCH_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const presetSubjects: Subject[] = preset.subjects.map((sub, idx) => ({
      ...sub,
      id: `subj_${preset.code.toLowerCase()}_${idx}_${Date.now()}`,
      completedLectures: 0,
      isActive: true,
    }));

    const newSettings = {
      ...settings,
      branch: preset.code,
      onboardingCompleted: true,
    };

    await saveSubjectsState(presetSubjects);
    await updateSettings(newSettings);

    if (token) {
      apiService.syncAllData({ subjects: presetSubjects, logs, focusLogs, settings: newSettings }, token).catch((e) => {
        if (e.message === 'AUTH_EXPIRED') refreshAuthToken();
      });
    }
  };

  // Export Data to File System
  const exportData = async () => {
    try {
      const exportPayload: BackupData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        subjects,
        logs,
        focusLogs,
        settings,
      };

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const baseDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const filePath = `${baseDir}PrepTrace_Backup_${Date.now()}.json`;

      await FileSystem.writeAsStringAsync(filePath, jsonStr);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export PrepTrace Backup',
          UTI: 'public.json',
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Import Data
  const importData = async (jsonContent: string): Promise<boolean> => {
    try {
      const parsed: BackupData = JSON.parse(jsonContent);
      if (parsed.subjects && Array.isArray(parsed.subjects)) {
        await saveSubjectsState(parsed.subjects);
        if (parsed.logs) await saveLogsState(parsed.logs);
        if (parsed.focusLogs) {
          setFocusLogs(parsed.focusLogs);
          await AsyncStorage.setItem(STORAGE_KEYS.FOCUS_LOGS, JSON.stringify(parsed.focusLogs));
        }
        if (parsed.settings) await saveSettingsState(parsed.settings);

        if (token) {
          apiService.syncAllData({ subjects: parsed.subjects, logs: parsed.logs || [], focusLogs: parsed.focusLogs || [], settings: parsed.settings || settings }, token).catch(() => {});
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  };

  // Reset Data
  const resetAllData = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await AsyncStorage.multiRemove([STORAGE_KEYS.SUBJECTS, STORAGE_KEYS.LOGS, STORAGE_KEYS.FOCUS_LOGS, STORAGE_KEYS.SETTINGS]);
    setSubjects([]);
    setLogs([]);
    setFocusLogs([]);
    setSettings(DEFAULT_SETTINGS);

    if (token) {
      apiService.syncAllData({ subjects: [], logs: [], focusLogs: [], settings: DEFAULT_SETTINGS, reset: true }, token).catch((e) => {
        if (e.message === 'AUTH_EXPIRED') refreshAuthToken();
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        subjects,
        logs,
        focusLogs,
        settings,
        isLoading,
        syncStatus,
        quickLogAttendance,
        logAttendance,
        addFocusLog,
        toggleSubjectActive,
        addSubject,
        updateSubject,
        deleteSubject,
        loadBranchPreset,
        updateSettings,
        syncWithCloud,
        exportData,
        importData,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
