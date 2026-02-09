import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InprincipleService {
  constructor(private readonly prisma: PrismaService) {}

  // Build UBU ID from PAN + UK + district + primary activity initial.
  private buildUbuId(formData: any, districtId: number) {
    const pan = String(formData?.company?.pan || '').trim();
    const activity = String(formData?.company?.primary_activity || '').trim();
    const activityInitial = activity ? activity.charAt(0).toUpperCase() : '';
    const district = districtId ? String(districtId) : '';
    if (!pan || !district || !activityInitial) return null;
    return `${pan}UK${district}${activityInitial}`;
  }

  // Build app location from land details or corporate address.
  private buildAppLocation(formData: any) {
    const land = formData?.requirement?.land || {};
    const parts = [land.land_code, land.survey_no, land.village, land.block, land.district]
      .map((item: any) => String(item || '').trim())
      .filter(Boolean);

    if (parts.length) {
      return parts.join(', ');
    }

    const corp = formData?.company?.corp || {};
    return [corp.address1, corp.city, corp.block, corp.district]
      .map((item: any) => String(item || '').trim())
      .filter(Boolean)
      .join(', ');
  }

  // Prefer land district for master district mapping.
  private resolveMasterDistrictId(formData: any, fallbackDistrictId: number) {
    const landDistrict = Number(formData?.requirement?.land?.district || 0);
    return landDistrict || fallbackDistrictId;
  }

  // Draft edit URL.
  private buildRevertedCallbackUrl(serviceId: string, submissionId: number, departmentId?: number) {
    const params = new URLSearchParams();
    params.set('submissionId', String(submissionId));
    params.set('mode', 'edit');
    params.set('serviceId', String(serviceId));
    if (departmentId) params.set('departmentId', String(departmentId));
    return `/investor/inprinciple/new?${params.toString()}`;
  }

  // Deep merge while keeping latest __currentStep and non-empty values.
  private mergeDeep(base: any, override: any) {
    if (Array.isArray(base) || Array.isArray(override)) {
      return override ?? base;
    }
    if (base && typeof base === 'object' && override && typeof override === 'object') {
      const result: Record<string, any> = { ...base };
      Object.keys(override).forEach((key) => {
        if (key === '__currentStep') {
          const nextStep = Number(override[key]);
          const prevStep = Number(base?.[key]);
          if (Number.isFinite(nextStep)) {
            result[key] = nextStep;
          } else if (Number.isFinite(prevStep)) {
            result[key] = prevStep;
          }
          return;
        }
        result[key] = this.mergeDeep(base?.[key], override[key]);
      });
      return result;
    }
    if (override === '' || override === null || override === undefined) {
      return base ?? override;
    }
    return override ?? base;
  }

  // Normalize form data before saving.
  private sanitizeFormData(formData: any) {
    const normalized = this.mergeDeep({}, formData || {});

    if (normalized.project) {
      if (!Array.isArray(normalized.project.capacity_items)) {
        normalized.project.capacity_items = [];
      }
      if (!Array.isArray(normalized.project.product_items)) {
        normalized.project.product_items = [];
      }

      if (normalized.project.capacity_items.length > 0) {
        delete normalized.project.activity_nic;
        delete normalized.project.sector;
        delete normalized.project.item_description;
        delete normalized.project.proposed_capacity;
        delete normalized.project.unit_type;
      }
      if (normalized.project.product_items.length > 0) {
        delete normalized.project.product_annual_capacity;
        delete normalized.project.product_unit;
        delete normalized.project.product_hsn;
        delete normalized.project.product_description;
      }
    }

    if (normalized.promoter) {
      if (!Array.isArray(normalized.promoter.entries)) {
        normalized.promoter.entries = [];
      }
      normalized.promoter.entries = normalized.promoter.entries.map((entry: any) => {
        if (entry && typeof entry === 'object' && 'entries' in entry) {
          const next = { ...entry };
          delete next.entries;
          return next;
        }
        return entry;
      });

      if (normalized.promoter.entries.length > 0) {
        Object.keys(normalized.promoter).forEach((key) => {
          if (key === 'entries') return;
          const value = normalized.promoter[key];
          if (value === '' || value === null || value === undefined || value === false) {
            delete normalized.promoter[key];
          }
        });
      }
    }

    if (normalized.requirement?.water) {
      if (!Array.isArray(normalized.requirement.water.details)) {
        normalized.requirement.water.details = [];
      }
    }

    if (normalized.__currentStep !== undefined) {
      const step = Number(normalized.__currentStep);
      normalized.__currentStep = Number.isFinite(step) ? step : 0;
    }
    return normalized;
  }

  // Application print URL.
  private buildPrintAppUrl(submissionId: number) {
    return `/investor/inprinciple/print?submissionId=${submissionId}`;
  }

  // Format for UI display.
  private formatLabel(value: any) {
    if (!value) return 'N/A';
    const text = String(value).trim();
    if (!text) return 'N/A';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // List investor applications for dashboard accordion.
  async getInvestorApplications(options: { userId: bigint; serviceId?: string }) {
    const where: any = { userId: options.userId };
    if (options.serviceId) {
      where.serviceId = String(options.serviceId);
    }

    const submissions = await this.prisma.applicationSubmission.findMany({
      where,
      orderBy: { submissionId: 'desc' },
    });

    const appIds = submissions.map((item) => BigInt(item.submissionId));
    const spApps = appIds.length
      ? await this.prisma.spApplication.findMany({
          where: { appId: { in: appIds } },
        })
      : [];
    const spMap = new Map<string, any>(
      spApps.map((item) => [String(item.appId), item])
    );

    return submissions.map((submission) => {
      const formData = submission.fieldValue as any;
      const projectTypeRaw = formData?.company?.primary_activity;
      const projectType =
        projectTypeRaw === 'manufacturing'
          ? 'Manufacturing'
          : projectTypeRaw === 'service'
            ? 'Service'
            : this.formatLabel(projectTypeRaw);

      const projectCategory = this.formatLabel(formData?.finance?.project_category);
      const investmentValue = formData?.finance?.cost?.plant || formData?.finance?.cost?.total;
      const investment = investmentValue ? String(investmentValue) : 'N/A';
      const pollutionCategory = this.formatLabel(formData?.requirement?.pollution?.category);
      const spApp = spMap.get(String(submission.submissionId));
      const fallbackRevertUrl = this.buildRevertedCallbackUrl(
        submission.serviceId,
        submission.submissionId,
        submission.deptId || undefined
      );
      const fallbackPrintUrl = this.buildPrintAppUrl(submission.submissionId);

      return {
        submissionId: submission.submissionId,
        status: submission.applicationStatus,
        ubuId: submission.ubuId || null,
        unitName: submission.unitName || '',
        projectCategory,
        projectType,
        investment,
        pollutionCategory,
        revertedCallBackUrl: spApp?.revertedCallBackUrl || fallbackRevertUrl,
        printAppCallBackUrl: spApp?.printAppCallBackUrl || fallbackPrintUrl,
        downloadCertificateCallBackUrl: spApp?.downloadCertificateCallBackUrl || null,
      };
    });
  }

  // Load a saved draft for editing.
  async getDraftApplication(options: { submissionId: number; userId: bigint }) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    if (submission.userId !== options.userId) {
      throw new BadRequestException('Unauthorized draft access');
    }

    return {
      submissionId: submission.submissionId,
      status: submission.applicationStatus,
      formData: submission.fieldValue || {},
      unitName: submission.unitName || '',
      serviceId: submission.serviceId,
      departmentId: submission.deptId || null,
      formTypeId: submission.formId || null,
    };
  }

  // Fetch application history for activity log.
  async getApplicationHistory(options: { submissionId: number; userId: bigint }) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    if (submission.userId !== options.userId) {
      throw new BadRequestException('Unauthorized history access');
    }

    const history = await this.prisma.applicationHistory.findMany({
      where: { appId: String(options.submissionId) },
      orderBy: { addedDateTime: 'desc' },
    });

    return history.map((item, index) => ({
      id: item.historyId,
      sequence: index + 1,
      actionBy: item.roleUserInfo || item.approverDetails || (item.roleName ? item.roleName : 'Investor'),
      actionOn: item.addedDateTime,
      status: item.applicationStatus,
      comments: item.comments || '',
      nextRoleId: item.nextRoleId || null,
    }));
  }

  // Document checklist from service mapping.
  async getDocumentChecklist(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { service_id: serviceId },
    });

    if (!service?.document_checklist_mapping) {
      return [];
    }

    const mapping = Array.isArray(service.document_checklist_mapping)
      ? service.document_checklist_mapping
      : typeof service.document_checklist_mapping === 'string'
        ? JSON.parse(service.document_checklist_mapping)
        : [];

    const docIds = mapping
      .map((item: any) =>
        Number(
          item.doc_id ??
            item.docId ??
            item.document_id ??
            item.documentId ??
            item.id ??
            item.master_id ??
            item.documentMasterId
        )
      )
      .filter((id: number) => Number.isFinite(id));

    if (!docIds.length) return [];

    const masters = await this.prisma.documentMaster.findMany({
      where: { id: { in: docIds } },
      include: {
        documentType: true,
        department: true,
      },
    });

    const masterMap = new Map<number, any>(masters.map((item) => [item.id, item]));

    return mapping
      .map((item: any) => {
        const id = Number(
          item.doc_id ??
            item.docId ??
            item.document_id ??
            item.documentId ??
            item.id ??
            item.master_id ??
            item.documentMasterId
        );
        const master = masterMap.get(id);
        if (!master) return null;
        return {
          id: master.id,
          checklistId: master.checklistId,
          name: master.checklistDocumentName,
          extension: master.checklistDocumentExtension,
          maxSize: master.checklistDocumentMaxSize,
          documentType: master.documentType?.name || null,
          departmentId: master.departmentId,
          isRequired: item.is_required,
          comment: item.doc_comment || '',
          isMultiVersionAllowed: !!master.isMultiVersionAllowed,
          isDocValidityRequired: !!master.isDocValidityRequired,
        };
      })
      .filter(Boolean);
  }

  private getChecklistNumericId(checklistId?: string | null) {
    if (!checklistId) return null;
    const parts = String(checklistId).split('-');
    const last = parts[parts.length - 1];
    const num = Number(last);
    return Number.isFinite(num) ? num : null;
  }

  private getChecklistIdFromNumericId(docchkId?: number | null) {
    if (!docchkId) return null;
    return `UK-DCL-${docchkId}`;
  }

  private getNextDocVersion(existing: { documentVersion?: string | null }[]) {
    if (!existing.length) return '1.0';
    const latestRaw = String(existing[0].documentVersion || '1.0');
    const latest = latestRaw.replace(/^[A-Za-z]+/, '');
    const [majorRaw, minorRaw] = latest.split('.');
    const major = Number(majorRaw);
    const minor = Number(minorRaw);
    if (Number.isNaN(major) || Number.isNaN(minor)) return '1.0';
    return minor < 10 ? `${major}.${minor + 1}` : `${major + 1}.0`;
  }

  private async syncDocumentMappings(options: {
    submissionId: number;
    userId: bigint;
    serviceId: string;
    deptId: number;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const service = await this.prisma.service.findFirst({
      where: { service_id: options.serviceId },
      select: { document_checklist_mapping: true },
    });
    if (!service?.document_checklist_mapping) return;

    const mapping = Array.isArray(service.document_checklist_mapping)
      ? service.document_checklist_mapping
      : typeof service.document_checklist_mapping === 'string'
        ? JSON.parse(service.document_checklist_mapping)
        : [];

    const docIds = mapping
      .map((item: any) =>
        Number(
          item.doc_id ??
            item.docId ??
            item.document_id ??
            item.documentId ??
            item.id ??
            item.master_id ??
            item.documentMasterId
        )
      )
      .filter((id: number) => Number.isFinite(id));

    if (!docIds.length) return;

    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: options.userId },
      select: { uid: true },
    });
    if (!investorProfile?.uid) return;

    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(options.submissionId) },
      select: { sno: true },
    });
    if (!spApp?.sno) return;

    const existingMappings = await this.prisma.applicationDmsDocumentsMapping.findMany({
      where: { sno: BigInt(spApp.sno), userId: BigInt(options.userId) },
      select: { documentsId: true },
    });
    const mappedDocumentIds = new Set(
      existingMappings.map((item) => Number(item.documentsId)).filter(Number.isFinite)
    );

    const investorDocs = await this.prisma.investorDocument.findMany({
      where: {
        investorProfileUid: investorProfile.uid,
        documentMasterId: { in: docIds },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, documentMasterId: true, documentName: true },
    });

    const seenMasters = new Set<number>();
    for (const doc of investorDocs) {
      if (seenMasters.has(doc.documentMasterId)) continue;
      seenMasters.add(doc.documentMasterId);

      const docId = Number(doc.id);
      if (!Number.isSafeInteger(docId)) continue;
      if (mappedDocumentIds.has(docId)) continue;

      await this.prisma.applicationDmsDocumentsMapping.create({
        data: {
          iuid: BigInt(investorProfile.uid),
          userId: BigInt(options.userId),
          sno: BigInt(spApp.sno),
          deptId: options.deptId ?? 0,
          documentsId: docId,
          documentFileName: doc.documentName,
          status: 'U',
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null,
          createdOn: new Date(),
          lastUpdated: null,
          comments: null,
          isUploadedFlag: 1,
        },
      });
    }
  }

  async getUploadedDocuments(submissionId: number, userId: bigint) {
    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: userId },
      select: { uid: true },
    });
    if (!investorProfile?.uid) {
      throw new BadRequestException('Investor profile not found');
    }

    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: { submissionId: true },
    });
    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(submissionId) },
      select: { sno: true, appStatus: true },
    });

    const mappings = spApp?.sno
      ? await this.prisma.applicationDmsDocumentsMapping.findMany({
          where: { sno: BigInt(spApp.sno), userId: BigInt(userId) },
          orderBy: { createdOn: 'desc' },
        })
      : [];

    const docs: Array<{
      documentMasterId: number;
      documentsId: number;
      checklistId: string | null;
      fileName: string;
      filePath: string;
      status: string;
      createdOn: Date;
      versionType: string;
      version: string;
    }> = [];
    for (const mapping of mappings) {
      const mappingId = Number(mapping.documentsId);
      if (!Number.isSafeInteger(mappingId)) {
        continue;
      }
      const investorDoc = await this.prisma.investorDocument.findUnique({
        where: { id: BigInt(mappingId) },
        select: {
          id: true,
          documentMasterId: true,
          documentName: true,
          documentReferenceNumber: true,
          documentVersion: true,
          documentStatus: true,
          createdAt: true,
        },
      });

      if (!investorDoc) continue;

      const filePath = `uploads/investorDocuments/${investorProfile.uid}/${investorDoc.documentName}`;
      const versionType = String(investorDoc.documentVersion || '').startsWith('D') ? 'D' : 'V';
      const version = String(investorDoc.documentVersion || '').substring(1);
      docs.push({
        documentMasterId: investorDoc.documentMasterId,
        documentsId: Number(investorDoc.id),
        checklistId: null,
        fileName: investorDoc.documentName,
        filePath,
        status: investorDoc.documentStatus,
        createdOn: investorDoc.createdAt,
        versionType,
        version,
      });
    }

    return {
      uploads: docs,
      appStatus: spApp?.appStatus ?? null,
    };
  }

  async uploadSupportingDocument(options: {
    submissionId: number;
    documentMasterId: number;
    uploadType: 'new' | 'duplicate';
    comments?: string;
    validFrom?: string;
    validTo?: string;
    docDateOfIssuance?: string;
    isDocumentActive?: string;
    filePath: string;
    fileName: string;
    originalName: string;
    userId: bigint;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const {
      submissionId,
      documentMasterId,
      uploadType,
      comments,
      validFrom,
      validTo,
      docDateOfIssuance,
      isDocumentActive,
      filePath,
      fileName,
      originalName,
      userId,
      ipAddress,
      userAgent,
    } = options;

    const investorProfile = await this.prisma.investor_profiles.findUnique({
      where: { user_id: userId },
      select: { uid: true },
    });
    if (!investorProfile?.uid) {
      throw new BadRequestException('Investor profile not found');
    }

    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: { submissionId: true, deptId: true, serviceId: true, processingLevel: true },
    });
    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(submissionId) },
      select: { sno: true, appStatus: true },
    });
    if (!spApp?.sno) {
      throw new BadRequestException('Application not found in sp applications');
    }

    const allowedStatuses = ['I', 'RBI', 'H', 'DP', 'PD'];
    if (spApp.appStatus && !allowedStatuses.includes(spApp.appStatus)) {
      throw new BadRequestException('Document upload is not allowed for this application status');
    }

    const master = await this.prisma.documentMaster.findUnique({
      where: { id: documentMasterId },
      select: {
        id: true,
        checklistId: true,
        checklistDocumentExtension: true,
        documentTypeId: true,
        issuerId: true,
        departmentId: true,
        isMultiVersionAllowed: true,
        isDocValidityRequired: true,
      },
    });
    if (!master?.checklistId) {
      throw new BadRequestException('Document Master not found');
    }
    if (!master.documentTypeId || !master.departmentId || !master.issuerId) {
      throw new BadRequestException('Document Master is missing required mappings');
    }

    const checklistId = master.checklistId;
    const versionType = uploadType === 'duplicate' ? 'D' : 'V';

    if (master.isDocValidityRequired) {
      if (!validFrom || !validTo) {
        throw new BadRequestException('Valid From and Valid To are required for this document');
      }
    }

    if (!master.isMultiVersionAllowed) {
      const existingSingle = await this.prisma.investorDocument.findFirst({
        where: {
          investorProfileUid: investorProfile.uid,
          documentMasterId: master.id,
        },
        select: { id: true },
      });
      if (existingSingle) {
        throw new BadRequestException('Multiple versions are not allowed for this document');
      }
    }

    const allowedExtensions = String(master.checklistDocumentExtension || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const incomingExt = originalName.includes('.')
      ? originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase()
      : '';
    if (allowedExtensions.length && !allowedExtensions.includes(incomingExt)) {
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
      }
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`
      );
    }

    const existing = await this.prisma.investorDocument.findMany({
      where: {
        investorProfileUid: investorProfile.uid,
        documentMasterId: master.id,
        documentVersion: { startsWith: versionType },
      },
      orderBy: { createdAt: 'desc' },
      select: { documentVersion: true },
    });

    const version = this.getNextDocVersion(existing);
    const versionLabel = `${versionType}${version}`;

    const ext = incomingExt ? `.${incomingExt}` : '';
    const docRefNumber = `${investorProfile.uid}_${checklistId}_${versionLabel}`;
    const documentName = `${docRefNumber}${ext}`;
    const relativePath = `uploads/investorDocuments/${investorProfile.uid}/${documentName}`;

    const issuerId =
      submission.processingLevel && String(submission.processingLevel).toLowerCase() === 'state' ? 2 : 1;

    const created = await this.prisma.investorDocument.create({
      data: {
        documentMasterId: master.id,
        documentTypeId: master.documentTypeId,
        issuerId,
        departmentId: submission.deptId ?? master.departmentId,
        investorProfileUid: investorProfile.uid,
        userId: BigInt(userId),
        documentReferenceNumber: docRefNumber,
        documentName,
        documentVersion: versionLabel,
        documentStatus: 'U',
        isDocumentActive: (isDocumentActive as any) || 'Y',
        documentPath: relativePath,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        documentDateOfIssuance: docDateOfIssuance ? new Date(docDateOfIssuance) : null,
        comments: comments || null,
      },
    });

    if (!Number.isSafeInteger(Number(created.id))) {
      throw new BadRequestException('Generated document id is too large');
    }

    await this.prisma.applicationDmsDocumentsMapping.create({
      data: {
        iuid: BigInt(investorProfile.uid),
        userId: BigInt(userId),
        sno: BigInt(spApp.sno),
        deptId: submission.deptId ?? 0,
        documentsId: Number(created.id),
        documentFileName: documentName,
        status: 'U',
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        createdOn: new Date(),
        lastUpdated: null,
        comments: null,
        isUploadedFlag: 1,
      },
    });

    return {
      documentsId: Number(created.id),
      checklistId,
      documentName,
      filePath: relativePath,
      docRefNumber,
      versionType,
      version,
    };
  }

  // Create a new draft (status I).
  async submitDraftApplication(options: {
    userId: bigint;
    serviceId: string;
    departmentId?: number;
    formTypeId?: number;
    processingLevel?: string;
    formData: any;
    unitName?: string;
    districtId: number;
    cafType?: string;
    revertedCallBackUrl?: string;
    printAppCallBackUrl?: string;
    downloadCertificateCallBackUrl?: string;
    currentStep?: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    if ((options.currentStep ?? 0) === 0) {
      const corp = options.formData?.company?.corp || {};
      const required = [
        { label: 'Date of Incorporation', value: options.formData?.company?.incorporation_date },
        { label: 'City', value: corp.city },
        { label: 'Address Line 1', value: corp.address1 },
        { label: 'Pin Code', value: corp.pincode },
        { label: 'Email ID', value: corp.email },
        { label: 'Country Code', value: corp.country_code },
        { label: 'Mobile Number', value: corp.mobile },
      ];
      const missing = required.filter((item) => !item.value || String(item.value).trim() === '');
      if (missing.length) {
        throw new BadRequestException(
          `Missing required fields: ${missing.map((item) => item.label).join(', ')}`
        );
      }
    }

    const now = new Date();

    const service = await this.prisma.service.findFirst({
      where: { service_id: options.serviceId },
    });
    const resolvedDepartmentId = options.departmentId || service?.department_id || 0;
    const department = resolvedDepartmentId
      ? await this.prisma.department.findUnique({
          where: { id: resolvedDepartmentId },
        })
      : null;
    const district = await this.prisma.district.findUnique({
      where: { id: options.districtId },
    });

    const sanitizedFormData = this.sanitizeFormData(options.formData);
    const masterDistrictId = this.resolveMasterDistrictId(sanitizedFormData, options.districtId);

    const submission = await this.prisma.applicationSubmission.create({
      data: {
        applicationId: 12,
        parentSubId: 0,
        serviceId: options.serviceId,
        userId: options.userId,
        deptId: resolvedDepartmentId,
        formId: options.formTypeId || null,
        approvalId: null,
        fieldValue: sanitizedFormData || {},
        unitName: options.unitName || null,
        applicationStatus: 'I',
        applicationCreatedDate: now,
        applicationUpdatedDateTime: now,
        ipAddress: options.ipAddress || '',
        userAgent: options.userAgent || '',
        processingLevel: (options.processingLevel as any) || 'District',
        landrigionId: masterDistrictId,
        unitPanno: String(sanitizedFormData?.company?.pan || ''),
        unitPannoUpdatedDate: now,
        isMsmeapp2015Active: '1',
        ubuId: this.buildUbuId(sanitizedFormData, masterDistrictId),
      },
    });

    const spTag = department?.uniqueTag || (options.serviceId === '943.0' ? 'DOI@908#123' : '');
    const spAppId = service?.swcs_service_id ? String(service.swcs_service_id) : options.serviceId;
    const appLocation = this.buildAppLocation(sanitizedFormData);
    const revertedCallBackUrl =
      options.revertedCallBackUrl ||
      this.buildRevertedCallbackUrl(options.serviceId, submission.submissionId, resolvedDepartmentId);
    const printAppCallBackUrl =
      options.printAppCallBackUrl || this.buildPrintAppUrl(submission.submissionId);

    await this.prisma.spApplication.create({
      data: {
        spTag,
        spAppId,
        appId: BigInt(submission.submissionId),
        appName: service?.service_name || 'In-principle Application',
        appFields: {},
        appStatus: 'I',
        appComments: 'Application saved in draft',
        appDistt: String(masterDistrictId),
        appDisttName: '',
        appLocation,
        isAppliedByCaf: null,
        cafId: 0,
        cafType: null,
        unitName: options.unitName || '',
        revertedCallBackUrl,
        printAppCallBackUrl,
        downloadCertificateCallBackUrl: options.downloadCertificateCallBackUrl || '',
        userId: options.userId,
        createdOn: now,
        updatedOn: now,
        isActive: 'Y',
        remoteServer: options.ipAddress || '',
        userAgent: options.userAgent || '',
        param1: BigInt(0),
        param2: '',
        param3: '',
        param4: '',
        param5: '',
        isOfflineApplication: 'N',
        isUploadedSignedCertificate: 'N',
        deemedApproved: '0',
      },
    });

    await this.syncDocumentMappings({
      submissionId: submission.submissionId,
      userId: options.userId,
      serviceId: options.serviceId,
      deptId: resolvedDepartmentId,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
    });

    await this.prisma.applicationHistory.create({
      data: {
        spAppId: service?.swcs_service_id ?? null,
        serviceId: options.serviceId,
        spTag,
        appId: String(submission.submissionId),
        applicationStatus: 'I',
        comments: 'Application saved in draft',
        approverId: null,
        approverDetails: null,
        nextApprover: null,
        addedDateTime: now,
        sentDatedTime: null,
        roleId: null,
        roleName: null,
        roleUserInfo: null,
        nextRoleId: null,
        remoteServer: options.ipAddress || '',
        userAgent: options.userAgent || '',
      },
    });

    return submission;
  }

  // Update an existing draft (status I).
  async updateDraftApplication(options: {
    submissionId: number;
    userId: bigint;
    serviceId: string;
    departmentId?: number;
    formTypeId?: number;
    processingLevel?: string;
    formData: any;
    unitName?: string;
    districtId: number;
    cafType?: string;
    revertedCallBackUrl?: string;
    printAppCallBackUrl?: string;
    downloadCertificateCallBackUrl?: string;
    currentStep?: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    if ((options.currentStep ?? 0) === 0) {
      const corp = options.formData?.company?.corp || {};
      const required = [
        { label: 'Date of Incorporation', value: options.formData?.company?.incorporation_date },
        { label: 'City', value: corp.city },
        { label: 'Address Line 1', value: corp.address1 },
        { label: 'Pin Code', value: corp.pincode },
        { label: 'Email ID', value: corp.email },
        { label: 'Country Code', value: corp.country_code },
        { label: 'Mobile Number', value: corp.mobile },
      ];
      const missing = required.filter((item) => !item.value || String(item.value).trim() === '');
      if (missing.length) {
        throw new BadRequestException(
          `Missing required fields: ${missing.map((item) => item.label).join(', ')}`
        );
      }
    }

    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    if (submission.userId !== options.userId) {
      throw new BadRequestException('Unauthorized draft access');
    }

    const now = new Date();

    const service = await this.prisma.service.findFirst({
      where: { service_id: options.serviceId },
    });
    const resolvedDepartmentId = options.departmentId || service?.department_id || submission.deptId || 0;
    const department = resolvedDepartmentId
      ? await this.prisma.department.findUnique({
          where: { id: resolvedDepartmentId },
        })
      : null;

    const spTag = department?.uniqueTag || (options.serviceId === '943.0' ? 'DOI@908#123' : '');
    const spAppId = service?.swcs_service_id ? String(service.swcs_service_id) : options.serviceId;
    const sanitizedFormDataUpdate = this.sanitizeFormData(options.formData);
    const masterDistrictId = this.resolveMasterDistrictId(sanitizedFormDataUpdate, options.districtId);
    const appLocation = this.buildAppLocation(sanitizedFormDataUpdate);
    const revertedCallBackUrl =
      options.revertedCallBackUrl ||
      this.buildRevertedCallbackUrl(options.serviceId, options.submissionId, resolvedDepartmentId);
    const printAppCallBackUrl =
      options.printAppCallBackUrl || this.buildPrintAppUrl(options.submissionId);

    const mergedFieldValue = this.mergeDeep(
      submission.fieldValue || {},
      sanitizedFormDataUpdate || {}
    );

    await this.prisma.applicationSubmission.update({
      where: { submissionId: options.submissionId },
      data: {
        serviceId: options.serviceId,
        deptId: resolvedDepartmentId,
        formId: options.formTypeId || null,
        fieldValue: mergedFieldValue || {},
        unitName: options.unitName || null,
        applicationStatus: 'I',
        applicationUpdatedDateTime: now,
        ipAddress: options.ipAddress || '',
        userAgent: options.userAgent || '',
        processingLevel: (options.processingLevel as any) || submission.processingLevel,
        landrigionId: masterDistrictId,
        unitPanno: String(sanitizedFormDataUpdate?.company?.pan || ''),
        unitPannoUpdatedDate: now,
        isMsmeapp2015Active: '1',
        ubuId: this.buildUbuId(sanitizedFormDataUpdate, masterDistrictId),
      },
    });

    const spUpdate = await this.prisma.spApplication.updateMany({
      where: { appId: BigInt(options.submissionId) },
      data: {
        spTag,
        spAppId,
        appStatus: 'I',
        appComments: 'Application saved in draft',
        appDistt: String(masterDistrictId),
        appDisttName: '',
        appLocation,
        unitName: options.unitName || '',
        revertedCallBackUrl,
        printAppCallBackUrl,
        downloadCertificateCallBackUrl: options.downloadCertificateCallBackUrl || '',
        updatedOn: now,
        remoteServer: options.ipAddress || '',
        userAgent: options.userAgent || '',
        isOfflineApplication: 'N',
        isUploadedSignedCertificate: 'N',
        deemedApproved: '0',
      },
    });

    if (!spUpdate.count) {
      await this.prisma.spApplication.create({
        data: {
          spTag,
          spAppId,
          appId: BigInt(options.submissionId),
          appName: service?.service_name || 'In-principle Application',
          appFields: {},
          appStatus: 'I',
          appComments: 'Application saved in draft',
          appDistt: String(options.districtId),
          appDisttName: '',
          appLocation,
          isAppliedByCaf: null,
          cafId: 0,
          cafType: null,
          unitName: options.unitName || '',
          revertedCallBackUrl,
          printAppCallBackUrl,
          downloadCertificateCallBackUrl: options.downloadCertificateCallBackUrl || '',
          userId: options.userId,
          createdOn: now,
          updatedOn: now,
          isActive: 'Y',
          remoteServer: options.ipAddress || '',
          userAgent: options.userAgent || '',
          param1: BigInt(0),
          param2: '',
          param3: '',
          param4: '',
          param5: '',
          isOfflineApplication: 'N',
          isUploadedSignedCertificate: 'N',
          deemedApproved: '0',
        },
      });
    }

    await this.syncDocumentMappings({
      submissionId: options.submissionId,
      userId: options.userId,
      serviceId: options.serviceId,
      deptId: resolvedDepartmentId,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
    });

    await this.prisma.applicationHistory.create({
      data: {
        spAppId: service?.swcs_service_id ?? null,
        serviceId: options.serviceId,
        spTag,
        appId: String(options.submissionId),
        applicationStatus: 'I',
        comments: 'Application saved in draft',
        approverId: null,
        approverDetails: null,
        nextApprover: null,
        addedDateTime: now,
        sentDatedTime: null,
        roleId: null,
        roleName: null,
        roleUserInfo: null,
        nextRoleId: null,
        remoteServer: options.ipAddress || '',
        userAgent: options.userAgent || '',
      },
    });

    return { submissionId: options.submissionId };
  }

  async processDepartmentAction(options: {
    submissionId: number;
    serviceId: string;
    action: 'forward' | 'approve' | 'reject' | 'revert' | 'hold';
    processingLevel?: string;
    comments?: string;
    nextRoleId?: number;
    nextUserId?: number;
    reasonForDelay?: string;
    supportiveDocument?: string;
    userId: bigint;
    userRoleId: number;
    userAgent?: string;
  }) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const workflowConfig = await this.prisma.applicationWorkflowConfiguration.findFirst({
      where: {
        serviceId: options.serviceId,
        processingLevel: (options.processingLevel as any) || submission.processingLevel,
        currentRoleId: options.userRoleId,
      },
      orderBy: { step: 'asc' },
    });

    if (!workflowConfig) {
      throw new BadRequestException('Workflow configuration not found for this role');
    }

    const department = submission.deptId
      ? await this.prisma.department.findUnique({ where: { id: submission.deptId } })
      : null;

    const actionStatusMap: Record<string, string> = {
      forward: 'F',
      approve: 'A',
      reject: 'R',
      revert: 'R',
      hold: 'H',
    };

    const submissionStatusMap: Record<string, string> = {
      forward: 'F',
      approve: 'A',
      reject: 'R',
      revert: 'R',
      hold: 'H',
    };

    const spStatusMap: Record<string, string> = {
      forward: 'F',
      approve: 'A',
      reject: 'R',
      revert: 'RBI',
      hold: 'H',
    };

    const nextRoleId =
      options.nextRoleId ||
      (options.action === 'forward'
        ? workflowConfig.forwardRoleId || workflowConfig.nextRoleId
        : workflowConfig.nextRoleId);

    const now = new Date();

    await this.prisma.applicationSubmission.update({
      where: { submissionId: options.submissionId },
      data: {
        applicationStatus: submissionStatusMap[options.action],
        approvalId: nextRoleId || submission.approvalId,
        applicationUpdatedDateTime: now,
      },
    });

    await this.prisma.spApplication.updateMany({
      where: { cafId: options.submissionId },
      data: {
        appStatus: spStatusMap[options.action],
        updatedOn: now,
      },
    });

    await this.prisma.forwardApplication.create({
      data: {
        nextRoleId: nextRoleId || null,
        nextUserId: options.nextUserId || null,
        verifierUserId: Number(options.userId),
        appSubId: options.submissionId,
        forwardedDeptId: submission.deptId,
        forwardedDistId: submission.landrigionId,
        formId: submission.formId || null,
        postInfo: options.comments || null,
        actionTaken: options.action.toUpperCase(),
        actionStatus: actionStatusMap[options.action],
        verifierUserComment: options.comments || null,
        supportiveDocument: options.supportiveDocument || null,
        createdOn: now,
        userAgent: options.userAgent || '',
        reasonForDelay: options.reasonForDelay || null,
      },
    });

    await this.prisma.applicationHistory.create({
      data: {
        spAppId: null,
        serviceId: options.serviceId,
        spTag: department?.uniqueTag || '',
        appId: String(options.submissionId),
        applicationStatus: submissionStatusMap[options.action],
        comments: options.comments || null,
        approverId: String(options.userRoleId),
        approverDetails: null,
        nextApprover: nextRoleId ? String(nextRoleId) : null,
        addedDateTime: now,
        sentDatedTime: null,
        roleId: String(options.userRoleId),
        roleName: null,
        roleUserInfo: null,
        nextRoleId: nextRoleId ? String(nextRoleId) : null,
      },
    });

    return { status: 'ok' };
  }
}
