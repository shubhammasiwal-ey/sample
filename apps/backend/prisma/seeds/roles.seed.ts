import { PrismaClient } from '@prisma/client';
import { bo_workflow_config } from './data/bo_workflow_config.data';
import { bo_roles } from './data/bo_roles.data';

const REQUIRED_ROLE_IDS = new Set<number>();

const loadRequiredRoles = () => {
  bo_workflow_config
    .filter((row) => row.service_id === '943.0')
    .forEach((row) => {
      ['current_role_id', 'next_role_id', 'approver_id', 'forward_role_id', 'revert_role_id']
        .forEach((key) => {
          const value = Number(row[key] || 0);
          if (Number.isFinite(value) && value > 0) {
            REQUIRED_ROLE_IDS.add(value);
          }
        });
    });
};

export async function seedRoles(prisma: PrismaClient) {
  try {
    const baseRoles = [
      { id: 1, name: 'admin' },
      { id: 2, name: 'investor' },
      { id: 3, name: 'department_user' },
      { id: 4, name: 'Joint_Director' },
    ];

    for (const role of baseRoles) {
      await prisma.roles.upsert({
        where: { id: role.id },
        update: { name: role.name },
        create: role,
      });
    }

    const rolesFromCsv = bo_roles
      .filter((row) => REQUIRED_ROLE_IDS.has(Number(row.role_id)))
      .map((row) => ({
        id: Number(row.role_id),
        name: row.role_name || `role_${row.role_id}`,
      }));

    for (const role of rolesFromCsv) {
      if (!Number.isFinite(role.id)) continue;
      await prisma.roles.upsert({
        where: { id: role.id },
        update: { name: role.name },
        create: role,
      });
    }

    console.log(`  seeded ${baseRoles.length + rolesFromCsv.length} roles`);
  } catch (error) {
    console.error('  role seeding failed:', error);
    throw error;
  }
}
