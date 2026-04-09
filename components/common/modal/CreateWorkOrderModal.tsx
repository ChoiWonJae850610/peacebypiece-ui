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

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="create-workorder-title" maxWidthClassName="md:max-w-xl">
      <ModalHeader titleId="create-workorder-title" title="새 작업지시서 생성" description="작업지시서 기본 정보를 입력하면 작성중 상태로 생성됩니다." onClose={onClose} />
      <ModalBody>
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">작업지시서명</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 코튼 레이어드 반팔" className="pbp-field-interaction h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none focus:border-stone-500" />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">대분류</span>
              <select value={category1} onChange={(e) => setCategory1(e.target.value)} className="pbp-field-interaction h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-500">
                {CATEGORY1_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">중분류</span>
              <select value={category2} onChange={(e) => setCategory2(e.target.value)} className="pbp-field-interaction h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-500">
                {category2Options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">소분류</span>
              <select value={category3} onChange={(e) => setCategory3(e.target.value)} className="pbp-field-interaction h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-500">
                {category3Options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">시즌</span>
              <select value={seasonType} onChange={(e) => setSeasonType(e.target.value)} className="pbp-field-interaction h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-500">
                {SEASON_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-stone-700">연도</span>
              <select value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} className="pbp-field-interaction h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-500">
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
