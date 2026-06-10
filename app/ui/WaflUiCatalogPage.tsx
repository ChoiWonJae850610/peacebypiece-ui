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
  description: string;
  status: "sampled" | "skeleton";
};

type ComponentSpec = {
  name: string;
  path: string;
  purpose: string;
  props: string;
  sizes: string;
  tones: string;
  variants: string;
  avoid: string;
  screens: string;
};

const catalogSections: CatalogSection[] = [
  {
    id: "foundation",
    title: "Foundation",
    description: "WAFL 토큰, radius, border, surface, text hierarchy의 기준을 확인한다.",
    status: "skeleton",
  },
  {
    id: "surface",
    title: "Surface",
    description: "card, panel, row, info, selected, empty 상태의 표면 문법을 확인한다.",
    status: "sampled",
  },
  {
    id: "buttons",
    title: "Buttons",
    description: "주요 CTA, 보조 액션, ghost, danger, icon 버튼의 사용 기준을 확인한다.",
    status: "sampled",
  },
  {
    id: "forms",
    title: "Forms",
    description: "input, textarea, select trigger, selectable card의 입력 문법을 확인한다.",
    status: "sampled",
  },
  {
    id: "feedback",
    title: "Feedback",
    description: "notice, info, empty, badge 등 안내·상태 표현을 확인한다.",
    status: "sampled",
  },
  {
    id: "data-display",
    title: "Data Display",
    description: "filter bar, table, compact row, metric card의 기본 구조를 확인한다.",
    status: "sampled",
  },
  {
    id: "navigation",
    title: "Navigation",
    description: "홈, 섹션 이동, 업무 화면 전환 패턴을 이후 버전에서 채운다.",
    status: "skeleton",
  },
  {
    id: "modal",
    title: "Modal",
    description: "BaseModal, header, body, footer, focus trap, Escape 닫기 규칙을 이후 버전에서 채운다.",
    status: "skeleton",
  },
  {
    id: "workorder-patterns",
    title: "Workorder Patterns",
    description: "작업지시서, 원단·부자재 발주, 저장소 실무 카드/row 패턴을 이후 버전에서 채운다.",
    status: "skeleton",
  },
];

const componentSpecs: ComponentSpec[] = [
  {
    name: "WaflButton",
    path: "@/components/common/ui/WaflButton",
    purpose: "업무 화면의 기본 button. 저장, 생성, 삭제, 보조 액션, icon 액션을 의미 단위로 구분한다.",
    props: "variant, size, width, disabled, type, children",
    sizes: "sm / md / lg",
    tones: "variant가 tone 역할을 겸함",
    variants: "primary / secondary / ghost / danger / subtle / icon",
    avoid: "rounded, shadow, bg, text 색상을 화면별 className으로 새로 조합하지 않는다.",
    screens: "작업지시서, 발주, 저장소, 통계, 멤버관리, 환경설정",
  },
  {
    name: "WaflLinkButton",
    path: "@/components/common/ui/WaflButton",
    purpose: "이동 성격의 CTA를 button과 같은 시각 문법으로 표시한다.",
    props: "href, variant, size, width, children",
    sizes: "sm / md / lg",
    tones: "variant가 tone 역할을 겸함",
    variants: "primary / secondary / ghost / danger / subtle / icon",
    avoid: "링크를 별도 rounded pill 또는 임의 underline CTA로 만들지 않는다.",
    screens: "홈, 운영 대시보드, 내부 catalog, 설정 이동",
  },
  {
    name: "WaflAddCardButton",
    path: "@/components/common/ui/WaflSurface",
    purpose: "새 항목 추가를 카드 그리드 안에서 표시한다. 빈 슬롯 CTA에 사용한다.",
    props: "children, className, button attributes",
    sizes: "컨테이너 높이에 맞춤",
    tones: "add surface token",
    variants: "single visual variant",
    avoid: "카드형 추가 버튼을 일반 WaflButton으로 억지 배치하지 않는다.",
    screens: "작업지시서 첨부, 디자인, 메모, 구성 항목 추가",
  },
  {
    name: "WaflAddIconBubble",
    path: "@/components/common/ui/WaflSurface",
    purpose: "AddCardButton 내부의 + 아이콘 버블. 단독 액션보다 카드 CTA 보조 시각 요소로 사용한다.",
    props: "className, span attributes",
    sizes: "fixed bubble",
    tones: "add icon token",
    variants: "single visual variant",
    avoid: "+ 원형 아이콘을 화면마다 직접 border/bg 조합으로 만들지 않는다.",
    screens: "작업지시서, 기준정보, 저장소 추가 카드",
  },
  {
    name: "AppBadge",
    path: "@/components/common/ui/AppBadge",
    purpose: "상태, 개수, 파일 유형, 업무 단계 등 짧은 라벨을 표시한다.",
    props: "tone, variant, size, children",
    sizes: "xs / sm / md",
    tones: "neutral / strong / info / success / warning / danger / brand / workorder / design / document / memo / file / inverse",
    variants: "status / count / info / success / warning / danger / brand / neutral",
    avoid: "상태값별 색상을 개별 화면에서 직접 className으로 분기하지 않는다.",
    screens: "전체 업무 화면, 파일 카드, 상태 row, table count",
  },
  {
    name: "WaflInput",
    path: "@/components/common/ui/WaflForm",
    purpose: "단일행 텍스트 입력. 검색, 이름, 연락처, 제목, 짧은 값 입력에 사용한다.",
    props: "input attributes, className, ref",
    sizes: "md 고정 / h-11",
    tones: "surface field token",
    variants: "single visual variant",
    avoid: "input마다 h, border, focus ring을 직접 정의하지 않는다.",
    screens: "멤버관리, 협력업체, 저장소, 작업지시서 생성/수정 모달",
  },
  {
    name: "WaflTextarea",
    path: "@/components/common/ui/WaflForm",
    purpose: "여러 줄 입력. 설명, 메모, 사유, 안내문 초안 입력에 사용한다.",
    props: "textarea attributes, className, ref",
    sizes: "md 고정 / min-h-24",
    tones: "surface field token",
    variants: "single visual variant",
    avoid: "textarea 높이와 focus ring을 화면별로 새로 만들지 않는다.",
    screens: "메모, 반려 사유, 설정 설명, 업체/파일 설명",
  },
  {
    name: "Select trigger",
    path: "WAFL field class 또는 WaflFilterBar field class",
    purpose: "select 자체 또는 custom select trigger를 WAFL 입력 필드 문법으로 표시한다.",
    props: "value, onChange/onSelect, disabled, options",
    sizes: "md field 기준",
    tones: "surface field token",
    variants: "native select / custom trigger",
    avoid: "셀렉트 화살표, 열린 상태, 닫힘 상태를 화면별 임의 스타일로 만들지 않는다.",
    screens: "작업지시서 생성, 권한 모달, 통계 기간, 필터바",
  },
];

const buttonUsageRules = [
  "primary는 저장·생성·확정처럼 화면의 주 액션에만 사용한다.",
  "secondary는 취소가 아닌 보조 실행 액션에 사용한다.",
  "ghost는 카드 내부 보조 액션이나 부담이 낮은 이동에 사용한다.",
  "danger는 삭제·영구삭제·되돌릴 수 없는 흐름에만 사용한다.",
  "subtle은 추가·가벼운 보조 CTA에 사용한다.",
  "icon은 aria-label을 반드시 제공한다.",
];

const badgeUsageRules = [
  "tone은 의미별로 고정한다. 성공은 success, 경고는 warning, 위험은 danger를 우선한다.",
  "문서·디자인·메모·파일은 각각 document/design/memo/file tone을 사용한다.",
  "개수 표시는 variant=count 또는 strong tone을 사용한다.",
  "badge 안에는 긴 문장을 넣지 않고 짧은 상태·개수·유형만 넣는다.",
];

const formUsageRules = [
  "label 텍스트는 입력 요소와 같은 그룹에 둔다.",
  "입력 높이, border, focus ring은 WaflInput/WaflTextarea 또는 WAFL field class를 사용한다.",
  "검색·필터 조합은 WaflFilterBar 안에서 구성한다.",
  "select trigger는 다시 눌렀을 때 닫힘, 바깥 클릭 닫힘, Escape 닫힘을 유지해야 한다.",
];

function SectionAnchorList() {
  return (
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="WAFL UI catalog sections">
      {catalogSections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          data-wafl-component="catalog-nav-card"
          className="rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm font-semibold text-[var(--pbp-text-primary)] shadow-none transition hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)]"
        >
          <span className="flex items-center justify-between gap-3">
            {section.title}
            <AppBadge size="xs" tone={section.status === "sampled" ? "brand" : "neutral"}>
              {section.status === "sampled" ? "sample" : "skeleton"}
            </AppBadge>
          </span>
          <span className="mt-1 block text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            {section.description}
          </span>
        </a>
      ))}
    </nav>
  );
}

function SpecTable() {
  return (
    <WaflDataTableShell>
      <WaflDataTableHeader gridTemplateColumns="0.8fr 1.1fr 1.2fr 0.8fr 1fr 1fr">
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Component</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Import</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Purpose / props</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Size</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Tone / variant</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>금지 기준 / 적용 화면</div>
      </WaflDataTableHeader>
      <WaflDataTableBody>
        {componentSpecs.map((spec) => (
          <WaflDataTableRow key={spec.name} gridTemplateColumns="0.8fr 1.1fr 1.2fr 0.8fr 1fr 1fr">
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <p className={WAFL_DATA_TABLE_PRIMARY_TEXT_CLASS}>{spec.name}</p>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>data-wafl-component 기준 확인 대상</p>
            </div>
            <code className="min-w-0 truncate rounded-full bg-[var(--pbp-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--pbp-text-muted)]">
              {spec.path}
            </code>
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <p className="line-clamp-2 text-[12px] font-medium leading-5 text-[var(--pbp-text-muted)]">{spec.purpose}</p>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>{spec.props}</p>
            </div>
            <p className="text-[11px] font-semibold leading-5 text-[var(--pbp-text-muted)]">{spec.sizes}</p>
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <p className="line-clamp-2 text-[11px] font-semibold leading-5 text-[var(--pbp-text-muted)]">{spec.tones}</p>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>{spec.variants}</p>
            </div>
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <p className="line-clamp-2 text-[11px] font-medium leading-5 text-[var(--pbp-text-subtle)]">{spec.avoid}</p>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>{spec.screens}</p>
            </div>
          </WaflDataTableRow>
        ))}
      </WaflDataTableBody>
    </WaflDataTableShell>
  );
}

function SampleSurfaceGrid() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <WaflSurface component="catalog-surface-card" className="p-4">
        <p className="text-sm font-bold text-[var(--pbp-text-primary)]">Surface card</p>
        <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">기본 card/panel 표면. shadow는 최소화하고 border와 surface 토큰을 우선한다.</p>
      </WaflSurface>
      <WaflSurfaceButton component="catalog-surface-button" selected>
        <p className="text-sm font-bold">Selected surface button</p>
        <p className="mt-1 text-xs leading-5">선택 가능한 카드형 액션. selected 상태는 selected token만 사용한다.</p>
      </WaflSurfaceButton>
      <WaflEmptyCard component="catalog-empty-card">데이터가 없을 때 쓰는 empty card 샘플</WaflEmptyCard>
      <WaflInfoRow>
        <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">Info row</span>
        <AppBadge size="xs" tone="info">row</AppBadge>
      </WaflInfoRow>
      <WaflAddCardButton className="min-h-24 gap-3">
        <WaflAddIconBubble />
        <span className="text-sm font-semibold text-[var(--pbp-text-muted)]">Add card button</span>
      </WaflAddCardButton>
      <WaflInfoBox tone="selected">
        <p className="text-sm font-bold">Info box</p>
        <p className="mt-1 text-xs leading-5">안내, 선택 요약, 주의 내용을 card보다 낮은 depth로 표시한다.</p>
      </WaflInfoBox>
    </div>
  );
}

function SampleButtonGrid() {
  const variants = ["primary", "secondary", "ghost", "danger", "subtle"] as const;
  const sizes = ["sm", "md", "lg"] as const;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pbp-text-subtle)]">Variant</p>
        <div className="flex flex-wrap items-center gap-2">
          {variants.map((variant) => (
            <WaflButton key={variant} variant={variant} size="md">
              {variant}
            </WaflButton>
          ))}
          <WaflButton variant="icon" size="md" aria-label="아이콘 버튼 샘플">+</WaflButton>
          <WaflLinkButton href="#foundation" variant="secondary" size="sm">
            link button
          </WaflLinkButton>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pbp-text-subtle)]">Size / width / disabled</p>
        <div className="flex flex-wrap items-center gap-2">
          {sizes.map((size) => (
            <WaflButton key={size} variant="secondary" size={size}>
              {size}
            </WaflButton>
          ))}
          <WaflButton variant="primary" size="md" width="full" className="max-w-52">
            width full
          </WaflButton>
          <WaflButton variant="secondary" size="md" disabled>
            disabled
          </WaflButton>
        </div>
      </div>
      <RuleList title="Button 사용 기준" rules={buttonUsageRules} />
    </div>
  );
}

function SampleBadgeGrid() {
  const tones = [
    "neutral",
    "strong",
    "info",
    "success",
    "warning",
    "danger",
    "brand",
    "workorder",
    "design",
    "document",
    "memo",
    "file",
    "inverse",
  ] as const;
  const variants = ["status", "count", "info", "success", "warning", "danger", "brand", "neutral"] as const;
  const sizes = ["xs", "sm", "md"] as const;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pbp-text-subtle)]">Tone</p>
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3">
          {tones.map((tone) => (
            <AppBadge key={tone} tone={tone}>
              {tone}
            </AppBadge>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pbp-text-subtle)]">Variant / size</p>
        <div className="flex flex-wrap items-center gap-2">
          {variants.map((variant) => (
            <AppBadge key={variant} variant={variant}>
              {variant}
            </AppBadge>
          ))}
          {sizes.map((size) => (
            <AppBadge key={size} tone="brand" size={size}>
              size {size}
            </AppBadge>
          ))}
        </div>
      </div>
      <RuleList title="Badge 사용 기준" rules={badgeUsageRules} />
    </div>
  );
}

function SelectTriggerSample() {
  return (
    <button
      type="button"
      data-wafl-component="select-trigger"
      className="pbp-field-interaction flex h-11 w-full items-center justify-between gap-3 rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-left text-sm font-semibold text-[var(--pbp-text-primary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)]"
      aria-haspopup="listbox"
      aria-expanded="false"
    >
      <span className="min-w-0 truncate">셀렉트 트리거 샘플</span>
      <span aria-hidden="true" className="text-[var(--pbp-text-muted)]">⌄</span>
    </button>
  );
}

function SampleFormGrid() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <label className="space-y-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
          Input
          <WaflInput placeholder="검색어 또는 이름 입력" />
        </label>
        <label className="space-y-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
          Select trigger
          <SelectTriggerSample />
        </label>
        <label className="space-y-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
          Disabled input
          <WaflInput placeholder="비활성 입력" disabled />
        </label>
        <label className="space-y-2 text-xs font-semibold text-[var(--pbp-text-muted)] lg:col-span-2">
          Textarea
          <WaflTextarea placeholder="메모 또는 설명 입력" />
        </label>
        <WaflSelectableCard selected>
          <span className="min-w-0">
            <span className="block text-sm font-bold">Selectable card</span>
            <span className="mt-1 block text-xs text-[var(--pbp-text-muted)]">권한, 역할, 옵션 선택에 사용</span>
          </span>
          <AppBadge size="xs" tone="brand">selected</AppBadge>
        </WaflSelectableCard>
      </div>
      <RuleList title="Form 사용 기준" rules={formUsageRules} />
    </div>
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

function SampleFeedbackGrid() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <WaflNoticeBox tone="info">개발/내부용 카탈로그 페이지다. production에서는 접근을 차단한다.</WaflNoticeBox>
      <SampleBadgeGrid />
    </div>
  );
}

function SampleDataDisplay() {
  return (
    <div className="space-y-3">
      <WaflFilterBar layoutClassName="lg:grid-cols-[1fr_180px_auto]">
        <label className={WAFL_FILTER_FIELD_CLASS}>
          <span className={WAFL_FILTER_LABEL_CLASS}>검색</span>
          <input className={WAFL_FILTER_INPUT_CLASS} placeholder="컴포넌트명 검색" />
        </label>
        <label className={WAFL_FILTER_FIELD_CLASS}>
          <span className={WAFL_FILTER_LABEL_CLASS}>상태</span>
          <select className={WAFL_FILTER_INPUT_CLASS} defaultValue="all">
            <option value="all">전체</option>
            <option value="sampled">샘플 있음</option>
            <option value="skeleton">뼈대만</option>
          </select>
        </label>
        <div className="flex items-end">
          <WaflButton variant="secondary" size="md">필터 적용</WaflButton>
        </div>
      </WaflFilterBar>
      <SpecTable />
    </div>
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
          title="공통 컴포넌트 카탈로그"
          description="WAFL 공통 컴포넌트의 실제 렌더링, import 경로, props, 금지 사용 예를 한 화면에서 비교하기 위한 개발/내부 확인 페이지다."
          badges={
            <>
              <AppBadge tone="brand">v{appVersion}</AppBadge>
              <AppBadge tone="info">runtime: {runtimeMode}</AppBadge>
            </>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <WaflInfoBox tone="muted">
              <p className="text-sm font-bold text-[var(--pbp-text-primary)]">접근 조건</p>
              <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
                NEXT_PUBLIC_APP_RUNTIME_MODE가 {allowedRuntimeModes.join(" / ")} 중 하나일 때만 /ui에 접근한다. production 또는 알 수 없는 값은 404로 차단한다.
              </p>
            </WaflInfoBox>
            <WaflInfoBox tone="selected">
              <p className="text-sm font-bold">0.21.00 범위</p>
              <p className="mt-1 text-xs leading-5">Button, Badge, Form 계열의 실제 샘플과 props/size/tone/variant/금지 기준을 채운다. 업무 기능 로직은 변경하지 않는다.</p>
            </WaflInfoBox>
          </div>
        </WaflPageHero>

        <WaflSectionPanel
          title="Catalog sections"
          description="0.21.00에서는 버튼, 뱃지, 입력 계열의 상세 스펙을 먼저 채우고, 이후 Surface/Table/Modal/실무 패턴을 확장한다."
          density="compact"
        >
          <SectionAnchorList />
        </WaflSectionPanel>

        <div id="foundation" className="scroll-mt-6">
          <WaflSectionPanel
            title="Foundation"
            description="토큰, radius, border, surface, typography 기준은 이후 버전에서 세분화한다."
            density="compact"
            bodyClassName="pt-3"
          >
            <div className="grid gap-3 lg:grid-cols-3">
              <WaflInfoBox tone="neutral">
                <p className="text-sm font-bold">Radius</p>
                <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">기본 radius는 var(--pbp-radius-wafl)을 우선한다.</p>
              </WaflInfoBox>
              <WaflInfoBox tone="neutral">
                <p className="text-sm font-bold">Shadow</p>
                <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">업무 요소는 shadow-none 또는 공통 surface shadow만 사용한다.</p>
              </WaflInfoBox>
              <WaflInfoBox tone="neutral">
                <p className="text-sm font-bold">Component mark</p>
                <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">공통 요소는 data-wafl-component를 유지한다.</p>
              </WaflInfoBox>
            </div>
          </WaflSectionPanel>
        </div>

        <div id="surface" className="scroll-mt-6">
          <WaflSectionPanel title="Surface" description="card, panel, row, info, selected, empty 표면 샘플." density="compact">
            <SampleSurfaceGrid />
          </WaflSectionPanel>
        </div>

        <div id="buttons" className="scroll-mt-6">
          <WaflSectionPanel title="Buttons" description="WaflButton/WaflLinkButton/WaflAddCardButton/WaflAddIconBubble의 variant, size, width, disabled 기준." density="compact">
            <SampleButtonGrid />
          </WaflSectionPanel>
        </div>

        <div id="forms" className="scroll-mt-6">
          <WaflSectionPanel title="Forms" description="WaflInput, WaflTextarea, select trigger, WaflSelectableCard의 입력·선택 기준." density="compact">
            <SampleFormGrid />
          </WaflSectionPanel>
        </div>

        <div id="feedback" className="scroll-mt-6">
          <WaflSectionPanel title="Feedback" description="notice, badge, empty 상태의 대표 샘플. AppBadge tone/variant/size 기준은 이 섹션에서 확인한다." density="compact">
            <SampleFeedbackGrid />
          </WaflSectionPanel>
        </div>

        <div id="data-display" className="scroll-mt-6">
          <WaflSectionPanel title="Data Display" description="필터바와 데이터 테이블의 1차 스펙 샘플." density="compact">
            <SampleDataDisplay />
          </WaflSectionPanel>
        </div>

        <div id="navigation" className="scroll-mt-6">
          <WaflSectionPanel title="Navigation" description="홈, 업무 화면 이동, 섹션 이동 패턴은 0.21.05 이후 체크리스트와 연결한다." density="compact">
            <WaflEmptyCard component="catalog-section-placeholder">Navigation 상세 스펙은 이후 버전에서 작성한다.</WaflEmptyCard>
          </WaflSectionPanel>
        </div>

        <div id="modal" className="scroll-mt-6">
          <WaflSectionPanel title="Modal" description="BaseModal, ModalHeader, ModalBody, ModalFooter, focus trap, Escape 닫기, 모바일 닫기 버튼 규칙을 0.21.03에서 채운다." density="compact">
            <WaflEmptyCard component="catalog-section-placeholder">Modal pattern 상세 스펙은 0.21.03에서 작성한다.</WaflEmptyCard>
          </WaflSectionPanel>
        </div>

        <div id="workorder-patterns" className="scroll-mt-6">
          <WaflSectionPanel title="Workorder Patterns" description="작업지시서, 원단·부자재 발주, 저장소 실무 패턴은 0.21.04에서 최소 샘플로 연결한다." density="compact">
            <WaflEmptyCard component="catalog-section-placeholder">업무 패턴 샘플은 실제 화면과 동일한 최소 구조만 반영한다.</WaflEmptyCard>
          </WaflSectionPanel>
        </div>
      </div>
    </main>
  );
}
