import AppBadge from "@/components/common/ui/AppBadge";
import { WaflButton, WaflLinkButton } from "@/components/common/ui/WaflButton";
import { WaflInfoBox, WaflInput, WaflSelectableCard, WaflTextarea } from "@/components/common/ui/WaflForm";
import {
  WaflAddCardButton,
  WaflAddIconBubble,
  WaflEmptyCard,
  WaflInfoRow,
  WaflSurface,
  WaflSurfaceButton,
} from "@/components/common/ui/WaflSurface";
import {
  WaflDataTableShell,
  WaflDataTableBody,
  WaflDataTableHeader,
  WaflDataTableRow,
  WAFL_DATA_TABLE_CELL_CLASS,
  WAFL_DATA_TABLE_HEADER_CELL_CLASS,
  WAFL_DATA_TABLE_PRIMARY_TEXT_CLASS,
  WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS,
} from "@/components/admin/common/WaflDataTable";
import WaflFilterBar, {
  WAFL_FILTER_FIELD_CLASS,
  WAFL_FILTER_INPUT_CLASS,
  WAFL_FILTER_LABEL_CLASS,
} from "@/components/admin/common/WaflFilterBar";
import WaflNoticeBox from "@/components/admin/common/WaflNoticeBox";
import WaflPageHero from "@/components/admin/common/WaflPageHero";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";

type WaflUiCatalogPageProps = {
  appVersion: string;
  runtimeMode: string;
  allowedRuntimeModes: string[];
};

type CatalogSection = {
  id: string;
  title: string;
  plainTitle: string;
  description: string;
  status: "guide" | "sampled" | "skeleton";
};

type QuickDecision = {
  label: string;
  component: string;
  rule: string;
  example: string;
};

type ComponentSpec = {
  name: string;
  path: string;
  plainRule: string;
  purpose: string;
  props: string;
  avoid: string;
  screens: string;
};

const catalogSections: CatalogSection[] = [
  {
    id: "start-here",
    title: "Start here",
    plainTitle: "먼저 보는 판단 기준",
    description: "컴포넌트를 모양이 아니라 역할로 고르는 기준을 먼저 확인한다.",
    status: "guide",
  },
  {
    id: "touch-actions",
    title: "Touch actions",
    plainTitle: "누르는 것",
    description: "버튼, 링크 버튼, 카드형 버튼, 추가 카드의 차이를 비교한다.",
    status: "guide",
  },
  {
    id: "containers",
    title: "Containers",
    plainTitle: "담는 것",
    description: "Surface, InfoBox, EmptyCard, SelectableCard의 역할 차이를 비교한다.",
    status: "guide",
  },
  {
    id: "inputs",
    title: "Inputs",
    plainTitle: "입력하는 것",
    description: "Input, Textarea, Select trigger, 선택 카드의 사용 기준을 확인한다.",
    status: "sampled",
  },
  {
    id: "status",
    title: "Status",
    plainTitle: "상태를 보여주는 것",
    description: "Badge, notice, empty, table row처럼 정보를 표시하는 기준을 확인한다.",
    status: "sampled",
  },
  {
    id: "wrong-right",
    title: "Wrong / Right",
    plainTitle: "잘못 쓴 예와 맞게 쓴 예",
    description: "같아 보이는 컴포넌트를 어떤 상황에서 다르게 써야 하는지 비교한다.",
    status: "guide",
  },
  {
    id: "spec-table",
    title: "Spec table",
    plainTitle: "개발자용 스펙 표",
    description: "import 경로, props, 금지 기준은 표에서 한 번에 확인한다.",
    status: "sampled",
  },
  {
    id: "next-patterns",
    title: "Next patterns",
    plainTitle: "다음에 채울 실무 패턴",
    description: "모달, 작업지시서, 발주, 저장소 패턴은 이후 버전에서 실제 화면 기준으로 연결한다.",
    status: "skeleton",
  },
];

const quickDecisions: QuickDecision[] = [
  {
    label: "저장, 생성, 삭제처럼 실행한다",
    component: "WaflButton",
    rule: "화면의 명령이다. 누르면 바로 실행되거나 저장 흐름으로 들어간다.",
    example: "저장 / 생성 / 삭제 / 검토완료",
  },
  {
    label: "다른 화면이나 섹션으로 이동한다",
    component: "WaflLinkButton",
    rule: "버튼처럼 보여도 본질이 이동이면 LinkButton을 쓴다.",
    example: "설정으로 이동 / 홈으로 이동 / 섹션 이동",
  },
  {
    label: "정보 카드처럼 보이지만 누를 수 있다",
    component: "WaflSurfaceButton",
    rule: "목록 항목, 카드 옵션, 선택 가능한 업무 항목에 쓴다.",
    example: "공정 카드 선택 / 파일 카드 열기",
  },
  {
    label: "비어 있는 자리에 새 항목을 추가한다",
    component: "WaflAddCardButton",
    rule: "카드 그리드 안의 빈 슬롯 CTA다. 일반 저장 버튼과 분리한다.",
    example: "첨부 추가 / 디자인 추가 / 구성 항목 추가",
  },
  {
    label: "그냥 내용을 담는다",
    component: "WaflSurface",
    rule: "정적 정보 묶음이다. 클릭, 선택, 상태 강조가 핵심이면 다른 컴포넌트를 고른다.",
    example: "요약 카드 / 설정 카드 / 패널 내부 group",
  },
  {
    label: "안내문이나 보조 설명이다",
    component: "WaflInfoBox",
    rule: "card보다 낮은 depth다. 카드 안 카드가 생길 때 InfoBox로 낮춘다.",
    example: "주의 안내 / 선택 요약 / 정책 설명",
  },
  {
    label: "데이터가 없다",
    component: "WaflEmptyCard",
    rule: "빈 상태 전용이다. 실제 데이터 카드처럼 보이면 안 된다.",
    example: "첨부 없음 / 메모 없음 / 준비 중",
  },
  {
    label: "짧은 상태나 유형을 붙인다",
    component: "AppBadge",
    rule: "문장 설명이 아니라 상태값, 개수, 유형 같은 짧은 라벨이다.",
    example: "작성중 / 승인 / 파일 3 / 디자인",
  },
];

const componentSpecs: ComponentSpec[] = [
  {
    name: "WaflButton",
    path: "@/components/common/ui/WaflButton",
    plainRule: "명령을 실행할 때 쓴다.",
    purpose: "저장, 생성, 삭제, 승인, 반려 등 업무 액션 버튼.",
    props: "variant, size, width, disabled, type, children",
    avoid: "rounded, shadow, bg, text 색상을 화면별로 직접 조합하지 않는다.",
    screens: "작업지시서, 발주, 저장소, 통계, 멤버관리",
  },
  {
    name: "WaflLinkButton",
    path: "@/components/common/ui/WaflButton",
    plainRule: "실행이 아니라 이동이면 이걸 쓴다.",
    purpose: "href 기반 이동 CTA를 버튼 문법으로 표시한다.",
    props: "href, variant, size, width, children",
    avoid: "링크를 별도 pill, underline CTA, 임의 button class로 만들지 않는다.",
    screens: "홈, 운영 대시보드, 내부 catalog, 설정 이동",
  },
  {
    name: "WaflSurfaceButton",
    path: "@/components/common/ui/WaflSurface",
    plainRule: "카드처럼 생겼지만 누르는 항목이다.",
    purpose: "선택 가능한 카드형 버튼, 옵션 카드, 목록 항목 액션.",
    props: "selected, tone, component, disabled, onClick, children",
    avoid: "선택 상태를 border 색상 하나만 바꾸거나 shadow로 강조하지 않는다.",
    screens: "권한 선택, 기준정보 선택, 작업 옵션 카드",
  },
  {
    name: "WaflAddCardButton",
    path: "@/components/common/ui/WaflSurface",
    plainRule: "빈 카드 자리에서 새 항목을 추가한다.",
    purpose: "카드 그리드 안의 추가 CTA.",
    props: "children, className, button attributes",
    avoid: "카드형 추가 버튼을 일반 WaflButton으로 억지 배치하지 않는다.",
    screens: "작업지시서 첨부, 디자인, 메모, 구성 항목 추가",
  },
  {
    name: "WaflSurface",
    path: "@/components/common/ui/WaflSurface",
    plainRule: "정보를 담는 기본 박스다.",
    purpose: "card, panel, section의 기본 표면. 정적 container에 사용한다.",
    props: "as, tone, component, className, children",
    avoid: "rounded, border, bg, shadow 조합을 화면마다 직접 만들지 않는다.",
    screens: "파일 카드, 설정 카드, 업무 패널 내부 group",
  },
  {
    name: "WaflInfoBox",
    path: "@/components/common/ui/WaflForm",
    plainRule: "안내문과 보조 설명이다.",
    purpose: "선택 요약, 정책 설명, 주의 안내처럼 card보다 낮은 depth의 정보 블록.",
    props: "tone, component, className, children",
    avoid: "안내문을 임의 bg 박스나 shadow card로 만들지 않는다.",
    screens: "모달 안내, 설정 안내, 접근 조건 안내",
  },
  {
    name: "WaflEmptyCard",
    path: "@/components/common/ui/WaflSurface",
    plainRule: "데이터가 없을 때만 쓴다.",
    purpose: "데이터 없음, 준비 중, 비어 있는 슬롯 표시.",
    props: "component, className, children",
    avoid: "빈 상태를 일반 회색 박스나 텍스트 한 줄만으로 방치하지 않는다.",
    screens: "저장소, 작업지시서 첨부/메모, placeholder",
  },
  {
    name: "WaflSelectableCard",
    path: "@/components/common/ui/WaflForm",
    plainRule: "폼 안의 선택지다.",
    purpose: "권한, 역할, 옵션 선택지를 카드 형태로 표시한다.",
    props: "selected, component, disabled, onClick, children",
    avoid: "폼 선택지를 임의 radio card 스타일로 중복 구현하지 않는다.",
    screens: "멤버 권한 모달, 설정 옵션, 작업 분류 선택",
  },
  {
    name: "AppBadge",
    path: "@/components/common/ui/AppBadge",
    plainRule: "짧은 상태 라벨이다.",
    purpose: "상태, 개수, 파일 유형, 업무 단계 등 짧은 라벨 표시.",
    props: "tone, variant, size, children",
    avoid: "상태값별 색상을 개별 화면에서 직접 className으로 분기하지 않는다.",
    screens: "전체 업무 화면, 파일 카드, 상태 row, table count",
  },
  {
    name: "WaflInput / WaflTextarea",
    path: "@/components/common/ui/WaflForm",
    plainRule: "입력값을 받는다.",
    purpose: "검색, 이름, 제목, 설명, 메모, 사유 입력.",
    props: "input/textarea attributes, className, ref",
    avoid: "입력 높이, border, focus ring을 화면별로 새로 만들지 않는다.",
    screens: "멤버관리, 협력업체, 저장소, 작업지시서 모달",
  },
  {
    name: "WaflFilterBar",
    path: "@/components/admin/common/WaflFilterBar",
    plainRule: "검색과 필터를 한 줄/한 덩어리로 묶는다.",
    purpose: "검색 input, select, action button 조합.",
    props: "layoutClassName, children",
    avoid: "화면마다 필터 영역의 gap, border, field 높이를 새로 만들지 않는다.",
    screens: "저장소, 통계, 멤버관리, 협력업체",
  },
];

const buttonRules = [
  "저장·생성·확정은 WaflButton primary를 쓴다.",
  "삭제·영구삭제는 WaflButton danger를 쓴다.",
  "화면 이동은 WaflLinkButton을 쓴다.",
  "카드처럼 보이는 클릭 항목은 WaflSurfaceButton을 쓴다.",
  "카드 그리드의 추가 슬롯은 WaflAddCardButton을 쓴다.",
];

const containerRules = [
  "WaflSurface는 정보를 담는 기본 박스다.",
  "WaflInfoBox는 안내문이다. 카드 안 카드가 생기면 InfoBox로 낮춘다.",
  "WaflEmptyCard는 데이터 없음 전용이다.",
  "WaflSelectableCard는 폼 내부 선택지다.",
  "선택 상태는 shadow가 아니라 selected token으로 표현한다.",
];

const statusRules = [
  "짧은 상태값은 AppBadge를 쓴다.",
  "긴 설명은 Badge가 아니라 InfoBox나 NoticeBox를 쓴다.",
  "목록 데이터는 WaflDataTable 계열을 우선한다.",
  "검색과 필터는 WaflFilterBar 안에서 묶는다.",
];

function SectionAnchorList() {
  return (
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="WAFL UI catalog sections">
      {catalogSections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          data-wafl-component="catalog-nav-card"
          className="rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm font-semibold text-[var(--pbp-text-primary)] shadow-none transition hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)]"
        >
          <span className="flex items-center justify-between gap-3">
            {section.title}
            <AppBadge size="xs" tone={section.status === "guide" ? "brand" : section.status === "sampled" ? "info" : "neutral"}>
              {section.status}
            </AppBadge>
          </span>
          <span className="mt-1 block text-xs font-bold text-[var(--pbp-text-primary)]">{section.plainTitle}</span>
          <span className="mt-1 block text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            {section.description}
          </span>
        </a>
      ))}
    </nav>
  );
}

function RuleList({ title, rules }: { title: string; rules: string[] }) {
  return (
    <WaflInfoBox tone="muted" component="catalog-rule-list">
      <p className="text-sm font-bold text-[var(--pbp-text-primary)]">{title}</p>
      <ul className="mt-2 grid gap-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)] lg:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule} className="flex gap-2">
            <span aria-hidden="true" className="text-[var(--pbp-brand-primary)]">•</span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </WaflInfoBox>
  );
}

function QuickDecisionGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {quickDecisions.map((item) => (
        <WaflSurface key={item.component + item.label} component="catalog-decision-card" tone="surface" className="p-4">
          <div className="flex h-full flex-col gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">상황</p>
              <p className="text-sm font-bold leading-5 text-[var(--pbp-text-primary)]">{item.label}</p>
            </div>
            <div className="rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-2">
              <p className="text-xs font-bold text-[var(--pbp-brand-primary)]">{item.component}</p>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">{item.rule}</p>
            </div>
            <p className="mt-auto text-xs font-medium leading-5 text-[var(--pbp-text-subtle)]">예: {item.example}</p>
          </div>
        </WaflSurface>
      ))}
    </div>
  );
}

function ComparisonCard({
  title,
  leftTitle,
  leftBody,
  rightTitle,
  rightBody,
}: {
  title: string;
  leftTitle: string;
  leftBody: string;
  rightTitle: string;
  rightBody: string;
}) {
  return (
    <WaflSurface component="catalog-comparison-card" tone="surface" className="p-4">
      <p className="text-sm font-bold text-[var(--pbp-text-primary)]">{title}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3">
          <AppBadge size="xs" tone="neutral">비슷해 보이는 것</AppBadge>
          <p className="mt-2 text-sm font-bold text-[var(--pbp-text-primary)]">{leftTitle}</p>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">{leftBody}</p>
        </div>
        <div className="rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] p-3">
          <AppBadge size="xs" tone="brand">판단 기준</AppBadge>
          <p className="mt-2 text-sm font-bold text-[var(--pbp-text-primary)]">{rightTitle}</p>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">{rightBody}</p>
        </div>
      </div>
    </WaflSurface>
  );
}

function TouchActionSamples() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <WaflInfoBox tone="selected" component="catalog-action-guide">
          <p className="text-sm font-bold">핵심 구분</p>
          <p className="mt-1 text-xs font-medium leading-5">
            같은 버튼처럼 보여도 “실행”, “이동”, “카드 선택”, “빈 슬롯 추가”는 서로 다른 컴포넌트를 쓴다.
          </p>
        </WaflInfoBox>
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3">
          <WaflButton variant="primary" size="md">저장 실행</WaflButton>
          <WaflButton variant="secondary" size="md">보조 실행</WaflButton>
          <WaflButton variant="danger" size="md">삭제</WaflButton>
          <WaflLinkButton href="#start-here" variant="secondary" size="md">섹션 이동</WaflLinkButton>
          <WaflButton variant="icon" size="md" aria-label="추가 아이콘 버튼">+</WaflButton>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <WaflSurfaceButton component="catalog-surface-button-sample" selected>
          <span className="min-w-0">
            <span className="block text-sm font-bold">WaflSurfaceButton</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--pbp-text-muted)]">카드처럼 보이는 클릭 항목</span>
          </span>
          <AppBadge size="xs" tone="brand">selected</AppBadge>
        </WaflSurfaceButton>
        <WaflAddCardButton className="min-h-28 flex-col gap-2">
          <WaflAddIconBubble />
          <span className="text-sm font-bold text-[var(--pbp-text-primary)]">새 항목 추가</span>
          <span className="text-center text-xs leading-5 text-[var(--pbp-text-muted)]">카드 그리드의 빈 슬롯</span>
        </WaflAddCardButton>
        <WaflSurface component="catalog-non-click-card" tone="surface" className="p-4">
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">WaflSurface</p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">이건 누르는 요소가 아니라 정보를 담는 카드다.</p>
        </WaflSurface>
      </div>
      <RuleList title="누르는 요소 선택 규칙" rules={buttonRules} />
    </div>
  );
}

function ContainerSamples() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-4">
        <WaflSurface component="catalog-surface-card" tone="surface" className="p-4">
          <AppBadge size="xs" tone="neutral">정보 카드</AppBadge>
          <p className="mt-3 text-sm font-bold text-[var(--pbp-text-primary)]">WaflSurface</p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">정적 정보를 담는다.</p>
        </WaflSurface>
        <WaflInfoBox tone="muted" component="catalog-info-box-sample">
          <AppBadge size="xs" tone="info">안내문</AppBadge>
          <p className="mt-3 text-sm font-bold text-[var(--pbp-text-primary)]">WaflInfoBox</p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">카드보다 낮은 depth의 설명.</p>
        </WaflInfoBox>
        <WaflEmptyCard component="catalog-empty-card-sample">
          <span className="block text-sm font-bold">WaflEmptyCard</span>
          <span className="mt-1 block text-xs leading-5">데이터 없음 전용</span>
        </WaflEmptyCard>
        <WaflSelectableCard selected>
          <span className="min-w-0">
            <span className="block text-sm font-bold">WaflSelectableCard</span>
            <span className="mt-1 block text-xs text-[var(--pbp-text-muted)]">폼 안 선택지</span>
          </span>
          <AppBadge size="xs" tone="brand">선택</AppBadge>
        </WaflSelectableCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <WaflSurface component="catalog-container-composition" tone="surface" className="p-4">
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">카드 내부 구성 예시</p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
            큰 card 안에서 또 card를 반복하기보다 InfoRow와 InfoBox를 섞어 depth를 낮춘다.
          </p>
          <div className="mt-3 grid gap-2">
            <WaflInfoRow component="catalog-info-row-one">
              <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">상태</span>
              <AppBadge size="xs" tone="success">정상</AppBadge>
            </WaflInfoRow>
            <WaflInfoRow component="catalog-info-row-two" tone="muted">
              <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">사용 화면</span>
              <span className="text-xs font-bold text-[var(--pbp-text-primary)]">저장소 / 멤버관리 / 작업지시서</span>
            </WaflInfoRow>
            <WaflInfoBox tone="muted" component="catalog-nested-info-note">
              <p className="text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">보조 설명은 이 정도 depth로 낮춘다.</p>
            </WaflInfoBox>
          </div>
        </WaflSurface>
        <RuleList title="담는 요소 선택 규칙" rules={containerRules} />
      </div>
    </div>
  );
}

function InputSamples() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <label className="space-y-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
          짧은 값 입력
          <WaflInput placeholder="검색어 또는 이름" />
        </label>
        <label className="space-y-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
          셀렉트 트리거
          <button
            type="button"
            data-wafl-component="select-trigger"
            className="pbp-field-interaction flex h-11 w-full items-center justify-between gap-3 rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-left text-sm font-semibold text-[var(--pbp-text-primary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)]"
            aria-haspopup="listbox"
            aria-expanded="false"
          >
            <span className="min-w-0 truncate">구분 선택</span>
            <span aria-hidden="true" className="text-[var(--pbp-text-muted)]">⌄</span>
          </button>
        </label>
        <label className="space-y-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
          비활성 입력
          <WaflInput placeholder="읽기 전용 값" disabled />
        </label>
        <label className="space-y-2 text-xs font-semibold text-[var(--pbp-text-muted)] lg:col-span-2">
          긴 설명 입력
          <WaflTextarea placeholder="메모, 사유, 설명" />
        </label>
        <WaflSelectableCard selected>
          <span className="min-w-0">
            <span className="block text-sm font-bold">선택형 입력</span>
            <span className="mt-1 block text-xs text-[var(--pbp-text-muted)]">권한/역할/옵션을 고른다.</span>
          </span>
          <AppBadge size="xs" tone="brand">선택됨</AppBadge>
        </WaflSelectableCard>
      </div>
      <WaflNoticeBox tone="info">select trigger는 다시 누르면 닫힘, 바깥 클릭 닫힘, Escape 닫힘을 유지해야 한다.</WaflNoticeBox>
    </div>
  );
}

function StatusSamples() {
  const tones = ["neutral", "info", "success", "warning", "danger", "brand", "document", "design", "memo", "file"] as const;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <WaflSurface component="catalog-badge-samples" tone="surface" className="p-4">
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">AppBadge</p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">짧은 상태·개수·유형만 표시한다.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tones.map((tone) => (
              <AppBadge key={tone} tone={tone}>{tone}</AppBadge>
            ))}
            <AppBadge variant="count">12</AppBadge>
            <AppBadge size="xs" tone="brand">xs</AppBadge>
            <AppBadge size="md" tone="brand">md</AppBadge>
          </div>
        </WaflSurface>
        <RuleList title="보여주는 요소 선택 규칙" rules={statusRules} />
      </div>

      <WaflFilterBar layoutClassName="lg:grid-cols-[1fr_180px_auto]">
        <label className={WAFL_FILTER_FIELD_CLASS}>
          <span className={WAFL_FILTER_LABEL_CLASS}>검색</span>
          <input className={WAFL_FILTER_INPUT_CLASS} placeholder="컴포넌트명 검색" />
        </label>
        <label className={WAFL_FILTER_FIELD_CLASS}>
          <span className={WAFL_FILTER_LABEL_CLASS}>상태</span>
          <select className={WAFL_FILTER_INPUT_CLASS} defaultValue="all">
            <option value="all">전체</option>
            <option value="guide">설명 있음</option>
            <option value="sampled">샘플 있음</option>
          </select>
        </label>
        <div className="flex items-end">
          <WaflButton variant="secondary" size="md">필터 적용</WaflButton>
        </div>
      </WaflFilterBar>
    </div>
  );
}

function WrongRightSamples() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ComparisonCard
        title="WaflSurface vs WaflSurfaceButton"
        leftTitle="둘 다 카드처럼 보인다"
        leftBody="하지만 Surface는 정보를 담는 정적 박스이고, SurfaceButton은 사용자가 누르는 항목이다."
        rightTitle="누르면 SurfaceButton, 안 누르면 Surface"
        rightBody="클릭 이벤트나 selected 상태가 있으면 SurfaceButton 계열을 우선한다."
      />
      <ComparisonCard
        title="WaflSurface vs WaflInfoBox"
        leftTitle="둘 다 사각형 박스다"
        leftBody="Surface는 정보 덩어리의 기본 단위이고, InfoBox는 안내문이나 보조 설명이다."
        rightTitle="카드 안 설명은 InfoBox"
        rightBody="카드 안에 또 카드를 만들면 depth가 과해지므로 InfoBox로 낮춘다."
      />
      <ComparisonCard
        title="WaflButton vs WaflLinkButton"
        leftTitle="둘 다 버튼처럼 보인다"
        leftBody="Button은 저장/삭제 같은 실행이고, LinkButton은 href 이동이다."
        rightTitle="URL 이동이면 LinkButton"
        rightBody="의미를 분리해야 loading, 접근성, 라우팅 기준을 나중에 정리하기 쉽다."
      />
      <ComparisonCard
        title="AppBadge vs 안내 문장"
        leftTitle="색 있는 라벨처럼 보인다"
        leftBody="Badge는 짧은 상태값 전용이다. 긴 설명을 넣으면 모바일에서 의미가 흐려진다."
        rightTitle="짧으면 Badge, 길면 InfoBox"
        rightBody="작성중/완료/파일 같은 값은 Badge, 정책 안내는 InfoBox를 쓴다."
      />
    </div>
  );
}

function SpecTable() {
  return (
    <WaflDataTableShell>
      <WaflDataTableHeader gridTemplateColumns="0.8fr 1.1fr 1.2fr 1fr 1fr">
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Component</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>쉽게 말하면</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Import / props</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>금지 기준</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>적용 화면</div>
      </WaflDataTableHeader>
      <WaflDataTableBody>
        {componentSpecs.map((spec) => (
          <WaflDataTableRow key={spec.name} gridTemplateColumns="0.8fr 1.1fr 1.2fr 1fr 1fr">
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <p className={WAFL_DATA_TABLE_PRIMARY_TEXT_CLASS}>{spec.name}</p>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>{spec.purpose}</p>
            </div>
            <p className="text-[12px] font-bold leading-5 text-[var(--pbp-text-primary)]">{spec.plainRule}</p>
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <code className="min-w-0 truncate rounded-full bg-[var(--pbp-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--pbp-text-muted)]">
                {spec.path}
              </code>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>{spec.props}</p>
            </div>
            <p className="text-[11px] font-medium leading-5 text-[var(--pbp-text-subtle)]">{spec.avoid}</p>
            <p className="text-[11px] font-semibold leading-5 text-[var(--pbp-text-muted)]">{spec.screens}</p>
          </WaflDataTableRow>
        ))}
      </WaflDataTableBody>
    </WaflDataTableShell>
  );
}

export default function WaflUiCatalogPage({
  appVersion,
  runtimeMode,
  allowedRuntimeModes,
}: WaflUiCatalogPageProps) {
  return (
    <main className="min-h-screen bg-[var(--pbp-app-bg)] px-4 py-6 text-[var(--pbp-text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <WaflPageHero
          eyebrow="WAFL UI Catalog"
          title="공통 컴포넌트 사용 설명서"
          description="비슷해 보이는 WAFL 컴포넌트를 모양이 아니라 역할로 구분하기 위한 내부 확인 페이지다. 모바일에서는 먼저 '상황 → 컴포넌트' 기준으로 보면 된다."
          badges={
            <>
              <AppBadge tone="brand">v{appVersion}</AppBadge>
              <AppBadge tone="info">runtime: {runtimeMode}</AppBadge>
              <AppBadge tone="warning">/ui gate off</AppBadge>
            </>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <WaflInfoBox tone="selected">
              <p className="text-sm font-bold">보는 순서</p>
              <p className="mt-1 text-xs leading-5">
                1. 상황별 판단 기준을 본다. 2. 누르는 것/담는 것/입력하는 것을 비교한다. 3. 마지막에 개발자용 스펙 표를 확인한다.
              </p>
            </WaflInfoBox>
            <WaflInfoBox tone="muted">
              <p className="text-sm font-bold text-[var(--pbp-text-primary)]">현재 접근 상태</p>
              <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
                모바일 확인을 위해 /ui 접근 제한은 임시 해제 상태다. 원래 허용 모드는 {allowedRuntimeModes.join(" / ")} 이다.
              </p>
            </WaflInfoBox>
          </div>
        </WaflPageHero>

        <WaflSectionPanel title="Catalog sections" description="모바일에서는 위에서 아래로 내려가며 상황별로 보면 된다." density="compact">
          <SectionAnchorList />
        </WaflSectionPanel>

        <div id="start-here" className="scroll-mt-6">
          <WaflSectionPanel title="Start here" description="모양이 아니라 상황으로 컴포넌트를 고른다." density="compact">
            <QuickDecisionGrid />
          </WaflSectionPanel>
        </div>

        <div id="touch-actions" className="scroll-mt-6">
          <WaflSectionPanel title="Touch actions · 누르는 것" description="실행 버튼, 이동 버튼, 카드형 버튼, 추가 카드 버튼을 분리한다." density="compact">
            <TouchActionSamples />
          </WaflSectionPanel>
        </div>

        <div id="containers" className="scroll-mt-6">
          <WaflSectionPanel title="Containers · 담는 것" description="Surface, InfoBox, EmptyCard, SelectableCard는 모두 박스처럼 보이지만 역할이 다르다." density="compact">
            <ContainerSamples />
          </WaflSectionPanel>
        </div>

        <div id="inputs" className="scroll-mt-6">
          <WaflSectionPanel title="Inputs · 입력하는 것" description="짧은 입력, 긴 입력, 선택 트리거, 선택 카드의 기본 문법." density="compact">
            <InputSamples />
          </WaflSectionPanel>
        </div>

        <div id="status" className="scroll-mt-6">
          <WaflSectionPanel title="Status · 보여주는 것" description="상태 라벨, 안내 박스, 필터바, 데이터 표시 패턴." density="compact">
            <StatusSamples />
          </WaflSectionPanel>
        </div>

        <div id="wrong-right" className="scroll-mt-6">
          <WaflSectionPanel title="Wrong / Right" description="같아 보이는 컴포넌트의 판단 기준을 비교한다." density="compact">
            <WrongRightSamples />
          </WaflSectionPanel>
        </div>

        <div id="spec-table" className="scroll-mt-6">
          <WaflSectionPanel title="Spec table" description="개발자가 import 경로와 props, 금지 기준을 확인하는 표다." density="compact">
            <SpecTable />
          </WaflSectionPanel>
        </div>

        <div id="next-patterns" className="scroll-mt-6">
          <WaflSectionPanel title="Next patterns" description="이후 버전에서 실제 업무 화면 패턴과 연결한다." density="compact">
            <div className="grid gap-3 lg:grid-cols-3">
              <WaflEmptyCard component="catalog-modal-placeholder">Modal pattern은 다음 단계에서 실제 모달 구조와 연결한다.</WaflEmptyCard>
              <WaflEmptyCard component="catalog-workorder-placeholder">작업지시서 Add 카드, 공정 카드, 첨부/메모 카드를 연결한다.</WaflEmptyCard>
              <WaflEmptyCard component="catalog-storage-placeholder">저장소 row/detail modal 패턴을 연결한다.</WaflEmptyCard>
            </div>
          </WaflSectionPanel>
        </div>
      </div>
    </main>
  );
}
