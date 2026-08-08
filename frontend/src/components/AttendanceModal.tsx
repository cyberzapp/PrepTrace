import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X, Check, Video, Tv, RotateCcw, AlertTriangle } from 'lucide-react-native';
import { Subject, AttendanceStatus } from '../types';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface AttendanceModalProps {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ visible, subject, onClose }) => {
  const { logAttendance } = useApp();
  const [status, setStatus] = useState<AttendanceStatus>('live');
  const [lectNumber, setLectNumber] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (subject) {
      setLectNumber((subject.completedLectures + 1).toString());
      setStatus('live');
      setNotes('');
    }
  }, [subject, visible]);

  if (!subject) return null;

  const handleSave = async () => {
    const num = parseInt(lectNumber, 10) || subject.completedLectures + 1;
    await logAttendance(subject.id, status, notes.trim(), num);
    onClose();
  };

  const statusOptions: { key: AttendanceStatus; label: string; icon: any; color: string }[] = [
    { key: 'live', label: 'Live Class', icon: Tv, color: Colors.primary },
    { key: 'recorded', label: 'Recorded', icon: Video, color: Colors.secondary },
    { key: 'revision', label: 'Revision', icon: RotateCcw, color: Colors.success },
    { key: 'missed', label: 'Missed', icon: AlertTriangle, color: Colors.danger },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Lecture Attendance</Text>
                <Text style={styles.subjectSubtitle}>{subject.name}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Lecture Number Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lecture Number</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                value={lectNumber}
                onChangeText={setLectNumber}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Attendance Status Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Class Mode / Status</Text>
              <View style={styles.statusGrid}>
                {statusOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = status === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.statusBox,
                        isSelected && {
                          borderColor: opt.color,
                          backgroundColor: `${opt.color}1E`,
                        },
                      ]}
                      onPress={() => setStatus(opt.key)}
                      activeOpacity={0.7}
                    >
                      <Icon size={18} color={isSelected ? opt.color : Colors.textMuted} />
                      <Text
                        style={[
                          styles.statusLabel,
                          isSelected && { color: opt.color, fontWeight: '700' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Topic Notes Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Topic / Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                multiline
                numberOfLines={3}
                placeholder="e.g. Dynamic Programming, Graph Traversal..."
                placeholderTextColor={Colors.textMuted}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.8}>
                <Check size={18} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.submitText}>Confirm Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subjectSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  notesInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: '47%',
  },
  statusLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
