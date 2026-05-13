"use client";

import { AdminModal, AdminModalSection } from "@/components/admin/layout/AdminModal";
import { MODAL_INPUT_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { buildCategoryRuleMatchPreview } from "@/lib/system/categoryRuleEditor";
import type { CategoryRulesManagerText } from "@/lib/system/categoryRuleText";
import { TestResultPanel } from "./CategoryRulePanelShared";

export function CategoryRuleTestModal({
  open,
  onClose,
  testTitle,
  onChangeTitle,
  preview,
  text,
}: {
  open: boolean;
  onClose: () => void;
  testTitle: string;
  onChangeTitle: (value: string) => void;
  preview: ReturnType<typeof buildCategoryRuleMatchPreview>;
  text: CategoryRulesManagerText;
}) {
  return (
    <AdminModal open={open} onClose={onClose} title={text.testModalTitle} maxWidthClass="md:max-w-xl">
      <AdminModalSection>
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">{text.testInputLabel}</span>
            <input
              value={testTitle}
              onChange={(event) => onChangeTitle(event.target.value)}
              placeholder={text.testInputPlaceholder}
              className={MODAL_INPUT_CLASS}
            />
          </label>
          <TestResultPanel preview={preview} text={text} />
        </div>
      </AdminModalSection>
    </AdminModal>
  );
}
