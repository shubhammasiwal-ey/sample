"use client";

import { Dialog } from "primereact/dialog";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";

interface PreFormPopupProps {
  visible: boolean;
  title?: string;
  sections?: any[];
  acknowledgementText?: string;
  acknowledged: boolean;
  onAcknowledgeChange: (value: boolean) => void;
  onContinue: () => void;
  onHide: () => void;
}

export default function PreFormPopup({
  visible,
  title,
  sections = [],
  acknowledgementText,
  acknowledged,
  onAcknowledgeChange,
  onContinue,
  onHide,
}: PreFormPopupProps) {
  return (
    <Dialog
      header={title || ""}
      visible={visible}
      style={{ width: "60vw" }}
      modal
      closable={false}
      onHide={onHide}
      headerClassName="p-3"
    >
      <div className="p-4">
        {/* Sections */}
        {sections.map((section: any, index: number) => (
          <div key={index} className="mb-3">
            {/* Paragraph */}
            {section.type === "paragraph" && (
              <p className={section.muted ? "text-muted" : ""}>
                {section.content}
              </p>
            )}

            {/* Bullets */}
            {section.type === "bullets" && (
              <ul className="ps-0 list-unstyled">
                {section.items?.map((item: string, i: number) => (
                  <li key={i} className="d-flex gap-2 mb-1">
                    <i
                      className="pi pi-circle"
                      style={{ fontSize: "0.6rem", marginTop: "0.4rem" }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Documents */}
            {section.type === "documents" && (
              <>
                <h6 className="fw-semibold d-flex align-items-center gap-2">
                  <i className="pi pi-file" />
                  Documents Required
                </h6>
                <ul className="ps-3">
                  {section.items?.map((doc: string, i: number) => (
                    <li key={i}>{doc}</li>
                  ))}
                </ul>
              </>
            )}

            {/* Table */}
            {section.type === "table" && (
              <table className="table table-bordered">
                <thead>
                  <tr>
                    {section.headers?.map((h: string, i: number) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows?.map((row: any[], r: number) => (
                    <tr key={r}>
                      {row.map((cell: string, c: number) => (
                        <td key={c}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}

        {/* Acknowledgement */}
        <div className="mt-4 d-flex align-items-center gap-2">
          <Checkbox
            checked={acknowledged}
            onChange={(e) => onAcknowledgeChange(e.checked ?? false)}
          />
          <label>
            {acknowledgementText ||
              "I have read and understood the above information"}
          </label>
        </div>

        {/* Action */}
        <div className="mt-3 text-end">
          <Button
            label="I agree & continue"
            icon="pi pi-chevron-right"
            iconPos="right"
            disabled={!acknowledged}
            onClick={onContinue}
          />
        </div>
      </div>
    </Dialog>
  );
}
