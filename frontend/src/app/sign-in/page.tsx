'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Anchor,
  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../lib/auth-context';


export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (!value ? 'Имя пользователя обязательно' : null),
      password: (value) => (!value ? 'Пароль обязателен' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      router.push('/tasks');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb={20}>
        Вход в систему
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Имя пользователя"
              placeholder="Введите имя пользователя"
              required
              {...form.getInputProps('username')}
            />

            <PasswordInput
              label="Пароль"
              placeholder="Введите пароль"
              required
              {...form.getInputProps('password')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Войти
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt={20}>
          Нет аккаунта?{' '}
          <Anchor size="sm" href="/sign-up">
            Зарегистрироваться
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}