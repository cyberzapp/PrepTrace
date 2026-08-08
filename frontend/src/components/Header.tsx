import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Calendar, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { settings, logs, subjects } = useApp();

  // Calculate lectures logged today
  const todayStr = new Date().toISOString().split('T')[0];
  const logsToday = logs.filter((l) => l.date.startsWith(todayStr)).length;
  const target = settings.dailyTargetLectures || 4;
  const progressRatio = Math.min(1, logsToday / target);

  // Calculate Days remaining until target exam
  const getDaysRemaining = () => {
    try {
      const targetDate = new Date(settings.targetExamDate);
      const today = new Date();
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  };

  const daysRemaining = getDaysRemaining();

  return (
    <View style={styles.container}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.brandTitle}>PrepTrace</Text>
          <Text style={styles.brandSubtitle}>
            Branch: <Text style={styles.highlightText}>{settings.branch || 'CS'}</Text>
          </Text>
        </View>

        {/* Streak & Countdown Pill Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.streakBadge}>
            <Flame size={16} color={Colors.warning} />
            <Text style={styles.streakText}>{settings.streakCount} d</Text>
          </View>

          <View style={styles.countdownBadge}>
            <Calendar size={14} color={Colors.primary} />
            <Text style={styles.countdownText}>{daysRemaining} d left</Text>
          </View>
        </View>
      </View>

      {/* Daily Progress Widget */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.flexRow}>
            <CheckCircle2 size={16} color={logsToday >= target ? Colors.success : Colors.primary} />
            <Text style={styles.progressTitle}>Today's Target</Text>
          </View>
          <Text style={styles.progressCount}>
            <Text style={styles.progressBold}>{logsToday}</Text> / {target} Lectures
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressRatio * 100}%`,
                backgroundColor: logsToday >= target ? Colors.success : Colors.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  highlightText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningGlow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  streakText: {
    color: Colors.warning,
    fontWeight: '700',
    fontSize: 13,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  countdownText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressBold: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 7,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
