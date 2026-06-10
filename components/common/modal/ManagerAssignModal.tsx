"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { blurActiveModalElement } from "@/components/common/modal/modalUtils";
import { MODAL_CONTENT_MUTED_PANEL_CLASS } from "@/components/common/modal/modalContentClassNames";
import {
  MODAL_ACTION_LABELS,
  getModalActionDisabledState,
  renderModalFooterActions,
} from "@/components/common/modal/modalActions";
import { formatRoles } from "@/lib/constants/roles";
import type { UserProfile } from "@/types/user";
import { useI18n } from "@/lib/i18n";
import { SELECTABLE_CARD_SUBTEXT_CLASS } from "@/lib/constants/display";
import { WaflInfoRow, WaflSelectableCard } from "@/components/common/ui";

export default function ManagerAssignModal({
  open,
  onClose,
  users,
  currentManagerId,
  currentManagerName,
  onSelectManager,
}: {
  open: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentManagerId: string | null;
  currentManagerName: string;
  onSelectManager: (userId: string) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.managerAssign;
  const [draftManagerId, setDraftManagerId] = useState<string>(
    currentManagerId ?? "",
  );
  const managerCandidates = useMemo(
    () =>
      users.filter((user) => Boolean(user.id) && Boolean(user.companyMemberId)),
    [users],
  );

  useEffect(() => {
    if (open) setDraftManagerId(currentManagerId ?? "");
  }, [currentManagerId, open]);

  const applyDisabled = getModalActionDisabledState(
    !draftManagerId || draftManagerId === (currentManagerId ?? ""),
  );
  const handleApply = () => {
    if (applyDisabled || !draftManagerId) return;
    blurActiveModalElement();
    onSelectManager(draftManagerId);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-lg"
      footer={renderModalFooterActions({
        layout: "end",
        primary: {
          label: MODAL_ACTION_LABELS.apply,
          onClick: handleApply,
          disabled: applyDisabled,
          tone: "primary",
        },
      })}
    >
      <WaflInfoRow
        tone="muted"
        component="manager-assign-current-row"
        className={`${MODAL_CONTENT_MUTED_PANEL_CLASS} px-4 py-3 text-sm`}
      >
        <span className="text-[var(--pbp-text-secondary)]">
          {copy.currentManagerLabel}
        </span>
        <span className="font-medium text-[var(--pbp-text-primary)]">
          {currentManagerName || "-"}
        </span>
      </WaflInfoRow>

      <div className="mt-4 space-y-2">
        {managerCandidates.map((user) => {
          const selected = draftManagerId
            ? user.id === draftManagerId
            : user.name === currentManagerName;
          return (
            <WaflSelectableCard
              key={user.id}
              onPointerDown={(event) => {
                blurActiveModalElement();
                event.stopPropagation();
              }}
              onTouchEnd={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDraftManagerId(user.id);
              }}
              selected={selected}
            >
              <div>
                <div className="text-sm font-semibold">{user.name}</div>
                <div
                  className={`mt-1 text-xs ${selected ? SELECTABLE_CARD_SUBTEXT_CLASS.active : SELECTABLE_CARD_SUBTEXT_CLASS.inactive}`}
                >
                  {formatRoles(user.roles, user.role)}
                </div>
              </div>
              {selected ? (
                <span className="text-xs font-medium">{copy.currentBadge}</span>
              ) : null}
            </WaflSelectableCard>
          );
        })}
      </div>
    </ModalShell>
  );
}
