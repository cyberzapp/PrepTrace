import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Check, MoreVertical, BookOpen } from 'lucide-react-native';
import { Subject } from '../types';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface SubjectCardProps {
  subject: Subject;
  onOpenQuickLogModal: (subject: Subject) => void;
  onOpenEditModal?: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onOpenQuickLogModal,
  onOpenEditModal,
}) => {
  const { quickLogAttendance, toggleSubjectActive } = useApp();

  const percentage = Math.round((subject.completedLectures / subject.totalLectures) * 100) || 0;
  const isCompleted = subject.completedLectures >= subject.totalLectures;
  const nextLectureNum = Math.min(subject.totalLectures, subject.completedLectures + 1);

  return (
    <View style={styles.cardContainer}>
      {/* Top Banner Row */}
      <View style={styles.cardHeader}>
        <View style={styles.codeAndBadge}>
          <View style={[styles.colorIndicator, { backgroundColor: subject.color || Colors.primary }]} />
          <Text style={styles.subjectCode}>{subject.code}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{subject.category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Options Button */}
        {onOpenEditModal && (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => onOpenEditModal(subject)}
            activeOpacity={0.7}
          >
            <MoreVertical size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Subject Content */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onOpenQuickLogModal(subject)}
        style={styles.contentBody}
      >
        <Text style={styles.subjectName} numberOfLines={1}>
          {subject.name}
        </Text>
        <Text style={styles.teacherName}>Instructor: {subject.teacher || 'N/A'}</Text>

        {/* Lecture Progress Counter & Percentage */}
        <View style={styles.progressStatsRow}>
          <Text style={styles.lecturesCountText}>
            <Text style={styles.boldNum}>{subject.completedLectures}</Text> / {subject.totalLectures} Lects
          </Text>
          <Text style={[styles.percentageText, { color: subject.color || Colors.primary }]}>
            {percentage}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, percentage)}%`,
                backgroundColor: subject.color || Colors.primary,
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* Bottom Action Footer */}
      <View style={styles.cardFooter}>
        {/* Active Toggle Switch / Status indicator */}
        <TouchableOpacity
          style={styles.activeToggleBtn}
          onPress={() => toggleSubjectActive(subject.id)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: subject.isActive ? Colors.success : Colors.textMuted },
            ]}
          />
          <Text style={styles.activeToggleLabel}>
            {subject.isActive ? 'Active Schedule' : 'Queued'}
          </Text>
        </TouchableOpacity>

        {/* Ultra-Fast 1-CLICK ATTENDANCE BUTTON */}
        {!isCompleted ? (
          <TouchableOpacity
            style={[styles.fastLogBtn, { backgroundColor: subject.color || Colors.primary }]}
            onPress={() => quickLogAttendance(subject.id)}
            activeOpacity={0.75}
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={3} />
            <Text style={styles.fastLogBtnText}>Log Lect #{nextLectureNum}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBadge}>
            <Check size={14} color={Colors.success} strokeWidth={3} />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  moreBtn: {
    padding: 4,
  },
  contentBody: {
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lecturesCountText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  boldNum: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  activeToggleLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  fastLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fastLogBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successGlow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 12,
  },
});
