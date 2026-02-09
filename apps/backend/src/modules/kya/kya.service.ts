import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateKyaQuestionDto, UpdateKyaQuestionDto } from './dto';

@Injectable()
export class KyaService {
    constructor(private prisma: PrismaService) { }

    // Get all KYA categories
    async getCategories() {
        return this.prisma.kyaCategory.findMany({
            where: { isActive: true },
            select: {
                id: true,
                categoryName: true,
            },
            orderBy: { id: 'asc' },
        });
    }

    // Create a new category
    async createCategory(categoryName: string) {
        if (!categoryName || categoryName.trim() === '') {
            throw new BadRequestException('Category name is required');
        }
        return this.prisma.kyaCategory.create({
            data: { categoryName: categoryName.trim() },
        });
    }

    // Update a category
    async updateCategory(id: number, categoryName: string) {
        const existing = await this.prisma.kyaCategory.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return this.prisma.kyaCategory.update({
            where: { id },
            data: { categoryName: categoryName.trim() },
        });
    }

    // Soft delete a category
    async deleteCategory(id: number) {
        const existing = await this.prisma.kyaCategory.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return this.prisma.kyaCategory.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Get all questions with options and service mappings
    async getQuestions() {
        return this.prisma.kyaQuestion.findMany({
            where: { isActive: true },
            include: {
                category: {
                    select: { id: true, categoryName: true },
                },
                options: {
                    where: { isActive: true },
                    include: {
                        serviceMappings: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                serviceId: true,
                            },
                        },
                    },
                },
            },
            orderBy: { id: 'asc' },
        });
    }

    // Create a new question with options
    async createQuestion(dto: CreateKyaQuestionDto, files?: any) {
        // Handle file upload path
        let urlDocument: string | null = null;
        if (files?.url_document?.[0]) {
            urlDocument = `uploads/kya/${files.url_document[0].filename}`;
        }

        // Parse options if string
        let optionDetails = dto.optionDetails;
        if (typeof dto.optionDetails === 'string') {
            try {
                optionDetails = JSON.parse(dto.optionDetails);
            } catch {
                throw new BadRequestException('Invalid JSON in optionDetails');
            }
        }

        // Convert FormData string values to proper types
        const categoryId = typeof dto.categoryId === 'string' ? parseInt(dto.categoryId) : dto.categoryId;
        const isDependent = typeof dto.isDependent === 'string' ? dto.isDependent === 'true' : (dto.isDependent ?? false);
        const isMandatory = typeof dto.isMandatory === 'string' ? dto.isMandatory === 'true' : (dto.isMandatory ?? true);
        const isTooltipAvailable = typeof dto.isTooltipAvailable === 'string' ? dto.isTooltipAvailable === 'true' : (dto.isTooltipAvailable ?? false);
        const showReferenceDocument = typeof dto.showReferenceDocument === 'string' ? dto.showReferenceDocument === 'true' : (dto.showReferenceDocument ?? false);
        const parentQuestionId = dto.parentQuestionId ? (typeof dto.parentQuestionId === 'string' ? parseInt(dto.parentQuestionId) : dto.parentQuestionId) : null;
        const kyaOptionId = dto.kyaOptionId ? (typeof dto.kyaOptionId === 'string' ? parseInt(dto.kyaOptionId) : dto.kyaOptionId) : null;
        const userId = dto.userId ? (typeof dto.userId === 'string' ? parseInt(dto.userId) : dto.userId) : null;

        return this.prisma.$transaction(async (tx) => {
            // Create the question
            const question = await tx.kyaQuestion.create({
                data: {
                    categoryId,
                    questionLabel: dto.questionLabel,
                    fieldType: dto.fieldType,
                    isDependent,
                    parentQuestionId,
                    kyaOptionId,
                    isMandatory,
                    isTooltipAvailable,
                    tooltipText: dto.tooltipText || null,
                    showReferenceDocument,
                    urlDocument,
                    userId,
                },
            });

            // Create options and service mappings
            if (optionDetails && Array.isArray(optionDetails)) {
                for (const opt of optionDetails) {
                    const option = await tx.kyaOption.create({
                        data: {
                            questionId: question.id,
                            optionLabel: opt.option_label,
                        },
                    });

                    // Create service mappings
                    if (opt.approvals && Array.isArray(opt.approvals)) {
                        for (const serviceId of opt.approvals) {
                            await tx.kyaServiceMapping.create({
                                data: {
                                    optionId: option.id,
                                    serviceId: Number(serviceId),
                                },
                            });
                        }
                    }
                }
            }

            return { message: 'KYA Question created successfully', questionId: question.id };
        });
    }

    // Update a question
    async updateQuestion(id: number, dto: UpdateKyaQuestionDto, files?: any) {
        const existing = await this.prisma.kyaQuestion.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Question with ID ${id} not found`);
        }

        // Handle file upload
        let urlDocument = existing.urlDocument;
        if (files?.url_document?.[0]) {
            urlDocument = `uploads/kya/${files.url_document[0].filename}`;
        }

        // Parse options if string
        let optionDetails = dto.optionDetails;
        if (typeof dto.optionDetails === 'string') {
            try {
                optionDetails = JSON.parse(dto.optionDetails);
            } catch {
                throw new BadRequestException('Invalid JSON in optionDetails');
            }
        }

        // Convert FormData string values to proper types
        const categoryId = dto.categoryId ? (typeof dto.categoryId === 'string' ? parseInt(dto.categoryId) : dto.categoryId) : undefined;
        const isDependent = dto.isDependent !== undefined ? (typeof dto.isDependent === 'string' ? dto.isDependent === 'true' : dto.isDependent) : undefined;
        const isMandatory = dto.isMandatory !== undefined ? (typeof dto.isMandatory === 'string' ? dto.isMandatory === 'true' : dto.isMandatory) : undefined;
        const isTooltipAvailable = dto.isTooltipAvailable !== undefined ? (typeof dto.isTooltipAvailable === 'string' ? dto.isTooltipAvailable === 'true' : dto.isTooltipAvailable) : undefined;
        const showReferenceDocument = dto.showReferenceDocument !== undefined ? (typeof dto.showReferenceDocument === 'string' ? dto.showReferenceDocument === 'true' : dto.showReferenceDocument) : undefined;
        const parentQuestionId = dto.parentQuestionId ? (typeof dto.parentQuestionId === 'string' ? parseInt(dto.parentQuestionId) : dto.parentQuestionId) : null;
        const kyaOptionId = dto.kyaOptionId ? (typeof dto.kyaOptionId === 'string' ? parseInt(dto.kyaOptionId) : dto.kyaOptionId) : null;
        const userId = dto.userId ? (typeof dto.userId === 'string' ? parseInt(dto.userId) : dto.userId) : null;

        return this.prisma.$transaction(async (tx) => {
            // Update question
            await tx.kyaQuestion.update({
                where: { id },
                data: {
                    categoryId,
                    questionLabel: dto.questionLabel,
                    fieldType: dto.fieldType,
                    isDependent,
                    parentQuestionId,
                    kyaOptionId,
                    isMandatory,
                    isTooltipAvailable,
                    tooltipText: dto.tooltipText,
                    showReferenceDocument,
                    urlDocument,
                    updatedBy: userId,
                },
            });

            // Update options
            if (optionDetails && Array.isArray(optionDetails)) {
                for (const opt of optionDetails) {
                    if (opt.id) {
                        // Update existing option
                        await tx.kyaOption.update({
                            where: { id: opt.id },
                            data: { optionLabel: opt.option_label },
                        });

                        // Deactivate old mappings
                        await tx.kyaServiceMapping.updateMany({
                            where: { optionId: opt.id },
                            data: { isActive: false },
                        });

                        // Create new mappings
                        if (opt.approvals && Array.isArray(opt.approvals)) {
                            for (const serviceId of opt.approvals) {
                                await tx.kyaServiceMapping.upsert({
                                    where: {
                                        optionId_serviceId: { optionId: opt.id, serviceId: Number(serviceId) },
                                    },
                                    update: { isActive: true },
                                    create: {
                                        optionId: opt.id,
                                        serviceId: Number(serviceId),
                                    },
                                });
                            }
                        }
                    } else {
                        // Create new option
                        const newOption = await tx.kyaOption.create({
                            data: {
                                questionId: id,
                                optionLabel: opt.option_label,
                            },
                        });

                        if (opt.approvals && Array.isArray(opt.approvals)) {
                            for (const serviceId of opt.approvals) {
                                await tx.kyaServiceMapping.create({
                                    data: {
                                        optionId: newOption.id,
                                        serviceId: Number(serviceId),
                                    },
                                });
                            }
                        }
                    }
                }
            }

            return { message: 'KYA Question updated successfully' };
        });
    }

    // Soft delete a question
    async deleteQuestion(id: number, userId?: number) {
        const existing = await this.prisma.kyaQuestion.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Question with ID ${id} not found`);
        }

        return this.prisma.$transaction(async (tx) => {
            // Soft delete question
            await tx.kyaQuestion.update({
                where: { id },
                data: {
                    isActive: false,
                    updatedBy: userId,
                },
            });

            // Get options for this question
            const options = await tx.kyaOption.findMany({
                where: { questionId: id, isActive: true },
            });

            // Soft delete service mappings
            if (options.length > 0) {
                const optionIds = options.map((o) => o.id);
                await tx.kyaServiceMapping.updateMany({
                    where: { optionId: { in: optionIds } },
                    data: { isActive: false },
                });
            }

            // Soft delete options
            await tx.kyaOption.updateMany({
                where: { questionId: id },
                data: { isActive: false },
            });

            return { message: 'KYA Question deleted successfully' };
        });
    }

    // Get all services (for dropdown in frontend)
    async getServices() {
        return this.prisma.service.findMany({
            where: { isActive: true },
            select: {
                id: true,
                service_name: true,
                department: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { service_name: 'asc' },
        });
    }

    // Get all departments
    async getDepartments() {
        return this.prisma.department.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                abbreviation: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    // ------------------SERVICE DETAILS METHODS------------------

    // Get all service details
    async getServiceDetails() {
        return this.prisma.serviceDetail.findMany({
            where: { isActive: true },
            include: {
                service: {
            select: {
                id: true,
                service_name: true,
                service_level: true,
                department: {
                    select: { id: true, name: true },
                },
            },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Create service detail with file uploads
    async createServiceDetail(body: any, files: any) {
        const serviceId = parseInt(body.serviceId);
        const timeline = body.timeline ? parseInt(body.timeline) : null;

        const data: any = {
            serviceId,
            serviceCategory: body.serviceCategory,
            authorityName: body.authorityName || null,
            timeline,
        };

        // Handle file uploads
        if (files?.sopDocument?.[0]?.filename) {
            data.sopDocument = `uploads/kya/${files.sopDocument[0].filename}`;
        }
        if (files?.feeStructureDocument?.[0]?.filename) {
            data.feeStructureDocument = `uploads/kya/${files.feeStructureDocument[0].filename}`;
        }
        if (files?.listOfRequiredDocuments?.[0]?.filename) {
            data.listOfRequiredDocuments = `uploads/kya/${files.listOfRequiredDocuments[0].filename}`;
        }

        return this.prisma.serviceDetail.create({ data });
    }

    // Update service detail with file uploads
    async updateServiceDetail(id: number, body: any, files: any) {
        const existing = await this.prisma.serviceDetail.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Service detail with ID ${id} not found`);
        }

        const timeline = body.timeline ? parseInt(body.timeline) : null;

        const data: any = {
            serviceCategory: body.serviceCategory,
            authorityName: body.authorityName || null,
            timeline,
        };

        // Handle file uploads (only update if new files provided)
        if (files?.sopDocument?.[0]?.filename) {
            data.sopDocument = `uploads/kya/${files.sopDocument[0].filename}`;
        }
        if (files?.feeStructureDocument?.[0]?.filename) {
            data.feeStructureDocument = `uploads/kya/${files.feeStructureDocument[0].filename}`;
        }
        if (files?.listOfRequiredDocuments?.[0]?.filename) {
            data.listOfRequiredDocuments = `uploads/kya/${files.listOfRequiredDocuments[0].filename}`;
        }

        return this.prisma.serviceDetail.update({
            where: { id },
            data,
        });
    }

    // Soft delete service detail
    async deleteServiceDetail(id: number) {
        const existing = await this.prisma.serviceDetail.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Service detail with ID ${id} not found`);
        }

        return this.prisma.serviceDetail.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Get services by IDs for KYA approvals
    async getServiceDetailsByIds(serviceIds: number[]) {
        console.log('🔍 Received internal IDs:', serviceIds);

        // Step 1: Look up services by internal ID to get their service_id strings
        const services = await this.prisma.service.findMany({
            where: {
                id: { in: serviceIds },
                isActive: true,
            },
            select: {
                id: true,
                service_id: true,
                service_name: true,
                service_level: true,
            },
        });

        console.log('📦 Found services:', services);

        // Step 2: Extract service_id strings
        const serviceIdStrings = services
            .map(s => s.service_id)
            .filter((id): id is string => id !== null);

        console.log('🔑 Service ID strings:', serviceIdStrings);

        // Step 3: Query service details using service_id strings
        const serviceDetails = await this.prisma.serviceDetail.findMany({
            where: {
                serviceId: { in: serviceIdStrings },
                isActive: true,
            },
            orderBy: { serviceCategory: 'asc' },
        });

        console.log('📋 Found service details:', serviceDetails);

        // Step 4: Join service details with service info
        const result = serviceDetails.map(detail => {
            const service = services.find(s => s.service_id === detail.serviceId);
            return {
                id: detail.id,
                service_category: detail.serviceCategory,
                service_name: service?.service_name || '',
                is_central_govt_service: service?.service_level === 'Central' ? 'Y' : 'N',
                sop_document: detail.sopDocument,
                fee_structure_document: detail.feeStructureDocument,
                timeline: detail.timeline?.toString() || null,
                list_of_required_documents: detail.listOfRequiredDocuments,
                authority_name: detail.authorityName,
            };
        });

        console.log('✅ Transformed result:', result);
        return result;
    }
}
