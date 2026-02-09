import { FormBuilderScreen } from '@/components/admin/master/formBuilder/FormBuilderScreen';

export default async function FormBuilderPage({
  params,
}: {
  params: { locale: string; serviceId: string; formTypeId: string };
}) {
  const { serviceId, formTypeId } = await Promise.resolve(params);
  return <FormBuilderScreen serviceId={serviceId} formTypeId={Number(formTypeId)} />;
}