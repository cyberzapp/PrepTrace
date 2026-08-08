import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Subject, SubjectCategory } from '../types';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface AddEditSubjectModalProps {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;
}

const CATEGORIES: { key: SubjectCategory; label: string }[] = [
  { key: 'core', label: 'Core Subject' },
  { key: 'math', label: 'Mathematics' },
  { key: 'aptitude', label: 'Aptitude' },
  { key: 'elective', label: 'Elective' },
  { key: 'general', label: 'General' },
];

const PRESET_COLORS = ['#38BDF8', '#A78BFA', '#F59E0B', '#34D399', '#F472B6', '#FB7185', '#60A5FA'];

export const AddEditSubjectModal: React.FC<AddEditSubjectModalProps> = ({
  visible,
  subject,
  onClose,
}) => {
  const { addSubject, updateSubject, deleteSubject } = useApp();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [teacher, setTeacher] = useState('');
  const [totalLectures, setTotalLectures] = useState('40');
  const [completedLectures, setCompletedLectures] = useState('0');
  const [category, setCategory] = useState<SubjectCategory>('core');
  const [color, setColor] = useState('#38BDF8');

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setCode(subject.code);
      setTeacher(subject.teacher);
      setTotalLectures(subject.totalLectures.toString());
      setCompletedLectures(subject.completedLectures.toString());
      setCategory(subject.category);
      setColor(subject.color || '#38BDF8');
    } else {
      setName('');
      setCode('');
      setTeacher('');
      setTotalLectures('40');
      setCompletedLectures('0');
      setCategory('core');
      setColor('#38BDF8');
    }
  }, [subject, visible]);

  const handleSave = async () => {
    if (!name.trim()) return;

    const total = Math.max(1, parseInt(totalLectures, 10) || 40);
    const completed = Math.max(0, parseInt(completedLectures, 10) || 0);

    if (subject) {
      await updateSubject(subject.id, {
        name: name.trim(),
        code: code.trim().toUpperCase() || 'CS',
        teacher: teacher.trim(),
        totalLectures: total,
        completedLectures: Math.min(total, completed),
        category,
        color,
      });
    } else {
      await addSubject({
        name: name.trim(),
        code: code.trim().toUpperCase() || 'SUB',
        teacher: teacher.trim(),
        totalLectures: total,
        isActive: true,
        category,
        color,
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (subject) {
      await deleteSubject(subject.id);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={[styles.modalContent, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
            {/* Modal Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{subject ? 'Edit Subject' : 'Add New Subject'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Subject Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Subject Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Operating Systems"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Code & Teacher Row */}
              <View style={styles.row}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Subject Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="CS-OS"
                    placeholderTextColor={Colors.textMuted}
                    value={code}
                    onChangeText={setCode}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1.5 }]}>
                  <Text style={styles.label}>Teacher / Educator</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Prof. Name"
                    placeholderTextColor={Colors.textMuted}
                    value={teacher}
                    onChangeText={setTeacher}
                  />
                </View>
              </View>

              {/* Total & Completed Lectures Row */}
              <View style={styles.row}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Total Lectures</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={totalLectures}
                    onChangeText={setTotalLectures}
                  />
                </View>
                {subject && (
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Completed</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={completedLectures}
                      onChangeText={setCompletedLectures}
                    />
                  </View>
                )}
              </View>

              {/* Category Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.chip,
                        category === cat.key && styles.activeChip,
                      ]}
                      onPress={() => setCategory(cat.key)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          category === cat.key && styles.activeChipText,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Color Swatch Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Theme Accent Color</Text>
                <View style={styles.colorRow}>
                  {PRESET_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorCircle, { backgroundColor: c }]}
                      onPress={() => setColor(c)}
                    >
                      {color === c && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.footerRow}>
              {subject && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Trash2 size={18} color={Colors.danger} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!name.trim()}
                activeOpacity={0.8}
              >
                <Check size={18} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.saveText}>{subject ? 'Save Changes' : 'Create Subject'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  activeChipText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  deleteBtn: {
    backgroundColor: Colors.dangerGlow,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
    opacity: 0.6,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
