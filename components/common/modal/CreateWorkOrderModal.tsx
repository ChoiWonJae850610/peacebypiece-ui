"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalFooter from "@/components/common/modal/ModalFooter";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { CATEGORY1_OPTIONS, CATEGORY2_OPTIONS_MAP, CATEGORY3_OPTIONS_MAP, DEFAULT_BASIC_YEAR, SEASON_OPTIONS, YEAR_OPTIONS } from "@/lib/constants/workorderOptions";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; category1: string; category2: string; category3: string; season: string }) => void;
};

type CategoryRecommendation = {
  category1: string;
  category2: string;
  category3: string;
  reason: string;
};

const RECOMMENDATION_RULES: Array<{ keywords: string[]; recommendation: CategoryRecommendation }> = [
  {
    keywords: ["반팔", "반소매", "숏슬리브", "티셔츠", "티"],
    recommendation: { category1: "상의", category2: "티셔츠", category3: "반팔", reason: "제목에 반팔/티셔츠 계열 키워드가 포함되어 있습니다." },
  },
  {
    keywords: ["긴팔", "롱슬리브", "long sleeve"],
    recommendation: { category1: "상의", category2: "티셔츠", category3: "긴팔", reason: "제목에 긴팔 계열 키워드가 포함되어 있습니다." },
  },
  {
    keywords: ["셔츠", "남방"],
    recommendation: { category1: "상의", category2: "셔츠", category3: "베이직", reason: "제목에 셔츠 계열 키워드가 포함되어 있습니다." },
  },
  {
    keywords: ["니트", "스웨터", "가디건"],
    recommendation: { category1: "상의", category2: "니트", category3: "라운드", reason: "제목에 니트 계열 키워드가 포함되어 있습니다." },
  },
  {
    keywords: ["팬츠", "바지", "슬랙스", "조거"],
    recommendation: { category1: "하의", category2: "팬츠", category3: "와이드", reason: "제목에 팬츠/바지 계열 키워드가 포함되어 있습니다." },
  },
  {
    keywords: ["데님", "청바지", "진"],
    recommendation: { category1: "하의", category2: "데님", category3: "스트레이트", reason: "제목에 데님 계열 키워드가 포함되어 있습니다." },
  },
  {
    keywords: ["스커트", "치마"],
    recommendation: { category1: "하의", category2: "스커트", category3: "미디", reason: "제목에 스커트 계열 키워드가 포함되어 있습니다." },
  },
  {
    keywords: ["자켓", "재킷", "블레이저"],
    recommendation: { category1: "아우터", category2: "자켓", category3: "테일러드", reason: "제목에 자켓 계열 키워드가 포함되어 있습니다." },
  },
  {
    keywords: ["코트", "트렌치"],
    recommendation: { category1: "아우터", category2: "코트", category3: "롱", reason: "제목에 코트 계열 키워드가 포함되어 있습니다." },
  },
  {
    keywords: ["점퍼", "패딩", "블루종", "바람막이"],
    recommendation: { category1: "아우터", category2: "점퍼", category3: "바람막이", reason: "제목에 점퍼/아우터 계열 키워드가 포함되어 있습니다." },
  },
];

function getTitleRecommendation(title: string): CategoryRecommendation | null {
  const normalizedTitle = title.trim().toLowerCase();
  if (!normalizedTitle) return null;

  const matchedRule = RECOMMENDATION_RULES.find((rule) => rule.keywords.some((keyword) => normalizedTitle.includes(keyword.toLowerCase())));
  return matchedRule?.recommendation ?? null;
}

const mobileFieldClassName = "pbp-field-interaction h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 outline-none focus:border-stone-500 md:text-sm";
const mobileSelectClassName = "pbp-field-interaction h-11 rounded-xl border border-stone-300 bg-white px-3 text-base text-stone-900 outline-none focus:border-stone-500 md:text-sm";

export default function CreateWorkOrderModal({ open, onClose, onCreate }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState("");
  const [category1, setCategory1] = useState<string>(CATEGORY1_OPTIONS[0] ?? "의류");
  const category2Options = useMemo(() => CATEGORY2_OPTIONS_MAP[category1] ?? ["미분류"], [category1]);
  const [category2, setCategory2] = useState<string>(category2Options[0] ?? "미분류");
  const category3Options = useMemo(() => CATEGORY3_OPTIONS_MAP[category2] ?? ["미분류"], [category2]);
  const [category3, setCategory3] = useState<string>(category3Options[0] ?? "미분류");
  const [seasonType, setSeasonType] = useState<string>(SEASON_OPTIONS[0] ?? "SS");
  const [seasonYear, setSeasonYear] = useState<string>(DEFAULT_BASIC_YEAR);

  useModalEnvironment({ open, dialogRef, onClose });

  useEffect(() => {
    if (!open) return;
    setTitle("");
    const nextCategory1 = CATEGORY1_OPTIONS[0] ?? "의류";
    const nextCategory2 = CATEGORY2_OPTIONS_MAP[nextCategory1]?.[0] ?? "미분류";
    const nextCategory3 = CATEGORY3_OPTIONS_MAP[nextCategory2]?.[0] ?? "미분류";
    setCategory1(nextCategory1);
    setCategory2(nextCategory2);
    setCategory3(nextCategory3);
    setSeasonType(SEASON_OPTIONS[0] ?? "SS");
    setSeasonYear(DEFAULT_BASIC_YEAR);
  }, [open]);

  useEffect(() => {
    const nextCategory2 = CATEGORY2_OPTIONS_MAP[category1]?.[0] ?? "미분류";
    setCategory2(nextCategory2);
  }, [category1]);

  useEffect(() => {
    const nextCategory3 = CATEGORY3_OPTIONS_MAP[category2]?.[0] ?? "미분류";
    setCategory3(nextCategory3);
  }, [category2]);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0;
  const recommendedCategory = useMemo(() => getTitleRecommendation(trimmedTitle), [trimmedTitle]);

  const handleApplyRecommendation = () => {
    if (!recommendedCategory) return;
    setCategory1(recommendedCategory.category1);
    setCategory2(recommendedCategory.category2);
    setCategory3(recommendedCategory.category3);
  };

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="create-workorder-title" maxWidthClassName="md:max-w-xl">
      <ModalHeader titleId="create-workorder-title" title="작업지시서 생성" description="작업지시서 기본 정보를 입력하면 작성중 상태로 생성됩니다." onClose={onClose} />
      <ModalBody>
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">작업지시서명</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 코튼 레이어드 반팔" className={mobileFieldClassName} />
          </label>
          {recommendedCategory ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-emerald-900">추천 분류</div>
                  <div className="mt-1 text-sm text-emerald-800">
                    {recommendedCategory.category1} / {recommendedCategory.category2} / {recommendedCategory.category3}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-emerald-700">{recommendedCategory.reason}</div>
                </div>
                <button
                  type="button"
                  onClick={handleApplyRecommendation}
                  className="pbp-interactive-button shrink-0 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100"
                >
                  추천 분류 적용
                </button>
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">대분류</span>
              <select value={category1} onChange={(e) => setCategory1(e.target.value)} className={mobileSelectClassName}>
                {CATEGORY1_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">중분류</span>
              <select value={category2} onChange={(e) => setCategory2(e.target.value)} className={mobileSelectClassName}>
                {category2Options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">소분류</span>
              <select value={category3} onChange={(e) => setCategory3(e.target.value)} className={mobileSelectClassName}>
                {category3Options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">시즌</span>
              <select value={seasonType} onChange={(e) => setSeasonType(e.target.value)} className={mobileSelectClassName}>
                {SEASON_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">연도</span>
              <select value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} className={mobileSelectClassName}>
                {YEAR_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="pbp-interactive-button rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100">취소</button>
          <button type="button" disabled={!canSubmit} onClick={() => onCreate({ title: trimmedTitle, category1, category2, category3, season: `${seasonType} ${seasonYear}`.trim() })} className="pbp-interactive-button rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300">생성</button>
        </div>
      </ModalFooter>
    </BaseModal>
  );
}
