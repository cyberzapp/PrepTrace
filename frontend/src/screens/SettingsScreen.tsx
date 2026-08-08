import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  Download,
  RotateCcw,
  Target,
  Calendar,
  Sparkles,
  Check,
  ShieldAlert,
  Cloud,
  RefreshCw,
  LogOut,
  UserCheck,
  Globe,
} from 'lucide-react-native';
import { BranchPickerModal } from '../components/BranchPickerModal';
import { CustomAlert } from '../components/CustomAlert';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, exportData, resetAllData, syncStatus, syncWithCloud } = useApp();
  const { user, signOut } = useAuth();

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [examDate, setExamDate] = useState(settings.targetExamDate || '2027-02-06');
  const [dailyTarget, setDailyTarget] = useState(settings.dailyTargetLectures.toString() || '4');
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [showServerInput, setShowServerInput] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'danger' | 'success';
    primaryActionText?: string;
    secondaryActionText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setExamDate(formattedDate);
    }
  };

  const handleSaveExamDate = () => {
    updateSettings({ targetExamDate: examDate });
    setAlertConfig({
      visible: true,
      title: 'Saved',
      message: 'Target Exam Date updated.',
      type: 'success',
      onConfirm: closeAlert,
    });
  };

  const handleSaveDailyTarget = (val: number) => {
    setDailyTarget(val.toString());
    updateSettings({ dailyTargetLectures: val });
  };

  const handleSaveServerUrl = async () => {
    await setApiBaseUrl(serverUrl);
    setShowServerInput(false);
    setAlertConfig({
      visible: true,
      title: 'Saved',
      message: `API Base URL set to ${serverUrl}`,
      type: 'success',
      onConfirm: closeAlert,
    });
    syncWithCloud();
  };

  const handleManualSync = async () => {
    const success = await syncWithCloud();
    if (success) {
      setAlertConfig({
        visible: true,
        title: 'Cloud Sync Success',
        message: 'Synced latest subjects, attendance logs, and settings with Firestore database!',
        type: 'success',
        onConfirm: closeAlert,
      });
    } else {
      setAlertConfig({
        visible: true,
        title: 'Cloud Sync Alert',
        message: syncStatus.error || 'Failed to sync with backend. Ensure Express server is running.',
        type: 'warning',
        onConfirm: closeAlert,
      });
    }
  };

  const handleResetDataConfirm = () => {
    setAlertConfig({
      visible: true,
      title: 'Reset All Attendance Data?',
      message: 'This will erase all your logged attendance, subjects, and study streak statistics. This action cannot be undone.',
      type: 'danger',
      primaryActionText: 'Reset Everything',
      secondaryActionText: 'Cancel',
      onConfirm: () => {
        resetAllData();
        closeAlert();
      },
      onCancel: closeAlert,
    });
  };

  const handleSignOutConfirm = () => {
    setAlertConfig({
      visible: true,
      title: 'Sign Out of Account?',
      message: 'You will be returned to the login screen.',
      type: 'warning',
      primaryActionText: 'Sign Out',
      secondaryActionText: 'Cancel',
      onConfirm: () => {
        signOut();
        closeAlert();
      },
      onCancel: closeAlert,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Account & Settings</Text>
        <Text style={styles.subtitle}>Your account controls</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        {user && (
          <View style={styles.card}>
            <View style={styles.userRow}>
              {user.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <UserCheck size={20} color={Colors.accentCyan} />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.googleBadge}>
                  <Text style={styles.googleBadgeText}>Google Account Verified</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOutConfirm} activeOpacity={0.8}>
              <LogOut size={16} color={Colors.danger} />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}



        {/* Branch Preset Selector Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: Colors.primaryGlow }]}>
              <Sparkles size={18} color={Colors.primary} />
            </View>

            <View style={styles.cardHeaderTitleGroup}>
              <Text style={styles.cardTitle}>Study Preset</Text>
              <Text style={styles.cardSubtitle}>
                Active Branch: <Text style={styles.boldPrimary}>{settings.branch}</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsBranchModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Switch Branch / Load Presets</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Target Goal Selector */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: Colors.successGlow }]}>
              <Target size={18} color={Colors.success} />
            </View>

            <View style={styles.cardHeaderTitleGroup}>
              <Text style={styles.cardTitle}>Daily Lecture Goal</Text>
              <Text style={styles.cardSubtitle}>Target number of lectures to log daily</Text>
            </View>
          </View>

          <View style={styles.targetGrid}>
            {[2, 3, 4, 5, 6].map((num) => {
              const isSelected = settings.dailyTargetLectures === num;
              return (
                <TouchableOpacity
                  key={num}
                  style={[styles.targetPill, isSelected && styles.selectedTargetPill]}
                  onPress={() => handleSaveDailyTarget(num)}
                >
                  <Text
                    style={[styles.targetPillText, isSelected && styles.selectedTargetPillText]}
                  >
                    {num} Lects
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Target Exam Date */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: Colors.warningGlow }]}>
              <Calendar size={18} color={Colors.warning} />
            </View>

            <View style={styles.cardHeaderTitleGroup}>
              <Text style={styles.cardTitle}>Target Exam Date</Text>
              <Text style={styles.cardSubtitle}>Used to compute remaining preparation days</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={[styles.dateInput, { justifyContent: 'center' }]} 
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: examDate ? Colors.textPrimary : Colors.textMuted }}>
                {examDate || 'YYYY-MM-DD'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={examDate ? new Date(examDate) : new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <TouchableOpacity style={styles.saveDateBtn} onPress={handleSaveExamDate}>
              <Check size={16} color="#FFFFFF" strokeWidth={3} />
              <Text style={styles.saveDateText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone: Reset Data */}
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: Colors.dangerGlow }]}>
              <ShieldAlert size={18} color={Colors.danger} />
            </View>

            <View style={styles.cardHeaderTitleGroup}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <Text style={styles.cardSubtitle}>Reset all your progress</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetDataConfirm}
            activeOpacity={0.8}
          >
            <RotateCcw size={16} color={Colors.danger} />
            <Text style={styles.resetBtnText}>Reset All Data & Logs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Branch Picker Modal */}
      <BranchPickerModal
        visible={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type as any}
        primaryActionText={alertConfig.primaryActionText}
        secondaryActionText={alertConfig.secondaryActionText}
        onPrimaryAction={alertConfig.onConfirm}
        onSecondaryAction={alertConfig.onCancel}
        onClose={closeAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  googleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  googleBadgeText: {
    fontSize: 10,
    color: '#4285F4',
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  signOutBtnText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitleGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  syncTimestampText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  boldPrimary: {
    color: Colors.primary,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  configServerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    justifyContent: 'center',
  },
  configServerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  serverInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  serverInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  targetGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  targetPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedTargetPill: {
    backgroundColor: Colors.successGlow,
    borderColor: Colors.success,
  },
  targetPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  selectedTargetPillText: {
    color: Colors.success,
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  saveDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  saveDateText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  exportBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  dangerCard: {
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
  resetBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerGlow,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
});
