import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetPreview } from './WidgetPreview';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  try {
    const settingsStr = await AsyncStorage.getItem('@preptrace_settings_v2');
    let points = 0;
    let streakCount = 0;
    
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      points = settings.points || 0;
      streakCount = settings.streakCount || 0;
    }

    props.renderWidget(<WidgetPreview points={points} streakCount={streakCount} />);
  } catch (error) {
    console.error('Error rendering widget:', error);
    props.renderWidget(<WidgetPreview points={0} streakCount={0} />);
  }
}
