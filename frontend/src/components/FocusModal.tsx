import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  AppState,
  Switch,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Play, Square, Settings as SettingsIcon, History } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { CustomAlert } from './CustomAlert';
import { useApp } from '../context/AppContext';
import * as Notifications from 'expo-notifications';

interface FocusModalProps {
  visible: boolean;
  onClose: () => void;
}

type TimerState = 'idle' | 'focus' | 'break' | 'settings';

const HARSH_QUOTES = [
  "Only a small fraction of students achieve their ultimate dreams. Don't quit now.",
  "Your competitors are studying while you are scrolling. Get back to work.",
  "Comfort is the enemy of achievement. You just chose comfort.",
  "That quick peek at another app just broke your momentum.",
];

export const FocusModal: React.FC<FocusModalProps> = ({ visible, onClose }) => {
  const { settings, updateSettings, addFocusLog, focusLogs } = useApp();

  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState('25');
  const [breakMinutes, setBreakMinutes] = useState('5');
  const [totalSets, setTotalSets] = useState('4');
  const [currentSet, setCurrentSet] = useState(1);
  const [isStrictMode, setIsStrictMode] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState(parseInt(focusMinutes) * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    showReasonInput?: boolean;
    primaryActionText?: string;
    secondaryActionText?: string;
    onPrimaryAction?: (reason?: string) => void;
    onSecondaryAction?: () => void;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const [quitReason, setQuitReason] = useState('');

  // Sync timeLeft when settings change if idle
  useEffect(() => {
    if (timerState === 'idle') {
      const parsed = parseInt(focusMinutes) || 25;
      setTimeLeft(parsed * 60);
    }
  }, [focusMinutes, timerState]);

  // Handle App Backgrounding & 5-minute Grace Period
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const isGoingToBackground = appStateRef.current.match(/active/) && nextAppState === 'background';
      const isComingToForeground = appStateRef.current.match(/background/) && nextAppState === 'active';
      
      if (isGoingToBackground) {
        backgroundTimeRef.current = Date.now();
      }

      if (isComingToForeground && backgroundTimeRef.current && timerState === 'focus' && isStrictMode) {
        const timeInBackgroundMs = Date.now() - backgroundTimeRef.current;
        const timeInBackgroundSec = Math.floor(timeInBackgroundMs / 1000);
        
        // 5 Minutes grace period (300 seconds)
        if (timeInBackgroundSec > 300) {
          handleFailFocus(true); // Forced fail
        } else {
          // Subtract elapsed time
          setTimeLeft((prev) => Math.max(0, prev - timeInBackgroundSec));
        }
        backgroundTimeRef.current = null;
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [timerState, isStrictMode]);

  // Observer for Timer Completion to prevent React State update inside setInterval
  useEffect(() => {
    if (timeLeft === 0 && (timerState === 'focus' || timerState === 'break')) {
      handleSessionComplete(timerState);
    }
  }, [timeLeft, timerState]);

  const closeAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  const applyPenaltyAndReset = async (reason?: string) => {
    stopTimer();
    setTimerState('idle');
    setCurrentSet(1);

    const breaksToday = (settings.focusBreaksToday || 0) + 1;
    let newPoints = settings.points || 0;
    
    const randomQuote = HARSH_QUOTES[Math.floor(Math.random() * HARSH_QUOTES.length)];
    let message = randomQuote;

    if (breaksToday > 2) {
      newPoints = Math.max(0, newPoints - 50);
      message += '\n\nPenalty: -50 Points for breaking focus multiple times today.';
    }

    if (reason) {
      message += `\n\nReason: "${reason}"`;
    }

    await updateSettings({
      focusBreaksToday: breaksToday,
      points: newPoints,
    });

    setAlertConfig({
      visible: true,
      type: 'error',
      title: 'Focus Broken! ❌',
      message,
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Focus Broken! ❌',
        body: 'You broke your focus session. Click here to see the damage.',
        sound: 'notification.wav',
      },
      trigger: null, // trigger immediately
    });
  };

  const handleFailFocus = (forced = false) => {
    if (forced) {
      applyPenaltyAndReset();
      return;
    }

    // Mid-Session Warning before quitting
    setQuitReason('');
    setAlertConfig({
      visible: true,
      type: 'warning',
      title: 'Are you giving up?',
      message: 'Quitting now will break your streak. Are you sure you want to stop?',
      showReasonInput: true,
      primaryActionText: 'Yes, Quit',
      secondaryActionText: 'No, Keep Going',
      onPrimaryAction: (reason) => {
        closeAlert();
        applyPenaltyAndReset(reason);
      },
      onSecondaryAction: () => {
        closeAlert();
      }
    });
  };

  const startTimer = (mode: 'focus' | 'break') => {
    setTimerState(mode);
    const m = mode === 'focus' ? parseInt(focusMinutes) || 25 : parseInt(breakMinutes) || 5;
    setTimeLeft(m * 60);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0; // The useEffect will catch 0 and handle completion safely
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const calculatePoints = () => {
    const fMins = parseInt(focusMinutes) || 25;
    let earned = isStrictMode ? fMins * 1.5 : fMins * 0.5;
    return Math.round(earned);
  };

  const handleSessionComplete = async (completedMode: 'focus' | 'break') => {
    setTimerState('idle'); // Prevent multiple triggers
    const fMins = parseInt(focusMinutes) || 25;
    const tSets = parseInt(totalSets) || 4;

    if (completedMode === 'focus') {
      const earnedPoints = calculatePoints();
      
      await addFocusLog({
        durationMinutes: fMins,
        date: new Date().toISOString(),
        strictMode: isStrictMode,
        completed: true,
      });

      await updateSettings({
        points: (settings.points || 0) + earnedPoints,
      });

      if (currentSet >= tSets) {
        setAlertConfig({
          visible: true,
          type: 'success',
          title: 'Congratulations! 🎉',
          message: `You completed all focus sets and earned +${earnedPoints} points!`,
        });
        setCurrentSet(1);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Congratulations! 🎉',
            body: `You completed all focus sets and earned +${earnedPoints} points!`,
            sound: 'notification.wav',
          },
          trigger: null,
        });
      } else {
        setAlertConfig({
          visible: true,
          type: 'success',
          title: 'Focus Complete!',
          message: `You earned +${earnedPoints} points! Time for a break.`,
        });
        startTimer('break');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Focus Complete!',
            body: `You earned +${earnedPoints} points! Time for a break.`,
            sound: 'notification.wav',
          },
          trigger: null,
        });
      }
    } else {
      setAlertConfig({
        visible: true,
        type: 'info',
        title: 'Break Over!',
        message: 'Time to get back to work.',
      });
      setCurrentSet((prev) => prev + 1);
      startTimer('focus');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Break Over!',
          body: 'Time to get back to work.',
          sound: 'notification.wav',
        },
        trigger: null,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{showHistory ? 'Focus History' : 'Focus Mode'}</Text>
          {timerState === 'idle' && (
            <View style={styles.headerRight}>
              {!showHistory && (
                <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.iconBtn}>
                  <History size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={showHistory ? () => setShowHistory(false) : onClose} style={styles.iconBtn}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showHistory ? (
          <ScrollView style={styles.historyContainer}>
            {focusLogs.length > 0 ? (
              focusLogs.map((log) => (
                <View key={log.id} style={styles.historyItem}>
                  <View>
                    <Text style={styles.historyDate}>
                      {new Date(log.date).toLocaleDateString()} at {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.historyDetail}>
                      {log.durationMinutes} mins • {log.strictMode ? 'Strict Mode' : 'Normal'}
                    </Text>
                  </View>
                  <View style={[styles.historyStatus, { backgroundColor: log.completed ? Colors.successGlow : Colors.danger }]}>
                    <Text style={[styles.historyStatusText, { color: log.completed ? Colors.success : '#FFF' }]}>
                      {log.completed ? 'Success' : 'Failed'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noHistoryText}>No focus sessions recorded yet.</Text>
            )}
          </ScrollView>
        ) : timerState === 'settings' ? (
          <View style={styles.settingsContainer}>
            <View style={styles.strictModeRow}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={styles.settingLabel}>Strict Mode</Text>
                <Text style={styles.strictModeDesc}>
                  App background tracking enabled. Awards 3x points. You get a 5-minute grace period if you need to open a study app.
                </Text>
              </View>
              <Switch
                value={isStrictMode}
                onValueChange={setIsStrictMode}
                trackColor={{ false: Colors.surface, true: Colors.primary }}
              />
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.settingLabel}>Focus Time (mins)</Text>
              <TextInput
                style={styles.textInput}
                value={focusMinutes}
                onChangeText={setFocusMinutes}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.settingLabel}>Break Time (mins)</Text>
              <TextInput
                style={styles.textInput}
                value={breakMinutes}
                onChangeText={setBreakMinutes}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.settingLabel}>Number of Sets</Text>
              <TextInput
                style={styles.textInput}
                value={totalSets}
                onChangeText={setTotalSets}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={() => setTimerState('idle')}>
              <Text style={styles.saveBtnText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timerContainer}>
            <Text style={styles.statusText}>
              {timerState === 'idle' ? 'Ready to Focus?' : timerState === 'focus' ? 'Deep Work' : 'Resting'}
            </Text>
            <Text style={styles.setTrackerText}>
              Set {currentSet} of {totalSets || '1'}
            </Text>
            
            <View style={[styles.timerCircle, timerState === 'focus' ? styles.timerCircleFocus : timerState === 'break' ? styles.timerCircleBreak : null]}>
              <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
            </View>

            <View style={styles.actionRow}>
              {timerState === 'idle' ? (
                <>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => startTimer('focus')}>
                    <Play size={24} color={Colors.background} fill={Colors.background} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.settingsBtn} onPress={() => setTimerState('settings')}>
                    <SettingsIcon size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.danger }]} onPress={() => handleFailFocus(false)}>
                  <Square size={24} color={Colors.background} fill={Colors.background} />
                </TouchableOpacity>
              )}
            </View>
            
            {timerState === 'focus' && isStrictMode && (
              <Text style={styles.warningText}>
                STRICT MODE: Do not leave the app for more than 5 minutes!
              </Text>
            )}
            {timerState === 'focus' && !isStrictMode && (
              <Text style={[styles.warningText, { color: Colors.warning }]}>
                Strict Mode OFF: No penalties.
              </Text>
            )}
          </View>
        )}
      </SafeAreaView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryActionText={alertConfig.primaryActionText}
        secondaryActionText={alertConfig.secondaryActionText}
        onPrimaryAction={() => {
          if (alertConfig.onPrimaryAction) alertConfig.onPrimaryAction(quitReason);
          else closeAlert();
        }}
        onSecondaryAction={alertConfig.onSecondaryAction}
        onClose={closeAlert}
      >
        {alertConfig.showReasonInput && (
          <TextInput
            style={styles.reasonInput}
            placeholder="Reason for quitting? (Optional)"
            placeholderTextColor={Colors.textMuted}
            value={quitReason}
            onChangeText={setQuitReason}
          />
        )}
      </CustomAlert>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 8,
  },
  historyContainer: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  historyDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  noHistoryText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  settingsContainer: {
    flex: 1,
  },
  strictModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  strictModeDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  inputCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  setTrackerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 40,
    fontWeight: '600',
  },
  timerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 6,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  timerCircleFocus: {
    borderColor: Colors.primary,
  },
  timerCircleBreak: {
    borderColor: Colors.success,
  },
  timeText: {
    fontSize: 64,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsBtn: {
    backgroundColor: Colors.card,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  warningText: {
    color: Colors.danger,
    marginTop: 40,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  reasonInput: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    marginBottom: 20,
    fontSize: 14,
  },
});
