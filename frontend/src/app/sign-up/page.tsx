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
import { api } from '../lib/api';
import { notifications } from '@mantine/notifications';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      username: (value) => (!value ? 'Имя пользователя обязательно' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Некорректный email'),
      password: (value) =>
        value.length < 6 ? 'Пароль должен быть не менее 6 символов' : null,
      confirmPassword: (value, values) =>
        value !== values.password ? 'Пароли не совпадают' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await api.auth.register({
        username: values.username,
        email: values.email,
        password: values.password
      });
      
      notifications.show({
        title: 'Успех',
        message: 'Регистрация прошла успешно',
        color: 'green',
      });
      
      router.push('/sign-in');
    } catch (error: any) {
      console.error('Register error:', error);
      
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Ошибка регистрации',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb={20}>
        Регистрация
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

            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Пароль"
              placeholder="Введите пароль"
              required
              {...form.getInputProps('password')}
            />

            <PasswordInput
              label="Подтверждение пароля"
              placeholder="Повторите пароль"
              required
              {...form.getInputProps('confirmPassword')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Зарегистрироваться
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt={20}>
          Уже есть аккаунт?{' '}
          <Anchor size="sm" href="/sign-in">
            Войти
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}