import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface WorkflowConfig {
  id: number;
  step: number;
  departmentId: number;
  serviceId: string;
  processingLevel: string;
  currentRoleId: number;
  formTypeId: number;
  nextRoleId: number;
  approverId: number;
  forwardRoleId: number;
  revertRoleId: number;
  isDelayReasonRequired: string;
  timeInHours: string;
  canRevertToInvestor: string;
  canVerifyDocument: string;
  canForwardToMultipleRoleId?: string | null;
  canForwardToMultipleUserId?: string | null;
  isOwnDepartment: string;
  permissableTabFormId: string;
  documentShowLast: string;
  processAnytime: string;
  showLiceneceList: string;
  showFieldEditableOrNot: string;
  formServiceJs: string;
  formActionController: string;
  subformActionName: string;
  licenceNumberFormat?: string | null;
  department?: { id: number; name: string };
  service?: { id: number; service_name: string; service_id: string };
  formType?: { id: number; name: string };
}

export const useWorkflowConfigs = (filters?: {
  serviceId?: string;
  departmentId?: number;
  processingLevel?: string;
  formTypeId?: number;
}) => {
  return useQuery<WorkflowConfig[]>({
    queryKey: ['workflow-configs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.serviceId) params.append('serviceId', filters.serviceId);
      if (filters?.departmentId) params.append('departmentId', String(filters.departmentId));
      if (filters?.processingLevel) params.append('processingLevel', filters.processingLevel);
      if (filters?.formTypeId) params.append('formTypeId', String(filters.formTypeId));
      const response = await apiClient.get(`/admin/workflow-config?${params}`);
      return response.data;
    },
  });
};

export const useCreateWorkflowConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<WorkflowConfig>) => {
      const response = await apiClient.post('/admin/workflow-config', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-configs'] });
    },
  });
};

export const useUpdateWorkflowConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<WorkflowConfig> }) => {
      const response = await apiClient.patch(`/admin/workflow-config/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-configs'] });
    },
  });
};

export const useDeleteWorkflowConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/admin/workflow-config/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-configs'] });
    },
  });
};
