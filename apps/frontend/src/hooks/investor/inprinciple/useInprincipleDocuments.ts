import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface InprincipleDocumentItem {
  id: number;
  checklistId: string;
  name: string;
  extension: string;
  maxSize: number;
  documentType?: string | null;
  departmentId?: number;
  isRequired?: string;
  comment?: string;
}

export const useInprincipleDocuments = (serviceId?: string) => {
  return useQuery<InprincipleDocumentItem[]>({
    queryKey: ['inprinciple-documents', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const response = await apiClient.get(`/investor/inprinciple/documents?serviceId=${serviceId}`);
      return response.data;
    },
    enabled: !!serviceId,
  });
};
