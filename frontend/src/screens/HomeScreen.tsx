import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Plus, BookMarked, History, Clock, TrendingUp, Settings, Bell, Sparkles, Timer, Trophy, Layers } from 'lucide-react-native';
import { Header } from '../components/Header';
import { SubjectCard } from '../components/SubjectCard';
import { AttendanceModal } from '../components/AttendanceModal';
import { AddEditSubjectModal } from '../components/AddEditSubjectModal';
import { BranchPickerModal } from '../components/BranchPickerModal';
import { FocusModal } from '../components/FocusModal';
import { Subject } from '../types';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export const HomeScreen: React.FC<{ 
  onNavigateToSubjects: () => void;
  onNavigateToAnalytics: () => void;
}> = ({
  onNavigateToSubjects,
  onNavigateToAnalytics,
}) => {
  const { subjects, logs, isLoading } = useApp();

  const [selectedSubjectForQuickLog, setSelectedSubjectForQuickLog] = useState<Subject | null>(null);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);

  // Filter only active subjects for home dashboard
  const activeSubjects = subjects.filter((s) => s.isActive);
  const queuedCount = subjects.filter((s) => !s.isActive).length;

  // Format recent log time
  const formatLogTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      {/* Focus Mode & Leaderboard Buttons */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity
          style={styles.focusLaunchBtn}
          onPress={() => setIsFocusModalOpen(true)}
          activeOpacity={0.8}
        >
          <Timer size={18} color="#FFFFFF" />
          <Text style={styles.focusLaunchText}>Deep Focus</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.leaderboardBtn}
          onPress={onNavigateToAnalytics}
          activeOpacity={0.8}
        >
          <Trophy size={18} color={Colors.warning} />
          <Text style={styles.leaderboardText}>Leaderboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} colors={[Colors.primary]} />}
      >
        {/* Section Header: Active Schedule */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <BookMarked size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Active Schedule ({activeSubjects.length})</Text>
          </View>

          <TouchableOpacity
            style={styles.addSubjectBtn}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.7}
          >
            <Plus size={16} color={Colors.primary} />
            <Text style={styles.addSubjectBtnText}>Add Subject</Text>
          </TouchableOpacity>
        </View>



        {/* Active Subjects List */}
        {activeSubjects.length > 0 ? (
          activeSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onOpenQuickLogModal={(sub) => setSelectedSubjectForQuickLog(sub)}
              onOpenEditModal={(sub) => setSelectedSubjectForEdit(sub)}
            />
          ))
        ) : (
          <View style={styles.emptyStateCard}>
            <Layers size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Active Subjects</Text>
            <Text style={styles.emptySubtitle}>
              You have no active subjects on your daily schedule right now.
            </Text>

            <View style={styles.emptyActionsRow}>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setIsPresetModalOpen(true)}
                activeOpacity={0.8}
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.presetBtnText}>Load Study Presets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.allSubjectsLinkBtn}
                onPress={onNavigateToSubjects}
                activeOpacity={0.8}
              >
                <Text style={styles.allSubjectsLinkText}>Manage All ({subjects.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Queued Banner */}
        {queuedCount > 0 && activeSubjects.length > 0 && (
          <TouchableOpacity
            style={styles.queuedBanner}
            onPress={onNavigateToSubjects}
            activeOpacity={0.8}
          >
            <Text style={styles.queuedBannerText}>
              + {queuedCount} subjects queued in syllabus background
            </Text>
            <Text style={styles.queuedBannerAction}>View All →</Text>
          </TouchableOpacity>
        )}

        {/* Section Header: Recent Activity Log Feed */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={styles.sectionTitleRow}>
            <History size={18} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Recent Log Feed</Text>
          </View>
        </View>

        {logs.length > 0 ? (
          <View style={styles.logsCard}>
            {logs.slice(0, 5).map((log, idx) => (
              <View
                key={log.id}
                style={[
                  styles.logItem,
                  idx < Math.min(5, logs.length) - 1 && styles.logItemBorder,
                ]}
              >
                <View style={styles.logItemLeft}>
                  <View style={styles.logBadge}>
                    <Text style={styles.logBadgeText}>L#{log.lectureNumber}</Text>
                  </View>
                  <View>
                    <Text style={styles.logSubjectName}>{log.subjectName}</Text>
                    {log.notes ? (
                      <Text style={styles.logNotes} numberOfLines={1}>
                        {log.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.logItemRight}>
                  <View style={styles.statusTag}>
                    <Text style={styles.statusTagText}>{log.status.toUpperCase()}</Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Clock size={11} color={Colors.textMuted} />
                    <Text style={styles.timeText}>{formatLogTime(log.date)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyLogsCard}>
            <Text style={styles.emptyLogsText}>No attendance logged yet today. Tap + Log on a card above!</Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <AttendanceModal
        visible={!!selectedSubjectForQuickLog}
        subject={selectedSubjectForQuickLog}
        onClose={() => setSelectedSubjectForQuickLog(null)}
      />

      <AddEditSubjectModal
        visible={isAddModalOpen || !!selectedSubjectForEdit}
        subject={selectedSubjectForEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedSubjectForEdit(null);
        }}
      />

      <BranchPickerModal
        visible={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
      />

      <FocusModal
        visible={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  addSubjectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  focusLaunchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  focusLaunchText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  leaderboardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.warningGlow,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  leaderboardText: {
    color: Colors.warning,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyStateCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  presetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  allSubjectsLinkBtn: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  allSubjectsLinkText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  queuedBanner: {
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  queuedBannerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  queuedBannerAction: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  logsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  logItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  logItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logBadge: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logBadgeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  logSubjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  logNotes: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  logItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusTag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyLogsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyLogsText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
