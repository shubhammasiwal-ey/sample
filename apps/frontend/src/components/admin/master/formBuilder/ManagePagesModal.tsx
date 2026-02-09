'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

import apiClient from '@/lib/api-client';
import { FbPage, FbPageCategory } from '@/types/formBuilder';
import { useFormCategories } from '@/hooks/master/useFormCategories';

type Props = {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  formTypeId: number;
  formName: string;
};

export function ManagePagesModal({ open, onClose, serviceId, formTypeId, formName }: Props) {
  const toast = useRef<Toast>(null);

  const [pages, setPages] = useState<FbPage[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPage, setSelectedPage] = useState<FbPage | null>(null);
  const [pageName, setPageName] = useState('');
  const [pageHindiName, setPageHindiName] = useState('');

  const [pageCategories, setPageCategories] = useState<FbPageCategory[]>([]);
  const [savingCats, setSavingCats] = useState(false);

  const { data: categories } = useFormCategories();

  const categoryOptions = useMemo(() => {
    return (categories ?? []).map((c: any) => ({
      label: c.categoryName ?? c.nameAlt ?? c.category_code ?? `Category-${c.id}`,
      value: c.id,
    }));
  }, [categories]);

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e6e6e6',
    borderRadius: 10,
    background: '#fff',
    padding: 14,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  };

  async function loadPages(keepSelectedId?: number) {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/master/form-builder/services/${serviceId}/forms/${formTypeId}/pages`
      );
      const newPages: FbPage[] = res.data ?? [];
      setPages(newPages);

      if (keepSelectedId) {
        const stillThere = newPages.find((p) => p.id === keepSelectedId);
        if (stillThere) {
          setSelectedPage(stillThere);
          setPageName(stillThere.page_name ?? '');
          setPageHindiName((stillThere as any).name_in_hindi ?? '');

          const catRes = await apiClient.get(`/master/form-builder/pages/${stillThere.id}/categories`);
          setPageCategories(catRes.data ?? []);
          return;
        }
      }

      setSelectedPage(null);
      setPageCategories([]);
      setPageName('');
      setPageHindiName('');
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to load pages.',
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceId, formTypeId]);

  async function addPage() {
    setLoading(true);
    try {
      await apiClient.post(`/master/form-builder/services/${serviceId}/forms/${formTypeId}/pages`, {
        pageName: undefined,
        nameInHindi: undefined,
        formCode: null,
      });

      toast.current?.show({ severity: 'success', summary: 'Added', detail: 'New page created.', life: 2500 });
      await loadPages(selectedPage?.id);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to add page.',
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  }

  async function deletePage(pageId: number) {
    const ok = window.confirm('Are you sure you want to delete this page?');
    if (!ok) return;

    setLoading(true);
    try {
      await apiClient.delete(`/master/form-builder/pages/${pageId}`);

      toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Page deleted.', life: 2500 });

      // if deleted selected page, clear selection
      const keep = selectedPage?.id === pageId ? undefined : selectedPage?.id;
      await loadPages(keep);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to delete page.',
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  }

  async function selectPage(p: FbPage) {
    setSelectedPage(p);
    setPageName(p.page_name ?? '');
    setPageHindiName((p as any).name_in_hindi ?? '');

    try {
      const res = await apiClient.get(`/master/form-builder/pages/${p.id}/categories`);
      setPageCategories(res.data ?? []);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to load categories.',
        life: 3500,
      });
      setPageCategories([]);
    }
  }

  async function updatePage() {
    if (!selectedPage) return;

    setLoading(true);
    try {
      await apiClient.patch(`/master/form-builder/pages/${selectedPage.id}`, {
        pageName,
        nameInHindi: pageHindiName,
      });

      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Page updated successfully.', life: 2500 });
      await loadPages(selectedPage.id);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to update page.',
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  }

  function updateCategoryRow(idx: number, patch: Partial<FbPageCategory>) {
    setPageCategories((prev) => prev.map((r, i) => (i === idx ? ({ ...r, ...patch } as any) : r)));
  }

  function addCategoryRow() {
    if (!selectedPage) return;
    setPageCategories((prev: any) => [
      ...prev,
      {
        id: -Date.now(),
        page_id: selectedPage.id,
        category_id: 0,
        preference: prev.length + 1,
        help_text: '',
        is_active: 'Y',
      },
    ]);
  }

  function removeCategoryRow(idx: number) {
    setPageCategories((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveCategories() {
    if (!selectedPage) return;

    setSavingCats(true);
    try {
      const payload = {
        categories: pageCategories
          .filter((c) => c.category_id && c.category_id > 0)
          .map((c) => ({
            categoryId: c.category_id,
            helpText: c.help_text ?? '',
          })),
      };

      await apiClient.put(`/master/form-builder/pages/${selectedPage.id}/categories`, payload);

      toast.current?.show({
        severity: 'success',
        summary: 'Saved',
        detail: 'Categories saved successfully.',
        life: 2500,
      });

      const res = await apiClient.get(`/master/form-builder/pages/${selectedPage.id}/categories`);
      setPageCategories(res.data ?? []);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to save categories.',
        life: 3500,
      });
    } finally {
      setSavingCats(false);
    }
  }

  return (
    <Dialog
      header={`Manage Pages: ${formName} (Form Type: ${formTypeId})`}
      visible={open}
      onHide={onClose}
      style={{ width: 'min(1150px, 98vw)' }}
      modal
    >
      <Toast ref={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        {/* Left: Pages */}
        <div style={{ borderRight: '1px solid #eee', paddingRight: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Pages</strong>
            <Button label="+ Add Page" size="small" onClick={addPage} loading={loading} />
          </div>

          <div style={{ marginTop: 10 }}>
            {pages.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: 10,
                  cursor: 'pointer',
                  background: selectedPage?.id === p.id ? '#eef6ff' : 'white',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
                onClick={() => selectPage(p)}
              >
                <div style={{ fontWeight: 700, maxWidth: 220 }}>
                  Page {p.preference}
                  {p.page_name ? ` — ${p.page_name}` : ''}
                </div>

                <Button
                  icon="pi pi-trash"
                  rounded
                  outlined
                  severity="danger"
                  className="btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePage(p.id);
                  }}
                  title="Delete Page"
                />
              </div>
            ))}

            {!pages.length && (
              <div style={{ padding: 10, color: '#666' }}>
                No pages yet. Click “+ Add Page”.
              </div>
            )}
          </div>
        </div>

        {/* Right: Edit + Categories */}
        <div style={{ paddingLeft: 4 }}>
          {!selectedPage ? (
            <div style={{ padding: 10, color: '#666' }}>
              Select a page to edit its name & categories.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* ✅ Edit Page section */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>Edit Page</h4>
                  <Button label="Save Page" icon="pi pi-save" onClick={updatePage} loading={loading} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600 }}>Page Name</label>
                    <InputText value={pageName} onChange={(e) => setPageName(e.target.value)} className="w-100" />
                  </div>

                  <div>
                    <label style={{ fontWeight: 600 }}>Page Name (Hindi)</label>
                    <InputText
                      value={pageHindiName}
                      onChange={(e) => setPageHindiName(e.target.value)}
                      className="w-100"
                    />
                  </div>
                </div>
              </div>

              {/* ✅ Categories section */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>Categories</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button label="+ Add Row" size="small" onClick={addCategoryRow} />
                    <Button
                      label="Save Categories"
                      icon="pi pi-check"
                      size="small"
                      severity="secondary"
                      onClick={saveCategories}
                      loading={savingCats}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pageCategories.map((c: any, idx) => (
                    <div
                      key={c.id ?? idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr auto',
                        gap: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Dropdown
                        value={c.category_id}
                        options={categoryOptions}
                        placeholder="Select Category"
                        className="w-100"
                        filter
                        showClear
                        onChange={(e) => updateCategoryRow(idx, { category_id: e.value } as any)}
                      />
                      <InputText
                        value={c.help_text ?? ''}
                        className="w-100"
                        placeholder="Help text"
                        onChange={(e) => updateCategoryRow(idx, { help_text: e.target.value } as any)}
                      />
                      <Button
                        icon="pi pi-times"
                        rounded
                        outlined
                        severity="danger"
                        className="btn-sm"
                        onClick={() => removeCategoryRow(idx)}
                        title="Remove row"
                      />
                    </div>
                  ))}

                  {!pageCategories.length && <div style={{ color: '#666' }}>No categories mapped yet.</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}