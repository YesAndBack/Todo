'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from '../lib/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <Notifications />
      <AuthProvider>
        {children}
      </AuthProvider>
    </MantineProvider>
  );
}