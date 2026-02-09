import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { User } from '@/types/user';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data;
    },
  });
};

export const useCreateUser = () => {
  return useMutation({
    mutationFn: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiClient.post('/users', data),
  });
};

export const useUpdateUser = () => {
  return useMutation({
    mutationFn: (data: { id: number; data: Partial<User> }) =>
      apiClient.put(`/users/${data.id}`, data.data),
  });
};

export const useDeleteUser = () => {
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/users/${id}`),
  });
};
