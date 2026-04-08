"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import type { NotificationSettingKey, NotificationSettings } from "@/types/workflow";

const SETTING_META: { key: NotificationSettingKey; label: string; description: string }[] = [
  { key: "created", label: "작업지시서 생성", description: "새 작업지시서가 만들어졌을 때 알림 대상에 포함합니다." },
  { key: "updated", label: "기본사항 수정", description: "기본 정보 저장/수정 이벤트를 알림 대상으로 둡니다." },
  { key: "status_changed", label: "상태 변경", description: "작성중, 검토요청, 발주요청 등 단계 변경 알림입니다." },
  { key: "materials_changed", label: "원단/부자재 변경", description: "원단, 부자재, 단가 등 생산구성 변경 알림입니다." },
  { key: "outsourcing_changed", label: "외주 공정 변경", description: "외주 공정 추가/수정/삭제 알림입니다." },
  { key: "stock_changed", label: "재고 변경", description: "입고, 차감, 보정 같은 재고 수량 변경 알림입니다." },
  { key: "comment_added", label: "메모 작성", description: "작업메모와 댓글이 등록되었을 때 알림합니다." },
];

type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
};

export default function AdminPanelModal({
  open,
  onClose,
  notificationSettings,
  onToggleNotificationSetting,
}: AdminPanelModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useModalEnvironment({
    open,
    dialogRef,
    onClose,
  });

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="admin-panel-modal-title" maxWidthClassName="md:max-w-xl">
      <ModalHeader
        titleId="admin-panel-modal-title"
        title="관리자 패널"
        description="관리자 알림 이벤트 ON/OFF를 미리 점검하는 테스트용 설정입니다. 현재는 상태만 유지하고 실제 발송은 연결하지 않습니다."
        onClose={onClose}
      />
      <ModalBody className="space-y-4 bg-stone-50">
        <section className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">알림 이벤트 설정</div>
              <div className="mt-1 text-xs leading-5 text-stone-500">이벤트별 알림 발송 여부를 미리 조정하는 임시 설정입니다.</div>
            </div>
            <span className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-700">테스트용</span>
          </div>

          <div className="mt-3 space-y-2">
            {SETTING_META.map((item) => {
              const checked = notificationSettings[item.key];
              return (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 transition hover:border-stone-300 hover:bg-stone-100"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleNotificationSetting(item.key)}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-stone-900">{item.label}</div>
                    <div className="mt-1 break-keep text-xs leading-5 text-stone-500">{item.description}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${checked ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"}`}>
                    {checked ? "ON" : "OFF"}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      </ModalBody>
    </BaseModal>
  );
}
