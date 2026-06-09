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

const componentSpecs = [
  {
    name: "WaflButton",
    path: "@/components/common/ui/WaflButton",
    purpose: "업무 화면의 기본 버튼. primary/secondary/ghost/danger/subtle/icon으로 의미를 구분한다.",
    props: "variant, size, width, disabled, children",
    avoid: "화면별 rounded, shadow, bg 색상 직접 지정으로 새 버튼을 만들지 않는다.",
  },
  {
    name: "AppBadge",
    path: "@/components/common/ui/AppBadge",
    purpose: "상태, 개수, 파일 유형, 업무 단계 등 짧은 라벨을 표시한다.",
    props: "tone, variant, size, children",
    avoid: "상태값별 색상을 개별 화면에서 직접 className으로 분기하지 않는다.",
  },
  {
    name: "WaflSurface",
    path: "@/components/common/ui/WaflSurface",
    purpose: "card/panel/row/empty 영역의 기본 표면 토큰을 제공한다.",
    props: "tone, component, as, children",
    avoid: "카드 안 카드 depth를 과도하게 중첩하지 않는다.",
  },
  {
    name: "WaflFilterBar",
    path: "@/components/admin/common/WaflFilterBar",
    purpose: "검색, select, 필터 액션을 한 줄 또는 grid로 묶는다.",
    props: "children, className, layoutClassName",
    avoid: "검색 영역마다 별도 border/bg/radius 조합을 만들지 않는다.",
  },
  {
    name: "WaflDataTable",
    path: "@/components/admin/common/WaflDataTable",
    purpose: "저장소, 협력업체, 멤버, 통계 등 admin table 문법을 통일한다.",
    props: "Shell, Header, Body, Row, gridTemplateColumns, clickable",
    avoid: "테이블마다 header/row height, divider, action alignment를 새로 정의하지 않는다.",
  },
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
      <WaflDataTableHeader gridTemplateColumns="1fr 1.2fr 1.4fr 1fr">
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Component</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Import</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Purpose / props</div>
        <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>금지 기준</div>
      </WaflDataTableHeader>
      <WaflDataTableBody>
        {componentSpecs.map((spec) => (
          <WaflDataTableRow key={spec.name} gridTemplateColumns="1fr 1.2fr 1.4fr 1fr">
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <p className={WAFL_DATA_TABLE_PRIMARY_TEXT_CLASS}>{spec.name}</p>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>data-wafl-component 기준 확인 대상</p>
            </div>
            <code className="min-w-0 truncate rounded-full bg-[var(--pbp-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--pbp-text-muted)]">
              {spec.path}
            </code>
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <p className="truncate text-[12px] font-medium text-[var(--pbp-text-muted)]">{spec.purpose}</p>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>{spec.props}</p>
            </div>
            <p className="line-clamp-2 text-[11px] font-medium leading-5 text-[var(--pbp-text-subtle)]">{spec.avoid}</p>
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

  return (
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
  );
}

function SampleFormGrid() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <label className="space-y-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
        Input
        <WaflInput placeholder="검색어 또는 이름 입력" />
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
  );
}

function SampleFeedbackGrid() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <WaflNoticeBox tone="info">개발/내부용 카탈로그 페이지다. production에서는 접근을 차단한다.</WaflNoticeBox>
      <div className="flex flex-wrap items-center gap-2">
        <AppBadge tone="neutral">neutral</AppBadge>
        <AppBadge tone="brand">brand</AppBadge>
        <AppBadge tone="success">success</AppBadge>
        <AppBadge tone="warning">warning</AppBadge>
        <AppBadge tone="danger">danger</AppBadge>
        <AppBadge tone="document">document</AppBadge>
        <AppBadge tone="design">design</AppBadge>
        <AppBadge tone="memo">memo</AppBadge>
      </div>
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
              <p className="text-sm font-bold">0.20.99 범위</p>
              <p className="mt-1 text-xs leading-5">라우팅, 접근 제한, layout, 대표 샘플 일부만 구성한다. 업무 기능 로직은 변경하지 않는다.</p>
            </WaflInfoBox>
          </div>
        </WaflPageHero>

        <WaflSectionPanel
          title="Catalog sections"
          description="이번 버전에서는 전체 구조를 먼저 고정하고, 0.21.00부터 컴포넌트별 상세 스펙을 순차적으로 채운다."
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
          <WaflSectionPanel title="Buttons" description="버튼 variant/size/tone의 대표 샘플." density="compact">
            <SampleButtonGrid />
          </WaflSectionPanel>
        </div>

        <div id="forms" className="scroll-mt-6">
          <WaflSectionPanel title="Forms" description="입력 필드와 선택 카드의 대표 샘플." density="compact">
            <SampleFormGrid />
          </WaflSectionPanel>
        </div>

        <div id="feedback" className="scroll-mt-6">
          <WaflSectionPanel title="Feedback" description="notice, badge, empty 상태의 대표 샘플." density="compact">
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
