import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import { Colors } from '../constants/theme';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomAlertProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type,
  title,
  message,
  primaryActionText = 'OK',
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  onClose,
  children,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={32} color={Colors.success} />;
      case 'error':
        return <XCircle size={32} color={Colors.danger} />;
      case 'warning':
        return <AlertCircle size={32} color={Colors.warning} />;
      case 'info':
      default:
        return <Info size={32} color={Colors.primary} />;
    }
  };

  const getThemeColor = () => {
    switch (type) {
      case 'success':
        return Colors.success;
      case 'error':
        return Colors.danger;
      case 'warning':
        return Colors.warning;
      case 'info':
      default:
        return Colors.primary;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <View style={styles.iconContainer}>{getIcon()}</View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          
          {children}

          <View style={styles.actionsRow}>
            {secondaryActionText && (
              <TouchableOpacity
                style={[styles.btn, styles.secondaryBtn]}
                onPress={onSecondaryAction || onClose}
              >
                <Text style={styles.secondaryBtnText}>{secondaryActionText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, styles.primaryBtn, { backgroundColor: getThemeColor() }]}
              onPress={onPrimaryAction || onClose}
            >
              <Text style={styles.primaryBtnText}>{primaryActionText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  secondaryBtn: {
    backgroundColor: Colors.surfaceLight,
  },
  primaryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtnText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
