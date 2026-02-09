import { PrismaClient } from '@prisma/client';

export async function seedServiceDetails(prisma: PrismaClient) {
    console.log('🏢 Seeding Service Details...');

    // Look up service by service_id field (not internal id)
    const service = await prisma.service.findFirst({
        where: { service_id: '577.1' },
    });

    if (!service) {
        console.warn('  ⚠️  Service with service_id 577.1 not found in database.');
        console.warn('  ⚠️  Please ensure the service.seed.ts has created this service first.');
        return;
    }

    console.log(`  ✓ Found service: ${service.service_name} (ID: ${service.id}, service_id: ${service.service_id})`);

    // Check if service details already exist
    const existingDetail = await prisma.serviceDetail.findUnique({
        where: { serviceId: service.service_id! }, // Use service_id string
    });

    if (existingDetail) {
        console.log('  ℹ️  Service details already exist, updating...');

        await prisma.serviceDetail.update({
            where: { id: existingDetail.id },
            data: {
                serviceCategory: 'Pre establishment',
                authorityName: 'Ministry of Environment, Forest and Climate Change',
                timeline: 60,
                isActive: true,
            },
        });

        console.log('  ✓ Updated service details for service_id 577.1');
    } else {
        // Create new service details
        await prisma.serviceDetail.create({
            data: {
                serviceId: service.service_id!, // Use service_id string as FK
                serviceCategory: 'Pre establishment',
                authorityName: 'Ministry of Environment, Forest and Climate Change',
                timeline: 60,
                sopDocument: null,
                feeStructureDocument: null,
                listOfRequiredDocuments: null,
                isActive: true,
            },
        });

        console.log('  ✓ Created service details for service_id 577.1');
    }

    console.log('✅ Service Details seeded successfully.');
}
