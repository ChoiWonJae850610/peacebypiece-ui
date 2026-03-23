"use client";

import { useEffect, useMemo, useState } from "react";

type Material = {
  type: string;
  name: string;
  vendor: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  status: string;
};

type Outsourcing = {
  process: string;
  vendor: string;
  quantity: number;
  unitType: string;
  unitCost: number;
  totalCost: number;
  status: string;
};

type WorkOrder = {
  id: string;
  productName: string;
  internalCode: string;
  category: string;
  stage: string;
  vendor: string;
  dueDate: string;
  inventoryStatus: string;
  filesCount: number;
  title: string;
  status: string;
  category1: string;
  category2: string;
  category3: string;
  season: string;
  manager: string;
  priority: string;
  quantity: number;
  memo: string;
  historyItems: { time: string; user: string; action: string }[];
  materials: Material[];
  outsourcing: Outsourcing[];
};

export default function Home() {
  const version = "0.0.17";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [outsourcingOpen, setOutsourcingOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("WO-2026-0014");

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    if (drawerOpen) {
      const scrollY = window.scrollY;
      body.dataset.scrollY = String(scrollY);
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
    } else {
      const saved = body.dataset.scrollY || "0";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      html.style.overflow = "";
      window.scrollTo(0, Number(saved));
      delete body.dataset.scrollY;
    }

    return () => {
      const saved = body.dataset.scrollY || "0";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      html.style.overflow = "";
      if (drawerOpen) {
        window.scrollTo(0, Number(saved));
      }
      delete body.dataset.scrollY;
    };
  }, [drawerOpen]);

  const workOrders: WorkOrder[] = [
    {
      id: "WO-2026-0014",
      internalCode: "MN-24031",
      productName: "코튼 레이어드 반팔",
      title: "코튼 레이어드 반팔",
      category: "의류 > 상의 > 반팔",
      stage: "발주대기",
      vendor: "A공장",
      dueDate: "03/29",
      inventoryStatus: "부족",
      filesCount: 4,
      status: "발주대기",
      category1: "의류",
      category2: "상의",
      category3: "반팔",
      season: "SS",
      manager: "김담당",
      priority: "높음",
      quantity: 20,
      memo: "샘플 1차 진행. 넥라인 시보리 톤 다운 요청.",
      historyItems: [
        { time: "09:14", user: "Kty", action: "수량 30 → 50 변경" },
        { time: "09:18", user: "김담당", action: "발주상태 요청 → 완료 변경" },
        { time: "09:23", user: "staff1", action: "샘플사진 2장 업로드" },
        { time: "09:40", user: "Kty", action: "외주공정 나염 추가" },
      ],
      materials: [
        { type: "원단", name: "30수 코튼", vendor: "A텍스타일", quantity: 12, unit: "yd", unitCost: 3500, totalCost: 42000, status: "발주완료" },
        { type: "원단", name: "폴리 안감", vendor: "B원단", quantity: 8, unit: "yd", unitCost: 2200, totalCost: 17600, status: "입고완료" },
        { type: "부자재", name: "단추 18mm", vendor: "C부자재", quantity: 40, unit: "개", unitCost: 120, totalCost: 4800, status: "발주완료" },
        { type: "부자재", name: "케어라벨", vendor: "D라벨", quantity: 20, unit: "개", unitCost: 150, totalCost: 3000, status: "요청전" },
      ],
      outsourcing: [
        { process: "재단", vendor: "A공장", quantity: 20, unitType: "장당", unitCost: 1500, totalCost: 30000, status: "완료" },
        { process: "봉제", vendor: "B공장", quantity: 20, unitType: "장당", unitCost: 8000, totalCost: 160000, status: "진행중" },
        { process: "나염", vendor: "C프린트", quantity: 1, unitType: "건당", unitCost: 50000, totalCost: 50000, status: "요청전" },
        { process: "라벨봉제", vendor: "D업체", quantity: 20, unitType: "장당", unitCost: 300, totalCost: 6000, status: "완료" },
      ],
    },
    {
      id: "WO-2026-0015",
      internalCode: "MN-24032",
      productName: "워싱 데님 팬츠",
      title: "워싱 데님 팬츠",
      category: "의류 > 하의 > 데님",
      stage: "봉제중",
      vendor: "B공장",
      dueDate: "04/02",
      inventoryStatus: "정상",
      filesCount: 6,
      status: "봉제중",
      category1: "의류",
      category2: "하의",
      category3: "데님",
      season: "SS",
      manager: "이담당",
      priority: "중간",
      quantity: 30,
      memo: "워싱 강도 샘플 확인 후 본생산 진행 예정.",
      historyItems: [
        { time: "10:05", user: "이담당", action: "워싱 샘플 확인 요청" },
        { time: "10:20", user: "Kty", action: "봉제 수량 재확인" },
      ],
      materials: [
        { type: "원단", name: "데님 10oz", vendor: "청원단", quantity: 20, unit: "yd", unitCost: 5200, totalCost: 104000, status: "입고완료" },
        { type: "부자재", name: "지퍼", vendor: "YKK", quantity: 30, unit: "개", unitCost: 600, totalCost: 18000, status: "발주완료" },
        { type: "부자재", name: "리벳", vendor: "금속부자재", quantity: 60, unit: "개", unitCost: 120, totalCost: 7200, status: "입고완료" },
      ],
      outsourcing: [
        { process: "재단", vendor: "B공장", quantity: 30, unitType: "장당", unitCost: 1800, totalCost: 54000, status: "완료" },
        { process: "봉제", vendor: "B공장", quantity: 30, unitType: "장당", unitCost: 9000, totalCost: 270000, status: "진행중" },
        { process: "워싱", vendor: "세탁공정", quantity: 30, unitType: "장당", unitCost: 2500, totalCost: 75000, status: "요청전" },
      ],
    },
    {
      id: "WO-2026-0016",
      internalCode: "MN-24033",
      productName: "미니 숄더백",
      title: "미니 숄더백",
      category: "가방 > 숄더백 > 미니백",
      stage: "완료",
      vendor: "C업체",
      dueDate: "03/18",
      inventoryStatus: "정상",
      filesCount: 3,
      status: "완료",
      category1: "가방",
      category2: "숄더백",
      category3: "미니백",
      season: "FW",
      manager: "박담당",
      priority: "낮음",
      quantity: 15,
      memo: "완료된 샘플. 사진 아카이브만 추가 정리 예정.",
      historyItems: [
        { time: "11:10", user: "박담당", action: "완료 처리" },
      ],
      materials: [
        { type: "원단", name: "합성피혁", vendor: "가방원단", quantity: 10, unit: "yd", unitCost: 6800, totalCost: 68000, status: "입고완료" },
        { type: "부자재", name: "체인 스트랩", vendor: "금속부자재", quantity: 15, unit: "개", unitCost: 2200, totalCost: 33000, status: "입고완료" },
      ],
      outsourcing: [
        { process: "재단", vendor: "C업체", quantity: 15, unitType: "개당", unitCost: 2000, totalCost: 30000, status: "완료" },
        { process: "봉제", vendor: "C업체", quantity: 15, unitType: "개당", unitCost: 7500, totalCost: 112500, status: "완료" },
      ],
    },
  ];

  const selectedWorkOrder = workOrders.find((item) => item.id === selectedId) ?? workOrders[0];

  const materials = selectedWorkOrder.materials;
  const outsourcing = selectedWorkOrder.outsourcing;
  const historyItems = selectedWorkOrder.historyItems;

  const fabricTotal = materials.filter((item) => item.type === "원단").reduce((sum, item) => sum + item.totalCost, 0);
  const subsidiaryTotal = materials.filter((item) => item.type === "부자재").reduce((sum, item) => sum + item.totalCost, 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + item.totalCost, 0);
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal;
  const unitCost = Math.round(totalCost / selectedWorkOrder.quantity);
  const stageList = ["작업지시 작성", "검토 완료", "발주 요청", "발주 완료", "입고 대기", "생산 중", "완료"];

  const materialSummary = useMemo(() => {
    return { count: materials.length, total: materials.reduce((sum, item) => sum + item.totalCost, 0) };
  }, [materials]);

  const outsourcingSummary = useMemo(() => {
    return { count: outsourcing.length, total: outsourcing.reduce((sum, item) => sum + item.totalCost, 0) };
  }, [outsourcing]);

  const handleSelectWorkOrder = (id: string, closeDrawer = false) => {
    setSelectedId(id);
    setMaterialOpen(false);
    setOutsourcingOpen(false);
    if (closeDrawer) setDrawerOpen(false);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900">
      <MobileTopBar version={version} onOpen={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} workOrders={workOrders} selectedId={selectedId} onSelect={handleSelectWorkOrder} onCreate={() => setDrawerOpen(false)} />

      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-12">
        <aside className="hidden min-w-0 border-r border-stone-200 bg-white md:block md:col-span-3">
          <SidebarContent version={version} workOrders={workOrders} selectedId={selectedId} onSelect={handleSelectWorkOrder} onCreate={() => undefined} />
        </aside>

        <section className="min-w-0 p-4 md:col-span-6 md:overflow-y-auto md:p-6">
          <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-cyan-900">모바일 체크포인트</div>
                <div className="mt-1 text-xs text-cyan-800">v{version} 반영 여부를 여기 기준으로 확인</div>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-cyan-800">select</span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-cyan-900">
              <div>1. 메뉴에서 작업 선택 시 드로어가 닫히는지</div>
              <div>2. 중앙 상세 제목이 선택한 작업으로 바뀌는지</div>
              <div>3. 품번/작업지시서 번호가 화면에서 사라졌는지</div>
              <div>4. 원단/부자재에서 역할 항목이 사라졌는지</div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <h2 className="mt-1 break-keep text-2xl font-semibold">{selectedWorkOrder.title}</h2>
                <div className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">상태: {selectedWorkOrder.status}</div>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <button className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm sm:flex-none">복제</button>
                <button className="flex-1 rounded-xl bg-stone-900 px-4 py-2 text-sm text-white sm:flex-none">저장</button>
              </div>
            </div>

            <div className="mt-6 grid gap-6">
              <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
                <h3 className="text-base font-semibold">기본 분류</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <Info label="대분류" value={selectedWorkOrder.category1} />
                  <Info label="중분류" value={selectedWorkOrder.category2} />
                  <Info label="소분류" value={selectedWorkOrder.category3} />
                  <Info label="시즌" value={selectedWorkOrder.season} />
                  <Info label="우선순위" value={selectedWorkOrder.priority} />
                  <Info label="공장" value={selectedWorkOrder.vendor} />
                  <Info label="담당자" value={selectedWorkOrder.manager} />
                  <Info label="납기일" value={selectedWorkOrder.dueDate} />
                  <Info label="총 수량" value={`${selectedWorkOrder.quantity}장`} />
                </div>
              </div>

              <AccordionSection
                title="원단 / 부자재 구성"
                buttonLabel="항목 추가"
                mobileOpen={materialOpen}
                onToggle={() => setMaterialOpen((prev) => !prev)}
                summaryText={`총 ${materialSummary.count}개 / ${materialSummary.total.toLocaleString()}원`}
                mobileItems={materials.map((item) => ({
                  key: `${item.name}-${item.vendor}`,
                  title: `${item.type} · ${item.name}`,
                  rows: [
                    ["거래처", item.vendor],
                    ["수량", `${item.quantity}${item.unit}`],
                    ["단가", `${item.unitCost.toLocaleString()}원`],
                    ["금액", `${item.totalCost.toLocaleString()}원`],
                    ["상태", item.status],
                  ],
                }))}
                desktopHeaders={["구분", "자재명", "거래처", "수량", "단가", "금액", "상태"]}
                desktopRows={materials.map((item) => [
                  item.type,
                  item.name,
                  item.vendor,
                  `${item.quantity}${item.unit}`,
                  `${item.unitCost.toLocaleString()}원`,
                  `${item.totalCost.toLocaleString()}원`,
                  item.status,
                ])}
              />

              <AccordionSection
                title="외주 공정"
                buttonLabel="공정 추가"
                mobileOpen={outsourcingOpen}
                onToggle={() => setOutsourcingOpen((prev) => !prev)}
                summaryText={`총 ${outsourcingSummary.count}개 / ${outsourcingSummary.total.toLocaleString()}원`}
                mobileItems={outsourcing.map((item) => ({
                  key: `${item.process}-${item.vendor}`,
                  title: item.process,
                  rows: [
                    ["외주처", item.vendor],
                    ["수량", String(item.quantity)],
                    ["단가기준", item.unitType],
                    ["단가", `${item.unitCost.toLocaleString()}원`],
                    ["금액", `${item.totalCost.toLocaleString()}원`],
                    ["상태", item.status],
                  ],
                }))}
                desktopHeaders={["공정", "외주처", "수량", "단가기준", "단가", "금액", "상태"]}
                desktopRows={outsourcing.map((item) => [
                  item.process,
                  item.vendor,
                  String(item.quantity),
                  item.unitType,
                  `${item.unitCost.toLocaleString()}원`,
                  `${item.totalCost.toLocaleString()}원`,
                  item.status,
                ])}
              />

              <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
                <h3 className="text-base font-semibold">작업 메모</h3>
                <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">{selectedWorkOrder.memo}</div>
              </div>
            </div>
          </div>
        </section>

        <aside className="min-w-0 border-t border-stone-200 bg-stone-50 p-4 md:col-span-3 md:border-t-0 md:border-l md:p-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">진행 단계</h3>
              <div className="mt-4 space-y-3">
                {stageList.map((stage, index) => {
                  const active = index <= 2;
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${active ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-500"}`}>{index + 1}</div>
                      <div className={`text-sm ${active ? "font-medium text-stone-900" : "text-stone-500"}`}>{stage}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">비용 요약</h3>
              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow label="원단 합계" value={`${fabricTotal.toLocaleString()}원`} />
                <SummaryRow label="부자재 합계" value={`${subsidiaryTotal.toLocaleString()}원`} />
                <SummaryRow label="외주 합계" value={`${outsourcingTotal.toLocaleString()}원`} />
                <div className="border-t border-stone-200 pt-3">
                  <SummaryRow label="총합" value={`${totalCost.toLocaleString()}원`} strong />
                  <SummaryRow label="장당 추정 원가" value={`${unitCost.toLocaleString()}원`} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">공정별 금액</h3>
              <div className="mt-4 space-y-2 text-sm">
                {outsourcing.map((item) => (
                  <SummaryRow key={item.process} label={item.process} value={`${item.totalCost.toLocaleString()}원`} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">최근 히스토리</h3>
              <div className="mt-4 space-y-3">
                {historyItems.map((item) => (
                  <div key={`${item.time}-${item.action}`} className="rounded-xl bg-stone-50 p-3">
                    <div className="text-xs text-stone-500">{item.time} · {item.user}</div>
                    <div className="mt-1 text-sm">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function AccordionSection({
  title,
  buttonLabel,
  mobileOpen,
  onToggle,
  summaryText,
  mobileItems,
  desktopHeaders,
  desktopRows,
}: {
  title: string;
  buttonLabel: string;
  mobileOpen: boolean;
  onToggle: () => void;
  summaryText: string;
  mobileItems: { key: string; title: string; rows: [string, string][] }[];
  desktopHeaders: string[];
  desktopRows: string[][];
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">{buttonLabel}</button>
      </div>

      <div className="mt-4 md:hidden">
        <button type="button" onClick={onToggle} className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">{title}</div>
              <div className="mt-1 text-xs text-stone-500">{summaryText}</div>
            </div>
            <span className="shrink-0 text-lg text-stone-500">{mobileOpen ? "−" : "+"}</span>
          </div>
        </button>

        {mobileOpen && (
          <div className="mt-3 space-y-3">
            {mobileItems.map((item) => (
              <MobileDataCard key={item.key} title={item.title} rows={item.rows} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="text-stone-500">
            <tr className="border-b border-stone-200">
              {desktopHeaders.map((header) => (
                <th key={header} className="px-2 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {desktopRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-stone-100">
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className={`px-2 py-3 ${cellIndex === row.length - 2 ? "font-medium" : ""}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileTopBar({ version, onOpen }: { version: string; onOpen: () => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <button type="button" onClick={onOpen} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800">메뉴</button>
      <div className="text-sm font-semibold text-stone-900">PeacebyPiece v{version}</div>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  workOrders,
  selectedId,
  onSelect,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  workOrders: WorkOrder[];
  selectedId: string;
  onSelect: (id: string, closeDrawer?: boolean) => void;
  onCreate?: (closeDrawer?: boolean) => void;
}) {
  return (
    <div className={`${open ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-40 md:hidden`}>
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className={`absolute left-0 top-0 h-full w-[85%] max-w-80 overflow-y-auto bg-white shadow-xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 p-4">
          <div>
            <div className="text-base font-semibold text-stone-900">작업 리스트</div>
            <div className="mt-1 text-xs text-stone-500">모바일 드로어 메뉴</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">닫기</button>
        </div>
        <div className="p-4">
          <input className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm outline-none" placeholder="제품명 검색" />
          <div className="mt-3 flex flex-wrap gap-2">
            {["전체", "진행중", "발주대기", "입고대기", "완료"].map((tag) => (
              <button key={tag} className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs">{tag}</button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onCreate?.(true)}
            className="mt-3 w-full rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            + 새 작업지시서
          </button>
        </div>
        <div className="space-y-3 px-4 pb-6">
          {workOrders.map((item) => {
            const selected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id, true)}
                className={`block w-full rounded-2xl border p-4 text-left shadow-sm ${selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-keep text-sm font-semibold">{item.productName}</div>
                    <div className={`mt-1 text-xs ${selected ? "text-stone-300" : "text-stone-500"}`}>{item.internalCode}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${selected ? "bg-white/15 text-white" : "bg-stone-100 text-stone-700"}`}>{item.stage}</span>
                </div>
                <div className={`mt-3 space-y-1 text-xs ${selected ? "text-stone-300" : "text-stone-600"}`}>
                  <div className="break-keep">{item.category}</div>
                  <div>마감: {item.dueDate}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  version,
  workOrders,
  selectedId,
  onSelect,
  onCreate,
}: {
  version: string;
  workOrders: WorkOrder[];
  selectedId: string;
  onSelect: (id: string, closeDrawer?: boolean) => void;
  onCreate?: () => void;
}) {
  return (
    <>
      <div className="border-b border-stone-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">PeacebyPiece</h1>
            <p className="mt-1 text-sm text-stone-500">작업지시 워크스테이션</p>
          </div>
          <span className="shrink-0 rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">v{version}</span>
        </div>
      </div>
      <div className="p-4">
        <input className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm outline-none" placeholder="제품명 검색" />
        <div className="mt-3 flex flex-wrap gap-2">
          {["전체", "진행중", "발주대기", "입고대기", "완료"].map((tag) => (
            <button key={tag} className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs">{tag}</button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onCreate?.()}
          className="mt-3 w-full rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          + 새 작업지시서
        </button>
      </div>
      <div className="space-y-3 px-4 pb-4">
        {workOrders.map((item) => {
          const selected = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`block w-full rounded-2xl border p-4 text-left shadow-sm ${selected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-keep text-sm font-semibold">{item.productName}</div>
                  <div className={`mt-1 text-xs ${selected ? "text-stone-300" : "text-stone-500"}`}>{item.internalCode}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${selected ? "bg-white/15 text-white" : "bg-stone-100 text-stone-700"}`}>{item.stage}</span>
              </div>
              <div className={`mt-3 space-y-1 text-xs ${selected ? "text-stone-300" : "text-stone-600"}`}>
                <div className="break-keep">{item.category}</div>
                <div>거래처/공장: {item.vendor}</div>
                <div>마감: {item.dueDate}</div>
                <div>재고: {item.inventoryStatus}</div>
                <div>첨부파일: {item.filesCount}개</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function MobileDataCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="text-sm font-semibold text-stone-900">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={`${title}-${label}`} className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-xs text-stone-500">{label}</span>
            <span className="text-right text-sm font-medium text-stone-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-stone-200 bg-white p-3">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-stone-900" : "text-stone-600"}>{label}</span>
      <span className={strong ? "font-semibold text-stone-900" : "font-medium"}>{value}</span>
    </div>
  );
}
