import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LayoutDashboard, BookOpen, BarChart3, Settings } from 'lucide-react-native';
import { Colors } from '../constants/theme';

export type TabType = 'home' | 'subjects' | 'analytics' | 'settings';

interface NavBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'subjects', label: 'Subjects', icon: BookOpen },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBtn}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconBg]}>
              <Icon
                size={20}
                color={isActive ? Colors.primary : Colors.textMuted}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
  },
  activeIconBg: {
    backgroundColor: Colors.primaryGlow,
  },
  tabLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
