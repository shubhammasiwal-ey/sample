import { FormPreview } from '@/components/admin/master/formBuilder/FormPreview';

export default async function FormBuilderPreviewPage({
    params,
}: {
    params: { locale: string; serviceId: string; formTypeId: string };
}) {
    const { serviceId, formTypeId } = await Promise.resolve(params);
    return <FormPreview serviceId={serviceId} formTypeId={Number(formTypeId)} />;
}