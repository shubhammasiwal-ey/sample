import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  // ========================= FIND ALL =========================
  async findAll(filters?: { isActive?: boolean; search?: string; departmentIds?: number[]; swcsServiceIds?: number[] }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { service_name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.departmentIds?.length) {
      where.department_id = { in: filters.departmentIds };
    }

    if (filters?.swcsServiceIds?.length) {
      where.swcs_service_id = { in: filters.swcsServiceIds };
    }

    const services = await this.prisma.service.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            issuerId: true,
          },
        },
        issuer: {
          select: {
            id: true,
            name: true,
            isIssuerActive: true,
          },
        },
      },
    });
    
    return services.map((s) => ({
      ...s,
      department_name: s.department?.name ?? null,
      issuer_name: s.issuer?.name ?? null,
    }));

    // return this.prisma.service.findMany({
    //   where,
    //   orderBy: { id: 'asc' },
    // });
  }

  // ========================= FIND ONE =========================
  async findOne(id: number) {

    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            issuerId: true,
          },
        },
        issuer: {
          select: {
            id: true,
            name: true,
            isIssuerActive: true,
          },
        },
      },
    });

    if (!service) return null;

    return {
      ...service,
      department_name: service.department?.name ?? null,
      issuer_name: service.issuer?.name ?? null,
    };

    // return this.prisma.service.findUnique({
    //   where: { id },
    // });
  }

  // ========================= CREATE =========================
  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        service_id: dto.service_id,
        swcs_service_id: dto.swcs_service_id,
        service_level: dto.service_level,
        document_checklist: dto.document_checklist,
        document_checklist_mapping: dto.document_checklist_mapping,
        document_type_mapping: dto.document_type_mapping,
        document_checkpoint_mapping: dto.document_checkpoint_mapping,
        comments: dto.comments,
        service_name: dto.service_name,
        service_url: dto.service_url,
        development_url: dto.development_url,
        is_in_SWCS_act: dto.is_in_SWCS_act,
        is_integrated_with_dms: dto.is_integrated_with_dms,
        service_status: dto.service_status,
        isActive: dto.isActive,
        user_agent: dto.user_agent,
        ipaddress: dto.ipaddress,
        service_go_live_date: dto.service_go_live_date,
        service_end_date: dto.service_end_date,

        // 🔥 FIXED (Important)
        department: dto.department_id
          ? { connect: { id: dto.department_id } }
          : undefined,
        issuer: dto.issuer_id
          ? { connect: { id: dto.issuer_id } }
          : undefined,
      },
    });
  }


  // ========================= UPDATE =========================
  async update(id: number, dto: UpdateServiceDto) {
    return this.prisma.service.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  // ========================= DELETE =========================
  async delete(id: number) {
    return this.prisma.service.delete({
      where: { id },
    });
  }

  // ========================= TOGGLE ACTIVE =========================
  async toggle(id: number) {
    const service = await this.findOne(id);

    return this.prisma.service.update({
      where: { id },
      data: {
        isActive: !service?.isActive,
        updatedAt: new Date(),
      },
    });
  }
}
