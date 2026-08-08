import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Plus, Search, Sparkles, Filter, BookOpen } from 'lucide-react-native';
import { SubjectCard } from '../components/SubjectCard';
import { AttendanceModal } from '../components/AttendanceModal';
import { AddEditSubjectModal } from '../components/AddEditSubjectModal';
import { BranchPickerModal } from '../components/BranchPickerModal';
import { Subject } from '../types';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

export const SubjectsScreen: React.FC = () => {
  const { subjects, settings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'queued' | 'completed'>('all');
  
  const [selectedSubjectForQuickLog, setSelectedSubjectForQuickLog] = useState<Subject | null>(null);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  // Filter subjects based on search & tab
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.teacher && subject.teacher.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'active') return subject.isActive;
    if (filterTab === 'queued') return !subject.isActive;
    if (filterTab === 'completed') return subject.completedLectures >= subject.totalLectures;

    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Title Bar */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.title}>Subject Manager</Text>
          <Text style={styles.subtitle}>
            Branch: <Text style={styles.highlight}>{settings.branch}</Text> ({subjects.length} Total Subjects)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.presetBadgeBtn}
          onPress={() => setIsPresetModalOpen(true)}
          activeOpacity={0.8}
        >
          <Sparkles size={14} color={Colors.primary} />
          <Text style={styles.presetBadgeText}>Presets</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Search size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search subjects, codes, or teachers..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.filterTab, filterTab === 'all' && styles.activeFilterTab]}
          onPress={() => setFilterTab('all')}
        >
          <Text style={[styles.filterTabText, filterTab === 'all' && styles.activeFilterTabText]}>
            All ({subjects.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filterTab === 'active' && styles.activeFilterTab]}
          onPress={() => setFilterTab('active')}
        >
          <Text
            style={[styles.filterTabText, filterTab === 'active' && styles.activeFilterTabText]}
          >
            Active ({subjects.filter((s) => s.isActive).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filterTab === 'queued' && styles.activeFilterTab]}
          onPress={() => setFilterTab('queued')}
        >
          <Text
            style={[styles.filterTabText, filterTab === 'queued' && styles.activeFilterTabText]}
          >
            Queued ({subjects.filter((s) => !s.isActive).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subjects Scroll List */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((sub) => (
            <SubjectCard
              key={sub.id}
              subject={sub}
              onOpenQuickLogModal={(subject) => setSelectedSubjectForQuickLog(subject)}
              onOpenEditModal={(subject) => setSelectedSubjectForEdit(subject)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <BookOpen size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Subjects Found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search filter or add a new subject to your curriculum.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Add Button */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={() => setIsAddModalOpen(true)}
        activeOpacity={0.85}
      >
        <Plus size={22} color="#FFFFFF" strokeWidth={3} />
      </TouchableOpacity>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  highlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  presetBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  presetBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  activeFilterTab: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeFilterTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  fabBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
