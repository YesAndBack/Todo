'use client';

import '@mantine/core/styles.css';
import { MantineProvider, Button, Card, Title, Center, Group } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { useRouter } from 'next/navigation';

export default function App() {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/sign-in');
    notifications.show({
      title: 'Sign In',
      message: 'Нажата кнопка входа',
      color: 'blue',
    });
  };

  const handleRegister = () => {
    router.push('/register');
    notifications.show({
      title: 'Register',
      message: 'Нажата кнопка регистрации',
      color: 'green',
    });
  };

  return (
    <MantineProvider>
      <Notifications />
      <Center h="100vh">
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Title order={3} ta="center">Добро пожаловать!</Title>
          <Group justify="center" mt="md">
            <Button color="blue" onClick={handleSignIn}>Sign In</Button>
            <Button color="green" onClick={handleRegister}>Register</Button>
          </Group>
        </Card>
      </Center>
    </MantineProvider>
  );
}
