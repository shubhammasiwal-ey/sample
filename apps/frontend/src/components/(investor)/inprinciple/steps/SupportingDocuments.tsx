import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];

export type SupportingDocumentsContext = {
  inprincipleDocuments: any[];
  uploadedDocuments: Record<string, any>;
  canUploadDocuments: boolean;
  onOpenUpload: (doc: any) => void;
  uploadModalOpen: boolean;
  uploadModalDoc: any | null;
  uploadForm: {
    uploadType: 'new' | 'duplicate';
    comments: string;
    validFrom: string;
    validTo: string;
    docDateOfIssuance: string;
    isDocumentActive: string;
    file: File | null;
  };
  setUploadForm: (next: SupportingDocumentsContext['uploadForm']) => void;
  onCloseUpload: () => void;
  onSubmitUpload: (doc: any) => Promise<void>;
  uploadError: string;
  uploading: boolean;
};

const buildAccept = (ext?: string) => {
  if (!ext) return '';
  const parts = String(ext)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return parts.map((item) => `.${item}`).join(',');
};

export const buildSupportingDocumentsStep = (ctx: SupportingDocumentsContext): Step => {
  const {
    inprincipleDocuments,
    uploadedDocuments,
    canUploadDocuments,
    onOpenUpload,
    uploadModalOpen,
    uploadModalDoc,
    uploadForm,
    setUploadForm,
    onCloseUpload,
    onSubmitUpload,
    uploadError,
    uploading,
  } = ctx;

  return {
    id: 'step-6',
    title: 'Supporting Documents',
    sections: [
      {
        id: 'supporting-documents',
        title: 'Supporting Documents',
        columns: 1,
        fields: [
          {
            name: 'documents.table',
            type: 'custom',
            colSpan: 1,
            render: () => (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-700 text-white">
                      <tr>
                        <th className="px-4 py-3 border border-gray-300 text-center">S.No</th>
                        <th className="px-4 py-3 border border-gray-300 text-center">Document Name</th>
                        <th className="px-4 py-3 border border-gray-300 text-center">
                          Allowed Document Size (MB)
                        </th>
                        <th className="px-4 py-3 border border-gray-300 text-center">Mandatory/Optional</th>
                        <th className="px-4 py-3 border border-gray-300 text-center">Description</th>
                        <th className="px-4 py-3 border border-gray-300 text-center">Latest Version</th>
                        <th className="px-4 py-3 border border-gray-300 text-center">
                          Document Status
                        </th>
                        <th className="px-4 py-3 border border-gray-300 text-center w-32">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inprincipleDocuments.length === 0 && (
                        <tr>
                          <td
                            className="px-4 py-3 text-center text-gray-500 border border-gray-200"
                            colSpan={8}
                          >
                            No document checklist mapped for this service.
                          </td>
                        </tr>
                      )}
                      {inprincipleDocuments.map((doc, index) => {
                        const maxSizeMb = doc.maxSize
                          ? (Number(doc.maxSize) / (1024 * 1024)).toFixed(2)
                          : '-';
                        const uploaded = uploadedDocuments[String(doc.id)];
                        const latestVersion =
                          uploaded?.versionType && uploaded?.version
                            ? `${uploaded.versionType}${uploaded.version}`
                            : '';
                        const statusLabel = (() => {
                          const status = String(uploaded?.status || '').toUpperCase();
                          if (status === 'V') return 'Verified';
                          if (status === 'R') return 'Rejected';
                          if (status === 'U') return 'Unverified';
                          return '';
                        })();
                        return (
                          <tr key={doc.id}>
                            <td className="px-4 py-3 border border-gray-200 text-center">{index + 1}</td>
                            <td className="px-4 py-3 border border-gray-200">
                              <div className="font-medium text-gray-800">{doc.name}</div>
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center">{maxSizeMb}</td>
                            <td className="px-4 py-3 border border-gray-200 text-center">
                              {doc.isRequired === 'Y' ? 'Mandatory' : 'Optional'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 border border-gray-200">
                              {doc.comment || '--'}
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center">
                              {latestVersion || <span>&nbsp;</span>}
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center">
                              {statusLabel || <span>&nbsp;</span>}
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center w-40">
                              <div className="flex items-center justify-center gap-2">
                                {uploaded?.filePath ? (
                                  <a
                                    href={`/${uploaded.filePath}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600"
                                    aria-label="Download document"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="h-4 w-4"
                                    >
                                      <path d="M12 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 111.414 1.414l-4.007 4.007a1 1 0 01-1.414 0L7.279 12.707a1 1 0 111.414-1.414L11 13.586V4a1 1 0 011-1z" />
                                      <path d="M5 20a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z" />
                                    </svg>
                                  </a>
                                ) : (
                                  <span className="text-sm text-gray-400">&nbsp;</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onOpenUpload(doc)}
                                  disabled={
                                    !canUploadDocuments ||
                                    (doc?.isMultiVersionAllowed === false && !!uploaded?.filePath)
                                  }
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md whitespace-nowrap ${
                                    canUploadDocuments &&
                                    !(doc?.isMultiVersionAllowed === false && !!uploaded?.filePath)
                                      ? 'bg-red-600 text-white hover:bg-red-700'
                                      : 'bg-red-600/20 text-red-700 cursor-not-allowed'
                                  }`}
                                >
                                  Upload New
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {uploadModalOpen && uploadModalDoc && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg w-[560px] max-w-[90vw] p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Upload Document</h3>
                        <button type="button" onClick={onCloseUpload} className="text-gray-500">
                          ✕
                        </button>
                      </div>

                      <div className="space-y-3">
                        {uploadModalDoc?.isMultiVersionAllowed !== false && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Upload Type
                            </label>
                            <select
                              value={uploadForm.uploadType}
                              onChange={(event) =>
                                setUploadForm({
                                  ...uploadForm,
                                  uploadType: event.target.value as 'new' | 'duplicate',
                                })
                              }
                              className="w-full px-3 py-2.5 border rounded text-sm bg-gray-50 border-gray-300"
                            >
                              <option value="new">New</option>
                              <option value="duplicate">Duplicate</option>
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select File
                          </label>
                          <div className="mt-1">
                            <input
                              type="file"
                              accept={buildAccept(uploadModalDoc.extension)}
                              onChange={(event) =>
                                setUploadForm({
                                  ...uploadForm,
                                  file: event.target.files?.[0] || null,
                                })
                              }
                            />
                          </div>
                        </div>
                        {uploadModalDoc?.isDocValidityRequired ? (
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Valid From <span className="text-red-600">*</span>
                              </label>
                              <input
                                type="date"
                                value={uploadForm.validFrom}
                                onChange={(event) =>
                                  setUploadForm({ ...uploadForm, validFrom: event.target.value })
                                }
                                className="w-full px-3 py-2.5 border rounded text-sm bg-white border-gray-300"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Valid To <span className="text-red-600">*</span>
                              </label>
                              <input
                                type="date"
                                value={uploadForm.validTo}
                                onChange={(event) =>
                                  setUploadForm({ ...uploadForm, validTo: event.target.value })
                                }
                                className="w-full px-3 py-2.5 border rounded text-sm bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3" />
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comments
                          </label>
                          <textarea
                            rows={3}
                            value={uploadForm.comments}
                            onChange={(event) =>
                              setUploadForm({ ...uploadForm, comments: event.target.value })
                            }
                            className="w-full px-3 py-2.5 border rounded text-sm bg-white border-gray-300"
                          />
                        </div>
                        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
                      </div>

                      <div className="mt-5 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={onCloseUpload}
                          className="px-4 py-2 rounded-md border border-gray-300 text-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => onSubmitUpload(uploadModalDoc)}
                          className="px-4 py-2 rounded-md bg-red-600 text-white"
                        >
                          {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
        ],
      },
    ],
  };
};
