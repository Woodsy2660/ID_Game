import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.black },
        animation: 'fade',
      }}
    />
  );
}
