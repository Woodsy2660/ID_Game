import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

/**
 * Auth layout stub — placeholder for the auth/lobby flow.
 * This will be built by the other developer.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.black },
      }}
    />
  );
}
