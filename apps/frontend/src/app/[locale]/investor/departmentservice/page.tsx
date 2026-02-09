"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/navigation";
import { useServices } from "@/hooks/master/useServices";
import { useTranslations } from "next-intl";

export default function UnifiedApplicationPage() {
  const router = useRouter();
  const t = useTranslations("DepartmentService");
  const [selectedCAF, setSelectedCAF] = useState("55389");

  const cafList = [
    { id: "55389", name: "ABC Private Limited - 55389" },
    { id: "66421", name: "XYZ Infra Pvt. Ltd - 66421" },
  ];

  const { data: servicesData = [] } = useServices({
    isActive: true,
    departmentIds: [23, 8, 4, 5, 11, 9, 3],
    swcsServiceIds: [11, 39, 23, 41, 2, 309, 42],
  });

  type ServiceRow = {
    id: number;
    department: string;
    service: string;
    stage: string;
  };

  const services = useMemo(
    () =>
      servicesData.map((srv: { id: number; department_name?: string; service_name?: string }) => ({
        id: srv.id,
        department: srv.department_name ?? "-",
        service: srv.service_name ?? "-",
        stage: "Pre-Establishment",
      })),
    [servicesData]
  );

  const [checkedServices, setCheckedServices] = useState<number[]>([]);

  useEffect(() => {
    if (services.length && checkedServices.length === 0) {
      setCheckedServices(services.map((s: { id: number }) => s.id));
    }
  }, [services, checkedServices.length]);

  function toggleService(id: number) {
    setCheckedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const handleApplyNow = () => {
    if (checkedServices.length === 0) {
      alert(t("selectAtLeastOneService"));
      return;
    }

    const payload = { caf: selectedCAF, services: checkedServices };
    sessionStorage.setItem("unified-selection", JSON.stringify(payload));
    router.push("/investor/departmentservice/unifiedapplication");
  };

  return (
   <div className="max-w mx-auto">
      <div className="mb-6">
          {/* Heading */}
          <h3 className="text-2xl font-bold mb-6 pb-3 border-b flex items-center gap-2">
            <span className="text-[#e9090c] text-xl">●</span>
            {t("pageTitle")}
          </h3>
          {/* CAF Dropdown */}
          <div className="mb-6">
            <label className="block mb-1 font-semibold">{t("selectCaf")}</label>
            <select
              className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
              value={selectedCAF}
              onChange={(e) => setSelectedCAF(e.target.value)}>
              {cafList.map((caf) => (
                <option key={caf.id} value={caf.id}>
                  {caf.name}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md shadow-lg">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-[#e9090c] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3 border">{t("serialNo")}</th>
                  <th className="px-4 py-3 border">{t("department")}</th>
                  <th className="px-4 py-3 border">{t("services")}</th>
                  <th className="px-4 py-3 border">{t("stage")}</th>
                  <th className="px-4 py-3 border text-center">{t("select")}</th>
                </tr>
              </thead>

              <tbody>
                {services.map((srv: ServiceRow, index: number) => (
                  <tr
                    key={srv.id}
                    className="hover:bg-[#ffe6e6] transition-colors"
                  >
                    <td className="px-4 py-3 border text-center">{index + 1}</td>
                    <td className="px-4 py-3 border">{srv.department}</td>
                    <td className="px-4 py-3 border">{srv.service}</td>
                    <td className="px-4 py-3 border">{t("preEstablishmentStage")}</td>
                    <td className="px-4 py-3 border text-center">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-[#e9090c]"
                        checked={checkedServices.includes(srv.id)}
                        onChange={() => toggleService(srv.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Apply Button */}
          <div className="text-right mt-6">
            <button
              onClick={handleApplyNow}
              className="bg-[#e9090c] hover:bg-red-700 text-white font-medium px-6 py-2 rounded-md shadow-md transition-all"
            >
              {t("applyNow")}
            </button>
          </div>
        </div>
    </div>
  );
}
