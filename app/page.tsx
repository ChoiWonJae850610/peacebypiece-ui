"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const version = "0.0.9";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [outsourcingOpen, setOutsourcingOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const workOrders = [
    {
      id: "WO-2026-0014",
      productName: "코튼 레이어드 반팔",
      code: "MN-24031",
      category: "의류 > 상의 > 반팔",
      stage: "발주대기",
      vendor: "A공장",
      dueDate: "03/29",
      inventoryStatus: "부족",
      filesCount: 4,
    },
    {
      id: "WO-2026-0015",
      productName: "워싱 데님 팬츠",
      code: "MN-24032",
      category: "의류 > 하의 > 데님",
      stage: "봉제중",
      vendor: "B공장",
      dueDate: "04/02",
      inventoryStatus: "정상",
      filesCount: 6,
    },
    {
      id: "WO-2026-0016",
      productName: "미니 숄더백",
      code: "MN-24033",
      category: "가방 > 숄더백 > 미니백",
      stage: "완료",
      vendor: "C업체",
      dueDate: "03/18",
      inventoryStatus: "정상",
      filesCount: 3,
    },
  ];

  const selectedWorkOrder = {
    id: "WO-2026-0014",
    title: "코튼 레이어드 반팔",
    code: "MN-24031",
    status: "발주대기",
    category1: "의류",
    category2: "상의",
    category3: "반팔",
    season: "SS",
    vendor: "A공장",
    manager: "김담당",
    dueDate: "2026-03-29",
    priority: "높음",
    quantity: 20,
    memo: "샘플 1차 진행. 넥라인 시보리 톤 다운 요청.",
  };

  const materials = [
    { type: "원단", name: "30수 코튼", role: "겉감", vendor: "A텍스타일", quantity: 12, unit: "yd", unitCost: 3500, totalCost: 42000, status: "발주완료" },
    { type: "원단", name: "폴리 안감", role: "안감", vendor: "B원단", quantity: 8, unit: "yd", unitCost: 2200, totalCost: 17600, status: "입고완료" },
    { type: "부자재", name: "단추 18mm", role: "앞여밈", vendor: "C부자재", quantity: 40, unit: "개", unitCost: 120, totalCost: 4800, status: "발주완료" },
    { type: "부자재", name: "케어라벨", role: "라벨", vendor: "D라벨", quantity: 20, unit: "개", unitCost: 150, totalCost: 3000, status: "요청전" },
  ];

  const outsourcing = [
    { process: "재단", vendor: "A공장", quantity: 20, unitType: "장당", unitCost: 1500, totalCost: 30000, status: "완료" },
    { process: "봉제", vendor: "B공장", quantity: 20, unitType: "장당", unitCost: 8000, totalCost: 160000, status: "진행중" },
    { process: "나염", vendor: "C프린트", quantity: 1, unitType: "건당", unitCost: 50000, totalCost: 50000, status: "요청전" },
    { process: "라벨봉제", vendor: "D업체", quantity: 20, unitType: "장당", unitCost: 300, totalCost: 6000, status: "완료" },
  ];

  const history = [
    { time: "09:14", user: "Kty", action: "수량 30 → 50 변경" },
    { time: "09:18", user: "김담당", action: "발주상태 요청 → 완료 변경" },
    { time: "09:23", user: "staff1", action: "샘플사진 2장 업로드" },
    { time: "09:40", user: "Kty", action: "외주공정 나염 추가" },
  ];

  const fabricTotal = materials.filter((item) => item.type === "원단").reduce((sum, item) => sum + item.totalCost, 0);
  const subsidiaryTotal = materials.filter((item) => item.type === "부자재").reduce((sum, item) => sum + item.totalCost, 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + item.totalCost, 0);
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal;
  const unitCost = Math.round(totalCost / selectedWorkOrder.quantity);
  const stageList = ["작업지시 작성", "검토 완료", "발주 요청", "발주 완료", "입고 대기", "생산 중", "완료"];

  const materialSummary = useMemo(() => {
    return {
      count: materials.length,
      total: materials.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }, [materials]);

  const outsourcingSummary = useMemo(() => {
    return {
      count: outsourcing.length,
      total: outsourcing.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }, [outsourcing]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900">
      <MobileTopBar version={version} onOpen={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} workOrders={workOrders} />

      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-12">
        <aside className="hidden min-w-0 border-r border-stone-200 bg-white md:block md:col-span-3">
          <SidebarContent version={version} workOrders={workOrders} />
        </aside>

        <section className="min-w-0 p-4 md:col-span-6 md:overflow-y-auto md:p-6">
          <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-violet-900">모바일 체크포인트</div>
                <div className="mt-1 text-xs text-violet-800">v{version} 반영 여부를 여기 기준으로 확인</div>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-violet-800">accordion</span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-violet-900">
              <div>1. 상단 메뉴 버튼 및 v{version} 보이는지</div>
              <div>2. 원단/부자재 섹션이 기본 접힘 상태인지</div>
              <div>3. 외주 공정 섹션도 기본 접힘 상태인지</div>
              <div>4. 각 섹션을 누르면 카드형 상세가 펼쳐지는지</div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <div className="text-sm text-stone-500">작업지시서 번호 {selectedWorkOrder.id}</div>
                <h2 className="mt-1 break-keep text-2xl font-semibold">{selectedWorkOrder.title}</h2>
                <div className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                  상태: {selectedWorkOrder.status}
                </div>
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
                  <Info label="품번" value={selectedWorkOrder.code} />
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
                  key: `${item.name}-${item.role}`,
                  title: `${item.type} · ${item.name}`,
                  rows: [
                    ["역할", item.role],
                    ["거래처", item.vendor],
                    ["수량", `${item.quantity}${item.unit}`],
                    ["단가", `${item.unitCost.toLocaleString()}원`],
                    ["금액", `${item.totalCost.toLocaleString()}원`],
                    ["상태", item.status],
                  ],
                }))}
                desktopHeaders={["구분", "자재명", "역할", "거래처", "수량", "단가", "금액", "상태"]}
                desktopRows={materials.map((item) => [
                  item.type,
                  item.name,
                  item.role,
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
                <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
                  {selectedWorkOrder.memo}
                </div>
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
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${active ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-500"}`}>
                        {index + 1}
                      </div>
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
                {history.map((item) => (
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
        <button
          type="button"
          onClick={onToggle}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-left"
        >
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
                  <td key={`${rowIndex}-${cellIndex}`} className={`px-2 py-3 ${cellIndex === row.length - 2 ? "font-medium" : ""}`}>
                    {cell}
                  </td>
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
      <div className="text-sm font-semibold text-stone-900">PeacebyPiece v0.0.9</div>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  workOrders,
}: {
  open: boolean;
  onClose: () => void;
  workOrders: { id: string; productName: string; code: string; stage: string; category: string; dueDate: string }[];
}) {
  return (
    <div className={`${open ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-40 md:hidden`}>
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`absolute left-0 top-0 h-full w-[85%] max-w-80 overflow-y-auto bg-white shadow-xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-stone-200 p-4">
          <div>
            <div className="text-base font-semibold text-stone-900">작업 리스트</div>
            <div className="mt-1 text-xs text-stone-500">모바일 드로어 메뉴</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">닫기</button>
        </div>
        <div className="p-4">
          <input className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm outline-none" placeholder="제품명 / 품번 검색" />
          <div className="mt-3 flex flex-wrap gap-2">
            {["전체", "진행중", "발주대기", "입고대기", "완료"].map((tag) => (
              <button key={tag} className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs">{tag}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3 px-4 pb-6">
          {workOrders.map((item, index) => (
            <div key={item.id} className={`rounded-2xl border p-4 shadow-sm ${index === 0 ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-keep text-sm font-semibold">{item.productName}</div>
                  <div className={`mt-1 text-xs ${index === 0 ? "text-stone-300" : "text-stone-500"}`}>{item.code}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${index === 0 ? "bg-white/15 text-white" : "bg-stone-100 text-stone-700"}`}>{item.stage}</span>
              </div>
              <div className={`mt-3 space-y-1 text-xs ${index === 0 ? "text-stone-300" : "text-stone-600"}`}>
                <div className="break-keep">{item.category}</div>
                <div>마감: {item.dueDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  version,
  workOrders,
}: {
  version: string;
  workOrders: { id: string; productName: string; code: string; stage: string; category: string; vendor: string; dueDate: string; inventoryStatus: string; filesCount: number }[];
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
        <input className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm outline-none" placeholder="제품명 / 품번 검색" />
        <div className="mt-3 flex flex-wrap gap-2">
          {["전체", "진행중", "발주대기", "입고대기", "완료"].map((tag) => (
            <button key={tag} className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs">{tag}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3 px-4 pb-4">
        {workOrders.map((item, index) => (
          <div key={item.id} className={`rounded-2xl border p-4 shadow-sm ${index === 0 ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-keep text-sm font-semibold">{item.productName}</div>
                <div className={`mt-1 text-xs ${index === 0 ? "text-stone-300" : "text-stone-500"}`}>{item.code}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${index === 0 ? "bg-white/15 text-white" : "bg-stone-100 text-stone-700"}`}>{item.stage}</span>
            </div>
            <div className={`mt-3 space-y-1 text-xs ${index === 0 ? "text-stone-300" : "text-stone-600"}`}>
              <div className="break-keep">{item.category}</div>
              <div>거래처/공장: {item.vendor}</div>
              <div>마감: {item.dueDate}</div>
              <div>재고: {item.inventoryStatus}</div>
              <div>첨부파일: {item.filesCount}개</div>
            </div>
          </div>
        ))}
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
