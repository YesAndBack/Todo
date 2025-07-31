'use client';

import { useEffect, useState } from 'react';
import {
  Container, Title, Button, Stack, Group, Card, Text, Checkbox, ActionIcon,
  Modal, TextInput, Textarea, Badge, Loader, Center, Select
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { api, Task, TaskData } from '../lib/api';
import { useAuth } from '../lib/auth-context';


export default function TasksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure();

  const form = useForm<TaskData>({
    initialValues: {
      title: '',
      description: '',
      completed: false,
      due_date: '',
    },
    validate: {
      title: (value) => (!value ? 'Название задачи обязательно' : null),
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) loadTasks();
  }, [filter, user]);

  const loadTasks = async () => {
    try {
      setTaskLoading(true);
      const params = filter ? { completed: filter === 'completed' } : undefined;
      const response = await api.tasks.list(params);
      setTasks(response.data);
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить задачи',
        color: 'red',
      });
    } finally {
      setTaskLoading(false);
    }
  };

  const handleSubmit = async (values: TaskData) => {
    try {
      if (editingTask) {
        await api.tasks.update(editingTask.id, values);
        notifications.show({ title: 'Успех', message: 'Задача обновлена', color: 'green' });
      } else {
        await api.tasks.create(values);
        notifications.show({ title: 'Успех', message: 'Задача создана', color: 'green' });
      }
      form.reset();
      setEditingTask(null);
      close();
      loadTasks();
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Ошибка при сохранении задачи',
        color: 'red',
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.setValues({
      title: task.title,
      description: task.description || '',
      completed: task.completed,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
    });
    open();
  };

  const handleDelete = async (taskId: number) => {
    try {
      await api.tasks.delete(taskId);
      notifications.show({ title: 'Успех', message: 'Задача удалена', color: 'blue' });
      loadTasks();
    } catch {
      notifications.show({ title: 'Ошибка', message: 'Не удалось удалить задачу', color: 'red' });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await api.tasks.update(task.id, { completed: !task.completed });
      loadTasks();
    } catch {
      notifications.show({ title: 'Ошибка', message: 'Не удалось обновить статус задачи', color: 'red' });
    }
  };

    const handleLogout = async () => {
        await api.auth.logout();
        router.push('/sign-in');
    };

  const handleNewTask = () => {
    setEditingTask(null);
    form.reset();
    open();
  };

  if (loading || !user) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Мои задачи</Title>
        <Group>
          <Text size="sm">Привет, {user.username}!</Text>
          <Button variant="outline" color="red" onClick={handleLogout}>Выйти</Button>
        </Group>
      </Group>

      <Group justify="space-between" mb="md">
        <Button onClick={handleNewTask}>Новая задача</Button>
        <Select
          placeholder="Фильтр"
          data={[
            { value: '', label: 'Все задачи' },
            { value: 'pending', label: 'Не выполненные' },
            { value: 'completed', label: 'Выполненные' },
          ]}
          value={filter}
          onChange={setFilter}
          clearable
        />
      </Group>

      {taskLoading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : (
        <Stack gap="md">
          {filteredTasks.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">Задач пока нет</Text>
            </Center>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" align="flex-start">
                  <Group align="flex-start">
                    <Checkbox
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task)}
                      mt={4}
                    />
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text fw={500} td={task.completed ? 'line-through' : 'none'} c={task.completed ? 'dimmed' : 'dark'}>
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text size="sm" c="dimmed">{task.description}</Text>
                      )}
                      <Group gap="xs">
                        <Badge color={task.completed ? 'green' : 'blue'} variant="light">
                          {task.completed ? 'Выполнено' : 'В процессе'}
                        </Badge>
                        {task.due_date && (
                          <Badge color="orange" variant="light">
                            {new Date(task.due_date).toLocaleDateString()}
                          </Badge>
                        )}
                      </Group>
                    </Stack>
                  </Group>

                  <Group gap="xs">
                    <ActionIcon variant="light" color="blue" onClick={() => handleEdit(task)}>
                      ✏️
                    </ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => handleDelete(task.id)}>
                      🗑️
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))
          )}
        </Stack>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title={editingTask ? 'Редактировать задачу' : 'Новая задача'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Название"
              placeholder="Введите название задачи"
              required
              {...form.getInputProps('title')}
            />
            <Textarea
              label="Описание"
              placeholder="Описание задачи (необязательно)"
              {...form.getInputProps('description')}
            />
            <TextInput
              label="Срок выполнения"
              type="date"
              {...form.getInputProps('due_date')}
            />
            <Checkbox
              label="Выполнено"
              {...form.getInputProps('completed', { type: 'checkbox' })}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="outline" onClick={close}>Отмена</Button>
              <Button type="submit">{editingTask ? 'Обновить' : 'Создать'}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
