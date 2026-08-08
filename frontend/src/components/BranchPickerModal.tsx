import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X, BookOpen, Check } from 'lucide-react-native';
import { BRANCH_PRESETS } from '../constants/presets';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface BranchPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BranchPickerModal: React.FC<BranchPickerModalProps> = ({ visible, onClose }) => {
  const { settings, loadBranchPreset } = useApp();

  const handleSelectPreset = async (presetId: string) => {
    await loadBranchPreset(presetId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Load Study Preset</Text>
              <Text style={styles.subtitle}>Pre-populate standard syllabus subjects</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {BRANCH_PRESETS.map((preset) => {
              const isSelected = settings.branch === preset.code;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetCard, isSelected && styles.selectedPresetCard]}
                  onPress={() => handleSelectPreset(preset.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.presetHeader}>
                    <View style={styles.codePill}>
                      <Text style={styles.codeText}>{preset.code}</Text>
                    </View>
                    <Text style={styles.presetName}>{preset.name}</Text>
                    {isSelected && <Check size={18} color={Colors.primary} strokeWidth={3} />}
                  </View>

                  <Text style={styles.presetDesc}>{preset.description}</Text>

                  <View style={styles.presetMeta}>
                    <BookOpen size={13} color={Colors.textMuted} />
                    <Text style={styles.subjectCountText}>
                      {preset.subjects.length} Subjects Included
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
            <Text style={styles.closeFooterText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  presetCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  selectedPresetCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  codePill: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  presetName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  presetDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  presetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subjectCountText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  closeFooterBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
  },
  closeFooterText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
