import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface WidgetPreviewProps {
  points: number;
  streakCount: number;
}

export function WidgetPreview({ points, streakCount }: WidgetPreviewProps) {
  const isStreakActive = streakCount > 0;
  
  // Dynamic Theme Colors
  const bgColor = isStreakActive ? '#064E3B' : '#450A0A'; // Deep Green or Deep Red
  const accentColor = isStreakActive ? '#10B981' : '#EF4444'; // Emerald Green or Red
  const textColor = '#FFFFFF';
  const subtextColor = isStreakActive ? '#A7F3D0' : '#FECACA';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0F172A',
        borderRadius: 24,
        flexDirection: 'column',
      }}
    >
      {/* Header Banner - Changes color based on streak */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: bgColor,
          padding: 16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderBottomWidth: 4,
          borderColor: accentColor,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={isStreakActive ? '🔥 Keep it burning!' : '⚠️ Streak Lost'}
            style={{ fontSize: 14, color: subtextColor, fontWeight: '700' }}
          />
          <TextWidget
            text={`${streakCount} Day Streak`}
            style={{ fontSize: 24, color: textColor, fontWeight: '900', marginTop: 4 }}
          />
        </FlexWidget>
        <TextWidget
          text={isStreakActive ? '🚀' : '💀'}
          style={{ fontSize: 36 }}
        />
      </FlexWidget>

      {/* Bottom Data Section */}
      <FlexWidget
        style={{
          flex: 1,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="Total Focus Points"
            style={{ fontSize: 13, color: '#94A3B8', fontWeight: '500' }}
          />
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <TextWidget
              text="⚡"
              style={{ fontSize: 20 }}
            />
            <TextWidget
              text={`${points} XP`}
              style={{ fontSize: 22, color: '#38BDF8', fontWeight: '900', marginLeft: 6 }}
            />
          </FlexWidget>
        </FlexWidget>
        
        <FlexWidget
          style={{
            backgroundColor: '#1E293B',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#334155'
          }}
        >
          <TextWidget
            text="OPEN APP"
            style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '800' }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
