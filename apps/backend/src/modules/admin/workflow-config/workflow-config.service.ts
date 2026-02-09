import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWorkflowConfigDto, UpdateWorkflowConfigDto } from './dto';

@Injectable()
export class WorkflowConfigService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: {
    serviceId?: string;
    departmentId?: number;
    processingLevel?: string;
    formTypeId?: number;
  }) {
    return this.prisma.applicationWorkflowConfiguration.findMany({
      where: {
        serviceId: filters?.serviceId,
        departmentId: filters?.departmentId,
        processingLevel: filters?.processingLevel as any,
        formTypeId: filters?.formTypeId,
      },
      orderBy: { id: 'desc' },
      include: {
        department: true,
        service: true,
        formType: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.applicationWorkflowConfiguration.findUnique({
      where: { id },
      include: {
        department: true,
        service: true,
        formType: true,
      },
    });
  }

  create(data: CreateWorkflowConfigDto) {
    return this.prisma.applicationWorkflowConfiguration.create({
      data: {
        step: data.step ?? 0,
        departmentId: data.departmentId,
        serviceId: data.serviceId,
        processingLevel: (data.processingLevel as any) || 'District',
        currentRoleId: data.currentRoleId,
        formTypeId: data.formTypeId,
        nextRoleId: data.nextRoleId,
        approverId: data.approverId,
        forwardRoleId: data.forwardRoleId,
        revertRoleId: data.revertRoleId,
        isDelayReasonRequired: (data.isDelayReasonRequired as any) || 'N',
        timeInHours: data.timeInHours ?? '0',
        canRevertToInvestor: (data.canRevertToInvestor as any) || 'N',
        canVerifyDocument: (data.canVerifyDocument as any) || 'N',
        canForwardToMultipleRoleId: data.canForwardToMultipleRoleId || null,
        canForwardToMultipleUserId: data.canForwardToMultipleUserId || null,
        isOwnDepartment: (data.isOwnDepartment as any) || 'N',
        permissableTabFormId: data.permissableTabFormId,
        documentShowLast: (data.documentShowLast as any) || 'N',
        processAnytime: (data.processAnytime as any) || 'N',
        showLiceneceList: data.showLiceneceList ?? '0',
        showFieldEditableOrNot: data.showFieldEditableOrNot ?? '0',
        formServiceJs: data.formServiceJs ?? '',
        formActionController: data.formActionController ?? '',
        subformActionName: data.subformActionName,
        licenceNumberFormat: data.licenceNumberFormat || null,
      },
    });
  }

  update(id: number, data: UpdateWorkflowConfigDto) {
    return this.prisma.applicationWorkflowConfiguration.update({
      where: { id },
      data: {
        step: data.step,
        departmentId: data.departmentId,
        serviceId: data.serviceId,
        processingLevel: data.processingLevel as any,
        currentRoleId: data.currentRoleId,
        formTypeId: data.formTypeId,
        nextRoleId: data.nextRoleId,
        approverId: data.approverId,
        forwardRoleId: data.forwardRoleId,
        revertRoleId: data.revertRoleId,
        isDelayReasonRequired: data.isDelayReasonRequired as any,
        timeInHours: data.timeInHours,
        canRevertToInvestor: data.canRevertToInvestor as any,
        canVerifyDocument: data.canVerifyDocument as any,
        canForwardToMultipleRoleId: data.canForwardToMultipleRoleId,
        canForwardToMultipleUserId: data.canForwardToMultipleUserId,
        isOwnDepartment: data.isOwnDepartment as any,
        permissableTabFormId: data.permissableTabFormId,
        documentShowLast: data.documentShowLast as any,
        processAnytime: data.processAnytime as any,
        showLiceneceList: data.showLiceneceList,
        showFieldEditableOrNot: data.showFieldEditableOrNot,
        formServiceJs: data.formServiceJs,
        formActionController: data.formActionController,
        subformActionName: data.subformActionName,
        licenceNumberFormat: data.licenceNumberFormat,
      },
    });
  }

  delete(id: number) {
    return this.prisma.applicationWorkflowConfiguration.delete({
      where: { id },
    });
  }
}
