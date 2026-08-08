import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  TrendingUp,
  CheckCircle2,
  Calendar,
  Zap,
  Flame,
  Award,
  BookOpen,
  Trophy,
  Gift,
} from 'lucide-react-native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { AttendanceLog } from '../types';
import { CustomAlert } from '../components/CustomAlert';

export const AnalyticsScreen: React.FC = () => {
  const { subjects, logs, settings } = useApp();

  // Total counts
  const totalLectures = subjects.reduce((sum, s) => sum + s.totalLectures, 0);
  const completedLectures = subjects.reduce((sum, s) => sum + s.completedLectures, 0);
  const overallPercentage = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
  const remainingLectures = Math.max(0, totalLectures - completedLectures);

  // Velocity Calculation (Average lectures per day based on last 7 days)
  const calculateVelocity = () => {
    if (logs.length === 0) return 0;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const logsLastWeek = logs.filter((l) => new Date(l.date) >= sevenDaysAgo);
    const avgPerDay = (logsLastWeek.length / 7).toFixed(1);
    return parseFloat(avgPerDay);
  };

  const dailyVelocity = calculateVelocity();

  // Projected Completion Date
  const calculateProjectedCompletion = () => {
    if (remainingLectures === 0) return 'Syllabus Completed 🎉';
    const rate = dailyVelocity > 0 ? dailyVelocity : settings.dailyTargetLectures || 4;
    const daysNeeded = Math.ceil(remainingLectures / rate);

    const projDate = new Date();
    projDate.setDate(projDate.getDate() + daysNeeded);
    return projDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const projectedDate = calculateProjectedCompletion();

  // Gamification & Leaderboard State
  const [leaderboard, setLeaderboard] = React.useState<{ id: string; name: string; points: number; rank: number }[]>([]);
  const [userRank, setUserRank] = React.useState(1);
  const [showGrandPrizeAlert, setShowGrandPrizeAlert] = React.useState(false);

  const userPoints = settings.points || 0;

  // Generate dynamic leaderboard on mount
  React.useEffect(() => {
    // Generate 1000 realistic competitor scores using a normal-ish distribution
    const competitors: { id: string; name: string; points: number; rank: number }[] = [];
    const firstNames = ['Vikram', 'Neha', 'Aarav', 'Priya', 'Rohan', 'Aditi', 'Karan', 'Sneha', 'Arjun', 'Riya', 'Rahul', 'Ananya', 'Aisha', 'Kabir', 'Dev', 'Kavya'];
    
    for (let i = 0; i < 1050; i++) {
      const name = firstNames[Math.floor(Math.random() * firstNames.length)] + (Math.floor(Math.random() * 900) + 100);
      // Bell curveish distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
      // Mean 800, std dev 400
      let points = Math.floor(800 + randStdNormal * 400);
      if (points < 0) points = Math.floor(Math.random() * 100);
      competitors.push({ id: `bot_${i}`, name, points, rank: 0 });
    }

    // Add User
    competitors.push({ id: 'user', name: 'You', points: userPoints, rank: 0 });
    
    // Sort descending
    competitors.sort((a, b) => b.points - a.points);
    
    // Assign Ranks
    competitors.forEach((c, i) => c.rank = i + 1);

    const userIndex = competitors.findIndex(c => c.id === 'user');
    setUserRank(userIndex + 1);

    // Prepare Display List: Top 3 + 2 Above + User + 2 Below
    const displayList: { id: string; name: string; points: number; rank: number }[] = [];
    
    // Add Top 3
    displayList.push(...competitors.slice(0, 3));

    // If user is not in top 3, show surroundings
    if (userIndex >= 3) {
      displayList.push({ id: 'ellipsis1', name: '...', points: -1, rank: -1 });
      
      const start = Math.max(3, userIndex - 2);
      const end = Math.min(competitors.length, userIndex + 3);
      
      // Prevent overlapping if user is very close to top 3
      for (let i = start; i < end; i++) {
        if (!displayList.find(d => d.id === competitors[i].id)) {
          displayList.push(competitors[i]);
        }
      }
      
      if (end < competitors.length - 1) {
        displayList.push({ id: 'ellipsis2', name: '...', points: -1, rank: -1 });
      }
    }

    setLeaderboard(displayList);
  }, [userPoints]);

  const handleClaimReward = () => {
    setShowGrandPrizeAlert(true);
  };

  // Calendar Heatmap Logic
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  const [logsForSelectedDate, setLogsForSelectedDate] = React.useState<AttendanceLog[]>([]);

  // Group logs by date string (YYYY-MM-DD)
  const logsByDate = React.useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return counts;
  }, [logs]);

  // Generate markedDates for react-native-calendars
  const markedDates = React.useMemo(() => {
    const dates: Record<string, any> = {};
    Object.keys(logsByDate).forEach((dateStr) => {
      const count = logsByDate[dateStr];
      let color = Colors.surfaceLight; // Default fade
      
      // Heatmap fade logic based on activity
      if (count === 1) color = 'rgba(59, 130, 246, 0.3)'; // Light fade
      else if (count === 2) color = 'rgba(59, 130, 246, 0.6)'; // Medium
      else if (count >= 3) color = Colors.primary; // Dark/Solid

      dates[dateStr] = {
        customStyles: {
          container: {
            backgroundColor: color,
            borderRadius: 6,
          },
          text: {
            color: Colors.textPrimary,
            fontWeight: 'bold',
          },
        },
      };
    });

    // Add selected date styling
    if (selectedDate) {
      dates[selectedDate] = {
        ...dates[selectedDate],
        selected: true,
        selectedColor: Colors.textPrimary,
        customStyles: {
          container: {
            backgroundColor: Colors.textPrimary,
            borderRadius: 6,
          },
          text: {
            color: Colors.background,
            fontWeight: 'bold',
          },
        },
      };
    }

    return dates;
  }, [logsByDate, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    const logsForDay = logs.filter((l) => {
      return new Date(l.date).toISOString().split('T')[0] === day.dateString;
    });
    setLogsForSelectedDate(logsForDay);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Syllabus Analytics</Text>
        <Text style={styles.subtitle}>Curriculum progress & velocity metrics</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Syllabus Completion Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Award size={16} color={Colors.primary} />
              <Text style={styles.heroBadgeText}>{settings.branch} Completion</Text>
            </View>
            <Text style={styles.heroPercentage}>{overallPercentage}%</Text>
          </View>

          {/* Main Progress Gauge Bar */}
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeFill, { width: `${overallPercentage}%` }]} />
          </View>

          <View style={styles.heroFooterRow}>
            <Text style={styles.heroStatText}>
              <Text style={styles.boldText}>{completedLectures}</Text> / {totalLectures} Completed
            </Text>
            <Text style={styles.heroStatText}>
              <Text style={styles.boldText}>{remainingLectures}</Text> Remaining
            </Text>
          </View>
        </View>

        {/* 2x2 Grid Stats */}
        <View style={styles.gridContainer}>
          {/* Velocity Card */}
          <View style={styles.gridCard}>
            <View style={styles.gridIconRow}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primaryGlow }]}>
                <Zap size={18} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.gridValue}>{dailyVelocity} / day</Text>
            <Text style={styles.gridLabel}>7-Day Study Velocity</Text>
          </View>

          {/* Projected Date Card */}
          <View style={styles.gridCard}>
            <View style={styles.gridIconRow}>
              <View style={[styles.iconBox, { backgroundColor: Colors.successGlow }]}>
                <Calendar size={18} color={Colors.success} />
              </View>
            </View>
            <Text style={styles.gridValue}>{projectedDate}</Text>
            <Text style={styles.gridLabel}>Projected Syllabus Finish</Text>
          </View>

          {/* Streak Card */}
          <View style={styles.gridCard}>
            <View style={styles.gridIconRow}>
              <View style={[styles.iconBox, { backgroundColor: Colors.warningGlow }]}>
                <Flame size={18} color={Colors.warning} />
              </View>
            </View>
            <Text style={styles.gridValue}>{settings.streakCount} Days</Text>
            <Text style={styles.gridLabel}>Active Study Streak</Text>
          </View>

          {/* Total Logs Card */}
          <View style={styles.gridCard}>
            <View style={styles.gridIconRow}>
              <View style={[styles.iconBox, { backgroundColor: Colors.secondaryGlow }]}>
                <CheckCircle2 size={18} color={Colors.secondary} />
              </View>
            </View>
            <Text style={styles.gridValue}>{logs.length}</Text>
            <Text style={styles.gridLabel}>Total Log Entries</Text>
          </View>
        </View>

        {/* Subject-by-Subject Syllabus Breakdown */}
        <View style={styles.sectionHeader}>
          <BookOpen size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Subject Syllabus Progress</Text>
        </View>

        <View style={styles.breakdownCard}>
          {subjects.map((sub, idx) => {
            const pct = Math.round((sub.completedLectures / sub.totalLectures) * 100) || 0;
            return (
              <View
                key={sub.id}
                style={[
                  styles.subjectRow,
                  idx < subjects.length - 1 && styles.subjectRowBorder,
                ]}
              >
                <View style={styles.subjectMetaRow}>
                  <View style={styles.subjectNameGroup}>
                    <View style={[styles.dot, { backgroundColor: sub.color || Colors.primary }]} />
                    <Text style={styles.subjectCodeText}>{sub.code}</Text>
                    <Text style={styles.subjectNameText} numberOfLines={1}>
                      {sub.name}
                    </Text>
                  </View>
                  <Text style={styles.pctText}>{pct}%</Text>
                </View>

                {/* Sub Bar */}
                <View style={styles.subTrack}>
                  <View
                    style={[
                      styles.subFill,
                      { width: `${pct}%`, backgroundColor: sub.color || Colors.primary },
                    ]}
                  />
                </View>

                <Text style={styles.subLecturesCount}>
                  {sub.completedLectures} of {sub.totalLectures} lectures logged
                </Text>
              </View>
            );
          })}
        </View>

        {/* Activity Heatmap Calendar */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Calendar size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Activity Heatmap</Text>
        </View>

        <View style={styles.calendarCard}>
          <RNCalendar
            markingType={'custom'}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: Colors.card,
              calendarBackground: Colors.card,
              textSectionTitleColor: Colors.textSecondary,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.textPrimary,
              todayTextColor: Colors.primary,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.textDisabled,
              dotColor: Colors.primary,
              selectedDotColor: Colors.textPrimary,
              arrowColor: Colors.primary,
              monthTextColor: Colors.textPrimary,
              indicatorColor: Colors.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
            }}
          />
          
          {selectedDate ? (
            <View style={styles.dayLogsContainer}>
              <Text style={styles.dayLogsTitle}>Logs for {selectedDate}</Text>
              {logsForSelectedDate.length > 0 ? (
                logsForSelectedDate.map((log) => (
                  <View key={log.id} style={styles.dayLogItem}>
                    <View style={styles.dayLogHeader}>
                      <Text style={styles.dayLogSubject}>{log.subjectName}</Text>
                      <Text style={styles.dayLogTime}>
                        {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.dayLogDetail}>
                      Lecture {log.lectureNumber} • {log.status}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noLogsText}>No activity recorded on this day.</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Gamification & Leaderboard Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Trophy size={18} color={Colors.warning} />
          <Text style={styles.sectionTitle}>Global Leaderboard</Text>
        </View>

        <View style={styles.leaderboardCard}>
          <View style={styles.pointsHeaderRow}>
            <Text style={styles.myPointsText}>Your Score: <Text style={{ color: Colors.primary }}>{userPoints}</Text> pts</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>Rank #{userRank}</Text>
            </View>
          </View>

          {/* Leaderboard List */}
          <View style={styles.leaderboardList}>
            {leaderboard.map((player) => {
              if (player.id.startsWith('ellipsis')) {
                return (
                  <View key={player.id} style={styles.ellipsisRow}>
                    <Text style={styles.ellipsisText}>•••</Text>
                  </View>
                );
              }
              
              return (
                <View key={player.id} style={[styles.leaderboardRow, player.id === 'user' && styles.leaderboardRowActive]}>
                  <View style={styles.leaderboardRowLeft}>
                    <Text style={[styles.rankNumber, player.rank <= 3 && { color: Colors.warning }]}>#{player.rank}</Text>
                    <Text style={[styles.playerName, player.id === 'user' && { color: Colors.primary }]}>
                      {player.name}
                    </Text>
                  </View>
                  <Text style={[styles.playerPoints, player.id === 'user' && { color: Colors.primary }]}>
                    {player.points.toLocaleString()} pts
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Grand Prize Banner */}
          <View style={styles.grandPrizeBanner}>
            <View style={styles.grandPrizeHeader}>
              <Gift size={20} color="#FFF" />
              <Text style={styles.grandPrizeTitle}>Rank 1 Grand Prizes</Text>
            </View>
            <Text style={styles.grandPrizeDesc}>
              Reach Rank #1 globally to unlock a MacBook, Gold Coin, or Flight Ticket!
            </Text>
            
            <TouchableOpacity 
              style={[styles.claimBtn, userRank !== 1 && styles.claimBtnDisabled]}
              onPress={handleClaimReward}
              disabled={userRank !== 1}
            >
              <Text style={styles.claimBtnText}>
                {userRank === 1 ? 'Claim Grand Prize!' : 'Reach Rank #1 to Claim'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <CustomAlert
        visible={showGrandPrizeAlert}
        type="success"
        title="The Ultimate Reward 🌟"
        message="You already got the reward: your better and consistent version. That is far higher than any material reward. Keep dominating!"
        primaryActionText="Keep Grinding"
        onClose={() => setShowGrandPrizeAlert(false)}
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
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  heroPercentage: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  gaugeTrack: {
    height: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  heroFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  boldText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  gridIconRow: {
    marginBottom: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  breakdownCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  subjectRow: {
    marginBottom: 14,
  },
  subjectRowBorder: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  subjectMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subjectCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  subjectNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  pctText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subTrack: {
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  subFill: {
    height: '100%',
    borderRadius: 3,
  },
  subLecturesCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  calendarCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dayLogsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 16,
  },
  dayLogsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  dayLogItem: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dayLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayLogSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  dayLogTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dayLogDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  noLogsText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  leaderboardCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  pointsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  myPointsText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  rankBadge: {
    backgroundColor: Colors.warningGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rankBadgeText: {
    color: Colors.warning,
    fontWeight: '800',
    fontSize: 13,
  },
  leaderboardList: {
    paddingVertical: 8,
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  leaderboardRowActive: {
    backgroundColor: Colors.surface,
  },
  leaderboardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 40,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  playerPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  grandPrizeBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
  },
  grandPrizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  grandPrizeTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  grandPrizeDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  claimBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  claimBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  claimBtnText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  ellipsisRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  ellipsisText: {
    color: Colors.textMuted,
    fontSize: 16,
    letterSpacing: 2,
  }
});
