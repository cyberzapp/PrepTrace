import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogIn, Database, Zap, BookOpen, ShieldCheck, ArrowRight, Layers } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { promptGoogleSignIn, signInWithDemo, isLoading, error } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Layers size={32} color={Colors.accentCyan} />
          </View>
          <Text style={styles.title}>PrepTrace</Text>
          <Text style={styles.subtitle}>Attendance & Syllabus Velocity</Text>
        </View>

        {/* Feature Highlights Grid */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Zap size={22} color={Colors.accentCyan} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>1-Click FAST Logging</Text>
              <Text style={styles.featureSub}>Log daily lectures instantly with tactile haptic feedback.</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Database size={22} color={Colors.accentIndigo} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Node + Express & Firestore</Text>
              <Text style={styles.featureSub}>All subjects, logs & streaks saved to Firestore database.</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <BookOpen size={22} color={Colors.accentGreen} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Branch Syllabus Presets</Text>
              <Text style={styles.featureSub}>Pre-loaded CS, ECE, EE, ME, Civil & DA course targets.</Text>
            </View>
          </View>
        </View>

        {/* Error Alert */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Sign In Actions */}
        <View style={styles.actionContainer}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.accentCyan} />
              <Text style={styles.loadingText}>Authenticating with Google...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.googleButton}
                activeOpacity={0.8}
                onPress={promptGoogleSignIn}
              >
                <View style={styles.googleIconCircle}>
                  <LogIn size={20} color="#fff" />
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoButton}
                activeOpacity={0.7}
                onPress={signInWithDemo}
              >
                <Text style={styles.demoButtonText}>Continue as Demo Student</Text>
                <ArrowRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </>
          )}

          <View style={styles.footerNote}>
            <ShieldCheck size={14} color={Colors.textMuted} />
            <Text style={styles.footerText}>Secure Google Auth • Encrypted Firestore Storage</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
  },
  actionContainer: {
    alignItems: 'stretch',
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  googleIconCircle: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  demoButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
