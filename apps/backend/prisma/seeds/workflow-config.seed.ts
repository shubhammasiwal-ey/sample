import { ActiveStatus, PrismaClient } from '@prisma/client';
import { bo_workflow_config } from './data/bo_workflow_config.data';

const toNumber = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toActiveStatus = (value?: string) => (value === 'Y' ? ActiveStatus.Y : ActiveStatus.N);

export async function seedWorkflowConfig(prisma: PrismaClient) {
  try {
    const configs = bo_workflow_config.filter((row) => row.service_id === '943.0');

    for (const row of configs) {
      const service = await prisma.service.findFirst({
        where: { service_id: row.service_id },
      });

      const departmentId = toNumber(row.department_id) || service?.department_id || 0;

      await prisma.applicationWorkflowConfiguration.upsert({
        where: { id: toNumber(row.id) },
        update: {
          step: toNumber(row.step),
          departmentId,
          serviceId: row.service_id,
          processingLevel: (row.processing_level as any) || 'District',
          currentRoleId: toNumber(row.current_role_id),
          formTypeId: toNumber(row.form_type_id),
          nextRoleId: toNumber(row.next_role_id),
          approverId: toNumber(row.approver_id),
          forwardRoleId: toNumber(row.forward_role_id),
          revertRoleId: toNumber(row.revert_role_id),
          isDelayReasonRequired: toActiveStatus(row.is_delay_reason_required),
          timeInHours: row.time_in_hours || '0',
          canRevertToInvestor: toActiveStatus(row.can_revert_to_investor),
          canVerifyDocument: toActiveStatus(row.can_verify_document),
          canForwardToMultipleRoleId: row.can_forward_to_multiple_role_id || null,
          canForwardToMultipleUserId: row.can_forward_to_multiple_user_id || null,
          isOwnDepartment: toActiveStatus(row.is_own_department),
          permissableTabFormId: row.permissable_tab_form_id || '',
          documentShowLast: toActiveStatus(row.document_show_last),
          processAnytime: toActiveStatus(row.process_anytime),
          showLiceneceList: row.show_licenece_list || '0',
          showFieldEditableOrNot: row.show_field_editable_or_not || '0',
          formServiceJs: row.form_service_js || '',
          formActionController: row.form_action_controller || '',
          subformActionName: row.subform_action_name || '',
          licenceNumberFormat: row.licence_number_format || null,
        },
        create: {
          id: toNumber(row.id),
          step: toNumber(row.step),
          departmentId,
          serviceId: row.service_id,
          processingLevel: (row.processing_level as any) || 'District',
          currentRoleId: toNumber(row.current_role_id),
          formTypeId: toNumber(row.form_type_id),
          nextRoleId: toNumber(row.next_role_id),
          approverId: toNumber(row.approver_id),
          forwardRoleId: toNumber(row.forward_role_id),
          revertRoleId: toNumber(row.revert_role_id),
          isDelayReasonRequired: toActiveStatus(row.is_delay_reason_required),
          timeInHours: row.time_in_hours || '0',
          canRevertToInvestor: toActiveStatus(row.can_revert_to_investor),
          canVerifyDocument: toActiveStatus(row.can_verify_document),
          canForwardToMultipleRoleId: row.can_forward_to_multiple_role_id || null,
          canForwardToMultipleUserId: row.can_forward_to_multiple_user_id || null,
          isOwnDepartment: toActiveStatus(row.is_own_department),
          permissableTabFormId: row.permissable_tab_form_id || '',
          documentShowLast: toActiveStatus(row.document_show_last),
          processAnytime: toActiveStatus(row.process_anytime),
          showLiceneceList: row.show_licenece_list || '0',
          showFieldEditableOrNot: row.show_field_editable_or_not || '0',
          formServiceJs: row.form_service_js || '',
          formActionController: row.form_action_controller || '',
          subformActionName: row.subform_action_name || '',
          licenceNumberFormat: row.licence_number_format || null,
        },
      });
    }

    console.log(`  seeded ${configs.length} workflow configurations`);
  } catch (error) {
    console.error('  workflow config seeding failed:', error);
    throw error;
  }
}
