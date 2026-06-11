import AppBadge from "@/components/common/ui/AppBadge";
import AppSelect from "@/components/common/ui/AppSelect";
import { WaflButton, WaflLinkButton } from "@/components/common/ui/WaflButton";
import {
  WaflInfoBox,
  WaflInput,
  WaflSelectableCard,
  WaflTextarea,
} from "@/components/common/ui/WaflForm";
import {
  WaflAddCardButton,
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

type ScreenChecklist = {
  screen: string;
  routeHint: string;
  purpose: string;
  requiredComponents: string[];
  checkItems: string[];
  missingRisk: string;
};

type ComponentInventoryItem = {
  name: string;
  group: "Primitive" | "Pattern" | "Domain" | "Legacy";
  role: string;
  keepDecision: "유지" | "통합 후보" | "폐기 후보" | "전환 대상";
  target: string;
  priority: "높음" | "중간" | "낮음";
  note: string;
};

type ComponentGroupGuide = {
  group: ComponentInventoryItem["group"];
  meaning: string;
  rule: string;
  examples: string;
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
    id: "foundation-primitive",
    title: "Foundation primitive",
    plainTitle: "WAFL 슈퍼클래스 기준",
    description:
      "shape, density, tone, variant, state를 한 primitive에서 나눠 쓴다.",
    status: "guide",
  },
  {
    id: "shape-grammar",
    title: "Shape grammar",
    plainTitle: "모양 통일 기준",
    description:
      "버튼, 배지, 입력창, 카드가 같은 둥근 네모 계열로 보이는지 확인한다.",
    status: "guide",
  },
  {
    id: "visual-styling",
    title: "Visual styling",
    plainTitle: "꾸밈 기준",
    description:
      "shape는 고정하고 tone, variant, state, depth만 공통 props로 조절한다.",
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
    description:
      "Surface, InfoBox, EmptyCard, SelectableCard의 역할 차이를 비교한다.",
    status: "guide",
  },
  {
    id: "inputs",
    title: "Inputs",
    plainTitle: "입력하는 것",
    description:
      "Input, Textarea, Select trigger, 선택 카드의 사용 기준을 확인한다.",
    status: "sampled",
  },
  {
    id: "status",
    title: "Status",
    plainTitle: "상태를 보여주는 것",
    description:
      "Badge, notice, empty, table row처럼 정보를 표시하는 기준을 확인한다.",
    status: "sampled",
  },
  {
    id: "wrong-right",
    title: "Wrong / Right",
    plainTitle: "잘못 쓴 예와 맞게 쓴 예",
    description:
      "같아 보이는 컴포넌트를 어떤 상황에서 다르게 써야 하는지 비교한다.",
    status: "guide",
  },
  {
    id: "practice-patterns",
    title: "Practice patterns",
    plainTitle: "실제 업무 화면 패턴",
    description:
      "작업지시서, 발주, 저장소에서 실제로 반복되는 카드/row/modal 구성을 샘플로 확인한다.",
    status: "sampled",
  },
  {
    id: "usage-rules",
    title: "Usage rules",
    plainTitle: "언제 쓰고 언제 쓰지 않는가",
    description:
      "직접 className 사용 금지 기준과 WAFL 컴포넌트 대체 기준을 확인한다.",
    status: "guide",
  },
  {
    id: "screen-checklist",
    title: "Screen checklist",
    plainTitle: "기존 화면별 점검표",
    description:
      "작업지시서부터 개인설정까지 화면별로 써야 하는 WAFL 컴포넌트를 확인한다.",
    status: "guide",
  },
  {
    id: "component-inventory",
    title: "Component inventory",
    plainTitle: "컴포넌트 재고표",
    description:
      "현재 WAFL 컴포넌트를 Primitive / Pattern / Domain / Legacy로 분류하고 유지·통합·폐기 후보를 본다.",
    status: "guide",
  },
  {
    id: "spec-table",
    title: "Spec table",
    plainTitle: "개발자용 스펙 표",
    description: "import 경로, props, 금지 기준은 표에서 한 번에 확인한다.",
    status: "sampled",
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
    example: "작업지시서 첨부 추가 / 디자인 추가 / 구성 항목 추가",
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
    avoid:
      "링크를 별도 pill, underline CTA, 임의 button class로 만들지 않는다.",
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
    purpose:
      "선택 요약, 정책 설명, 주의 안내처럼 card보다 낮은 depth의 정보 블록.",
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
  "AppBadge는 작성중·승인·파일 수처럼 짧은 상태값에만 쓴다.",
  "긴 안내문이나 설명 문장은 WaflInfoBox 또는 WaflNoticeBox로 보낸다.",
  "개수·유형·상태는 badge로 작게 붙이고, 본문 정보처럼 크게 쓰지 않는다.",
  "상태 색상은 tone으로만 고르고 화면별 text/bg class를 직접 조합하지 않는다.",
];

const shapeGrammarRules = [
  "WAFL의 최상위 shape는 surface/control/compact/icon token으로 관리한다.",
  "카드는 surface 16px, 버튼·입력은 control 8px, 배지는 compact 6px, 아이콘은 icon 6px을 쓴다.",
  "실행/상태/입력의 차이는 모서리 모양이 아니라 색, 채움, 굵기, 간격으로 구분한다.",
  "rounded-full은 진행 점, 아바타, 스피너처럼 원형 의미가 있을 때만 예외로 쓴다.",
];

const shapeGrammarRows = [
  {
    label: "큰 표면",
    component: "WaflSurface",
    sample: "카드/패널/정보 묶음",
    tone: "neutral" as const,
  },
  {
    label: "실행 버튼",
    component: "WaflButton",
    sample: "저장/삭제/이동",
    tone: "brand" as const,
  },
  {
    label: "짧은 상태",
    component: "AppBadge",
    sample: "작성중/승인/파일",
    tone: "info" as const,
  },
  {
    label: "입력 필드",
    component: "WaflInput",
    sample: "검색/이름/메모",
    tone: "success" as const,
  },
];

const visualStylingRules = [
  "shape는 surface/control/compact/icon token으로 고정하고 꾸밈 때문에 radius를 바꾸지 않는다.",
  "의미 구분은 tone으로 처리한다. 정보는 info, 성공은 success, 주의는 warning, 위험은 danger, 브랜드 강조는 brand를 쓴다.",
  "채움/외곽/투명 차이는 variant로 처리한다. 화면에서 bg/text/border 색상 class를 직접 조합하지 않는다.",
  "selected/current는 border와 background의 작은 차이로 표시하고 shadow를 강조 수단으로 쓰지 않는다.",
  "disabled는 opacity와 pointer 상태로 충분히 표현하고 별도 회색 팔레트를 화면마다 만들지 않는다.",
  "depth는 border/background 차이만 최소로 사용한다. 카드 안 카드가 필요하면 InfoBox나 muted Surface로 낮춘다.",
];

const visualStateRows = [
  {
    label: "normal",
    rule: "기본 정보. default/surface tone.",
    tone: "neutral" as const,
  },
  {
    label: "selected",
    rule: "사용자가 고른 항목. selected tone 또는 selected prop.",
    tone: "brand" as const,
  },
  {
    label: "current",
    rule: "현재 진행 위치. selected보다 약간 강한 status badge 또는 workflow token.",
    tone: "info" as const,
  },
  {
    label: "disabled",
    rule: "비활성. disabled attribute와 opacity 기준.",
    tone: "neutral" as const,
  },
  {
    label: "danger",
    rule: "삭제/반려/오류. danger tone과 danger variant.",
    tone: "danger" as const,
  },
];

const practiceRules = [
  "작업지시서의 빈 슬롯은 WaflAddCardButton으로 통일한다.",
  "제작 공정과 자재는 카드형 정보 단위로 보되, 선택/열기 동작이 있으면 WaflSurfaceButton을 쓴다.",
  "발주 목록은 row를 우선하고, 모바일에서는 row 내용을 카드처럼 접어 읽는다.",
  "저장소와 휴지통 상세는 리스트 row + detail modal 흐름으로 유지한다.",
];

const usageRuleCards = [
  {
    title: "언제 쓰는가",
    badge: "Use",
    tone: "success" as const,
    body: [
      "같은 UI가 2개 이상 화면에서 반복될 때",
      "버튼/카드/입력/상태/테이블처럼 WAFL 문법이 이미 있는 경우",
      "모바일에서 같은 구조를 유지해야 하는 업무 패턴",
    ],
  },
  {
    title: "언제 쓰지 않는가",
    badge: "Avoid",
    tone: "danger" as const,
    body: [
      "일회성 장식만 위해 새 박스를 만드는 경우",
      "rounded, shadow, border, bg를 직접 조합해서 비슷하게 흉내 내는 경우",
      "상태값을 화면마다 다른 색상 class로 분기하는 경우",
    ],
  },
  {
    title: "새 화면을 만들 때",
    badge: "Check",
    tone: "brand" as const,
    body: [
      "먼저 /ui에서 역할이 맞는 컴포넌트를 고른다",
      "없으면 새 컴포넌트를 만들기 전에 기존 Surface/Form/Table 패턴으로 표현 가능한지 본다",
      "직접 className은 layout 간격과 grid 배치에만 최소 사용한다",
    ],
  },
];

const directClassReplacementRows = [
  {
    direct: "rounded-* 직접 지정",
    replacement:
      "WaflSurface / WaflButton / WaflInput / AppBadge의 shape token",
    reason: "화면별 모서리 차이를 막는다.",
  },
  {
    direct: "shadow-* 직접 지정",
    replacement: "shadow-none 또는 WAFL Surface depth",
    reason: "카드 안 카드의 depth 과다를 막는다.",
  },
  {
    direct: "border-* / bg-* 직접 조합",
    replacement: "tone, variant, selected prop",
    reason: "상태 색과 배경이 화면마다 달라지는 것을 막는다.",
  },
  {
    direct: "text 색상 직접 분기",
    replacement: "AppBadge tone 또는 WAFL text token",
    reason: "상태/유형 색상을 컴포넌트 기준으로 묶는다.",
  },
  {
    direct: "검색/필터 영역 직접 구현",
    replacement: "WaflFilterBar + WAFL_FILTER_* class",
    reason: "관리 화면의 필터 높이와 간격을 통일한다.",
  },
];

const directStyleAuditRows = [
  {
    area: "작업지시서",
    scope: "components/workorder",
    status: "기준 화면",
    remaining: "rounded 69 / 상태색 17 / 직접 form 15",
    decision:
      "0.21.26에서 기준 화면으로 고정했지만 detail/editor 내부의 table, progress, legacy form 잔여분은 다음 정리 대상이다.",
    tone: "warning" as const,
  },
  {
    area: "발주",
    scope: "features/material-orders",
    status: "통과",
    remaining: "rounded 0 / 상태색 0 / 직접 form 0",
    decision:
      "0.21.27 기준으로 Foundation 적용 구간은 direct style 잔여가 거의 없다. 이후 기능 변경 시 회귀만 방지한다.",
    tone: "success" as const,
  },
  {
    area: "저장소/첨부",
    scope: "components/admin/files + Attachment modal",
    status: "부분 통과",
    remaining: "rounded 11 / 상태색 0 / 직접 form 0",
    decision:
      "썸네일, preview wrapper, modal shell 계열의 원형/표면 예외 여부를 확인한 뒤 제거 대상을 분리한다.",
    tone: "info" as const,
  },
  {
    area: "통계/멤버관리",
    scope: "dashboard + members + admin common",
    status: "1차 정리",
    remaining: "rounded 34 → 22 / stone 색상 일부 제거 / 직접 form 2",
    decision:
      "0.21.31에서 audit panel, workspace card, admin layout tile의 직접 radius와 stone 색상을 Foundation 기준으로 정리했다. chart dot/calendar range/table state는 예외 후보로 남긴다.",
    tone: "info" as const,
  },
  {
    area: "설정/결제/회사",
    scope: "settings + billing + companies",
    status: "2차 정리",
    remaining:
      "rounded 96 → progress bar 예외 중심 / 상태색 27 → 정책·파일 preview 일부 정리 / 직접 form 2 → feedback form 전환",
    decision:
      "0.21.34에서 설정 hub, 정책 overview, 회사 파일 preview/card, feedback form의 직접 radius/form 조합을 Foundation 기준으로 추가 정리했다. 진행률 bar와 color swatch는 예외 후보로 유지한다.",
    tone: "info" as const,
  },
  {
    area: "public/dev",
    scope: "public error + service paused + workspace legal + dev test console",
    status: "1차 정리 + 공통 품질 보강",
    remaining:
      "public/dev 핵심 page rounded 직접 조합 제거 / 공통 컴포넌트 data-wafl 기준 보강 / calendar·login·modal 예외 후보 유지",
    decision:
      "0.21.40에서 작업지시서 모바일/태블릿 detail density를 추가 점검하고 summary/action/cost/material/sidepanel accordion 계열을 control foundation 기준으로 재정리했다.",
    tone: "info" as const,
  },
];

const directStyleExceptionRows = [
  {
    label: "원형 의미",
    examples: "progress node, dot, spinner, avatar",
    decision: "예외 허용",
  },
  {
    label: "chart primitive",
    examples: "chart dot, tooltip anchor, donut center",
    decision: "시각화 내부 예외",
  },
  {
    label: "calendar range",
    examples: "range_start, range_end, range_middle",
    decision: "외부 캘린더 문법 예외 검토",
  },
  {
    label: "layout only",
    examples: "grid, flex, gap, width, overflow",
    decision: "WAFL style 아님",
  },
  {
    label: "legacy/dev",
    examples: "dev console, public error page",
    decision: "고객 화면 이후 정리",
  },
];

const waflNamingRules = [
  "data-wafl-component는 kebab-case로 쓴다. 예: workorder-add-card",
  "반복 row는 화면명 + 역할 + row 형태로 쓴다. 예: storage-file-row",
  "모달 내부 요소는 modal-header / modal-body / modal-footer 역할을 드러낸다.",
  "카탈로그 샘플은 catalog- 접두사를 붙여 실제 업무 요소와 구분한다.",
];

const newScreenChecklist = [
  "이 요소가 누르는 것인지, 담는 것인지, 입력하는 것인지 먼저 분류했다.",
  "WaflButton / WaflSurface / WaflForm / WaflDataTable / WaflFilterBar 중 대체 가능한 컴포넌트를 확인했다.",
  "rounded, shadow, border, bg를 직접 조합하지 않았다.",
  "모바일에서 row가 카드처럼 읽히는지 확인했다.",
  "상태값은 AppBadge, 안내문은 WaflInfoBox로 분리했다.",
  "data-wafl-component 이름을 부여했다.",
];

const screenChecklists: ScreenChecklist[] = [
  {
    screen: "작업지시서",
    routeHint: "workorder / order sheet",
    purpose: "좌·중·우 3패널에서 작성, 검토, 첨부, 디자인, 메모를 다룬다.",
    requiredComponents: [
      "WaflSurface",
      "WaflSurfaceButton",
      "WaflAddCardButton",
      "WaflInfoBox",
      "AppBadge",
      "WaflButton",
    ],
    checkItems: [
      "빈 첨부/디자인/메모 슬롯은 WaflAddCardButton으로 보인다.",
      "선택 가능한 공정/자재 카드는 WaflSurfaceButton 또는 WaflSelectableCard 역할로 분리된다.",
      "단계 상태는 AppBadge로 짧게 표시되고, 긴 설명은 InfoBox로 내려간다.",
    ],
    missingRisk:
      "카드 안 카드 depth가 과해지고, 추가 버튼과 실행 버튼이 같은 의미로 보일 수 있다.",
  },
  {
    screen: "원단·부자재 발주",
    routeHint: "material order",
    purpose: "발주서 목록, 발주 기본정보, 공정/주문내역, 작지 연결을 확인한다.",
    requiredComponents: [
      "WaflDataTable",
      "WaflFilterBar",
      "WaflSurface",
      "WaflInfoRow",
      "AppBadge",
      "WaflButton",
    ],
    checkItems: [
      "발주 목록은 row 기준으로 읽히고 모바일에서는 카드처럼 접힌다.",
      "발주 대기/완료/검수 가능 상태는 AppBadge로 구분된다.",
      "검색, 구분, 상태 필터는 WaflFilterBar 안에 묶인다.",
    ],
    missingRisk:
      "발주 row가 화면마다 다른 카드 모양이 되고, 상태 색상이 직접 className으로 흩어질 수 있다.",
  },
  {
    screen: "운영 대시보드",
    routeHint: "admin dashboard",
    purpose: "주요 지표, 요약 카드, 이동 CTA, 알림을 빠르게 확인한다.",
    requiredComponents: [
      "WaflPageHero",
      "WaflSectionPanel",
      "WaflSurface",
      "WaflLinkButton",
      "AppBadge",
      "WaflNoticeBox",
    ],
    checkItems: [
      "이동 CTA는 WaflLinkButton으로 분리된다.",
      "지표 카드는 WaflSurface 안에서 InfoRow/Badge 중심으로 구성된다.",
      "공지나 제한 안내는 WaflNoticeBox 또는 WaflInfoBox를 쓴다.",
    ],
    missingRisk:
      "카드 이동과 버튼 실행이 섞이고, dashboard 전용 박스가 늘어날 수 있다.",
  },
  {
    screen: "협력업체",
    routeHint: "partners / vendors",
    purpose: "업체 검색, 상태 필터, 업체 row, 등록/수정 모달을 다룬다.",
    requiredComponents: [
      "WaflFilterBar",
      "WaflDataTable",
      "WaflInput",
      "WaflTextarea",
      "WaflInfoBox",
      "WaflButton",
    ],
    checkItems: [
      "검색/분류/상태 필터는 WaflFilterBar 기준으로 정렬된다.",
      "업체 목록은 WaflDataTable 계열 row를 유지한다.",
      "등록/수정 모달의 안내문은 InfoBox로 낮춘다.",
    ],
    missingRisk:
      "멤버관리/저장소 테이블과 다른 행 높이·버튼 위치가 생길 수 있다.",
  },
  {
    screen: "저장소",
    routeHint: "files / storage",
    purpose: "파일 목록, 요약 카드, 미리보기/상세, 휴지통 흐름을 다룬다.",
    requiredComponents: [
      "WaflFilterBar",
      "WaflDataTable",
      "WaflSurface",
      "WaflInfoRow",
      "WaflEmptyCard",
      "AppBadge",
    ],
    checkItems: [
      "파일/휴지통 목록은 같은 row 문법을 쓴다.",
      "파일 없음 상태는 WaflEmptyCard로 보인다.",
      "상세 모달은 InfoRow, InfoBox, footer buttons로 분리된다.",
    ],
    missingRisk:
      "파일 카드, 휴지통 row, 상세 모달의 border/radius가 서로 달라질 수 있다.",
  },
  {
    screen: "통계",
    routeHint: "statistics",
    purpose: "기간 필터, 요약 지표, 분석 카드, chart panel을 확인한다.",
    requiredComponents: [
      "WaflFilterBar",
      "WaflSurface",
      "WaflSectionPanel",
      "WaflInfoRow",
      "AppBadge",
    ],
    checkItems: [
      "기간 선택과 분석 조건은 WaflFilterBar 기준으로 묶인다.",
      "metric card는 WaflSurface 안에서 숫자/단위/상태 badge로 정리된다.",
      "chart panel은 별도 shadow를 만들지 않고 section surface 기준을 따른다.",
    ],
    missingRisk:
      "통계 전용 카드가 늘어나면서 다른 관리 화면과 depth가 달라질 수 있다.",
  },
  {
    screen: "멤버관리",
    routeHint: "members",
    purpose: "멤버 검색, 초대/승인 row, 권한 모달, 상태 변경을 다룬다.",
    requiredComponents: [
      "WaflFilterBar",
      "WaflDataTable",
      "WaflSelectableCard",
      "WaflInfoBox",
      "AppBadge",
      "WaflButton",
    ],
    checkItems: [
      "검색 필드는 WaflFilterBar 안에서 다른 관리 화면과 같은 높이를 유지한다.",
      "권한 선택은 WaflSelectableCard로 보이고 선택 상태가 명확하다.",
      "초대/승인/비활성 상태는 AppBadge로 짧게 표시된다.",
    ],
    missingRisk:
      "권한 모달 내부 선택지가 일반 카드처럼 보여 실제 선택 상태가 흐려질 수 있다.",
  },
  {
    screen: "개인설정",
    routeHint: "profile / settings",
    purpose: "개인 정보, 계정 상태, 탈퇴 요청, 개발용 언어 전환 영역을 다룬다.",
    requiredComponents: [
      "WaflSectionPanel",
      "WaflSurface",
      "WaflInfoRow",
      "WaflInfoBox",
      "WaflButton",
      "AppBadge",
    ],
    checkItems: [
      "프로필 정보는 InfoRow로 정렬하고, 설명은 InfoBox로 낮춘다.",
      "탈퇴 요청 같은 위험 액션은 WaflButton danger 기준을 따른다.",
      "개발용 언어 전환은 운영 고객용 주요 CTA처럼 보이지 않게 분리한다.",
    ],
    missingRisk:
      "설정 화면이 기능별 임의 박스로 나뉘어 WAFL 공통 패널 문법에서 벗어날 수 있다.",
  },
];

const screenChecklistSummary = [
  "새 화면 리팩토링보다 /ui 기준 정리가 우선이다.",
  "모든 화면에서 누르는 것, 담는 것, 입력하는 것, 보여주는 것을 먼저 분류한다.",
  "직접 rounded/shadow/border/bg 검색 결과는 이 표의 required components로 치환한다.",
  "누락 컴포넌트가 있어도 한 번에 대규모 수정하지 말고 화면별 소규모 보정으로 나눈다.",
];

const componentGroupGuides: ComponentGroupGuide[] = [
  {
    group: "Primitive",
    meaning: "가장 작은 공통 부품",
    rule: "역할이 명확하고 여러 화면에서 반복되면 유지한다. 모양 차이는 props와 shape token으로 처리한다.",
    examples:
      "WaflButton, WaflIconButton, WaflInput, WaflTextarea, AppBadge, WaflSurface",
  },
  {
    group: "Pattern",
    meaning: "primitive를 조합한 반복 패턴",
    rule: "필터바, 테이블, 빈 상태, 추가 카드처럼 화면마다 같은 구조가 반복될 때 유지한다.",
    examples:
      "WaflFilterBar, WaflDataTable, WaflEmptyCard, WaflAddCardButton, WaflInfoBox",
  },
  {
    group: "Domain",
    meaning: "업무 도메인 전용 조합",
    rule: "작업지시서/발주/저장소의 데이터와 로직이 붙어 있으면 남기되 내부는 primitive/pattern을 쓰게 한다.",
    examples:
      "WorkOrderListCard, WorkOrderMemoPanel, StorageFileRow, MaterialOrderRow",
  },
  {
    group: "Legacy",
    meaning: "교체해야 할 이전 구현",
    rule: "일반 button/span/input에 직접 rounded/bg/border를 박은 요소는 전환 대상으로 표시한다.",
    examples:
      "화면 내부 직접 button, 직접 badge span, Admin* 구형 컴포넌트 일부",
  },
];

const componentInventoryItems: ComponentInventoryItem[] = [
  {
    name: "WaflButton",
    group: "Primitive",
    role: "저장, 등록, 삭제, 승인처럼 실행하는 버튼",
    keepDecision: "유지",
    target: "실행 버튼의 기준 컴포넌트",
    priority: "높음",
    note: "tone/variant/size로 처리하고 별도 저장 버튼 컴포넌트를 늘리지 않는다.",
  },
  {
    name: "WaflLinkButton",
    group: "Primitive",
    role: "버튼처럼 보이는 화면 이동 링크",
    keepDecision: "유지",
    target: "이동 CTA 전용",
    priority: "중간",
    note: "실행이 아니라 href 이동이면 WaflButton으로 합치지 않는다.",
  },
  {
    name: "WaflIconButton / WaflMoreActionButton",
    group: "Primitive",
    role: "..., +, 닫기, 수정, 삭제 같은 아이콘 액션",
    keepDecision: "유지",
    target: "WaflActionButton 기반 icon/more action 기준 컴포넌트",
    priority: "높음",
    note: "제작 공정 카드의 ... 버튼과 작업지시서 목록 ... 버튼을 같은 more action primitive로 맞춘다.",
  },
  {
    name: "AppBadge",
    group: "Primitive",
    role: "짧은 상태, 유형, 개수 표시",
    keepDecision: "유지",
    target: "상태 라벨 기준",
    priority: "높음",
    note: "작성중/발주완료/파일 유형 같은 짧은 값만 담당한다.",
  },
  {
    name: "WaflInput / WaflTextarea / WaflSelect trigger",
    group: "Primitive",
    role: "입력과 선택의 기본 control",
    keepDecision: "유지",
    target: "모든 검색/메모/폼 입력의 기준",
    priority: "높음",
    note: "화면별 input class는 wafl-shape-control과 이 컴포넌트로 흡수한다.",
  },
  {
    name: "WaflSurface",
    group: "Primitive",
    role: "내용을 담는 기본 컨테이너",
    keepDecision: "유지",
    target: "카드/패널의 shape 기준",
    priority: "높음",
    note: "클릭이 필요하면 SurfaceButton 계열로 분리한다.",
  },
  {
    name: "WaflSurfaceButton / WaflSelectableCard",
    group: "Pattern",
    role: "카드처럼 보이지만 선택/클릭 가능한 항목",
    keepDecision: "통합 후보",
    target: "선택 카드 패턴으로 정리",
    priority: "중간",
    note: "둘의 차이가 화면에서 애매하면 selected/pressed props 기준으로 합칠 수 있다.",
  },
  {
    name: "WaflAddCardButton / WaflAddIconBubble / WaflAddActionButton",
    group: "Pattern",
    role: "빈 슬롯 또는 작은 아이콘 자리에서 새 항목을 추가하는 CTA",
    keepDecision: "유지",
    target:
      "카드형은 WaflAddCardButton, 작은 +는 WaflAddActionButton, 내부 glyph는 WaflAddIconBubble",
    priority: "높음",
    note: "카드 안 + glyph도 border가 있는 WaflAddIconBubble을 사용해 화면별로 테두리가 사라지지 않게 관리한다.",
  },
  {
    name: "WaflInfoBox / WaflNoticeBox",
    group: "Pattern",
    role: "안내, 주의, 보조 설명 박스",
    keepDecision: "통합 후보",
    target: "안내 박스 계열 tone 기준 통합",
    priority: "중간",
    note: "관리 화면용 Notice와 일반 InfoBox의 역할 중복을 줄인다.",
  },
  {
    name: "WaflEmptyCard",
    group: "Pattern",
    role: "데이터가 없을 때만 쓰는 빈 상태 카드",
    keepDecision: "유지",
    target: "empty state 기준",
    priority: "중간",
    note: "일반 Surface에 '없음' 문구만 넣는 방식보다 우선 사용한다.",
  },
  {
    name: "WaflFilterBar",
    group: "Pattern",
    role: "검색, select, 필터 적용 버튼 묶음",
    keepDecision: "유지",
    target: "관리 화면 필터 기준",
    priority: "높음",
    note: "검색창/셀렉트/필터 버튼 shape와 간격을 한곳에서 통제한다.",
  },
  {
    name: "WaflDataTable",
    group: "Pattern",
    role: "관리 화면 table/row/mobile card 구조",
    keepDecision: "유지",
    target: "저장소/멤버/협력업체/통계 table 기준",
    priority: "높음",
    note: "AdminTable 계열과 역할 중복을 계속 줄인다.",
  },
  {
    name: "WaflPageHero / WaflSectionPanel",
    group: "Pattern",
    role: "페이지 상단 설명과 섹션 패널",
    keepDecision: "유지",
    target: "관리/내부 페이지 layout 기준",
    priority: "중간",
    note: "페이지별 임의 header/card를 줄이는 역할이다.",
  },
  {
    name: "BaseModal / ModalHeader / ModalBody / ModalFooter",
    group: "Pattern",
    role: "모달 shell과 내부 구획",
    keepDecision: "유지",
    target: "모달 구조 기준",
    priority: "중간",
    note: "모달 내부 버튼/입력/InfoBox는 primitive를 쓰게 유지한다.",
  },
  {
    name: "WorkOrderListCard / WorkOrderMemoPanel",
    group: "Domain",
    role: "작업지시서 전용 카드와 메모 패널",
    keepDecision: "유지",
    target: "도메인 조합은 유지, 내부 버튼은 primitive로 교체",
    priority: "높음",
    note: "업무 로직은 남기고 .../댓글/수정/삭제 버튼은 icon action primitive로 통합한다.",
  },
  {
    name: "AdminButton / AdminIconActionButton / AdminStatusBadge",
    group: "Legacy",
    role: "관리 화면 이전 버튼/아이콘/상태 컴포넌트",
    keepDecision: "전환 대상",
    target: "WaflButton / WaflIconButton / AppBadge",
    priority: "중간",
    note: "바로 삭제하지 않고 사용 위치를 줄이면서 WAFL 컴포넌트로 전환한다.",
  },
  {
    name: "화면 내부 직접 button/input/span",
    group: "Legacy",
    role: "data-wafl-component만 있거나 직접 className으로 만든 요소",
    keepDecision: "폐기 후보",
    target: "가장 가까운 primitive/pattern으로 교체",
    priority: "높음",
    note: "분홍색 outline이 있어도 shape token을 안 타는 원인이다.",
  },
];

const inventoryNextSteps = [
  "... / 닫기 / 수정 / 삭제는 WaflIconButton 또는 WaflMoreActionButton 기준으로 통합하고, 데스크톱 카드 안에서는 pbp-touch-target으로 크기를 키우지 않는다.",
  "+ 버튼은 WaflAddActionButton, 카드형 추가 슬롯은 WaflAddCardButton, 카드 안 glyph는 WaflAddIconBubble으로 고정한다.",
  "아이콘 버튼 크기는 sm 28px, md 32px, lg 36px로 고정하고 작업지시서 more/add 버튼은 md를 기본으로 쓴다.",
  "WaflSurfaceButton과 WaflSelectableCard는 선택 가능 카드 기준으로 통합 가능한지 확인한다.",
  "AdminButton/AdminIconActionButton/AdminStatusBadge는 바로 삭제하지 말고 사용 위치를 줄인다.",
  "화면 내부 직접 button/input/span은 신규 작성 금지 대상으로 표시한다.",
];

function SectionAnchorList() {
  return (
    <nav
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="WAFL UI catalog sections"
    >
      {catalogSections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          data-wafl-component="catalog-nav-card"
          className="wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-3 text-sm font-semibold text-[var(--pbp-text-primary)] shadow-none transition hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)]"
        >
          <span className="flex items-center justify-between gap-3">
            {section.title}
            <AppBadge
              size="xs"
              tone={
                section.status === "guide"
                  ? "brand"
                  : section.status === "sampled"
                    ? "info"
                    : "neutral"
              }
            >
              {section.status}
            </AppBadge>
          </span>
          <span className="mt-1 block text-xs font-bold text-[var(--pbp-text-primary)]">
            {section.plainTitle}
          </span>
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
      <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
        {title}
      </p>
      <ul className="mt-2 grid gap-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)] lg:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule} className="flex gap-2">
            <span
              aria-hidden="true"
              className="text-[var(--pbp-brand-primary)]"
            >
              •
            </span>
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
        <WaflSurface
          key={item.component + item.label}
          component="catalog-decision-card"
          tone="surface"
          className="p-4"
        >
          <div className="flex h-full flex-col gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
                상황
              </p>
              <p className="text-sm font-bold leading-5 text-[var(--pbp-text-primary)]">
                {item.label}
              </p>
            </div>
            <div className="wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-2">
              <p className="text-xs font-bold text-[var(--pbp-brand-primary)]">
                {item.component}
              </p>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                {item.rule}
              </p>
            </div>
            <p className="mt-auto text-xs font-medium leading-5 text-[var(--pbp-text-subtle)]">
              예: {item.example}
            </p>
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
    <WaflSurface
      component="catalog-comparison-card"
      tone="surface"
      className="p-4"
    >
      <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
        {title}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3">
          <AppBadge size="xs" tone="neutral">
            비슷해 보이는 것
          </AppBadge>
          <p className="mt-2 text-sm font-bold text-[var(--pbp-text-primary)]">
            {leftTitle}
          </p>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            {leftBody}
          </p>
        </div>
        <div className="wafl-shape-surface border border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] p-3">
          <AppBadge size="xs" tone="brand">
            판단 기준
          </AppBadge>
          <p className="mt-2 text-sm font-bold text-[var(--pbp-text-primary)]">
            {rightTitle}
          </p>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            {rightBody}
          </p>
        </div>
      </div>
    </WaflSurface>
  );
}

function FoundationPrimitiveSamples() {
  const primitiveRows = [
    {
      key: "shape",
      value: "surface / control / compact / icon",
      rule: "곡률 family를 고정한다.",
    },
    {
      key: "density",
      value: "micro / compact / default / spacious",
      rule: "높이와 좌우 여백을 고정한다.",
    },
    {
      key: "tone",
      value: "surface / muted / selected / warning / danger / info",
      rule: "의미 색상은 공통 tone으로만 바꾼다.",
    },
    {
      key: "state",
      value: "normal / selected / current / disabled / danger",
      rule: "상태 때문에 shape가 바뀌지 않게 한다.",
    },
  ];

  return (
    <div className="space-y-4">
      <WaflNoticeBox tone="info">
        0.21.41은 작업지시서 모바일/태블릿 보정 뒤 멤버관리 compact row, 저장소 휴지통 compact row, 설정 파일 preview, 개인설정 모달의 device density를 한 번 더 맞춘다.
      </WaflNoticeBox>

      <WaflSurface
        component="catalog-foundation-scan"
        shape="control"
        tone="muted"
        className="p-4"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
          Direct style scan · full audit
        </p>
        <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
          제거 대상과 예외 대상을 분리한다
        </h3>
        <div className="mt-3 grid gap-2 text-xs font-medium leading-5 text-[var(--pbp-text-muted)] md:grid-cols-2">
          <WaflInfoBox
            shape="control"
            tone="danger"
            state="danger"
            className="p-3"
          >
            제거 대상: 고객 업무 화면에서 컴포넌트 prop으로 대체 가능한 rounded,
            bg, border, text, 직접 form class 조합
          </WaflInfoBox>
          <WaflInfoBox shape="control" tone="info" state="info" className="p-3">
            예외 대상: 실제 원형 의미가 있는 dot/spinner/avatar, chart
            primitive, calendar range, layout-only class
          </WaflInfoBox>
        </div>
      </WaflSurface>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <WaflSurface
          component="catalog-foundation-map"
          tone="surface"
          className="p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
                Primitive map
              </p>
              <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
                같은 계열은 같은 foundation을 쓴다
              </h3>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                WaflSurface, WaflButton, WaflInput, AppSelect, AppBadge,
                InfoRow, EmptyCard, AddCard, AddCardButton은 서로 다른
                컴포넌트지만 shape/density/tone 값은 한 곳에서 공유한다.
              </p>
            </div>
            <AppBadge tone="brand" size="xs">
              foundation
            </AppBadge>
          </div>
          <div className="mt-4 grid gap-2">
            {primitiveRows.map((row) => (
              <WaflInfoRow
                key={row.key}
                component="catalog-foundation-row"
                tone="muted"
                className="items-start"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-[var(--pbp-text-primary)]">
                    {row.key}
                  </span>
                  <span className="mt-1 block text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                    {row.value}
                  </span>
                </span>
                <span className="max-w-[11rem] text-right text-[11px] font-semibold leading-5 text-[var(--pbp-text-muted)]">
                  {row.rule}
                </span>
              </WaflInfoRow>
            ))}
          </div>
        </WaflSurface>

        <WaflSurface
          component="catalog-foundation-visual"
          tone="surface"
          className="p-4"
        >
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
            control 계열 비교
          </p>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            아래 요소는 모두 control foundation으로 읽혀야 한다. 버튼, 검색필드,
            선택 row가 서로 다른 곡률로 보이면 해당 컴포넌트가 아직 primitive를
            우회한 것이다.
          </p>
          <div className="mt-4 grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <WaflButton variant="secondary" size="md">
                control button
              </WaflButton>
              <WaflButton variant="neutral" size="sm">
                compact control
              </WaflButton>
              <WaflButton variant="icon" size="md" aria-label="foundation icon">
                +
              </WaflButton>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <WaflInput fieldSize="sm" placeholder="검색필드 · control sm" />
              <AppSelect
                size="sm"
                value="active"
                options={[
                  { value: "active", label: "셀렉트 · control sm" },
                  { value: "all", label: "전체" },
                ]}
                ariaLabel="foundation select sample"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <WaflInput
                fieldSize="xs"
                placeholder="발주 table input · micro"
              />
              <AppSelect
                size="xs"
                value="unit"
                options={[
                  { value: "unit", label: "발주 table select · micro" },
                  { value: "ma", label: "마" },
                ]}
                ariaLabel="foundation micro select sample"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <WaflSurface
                component="catalog-storage-file-row"
                shape="control"
                tone="surface"
                className="flex items-center justify-between gap-3 p-3"
              >
                <span className="min-w-0 text-xs font-bold text-[var(--pbp-text-primary)]">
                  파일 row · control
                </span>
                <AppBadge tone="file" size="xs">
                  file
                </AppBadge>
              </WaflSurface>
              <WaflEmptyCard
                component="catalog-storage-empty"
                shape="control"
                density="compact"
              >
                storage empty · control compact
              </WaflEmptyCard>
            </div>
            <WaflSelectableCard
              selected
              component="catalog-foundation-selectable"
            >
              <span className="text-sm font-bold">control row</span>
              <AppBadge tone="brand" size="xs">
                selected
              </AppBadge>
            </WaflSelectableCard>
            <WaflInfoRow component="catalog-foundation-info-row" tone="muted">
              <span className="text-xs font-bold text-[var(--pbp-text-primary)]">
                control info row
              </span>
              <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">
                same shape
              </span>
            </WaflInfoRow>
            <div className="grid gap-2 sm:grid-cols-2">
              <WaflInfoBox
                component="catalog-modal-preview"
                tone="muted"
                shape="control"
                state="current"
              >
                <p className="text-xs font-bold text-[var(--pbp-text-primary)]">
                  modal preview
                </p>
                <p className="mt-1 text-xs font-medium text-[var(--pbp-text-muted)]">
                  기본정보 미리보기
                </p>
              </WaflInfoBox>
              <WaflEmptyCard
                component="catalog-modal-empty"
                shape="control"
                density="default"
              >
                modal empty state
              </WaflEmptyCard>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <WaflSurface
                component="catalog-side-panel"
                tone="surface"
                className="p-3"
              >
                <p className="text-xs font-bold text-[var(--pbp-text-primary)]">
                  side panel surface
                </p>
                <WaflInfoRow
                  component="catalog-side-panel-row"
                  tone="muted"
                  className="mt-2"
                >
                  <span className="text-xs font-semibold">첨부/메모 row</span>
                  <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">
                    control
                  </span>
                </WaflInfoRow>
              </WaflSurface>
              <WaflSurface
                component="catalog-cost-summary"
                shape="control"
                tone="info"
                className="p-3"
              >
                <p className="text-xs font-bold">cost summary control</p>
                <p className="mt-1 text-xs font-semibold opacity-75">
                  총 비용 / 공정별 금액
                </p>
              </WaflSurface>
            </div>
          </div>
        </WaflSurface>
      </div>
    </div>
  );
}

function ShapeGrammarSamples() {
  return (
    <div className="space-y-4">
      <WaflNoticeBox tone="info">
        현재 WAFL shape는 최상위 토큰으로 구조화했다. 카드·패널은 surface,
        버튼·입력은 control, 배지는 compact, 아이콘 버튼은 icon token을 쓴다.
      </WaflNoticeBox>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <WaflSurface
          component="catalog-shape-principle"
          tone="surface"
          className="p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
                Shape family
              </p>
              <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
                하나의 shape family, 네 개의 token
              </h3>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                컨테이너 모양을 기준으로 삼되, 작은 요소는 더 작은 radius
                token을 써서 눈에 보이는 곡률을 맞춘다.
              </p>
            </div>
            <AppBadge tone="brand" size="xs">
              shape token
            </AppBadge>
          </div>
          <div className="mt-4 grid gap-2">
            {shapeGrammarRows.map((row) => (
              <WaflInfoRow
                key={row.component}
                component="catalog-shape-row"
                tone="muted"
                className="items-start"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-[var(--pbp-text-primary)]">
                    {row.label}
                  </span>
                  <span className="mt-1 block text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                    {row.component} · {row.sample}
                  </span>
                </span>
                <AppBadge tone={row.tone} size="xs">
                  token
                </AppBadge>
              </WaflInfoRow>
            ))}
          </div>
        </WaflSurface>

        <WaflSurface
          component="catalog-shape-visual-sample"
          tone="surface"
          className="p-4"
        >
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
            같은 모양 계열 샘플
          </p>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            아래 요소들은 서로 다른 token을 쓰지만 같은 둥근 네모 계열로 읽혀야
            한다. 알약형으로 보이면 token 값이 아직 큰 것이다.
          </p>
          <div className="mt-4 grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <WaflButton variant="primary" size="md">
                저장 실행
              </WaflButton>
              <WaflButton variant="secondary" size="md">
                보조 실행
              </WaflButton>
              <WaflButton variant="danger" size="md">
                삭제
              </WaflButton>
              <WaflButton variant="icon" size="md" aria-label="아이콘 버튼">
                +
              </WaflButton>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AppBadge tone="brand">작성중</AppBadge>
              <AppBadge tone="success">승인</AppBadge>
              <AppBadge tone="file">파일</AppBadge>
              <AppBadge tone="danger">삭제 예정</AppBadge>
            </div>
            <WaflInput placeholder="검색 입력도 같은 모양 계열" />
            <WaflInfoBox tone="muted" component="catalog-shape-info-sample">
              <p className="text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                안내 박스도 같은 곡률 계열을 사용한다. 차이는 배경과 border
                tone으로 만든다.
              </p>
            </WaflInfoBox>
          </div>
        </WaflSurface>
      </div>

      <RuleList title="WAFL shape token" rules={shapeGrammarRules} />
    </div>
  );
}

function VisualStylingSamples() {
  return (
    <div className="space-y-4">
      <WaflNoticeBox tone="info">
        꾸밈은 화면별 className이 아니라 공통 컴포넌트의 tone, variant,
        selected, disabled 기준으로만 확장한다. 모바일에서는 contrast가 과하지
        않은지 먼저 확인한다.
      </WaflNoticeBox>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <WaflSurface
          component="catalog-visual-button-guide"
          tone="surface"
          className="p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
                WaflButton tone / variant
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
                명령의 강도는 variant로 고르고, 상태는 disabled prop으로 둔다.
              </p>
            </div>
            <AppBadge tone="brand" size="xs">
              control
            </AppBadge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <WaflButton variant="primary" size="sm">
              primary
            </WaflButton>
            <WaflButton variant="secondary" size="sm">
              secondary
            </WaflButton>
            <WaflButton variant="neutral" size="sm">
              neutral
            </WaflButton>
            <WaflButton variant="ghost" size="sm">
              ghost
            </WaflButton>
            <WaflButton variant="subtle" size="sm">
              subtle
            </WaflButton>
            <WaflButton variant="danger" size="sm">
              danger
            </WaflButton>
            <WaflButton variant="secondary" size="sm" disabled>
              disabled
            </WaflButton>
          </div>
        </WaflSurface>

        <WaflSurface
          component="catalog-visual-badge-guide"
          tone="surface"
          className="p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
                AppBadge tone
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
                짧은 상태·유형·개수만 badge로 표시한다.
              </p>
            </div>
            <AppBadge tone="memo" size="xs">
              compact
            </AppBadge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                "neutral",
                "info",
                "success",
                "warning",
                "danger",
                "brand",
                "document",
                "memo",
                "file",
              ] as const
            ).map((tone) => (
              <AppBadge key={tone} tone={tone}>
                {tone}
              </AppBadge>
            ))}
          </div>
        </WaflSurface>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <WaflSurface
          component="catalog-visual-surface-guide"
          tone="surface"
          className="p-4"
        >
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
            WaflSurface tone / state
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <WaflSurface
              component="catalog-surface-default"
              tone="default"
              className="p-3"
            >
              <AppBadge tone="neutral" size="xs">
                default
              </AppBadge>
              <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">
                기본 카드와 패널.
              </p>
            </WaflSurface>
            <WaflSurface
              component="catalog-surface-selected"
              tone="selected"
              className="p-3"
            >
              <AppBadge tone="brand" size="xs">
                selected
              </AppBadge>
              <p className="mt-2 text-xs leading-5">
                선택 목록 카드, current row.
              </p>
            </WaflSurface>
            <WaflSurface
              component="catalog-surface-muted"
              tone="muted"
              className="p-3"
            >
              <AppBadge tone="neutral" size="xs">
                muted
              </AppBadge>
              <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">
                카드 안 보조 row.
              </p>
            </WaflSurface>
            <WaflSurface
              component="catalog-surface-warning"
              tone="warning"
              className="p-3"
            >
              <AppBadge tone="warning" size="xs">
                warning
              </AppBadge>
              <p className="mt-2 text-xs leading-5">주의 안내나 대기 상태.</p>
            </WaflSurface>
          </div>
        </WaflSurface>

        <RuleList title="Visual styling rule" rules={visualStylingRules} />
      </div>

      <WaflDataTableShell>
        <WaflDataTableHeader gridTemplateColumns="0.55fr 1.2fr 0.45fr">
          <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>State</div>
          <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>적용 기준</div>
          <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Tone</div>
        </WaflDataTableHeader>
        <WaflDataTableBody>
          {visualStateRows.map((row) => (
            <WaflDataTableRow
              key={row.label}
              gridTemplateColumns="0.55fr 1.2fr 0.45fr"
            >
              <p className={WAFL_DATA_TABLE_PRIMARY_TEXT_CLASS}>{row.label}</p>
              <p className="text-[12px] font-medium leading-5 text-[var(--pbp-text-muted)]">
                {row.rule}
              </p>
              <div className={WAFL_DATA_TABLE_CELL_CLASS}>
                <AppBadge tone={row.tone} size="xs">
                  {row.tone}
                </AppBadge>
              </div>
            </WaflDataTableRow>
          ))}
        </WaflDataTableBody>
      </WaflDataTableShell>
    </div>
  );
}

function TouchActionSamples() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <WaflInfoBox tone="selected" component="catalog-action-guide">
          <p className="text-sm font-bold">핵심 구분</p>
          <p className="mt-1 text-xs font-medium leading-5">
            같은 버튼처럼 보여도 “실행”, “이동”, “카드 선택”, “빈 슬롯 추가”는
            서로 다른 컴포넌트를 쓴다.
          </p>
        </WaflInfoBox>
        <div className="flex flex-wrap items-center gap-2 wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3">
          <WaflButton variant="primary" size="md">
            저장 실행
          </WaflButton>
          <WaflButton variant="secondary" size="md">
            보조 실행
          </WaflButton>
          <WaflButton variant="danger" size="md">
            삭제
          </WaflButton>
          <WaflLinkButton href="#start-here" variant="secondary" size="md">
            섹션 이동
          </WaflLinkButton>
          <WaflButton variant="icon" size="md" aria-label="추가 아이콘 버튼">
            +
          </WaflButton>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <WaflSurfaceButton component="catalog-surface-button-sample" selected>
          <span className="min-w-0">
            <span className="block text-sm font-bold">WaflSurfaceButton</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--pbp-text-muted)]">
              카드처럼 보이는 클릭 항목
            </span>
          </span>
          <AppBadge size="xs" tone="brand">
            selected
          </AppBadge>
        </WaflSurfaceButton>
        <WaflAddCardButton
          density="spacious"
          label="새 항목 추가"
          description="카드 그리드의 빈 슬롯"
        />
        <WaflSurface
          component="catalog-non-click-card"
          tone="surface"
          className="p-4"
        >
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
            WaflSurface
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
            이건 누르는 요소가 아니라 정보를 담는 카드다.
          </p>
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
        <WaflSurface
          component="catalog-surface-card"
          tone="surface"
          className="p-4"
        >
          <AppBadge size="xs" tone="neutral">
            정보 카드
          </AppBadge>
          <p className="mt-3 text-sm font-bold text-[var(--pbp-text-primary)]">
            WaflSurface
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
            정적 정보를 담는다.
          </p>
        </WaflSurface>
        <WaflInfoBox tone="muted" component="catalog-info-box-sample">
          <AppBadge size="xs" tone="info">
            안내문
          </AppBadge>
          <p className="mt-3 text-sm font-bold text-[var(--pbp-text-primary)]">
            WaflInfoBox
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
            카드보다 낮은 depth의 설명.
          </p>
        </WaflInfoBox>
        <WaflEmptyCard component="catalog-empty-card-sample">
          <span className="block text-sm font-bold">WaflEmptyCard</span>
          <span className="mt-1 block text-xs leading-5">데이터 없음 전용</span>
        </WaflEmptyCard>
        <WaflSelectableCard selected>
          <span className="min-w-0">
            <span className="block text-sm font-bold">WaflSelectableCard</span>
            <span className="mt-1 block text-xs text-[var(--pbp-text-muted)]">
              폼 안 선택지
            </span>
          </span>
          <AppBadge size="xs" tone="brand">
            선택
          </AppBadge>
        </WaflSelectableCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <WaflSurface
          component="catalog-container-composition"
          tone="surface"
          className="p-4"
        >
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
            카드 내부 구성 예시
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
            큰 card 안에서 또 card를 반복하기보다 InfoRow와 InfoBox를 섞어
            depth를 낮춘다.
          </p>
          <div className="mt-3 grid gap-2">
            <WaflInfoRow component="catalog-info-row-one">
              <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">
                상태
              </span>
              <AppBadge size="xs" tone="success">
                정상
              </AppBadge>
            </WaflInfoRow>
            <WaflInfoRow component="catalog-info-row-two" tone="muted">
              <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">
                사용 화면
              </span>
              <span className="text-xs font-bold text-[var(--pbp-text-primary)]">
                저장소 / 멤버관리 / 작업지시서
              </span>
            </WaflInfoRow>
            <WaflInfoBox tone="muted" component="catalog-nested-info-note">
              <p className="text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                보조 설명은 이 정도 depth로 낮춘다.
              </p>
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
            className="pbp-field-interaction flex h-11 w-full items-center justify-between gap-3 wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-left text-sm font-semibold text-[var(--pbp-text-primary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)]"
            aria-haspopup="listbox"
            aria-expanded="false"
          >
            <span className="min-w-0 truncate">구분 선택</span>
            <span aria-hidden="true" className="text-[var(--pbp-text-muted)]">
              ⌄
            </span>
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
            <span className="mt-1 block text-xs text-[var(--pbp-text-muted)]">
              권한/역할/옵션을 고른다.
            </span>
          </span>
          <AppBadge size="xs" tone="brand">
            선택됨
          </AppBadge>
        </WaflSelectableCard>
      </div>
      <WaflNoticeBox tone="info">
        select trigger는 다시 누르면 닫힘, 바깥 클릭 닫힘, Escape 닫힘을
        유지해야 한다.
      </WaflNoticeBox>
    </div>
  );
}

function StatusSamples() {
  const tones = [
    "neutral",
    "info",
    "success",
    "warning",
    "danger",
    "brand",
    "document",
    "design",
    "memo",
    "file",
  ] as const;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <WaflSurface
          component="catalog-badge-samples"
          tone="surface"
          className="p-4"
        >
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
            AppBadge
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
            짧은 상태·개수·유형만 표시한다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tones.map((tone) => (
              <AppBadge key={tone} tone={tone}>
                {tone}
              </AppBadge>
            ))}
            <AppBadge variant="count">12</AppBadge>
            <AppBadge size="xs" tone="brand">
              xs
            </AppBadge>
            <AppBadge size="md" tone="brand">
              md
            </AppBadge>
          </div>
        </WaflSurface>
        <RuleList title="보여주는 요소 선택 규칙" rules={statusRules} />
      </div>

      <WaflFilterBar layoutClassName="lg:grid-cols-[1fr_180px_auto]">
        <label className={WAFL_FILTER_FIELD_CLASS}>
          <span className={WAFL_FILTER_LABEL_CLASS}>검색</span>
          <input
            className={WAFL_FILTER_INPUT_CLASS}
            placeholder="컴포넌트명 검색"
          />
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
          <WaflButton variant="secondary" size="md">
            필터 적용
          </WaflButton>
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

function PracticePatternSamples() {
  return (
    <div className="space-y-5">
      <WaflNoticeBox tone="info">
        아래 샘플은 실제 데이터 저장/조회 로직이 없는 카탈로그용 정적 예시다.
        화면에서 어떤 WAFL 컴포넌트를 선택해야 하는지 확인하는 용도다.
      </WaflNoticeBox>

      <div className="grid gap-4 xl:grid-cols-2">
        <WaflSurface
          component="catalog-workorder-pattern"
          tone="surface"
          className="p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
                Workorder pattern
              </p>
              <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
                작업지시서 구성 카드
              </h3>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                제품 구성, 공정, 첨부, 디자인, 메모처럼 반복되는 카드 묶음의
                기준이다.
              </p>
            </div>
            <AppBadge tone="document">작업지시서</AppBadge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <WaflAddCardButton
              className="min-h-28"
              label="첨부 추가"
              description="빈 슬롯 CTA"
            />

            <WaflSurfaceButton
              component="catalog-process-card-sample"
              selected
              className="flex items-center justify-between gap-3"
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold">봉제 공정</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--pbp-text-muted)]">
                  단가 3,500원 · 수량 12장
                </span>
              </span>
              <AppBadge tone="brand" size="xs">
                선택
              </AppBadge>
            </WaflSurfaceButton>

            <WaflSurface
              component="catalog-material-card-sample"
              tone="surface"
              className="p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
                    원단 · 울 혼방
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
                    2.5 yd · 메인 원단
                  </p>
                </div>
                <AppBadge tone="file" size="xs">
                  원단
                </AppBadge>
              </div>
            </WaflSurface>

            <WaflInfoBox tone="muted" component="catalog-workorder-note-sample">
              <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
                메모 카드 내부 안내
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
                카드 안 보조 설명은 InfoBox로 depth를 낮춘다.
              </p>
            </WaflInfoBox>
          </div>
        </WaflSurface>

        <WaflSurface
          component="catalog-order-pattern"
          tone="surface"
          className="p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
                Order pattern
              </p>
              <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
                원단·부자재 발주 row
              </h3>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                발주 목록은 row 구조를 우선하고, 모바일에서는 한 카드처럼 읽히게
                묶는다.
              </p>
            </div>
            <AppBadge tone="info">발주</AppBadge>
          </div>

          <div className="mt-4 grid gap-2">
            {[
              {
                name: "울 혼방 원단",
                meta: "거래처 A · 2.5 yd",
                status: "발주 대기",
                tone: "warning" as const,
              },
              {
                name: "금속 단추",
                meta: "부자재 B · 24 ea",
                status: "발주 완료",
                tone: "success" as const,
              },
            ].map((item) => (
              <WaflSurfaceButton
                key={item.name}
                component="catalog-order-row-sample"
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{item.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--pbp-text-muted)]">
                    {item.meta}
                  </span>
                </span>
                <AppBadge tone={item.tone} size="xs">
                  {item.status}
                </AppBadge>
              </WaflSurfaceButton>
            ))}
          </div>

          <WaflInfoBox
            tone="selected"
            component="catalog-order-rule"
            className="mt-3"
          >
            <p className="text-xs font-medium leading-5">
              발주 row를 누르면 상세를 열 수 있으므로 WaflSurfaceButton을 쓴다.
              단순 요약만 보여주면 WaflSurface로 낮춘다.
            </p>
          </WaflInfoBox>
        </WaflSurface>
      </div>

      <WaflSurface
        component="catalog-foundation-scan"
        shape="control"
        tone="muted"
        className="p-4"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
          Direct style scan · full audit
        </p>
        <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
          제거 대상과 예외 대상을 분리한다
        </h3>
        <div className="mt-3 grid gap-2 text-xs font-medium leading-5 text-[var(--pbp-text-muted)] md:grid-cols-2">
          <WaflInfoBox
            shape="control"
            tone="danger"
            state="danger"
            className="p-3"
          >
            제거 대상: 고객 업무 화면에서 컴포넌트 prop으로 대체 가능한 rounded,
            bg, border, text, 직접 form class 조합
          </WaflInfoBox>
          <WaflInfoBox shape="control" tone="info" state="info" className="p-3">
            예외 대상: 실제 원형 의미가 있는 dot/spinner/avatar, chart
            primitive, calendar range, layout-only class
          </WaflInfoBox>
        </div>
      </WaflSurface>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <WaflSurface
          component="catalog-storage-pattern"
          tone="surface"
          className="p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
                Storage pattern
              </p>
              <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
                저장소 row / 휴지통 detail
              </h3>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                파일 목록은 row, 상세 확인은 modal 내부 Surface/InfoBox 조합을
                기준으로 한다.
              </p>
            </div>
            <AppBadge tone="file">저장소</AppBadge>
          </div>

          <div className="mt-4 grid gap-2">
            <WaflSurfaceButton
              component="catalog-storage-row-sample"
              className="flex items-center justify-between gap-3"
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold">
                  작업지시서_샘플.pdf
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--pbp-text-muted)]">
                  PDF · 2.4MB · 2026-06-10
                </span>
              </span>
              <AppBadge tone="document" size="xs">
                문서
              </AppBadge>
            </WaflSurfaceButton>
            <WaflSurfaceButton
              component="catalog-trash-row-sample"
              className="flex items-center justify-between gap-3"
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold">
                  삭제된 디자인.png
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--pbp-text-muted)]">
                  30일 후 영구삭제 · 복원 가능
                </span>
              </span>
              <AppBadge tone="danger" size="xs">
                휴지통
              </AppBadge>
            </WaflSurfaceButton>
          </div>
        </WaflSurface>

        <WaflSurface
          component="catalog-modal-pattern"
          tone="surface"
          className="p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--pbp-border)] pb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
                Detail modal pattern
              </p>
              <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
                상세 모달 내부 구성
              </h3>
            </div>
            <WaflButton variant="secondary" size="sm">
              닫기
            </WaflButton>
          </div>

          <div className="mt-3 grid gap-2">
            <WaflInfoRow component="catalog-modal-info-row-one">
              <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">
                파일명
              </span>
              <span className="text-xs font-bold text-[var(--pbp-text-primary)]">
                작업지시서_샘플.pdf
              </span>
            </WaflInfoRow>
            <WaflInfoRow component="catalog-modal-info-row-two" tone="muted">
              <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">
                상태
              </span>
              <AppBadge tone="success" size="xs">
                복원 가능
              </AppBadge>
            </WaflInfoRow>
            <WaflInfoBox tone="muted" component="catalog-modal-info-box">
              <p className="text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                모달 본문에서는 정보 row, 안내 box, footer button을 분리한다.
                카드 안 카드 depth를 과하게 만들지 않는다.
              </p>
            </WaflInfoBox>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <WaflButton variant="secondary" size="md">
              취소
            </WaflButton>
            <WaflButton variant="primary" size="md">
              복원
            </WaflButton>
          </div>
        </WaflSurface>
      </div>

      <RuleList title="실무 패턴 선택 규칙" rules={practiceRules} />
    </div>
  );
}

function UsageRulesSamples() {
  return (
    <div className="space-y-5">
      <WaflNoticeBox tone="warning">
        이 섹션은 새 화면을 만들 때 먼저 보는 기준이다. 시각 모양을 비슷하게
        맞추는 것이 아니라 WAFL 컴포넌트의 역할을 맞추는 것이 목표다.
      </WaflNoticeBox>

      <div className="grid gap-3 lg:grid-cols-3">
        {usageRuleCards.map((card) => (
          <WaflSurface
            key={card.title}
            component="catalog-usage-rule-card"
            tone="surface"
            className="p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
                {card.title}
              </p>
              <AppBadge tone={card.tone} size="xs">
                {card.badge}
              </AppBadge>
            </div>
            <ul className="mt-3 grid gap-2 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
              {card.body.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="text-[var(--pbp-brand-primary)]"
                  >
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </WaflSurface>
        ))}
      </div>

      <WaflSurface
        component="catalog-class-replacement-table"
        tone="surface"
        className="p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
              직접 className 사용 금지 기준
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
              layout 배치용 class는 허용하지만, WAFL 문법에 해당하는
              색/테두리/그림자/모서리는 컴포넌트 prop으로 대체한다.
            </p>
          </div>
          <AppBadge tone="danger" size="xs">
            no ad-hoc style
          </AppBadge>
        </div>
        <div className="mt-4 grid gap-2">
          {directClassReplacementRows.map((row) => (
            <WaflInfoRow
              key={row.direct}
              component="catalog-class-replacement-row"
              tone="muted"
              className="items-start"
            >
              <span className="min-w-0">
                <span className="block text-xs font-bold text-[var(--pbp-text-primary)]">
                  {row.direct}
                </span>
                <span className="mt-1 block text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                  대체: {row.replacement}
                </span>
              </span>
              <span className="max-w-[44%] text-right text-xs font-medium leading-5 text-[var(--pbp-text-subtle)]">
                {row.reason}
              </span>
            </WaflInfoRow>
          ))}
        </div>
      </WaflSurface>

      <WaflSurface
        component="catalog-direct-style-audit"
        tone="surface"
        className="p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
              Direct Style 잔여 점검판
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
              0.21.41 기준으로 Add/Empty/Upload dashed box, 모달 내부, 작업지시서 모바일/태블릿에 이어 멤버관리·저장소·설정 모달의 compact row와 preview density까지 control foundation 기준으로 묶었다. login, date picker, calendar range, progress bar처럼 의미가 있는 UI는 예외 후보로 유지한다.
            </p>
          </div>
          <AppBadge tone="brand" size="xs">
            0.21.41 device density
          </AppBadge>
        </div>
        <div className="mt-4 grid gap-2">
          {directStyleAuditRows.map((row) => (
            <WaflInfoRow
              key={row.area}
              component="catalog-direct-style-audit-row"
              tone="muted"
              className="items-start"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[var(--pbp-text-primary)]">
                    {row.area}
                  </span>
                  <AppBadge tone={row.tone} size="xs">
                    {row.status}
                  </AppBadge>
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-[var(--pbp-text-subtle)]">
                  {row.scope}
                </span>
                <span className="mt-1 block text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                  {row.decision}
                </span>
              </span>
              <span className="max-w-[34%] text-right text-[11px] font-bold leading-5 text-[var(--pbp-text-subtle)]">
                {row.remaining}
              </span>
            </WaflInfoRow>
          ))}
        </div>
      </WaflSurface>

      <WaflSurface
        component="catalog-direct-style-exceptions"
        tone="surface"
        className="p-4"
      >
        <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
          예외 판정 기준
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {directStyleExceptionRows.map((row) => (
            <WaflInfoBox
              key={row.label}
              shape="control"
              tone="muted"
              className="p-3"
            >
              <p className="text-xs font-bold text-[var(--pbp-text-primary)]">
                {row.label}
              </p>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                {row.examples}
              </p>
              <p className="mt-2 text-[11px] font-bold text-[var(--pbp-text-subtle)]">
                {row.decision}
              </p>
            </WaflInfoBox>
          ))}
        </div>
      </WaflSurface>

      <div className="grid gap-4 xl:grid-cols-2">
        <WaflSurface
          component="catalog-naming-rules"
          tone="surface"
          className="p-4"
        >
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
            data-wafl-component naming
          </p>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            debug outline을 다시 켰을 때 어떤 요소인지 바로 추적하기 위한 이름
            규칙이다.
          </p>
          <ul className="mt-3 grid gap-2 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            {waflNamingRules.map((rule) => (
              <li key={rule} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="text-[var(--pbp-brand-primary)]"
                >
                  •
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </WaflSurface>

        <WaflSurface
          component="catalog-new-screen-checklist"
          tone="surface"
          className="p-4"
        >
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
            새 화면 개발 체크리스트
          </p>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            신규 화면을 만들기 전후로 확인할 최소 기준이다.
          </p>
          <div className="mt-3 grid gap-2">
            {newScreenChecklist.map((item, index) => (
              <WaflInfoRow
                key={item}
                component="catalog-checklist-row"
                tone={index % 2 === 0 ? "muted" : "surface"}
              >
                <span className="text-xs font-bold text-[var(--pbp-brand-primary)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                  {item}
                </span>
              </WaflInfoRow>
            ))}
          </div>
        </WaflSurface>
      </div>

      <WaflInfoBox tone="selected" component="catalog-debug-outline-note">
        <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
          Debug outline
        </p>
        <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
          현재 분홍색 outline은 모바일 확인을 위해 꺼져 있다. 다시 확인할 때는
          app/layout.tsx 상단의 WAFL_COMPONENT_DEBUG_OUTLINE_ENABLED 값을 true로
          바꾼다.
        </p>
      </WaflInfoBox>
    </div>
  );
}

function ScreenChecklistSamples() {
  return (
    <div className="space-y-5">
      <WaflNoticeBox tone="info">
        화면별 체크리스트는 실제 화면을 바로 리팩토링하라는 뜻이 아니다. 먼저
        어떤 WAFL 컴포넌트를 써야 하는지 기준을 고정하고, 이후 잔여 요소만
        소규모로 보정한다.
      </WaflNoticeBox>

      <div className="grid gap-3 lg:grid-cols-2">
        {screenChecklists.map((screen) => (
          <WaflSurface
            key={screen.screen}
            component="catalog-screen-checklist-card"
            tone="surface"
            className="p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--pbp-text-subtle)]">
                  {screen.routeHint}
                </p>
                <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
                  {screen.screen}
                </h3>
                <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                  {screen.purpose}
                </p>
              </div>
              <AppBadge tone="brand" size="xs">
                check
              </AppBadge>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-[var(--pbp-text-primary)]">
                필수 WAFL 컴포넌트
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {screen.requiredComponents.map((component) => (
                  <AppBadge key={component} tone="neutral" size="xs">
                    {component}
                  </AppBadge>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {screen.checkItems.map((item, index) => (
                <WaflInfoRow
                  key={item}
                  component="catalog-screen-checklist-row"
                  tone={index % 2 === 0 ? "muted" : "surface"}
                  className="items-start"
                >
                  <span className="text-xs font-bold text-[var(--pbp-brand-primary)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                    {item}
                  </span>
                </WaflInfoRow>
              ))}
            </div>

            <WaflInfoBox
              tone="muted"
              component="catalog-screen-risk-note"
              className="mt-4"
            >
              <p className="text-xs font-bold text-[var(--pbp-text-primary)]">
                누락 시 위험
              </p>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
                {screen.missingRisk}
              </p>
            </WaflInfoBox>
          </WaflSurface>
        ))}
      </div>

      <RuleList title="화면별 점검 순서" rules={screenChecklistSummary} />
    </div>
  );
}

function ComponentInventorySamples() {
  const decisionTone = {
    유지: "success",
    "통합 후보": "warning",
    "폐기 후보": "danger",
    "전환 대상": "info",
  } as const;

  const priorityTone = {
    높음: "danger",
    중간: "warning",
    낮음: "neutral",
  } as const;

  return (
    <div className="space-y-5">
      <WaflNoticeBox tone="info">
        재고표는 바로 삭제 목록이 아니다. 먼저 Primitive / Pattern / Domain /
        Legacy로 분류하고, 같은 역할인데 모양만 다른 컴포넌트부터 합친다.
      </WaflNoticeBox>

      <div className="grid gap-3 lg:grid-cols-4">
        {componentGroupGuides.map((guide) => (
          <WaflSurface
            key={guide.group}
            component="catalog-inventory-group-card"
            tone="surface"
            className="p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
                  {guide.group}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--pbp-brand-primary)]">
                  {guide.meaning}
                </p>
              </div>
              <AppBadge tone="neutral" size="xs">
                group
              </AppBadge>
            </div>
            <p className="mt-3 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
              {guide.rule}
            </p>
            <p className="mt-3 text-[11px] font-semibold leading-5 text-[var(--pbp-text-subtle)]">
              {guide.examples}
            </p>
          </WaflSurface>
        ))}
      </div>

      <WaflDataTableShell>
        <WaflDataTableHeader gridTemplateColumns="0.9fr 0.7fr 1.2fr 0.8fr 1.1fr 0.6fr">
          <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>Component</div>
          <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>분류</div>
          <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>역할</div>
          <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>판정</div>
          <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>
            통합/전환 기준
          </div>
          <div className={WAFL_DATA_TABLE_HEADER_CELL_CLASS}>우선순위</div>
        </WaflDataTableHeader>
        <WaflDataTableBody>
          {componentInventoryItems.map((item) => (
            <WaflDataTableRow
              key={item.name}
              gridTemplateColumns="0.9fr 0.7fr 1.2fr 0.8fr 1.1fr 0.6fr"
            >
              <div className={WAFL_DATA_TABLE_CELL_CLASS}>
                <p className={WAFL_DATA_TABLE_PRIMARY_TEXT_CLASS}>
                  {item.name}
                </p>
                <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>
                  {item.note}
                </p>
              </div>
              <div className={WAFL_DATA_TABLE_CELL_CLASS}>
                <AppBadge
                  tone={
                    item.group === "Legacy"
                      ? "danger"
                      : item.group === "Domain"
                        ? "info"
                        : item.group === "Pattern"
                          ? "warning"
                          : "brand"
                  }
                  size="xs"
                >
                  {item.group}
                </AppBadge>
              </div>
              <p className="text-[12px] font-semibold leading-5 text-[var(--pbp-text-muted)]">
                {item.role}
              </p>
              <div className={WAFL_DATA_TABLE_CELL_CLASS}>
                <AppBadge tone={decisionTone[item.keepDecision]} size="xs">
                  {item.keepDecision}
                </AppBadge>
              </div>
              <p className="text-[11px] font-medium leading-5 text-[var(--pbp-text-subtle)]">
                {item.target}
              </p>
              <div className={WAFL_DATA_TABLE_CELL_CLASS}>
                <AppBadge tone={priorityTone[item.priority]} size="xs">
                  {item.priority}
                </AppBadge>
              </div>
            </WaflDataTableRow>
          ))}
        </WaflDataTableBody>
      </WaflDataTableShell>

      <RuleList title="재고표 기준 다음 정리 순서" rules={inventoryNextSteps} />
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
          <WaflDataTableRow
            key={spec.name}
            gridTemplateColumns="0.8fr 1.1fr 1.2fr 1fr 1fr"
          >
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <p className={WAFL_DATA_TABLE_PRIMARY_TEXT_CLASS}>{spec.name}</p>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>
                {spec.purpose}
              </p>
            </div>
            <p className="text-[12px] font-bold leading-5 text-[var(--pbp-text-primary)]">
              {spec.plainRule}
            </p>
            <div className={WAFL_DATA_TABLE_CELL_CLASS}>
              <code className="min-w-0 truncate wafl-shape-compact bg-[var(--pbp-surface-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--pbp-text-muted)]">
                {spec.path}
              </code>
              <p className={WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS}>
                {spec.props}
              </p>
            </div>
            <p className="text-[11px] font-medium leading-5 text-[var(--pbp-text-subtle)]">
              {spec.avoid}
            </p>
            <p className="text-[11px] font-semibold leading-5 text-[var(--pbp-text-muted)]">
              {spec.screens}
            </p>
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
                1. 상황별 판단 기준을 본다. 2. 누르는 것/담는 것/입력하는 것을
                비교한다. 3. 마지막에 개발자용 스펙 표를 확인한다.
              </p>
            </WaflInfoBox>
            <WaflInfoBox tone="muted">
              <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
                현재 접근 상태
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
                모바일 확인을 위해 /ui 접근 제한은 임시 해제 상태다. 원래 허용
                모드는 {allowedRuntimeModes.join(" / ")} 이다.
              </p>
            </WaflInfoBox>
          </div>
        </WaflPageHero>

        <WaflSectionPanel
          title="Catalog sections"
          description="모바일에서는 위에서 아래로 내려가며 상황별로 보면 된다."
          density="compact"
        >
          <SectionAnchorList />
        </WaflSectionPanel>

        <div id="start-here" className="scroll-mt-6">
          <WaflSectionPanel
            title="Start here"
            description="모양이 아니라 상황으로 컴포넌트를 고른다."
            density="compact"
          >
            <QuickDecisionGrid />
          </WaflSectionPanel>
        </div>

        <div id="foundation-primitive" className="scroll-mt-6">
          <WaflSectionPanel
            title="Foundation primitive · WAFL 슈퍼클래스 기준"
            description="모양을 화면별로 맞추지 않고 모든 공통 컴포넌트가 같은 foundation token을 통과하게 한다."
            density="compact"
          >
            <FoundationPrimitiveSamples />
          </WaflSectionPanel>
        </div>

        <div id="shape-grammar" className="scroll-mt-6">
          <WaflSectionPanel
            title="Shape grammar · 모양 통일 기준"
            description="버튼, 배지, 입력, 카드가 같은 둥근 네모 계열로 보이는지 확인한다."
            density="compact"
          >
            <ShapeGrammarSamples />
          </WaflSectionPanel>
        </div>

        <div id="visual-styling" className="scroll-mt-6">
          <WaflSectionPanel
            title="Visual styling · 꾸밈 기준"
            description="shape는 고정하고 tone, variant, selected/current/disabled/danger 상태만 공통 props로 조절한다."
            density="compact"
          >
            <VisualStylingSamples />
          </WaflSectionPanel>
        </div>

        <div id="touch-actions" className="scroll-mt-6">
          <WaflSectionPanel
            title="Touch actions · 누르는 것"
            description="실행 버튼, 이동 버튼, 카드형 버튼, 추가 카드 버튼을 분리한다."
            density="compact"
          >
            <TouchActionSamples />
          </WaflSectionPanel>
        </div>

        <div id="containers" className="scroll-mt-6">
          <WaflSectionPanel
            title="Containers · 담는 것"
            description="Surface, InfoBox, EmptyCard, SelectableCard는 모두 박스처럼 보이지만 역할이 다르다."
            density="compact"
          >
            <ContainerSamples />
          </WaflSectionPanel>
        </div>

        <div id="inputs" className="scroll-mt-6">
          <WaflSectionPanel
            title="Inputs · 입력하는 것"
            description="짧은 입력, 긴 입력, 선택 트리거, 선택 카드의 기본 문법."
            density="compact"
          >
            <InputSamples />
          </WaflSectionPanel>
        </div>

        <div id="status" className="scroll-mt-6">
          <WaflSectionPanel
            title="Status · 보여주는 것"
            description="상태 라벨, 안내 박스, 필터바, 데이터 표시 패턴."
            density="compact"
          >
            <StatusSamples />
          </WaflSectionPanel>
        </div>

        <div id="wrong-right" className="scroll-mt-6">
          <WaflSectionPanel
            title="Wrong / Right"
            description="같아 보이는 컴포넌트의 판단 기준을 비교한다."
            density="compact"
          >
            <WrongRightSamples />
          </WaflSectionPanel>
        </div>

        <div id="practice-patterns" className="scroll-mt-6">
          <WaflSectionPanel
            title="Practice patterns · 실무 패턴"
            description="작업지시서, 발주, 저장소에서 실제로 반복되는 UI 조합을 샘플로 확인한다."
            density="compact"
          >
            <PracticePatternSamples />
          </WaflSectionPanel>
        </div>

        <div id="usage-rules" className="scroll-mt-6">
          <WaflSectionPanel
            title="Usage rules · 사용 기준"
            description="언제 쓰는가/쓰지 않는가, 직접 className 금지 기준, naming, 새 화면 체크리스트를 확인한다."
            density="compact"
          >
            <UsageRulesSamples />
          </WaflSectionPanel>
        </div>

        <div id="screen-checklist" className="scroll-mt-6">
          <WaflSectionPanel
            title="Screen checklist · 기존 화면별 점검표"
            description="작업지시서, 발주, 운영 대시보드, 협력업체, 저장소, 통계, 멤버관리, 개인설정에서 써야 하는 WAFL 컴포넌트를 연결한다."
            density="compact"
          >
            <ScreenChecklistSamples />
          </WaflSectionPanel>
        </div>

        <div id="component-inventory" className="scroll-mt-6">
          <WaflSectionPanel
            title="Component inventory · 컴포넌트 재고표"
            description="현재 컴포넌트를 유지/통합/전환/폐기 후보로 분류하고 다음 리팩토링 순서를 정한다."
            density="compact"
          >
            <ComponentInventorySamples />
          </WaflSectionPanel>
        </div>

        <div id="spec-table" className="scroll-mt-6">
          <WaflSectionPanel
            title="Spec table"
            description="개발자가 import 경로와 props, 금지 기준을 확인하는 표다."
            density="compact"
          >
            <SpecTable />
          </WaflSectionPanel>
        </div>
      </div>
    </main>
  );
}
