"use client";

import { useState, type ReactNode } from "react";
import {
  Camera,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Crown,
  Download,
  Factory,
  FileText,
  GripVertical,
  ImagePlus,
  Layers3,
  ListChecks,
  Lock,
  Paperclip,
  Printer,
  Monitor,
  Palette,
  Plus,
  Send,
  Share2,
  Shirt,
  Scissors,
  Sparkles,
  Smartphone,
  Tablet,
  Trash2,
  Truck,
  Unlock,
  X,
} from "lucide-react";

import WaflBadge, { type WaflBadgeTone } from "@/components/common/ui/WaflBadge";
import { WaflButton } from "@/components/common/ui/WaflButton";
import WaflCard from "@/components/common/ui/WaflCard";
import {
  WaflInfoBox,
  WaflInput,
  WaflTextarea,
  type WaflInfoBoxTone,
} from "@/components/common/ui/WaflForm";
import {
  WaflAddCardButton,
  WaflSurface,
} from "@/components/common/ui/WaflSurface";

type StatusSample = {
  label: string;
  code: string;
  tone: WaflBadgeTone;
};

type SheetTab = "overview" | "images" | "sizeColor" | "fabric" | "accessory" | "process" | "pdf";
type DeviceMode = "desktop" | "tabletPortrait" | "tabletLandscape" | "mobile";
type DrawerKind = "fabric" | "accessory" | "process" | "pdf" | null;
type EditorKind = "fabric" | "accessory" | null;
type ConfirmActionKind = "delete" | "orderRequest" | "orderMissing" | "orderComplete";

type FabricItem = {
  name: string;
  supplier: string;
  color: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  status: StatusSample;
  issue?: string;
};

type AccessoryItem = {
  category: string;
  name: string;
  supplier: string;
  quantity: string;
  status: StatusSample;
  issue?: string;
};

type ProcessItem = {
  step: string;
  partner: string;
  quantity: string;
  due: string;
  status: StatusSample;
  issue?: string;
};

type HistoryItem = {
  time: string;
  text: string;
  code: string;
};

type ImageMock = {
  id: string;
  name: string;
  type: "image" | "camera" | "sketch" | "reference";
  label: string;
  tone: WaflBadgeTone;
  note: string;
};

type AttachmentMock = {
  id: string;
  name: string;
  type: string;
  detail: string;
  tone: WaflBadgeTone;
  included: boolean;
};

type ConfirmAction = {
  kind: ConfirmActionKind;
  itemTitle: string;
  supplier: string;
  quantity: ReturnType<typeof quantityFlow>;
  amount: string;
  missing?: string[];
} | null;

type ProductMock = {
  id: string;
  name: string;
  subtitle: string;
  quantity: string;
  due: string;
  status: StatusSample;
  pdfStatus: StatusSample;
  thumbnailTone: WaflBadgeTone;
  fabrics: FabricItem[];
  accessories: AccessoryItem[];
  processes: ProcessItem[];
  history: HistoryItem[];
  assistant: Partial<Record<SheetTab, { title: string; detail: string; tone: WaflBadgeTone }>>;
};

const sheetStatuses: StatusSample[] = [
  { label: "초안", code: "draft", tone: "neutral" },
  { label: "준비됨", code: "ready", tone: "success" },
  { label: "발주됨", code: "ordered", tone: "info" },
  { label: "제작중", code: "making", tone: "brand" },
  { label: "검수중", code: "inspection", tone: "warning" },
  { label: "완료", code: "completed", tone: "success" },
  { label: "보류", code: "hold", tone: "warning" },
  { label: "취소", code: "cancelled", tone: "danger" },
];

const cardStatuses: StatusSample[] = [
  { label: "입력중", code: "draft", tone: "neutral" },
  { label: "발주 가능", code: "ready", tone: "brand" },
  { label: "발주 요청", code: "requested", tone: "info" },
  { label: "발주 완료", code: "ordered", tone: "success" },
];

const ready = { label: "준비됨", code: "ready", tone: "success" } as const;
const draft = { label: "작성중", code: "draft", tone: "neutral" } as const;
const requested = { label: "요청됨", code: "requested", tone: "info" } as const;
const ordered = { label: "발주됨", code: "ordered", tone: "brand" } as const;
const received = { label: "입고됨", code: "received", tone: "success" } as const;
const issue = { label: "이슈", code: "issue", tone: "danger" } as const;
const done = { label: "완료", code: "done", tone: "success" } as const;
const empty = { label: "비어있음", code: "empty", tone: "neutral" } as const;

const sheetTabs: Array<{ id: SheetTab; label: string; icon: typeof ClipboardList }> = [
  { id: "overview", label: "개요", icon: ClipboardList },
  { id: "images", label: "이미지·첨부", icon: ImagePlus },
  { id: "sizeColor", label: "사이즈·색상", icon: Layers3 },
  { id: "fabric", label: "원단", icon: Scissors },
  { id: "accessory", label: "부자재", icon: CircleDot },
  { id: "process", label: "제작 플로우", icon: Factory },
  { id: "pdf", label: "출력·공유", icon: FileText },
];

const deviceModes: Array<{ id: DeviceMode; label: string; description: string; icon: typeof Monitor }> = [
  {
    id: "desktop",
    label: "Desktop",
    description: "3영역 작업 허브",
    icon: Monitor,
  },
  {
    id: "tabletPortrait",
    label: "Tablet 세로",
    description: "768px 제작 카드 중심",
    icon: Tablet,
  },
  {
    id: "tabletLandscape",
    label: "Tablet 가로",
    description: "1024px 2영역 작업",
    icon: Tablet,
  },
  {
    id: "mobile",
    label: "Mobile",
    description: "390px phone frame",
    icon: Smartphone,
  },
];

const products: ProductMock[] = [
  {
    id: "shirring-onepiece",
    name: "셔링 원피스",
    subtitle: "SS sample / 여성복",
    quantity: "240개",
    due: "24/07/24",
    status: { label: "준비됨", code: "ready", tone: "success" },
    pdfStatus: { label: "검토 가능", code: "review_ready", tone: "info" },
    thumbnailTone: "brand",
    fabrics: [
      { name: "코튼 30수", supplier: "동대문 원단 A", color: "아이보리", quantity: "180 yd", unitPrice: "3,800", amount: "684,000", status: ordered },
      { name: "코튼 30수", supplier: "동대문 원단 A", color: "블랙", quantity: "120 yd", unitPrice: "3,800", amount: "456,000", status: ordered },
      { name: "안감 폴리", supplier: "성수 부자재몰", color: "크림", quantity: "90 yd", unitPrice: "2,200", amount: "198,000", status: requested },
      { name: "배색 립", supplier: "미정", color: "차콜", quantity: "36 yd", unitPrice: "미입력", amount: "-", status: draft, issue: "거래처/단가 확인" },
      { name: "허리 심지", supplier: "을지로 심지상사", color: "화이트", quantity: "42 yd", unitPrice: "1,100", amount: "46,200", status: ready },
      { name: "테이프 원단", supplier: "청계 테이프", color: "아이보리", quantity: "200 m", unitPrice: "450", amount: "90,000", status: issue, issue: "수량 재확인" },
    ],
    accessories: [
      { category: "단추", name: "18mm 소뿔 단추", supplier: "동대문 단추집", quantity: "520개", status: ready },
      { category: "단추", name: "예비 단추", supplier: "동대문 단추집", quantity: "80개", status: draft },
      { category: "지퍼", name: "콘솔 지퍼 52cm", supplier: "을지로 지퍼", quantity: "240개", status: ordered },
      { category: "라벨", name: "메인 라벨", supplier: "라벨 스튜디오", quantity: "260개", status: requested },
      { category: "라벨", name: "케어 라벨", supplier: "라벨 스튜디오", quantity: "260개", status: requested },
      { category: "끈", name: "허리 스트링", supplier: "청계 테이프", quantity: "300 m", status: issue, issue: "컬러 확정 필요" },
      { category: "끈", name: "행택 끈", supplier: "포장나라", quantity: "260개", status: ready },
      { category: "포장", name: "폴리백", supplier: "포장나라", quantity: "260개", status: ready },
      { category: "포장", name: "행택", supplier: "인쇄소 B", quantity: "260개", status: draft },
      { category: "봉제부속", name: "어깨 테이프", supplier: "성수 부자재몰", quantity: "80 m", status: received },
      { category: "봉제부속", name: "심지 테이프", supplier: "을지로 심지상사", quantity: "60 m", status: ready },
      { category: "기타", name: "검품 스티커", supplier: "포장나라", quantity: "300개", status: done },
    ],
    processes: [
      { step: "봉제", partner: "성수 샘플실 B", quantity: "240개", due: "24/07/24", status: ordered },
      { step: "나염", partner: "충무로 프린트", quantity: "120개", due: "24/07/18", status: requested, issue: "공장 전달 메모 필요" },
      { step: "자수", partner: "동대문 자수실", quantity: "60개", due: "24/07/19", status: draft },
      { step: "마감", partner: "성수 샘플실 B", quantity: "240개", due: "24/07/26", status: ready },
      { step: "검수", partner: "내부 검수", quantity: "240개", due: "24/07/27", status: empty },
    ],
    history: [
      { time: "오늘 14:20", text: "배색 립 단가 확인 요청", code: "fabric.update" },
      { time: "오늘 13:10", text: "메인 라벨 공급처 요청됨", code: "accessory.update" },
      { time: "어제 18:40", text: "출력 문서 상태 갱신", code: "pdf.generate" },
      { time: "어제 16:00", text: "대표 이미지가 교체됨", code: "file.set_primary_image" },
    ],
    assistant: {
      overview: { title: "발주 전 남은 정보 확인", detail: "대표 이미지와 기본정보는 완료됐고, 원단 단가와 부자재 거래처 확인이 남아 있습니다.", tone: "warning" },
      fabric: { title: "미발주 원단 2개", detail: "배색 립 거래처와 테이프 원단 수량을 확인하면 발주 요청이 가능합니다.", tone: "danger" },
      accessory: { title: "라벨 공급처 미확정", detail: "메인 라벨과 케어 라벨은 발주 요청 상태이고 행택은 거래처 확인이 필요합니다.", tone: "warning" },
      process: { title: "나염 공정 메모 필요", detail: "공장 전달 전에 나염 위치와 작업 메모를 정리합니다.", tone: "info" },
      pdf: { title: "작업지시서 출력 전 원단 수량 확인", detail: "공유나 인쇄 전에 원단 수량과 부자재 거래처를 확인합니다.", tone: "success" },
    },
  },
  {
    id: "fleece-skirt",
    name: "플리스 스커트",
    subtitle: "FW draft / 하의",
    quantity: "180개",
    due: "미정",
    status: { label: "초안", code: "draft", tone: "neutral" },
    pdfStatus: { label: "없음", code: "empty", tone: "neutral" },
    thumbnailTone: "warning",
    fabrics: [
      { name: "플리스 본딩", supplier: "성북 니트", color: "오트밀", quantity: "150 yd", unitPrice: "4,600", amount: "690,000", status: ready },
      { name: "플리스 본딩", supplier: "성북 니트", color: "네이비", quantity: "110 yd", unitPrice: "4,600", amount: "506,000", status: draft },
      { name: "허리 밴드 원단", supplier: "미정", color: "블랙", quantity: "60 yd", unitPrice: "미입력", amount: "-", status: draft, issue: "거래처 미정" },
      { name: "안감 트리코트", supplier: "청계 안감", color: "그레이", quantity: "120 yd", unitPrice: "1,900", amount: "228,000", status: requested },
      { name: "포켓감", supplier: "동대문 원단 B", color: "블랙", quantity: "40 yd", unitPrice: "2,300", amount: "92,000", status: ready },
      { name: "테스트 원단", supplier: "샘플실 보관", color: "아이보리", quantity: "12 yd", unitPrice: "0", amount: "0", status: done },
    ],
    accessories: [
      { category: "지퍼", name: "숨은 지퍼 18cm", supplier: "을지로 지퍼", quantity: "190개", status: requested },
      { category: "단추", name: "허리 안단 단추", supplier: "동대문 단추집", quantity: "200개", status: draft },
      { category: "라벨", name: "메인 라벨", supplier: "라벨 스튜디오", quantity: "190개", status: draft },
      { category: "라벨", name: "케어 라벨", supplier: "라벨 스튜디오", quantity: "190개", status: draft },
      { category: "포장", name: "폴리백", supplier: "포장나라", quantity: "190개", status: ready },
      { category: "포장", name: "행택", supplier: "미정", quantity: "190개", status: draft, issue: "디자인 미확정" },
      { category: "끈", name: "허리 스트링", supplier: "청계 테이프", quantity: "220 m", status: ready },
      { category: "봉제부속", name: "심지 테이프", supplier: "을지로 심지상사", quantity: "50 m", status: ready },
      { category: "봉제부속", name: "고무밴드", supplier: "성수 부자재몰", quantity: "210 m", status: requested },
      { category: "기타", name: "검품 스티커", supplier: "포장나라", quantity: "200개", status: ready },
      { category: "기타", name: "사이즈 스티커", supplier: "포장나라", quantity: "200개", status: ready },
      { category: "기타", name: "샘플 택", supplier: "내부", quantity: "10개", status: done },
    ],
    processes: [
      { step: "패턴 수정", partner: "내부", quantity: "1세트", due: "24/07/10", status: requested },
      { step: "봉제", partner: "미정", quantity: "180개", due: "미정", status: draft, issue: "공장 미정" },
      { step: "워싱", partner: "중랑 워싱", quantity: "180개", due: "미정", status: empty },
      { step: "마감", partner: "미정", quantity: "180개", due: "미정", status: empty },
      { step: "검수", partner: "내부 검수", quantity: "180개", due: "미정", status: empty },
    ],
    history: [
      { time: "오늘 10:12", text: "최소 생성 정보로 제작 카드 생성", code: "sheet.create" },
      { time: "오늘 10:20", text: "플리스 본딩 원단 추가", code: "fabric.update" },
      { time: "오늘 10:34", text: "행택 디자인 미확정 표시", code: "accessory.issue.report" },
    ],
    assistant: {
      overview: { title: "초안 제작 카드의 필수 정보를 더 채우세요", detail: "납기, 공장, 라벨 공급처가 아직 정해지지 않았습니다.", tone: "warning" },
      fabric: { title: "허리 밴드 원단 거래처 미정", detail: "저장 가능하지만 외부 발주 전에는 거래처가 필요합니다.", tone: "warning" },
      accessory: { title: "행택 디자인 미확정", detail: "부자재는 저장할 수 있으나 발주 요청 전 디자인 확인이 필요합니다.", tone: "danger" },
      process: { title: "봉제 공장 지정 필요", detail: "공장/공정 탭에서 후보 공장을 먼저 정해야 합니다.", tone: "warning" },
      pdf: { title: "출력 문서는 미완성 상태", detail: "공장과 납기가 없어 외부 전달 전 기본 정보를 더 채워야 합니다.", tone: "neutral" },
    },
  },
  {
    id: "stripe-shirt",
    name: "스트라이프 셔츠",
    subtitle: "23차 생산 / 상의",
    quantity: "360개",
    due: "24/07/30",
    status: { label: "제작중", code: "making", tone: "brand" },
    pdfStatus: { label: "공유됨", code: "shared_snapshot", tone: "brand" },
    thumbnailTone: "info",
    fabrics: [
      { name: "스트라이프 선염", supplier: "남대문 선염", color: "블루", quantity: "260 yd", unitPrice: "5,100", amount: "1,326,000", status: received },
      { name: "스트라이프 선염", supplier: "남대문 선염", color: "그린", quantity: "180 yd", unitPrice: "5,100", amount: "918,000", status: ordered },
      { name: "카라 심지", supplier: "을지로 심지상사", color: "화이트", quantity: "90 yd", unitPrice: "1,200", amount: "108,000", status: received },
      { name: "소매 배색", supplier: "동대문 원단 C", color: "화이트", quantity: "75 yd", unitPrice: "2,700", amount: "202,500", status: ready },
      { name: "요크 안감", supplier: "청계 안감", color: "화이트", quantity: "60 yd", unitPrice: "1,600", amount: "96,000", status: ordered },
      { name: "테스트 원단", supplier: "샘플실", color: "블루", quantity: "15 yd", unitPrice: "0", amount: "0", status: done },
      { name: "예비 원단", supplier: "남대문 선염", color: "블루", quantity: "30 yd", unitPrice: "5,100", amount: "153,000", status: ready },
    ],
    accessories: [
      { category: "단추", name: "셔츠 단추 11mm", supplier: "동대문 단추집", quantity: "2,900개", status: received },
      { category: "단추", name: "예비 단추", supplier: "동대문 단추집", quantity: "400개", status: ready },
      { category: "라벨", name: "메인 라벨", supplier: "라벨 스튜디오", quantity: "380개", status: received },
      { category: "라벨", name: "케어 라벨", supplier: "라벨 스튜디오", quantity: "380개", status: received },
      { category: "라벨", name: "사이즈 라벨", supplier: "라벨 스튜디오", quantity: "380개", status: ready },
      { category: "포장", name: "폴리백", supplier: "포장나라", quantity: "380개", status: ready },
      { category: "포장", name: "행택", supplier: "인쇄소 B", quantity: "380개", status: ordered },
      { category: "포장", name: "카라 키퍼", supplier: "포장나라", quantity: "720개", status: requested },
      { category: "봉제부속", name: "어깨 테이프", supplier: "성수 부자재몰", quantity: "180 m", status: received },
      { category: "봉제부속", name: "심지 테이프", supplier: "을지로 심지상사", quantity: "140 m", status: received },
      { category: "봉제부속", name: "소매 심지", supplier: "을지로 심지상사", quantity: "100 m", status: ready },
      { category: "기타", name: "검품 스티커", supplier: "포장나라", quantity: "400개", status: ready },
      { category: "기타", name: "박스 라벨", supplier: "포장나라", quantity: "20개", status: draft },
    ],
    processes: [
      { step: "봉제", partner: "마포 셔츠공장", quantity: "360개", due: "24/07/25", status: ordered },
      { step: "자수", partner: "동대문 자수실", quantity: "360개", due: "24/07/21", status: received },
      { step: "프레스", partner: "마포 셔츠공장", quantity: "360개", due: "24/07/28", status: requested },
      { step: "검침", partner: "내부 검수", quantity: "360개", due: "24/07/29", status: empty },
      { step: "포장", partner: "포장나라", quantity: "360개", due: "24/07/30", status: draft },
      { step: "출고 대기", partner: "내부", quantity: "360개", due: "24/07/31", status: empty },
    ],
    history: [
      { time: "오늘 15:01", text: "공유 문서 링크 열람됨", code: "pdf.share.view_log" },
      { time: "오늘 11:20", text: "셔츠 단추 입고 처리", code: "accessory.receive" },
      { time: "어제 17:45", text: "자수 공정 완료 보고", code: "process.complete" },
      { time: "어제 09:30", text: "공장 전달 작업지시서 공유", code: "factory.instruction.share" },
    ],
    assistant: {
      overview: { title: "제작중 카드의 진행 리스크를 확인하세요", detail: "공유 문서는 살아 있고, 포장/검침 일정이 다음 확인 대상입니다.", tone: "info" },
      fabric: { title: "선염 그린 원단 입고 대기", detail: "주요 원단은 대부분 확보됐고 예비 원단만 추가 확인하면 됩니다.", tone: "success" },
      accessory: { title: "카라 키퍼 요청 상태", detail: "부자재 대부분은 입고/준비 상태이며 카라 키퍼와 박스 라벨만 남았습니다.", tone: "warning" },
      process: { title: "프레스 공정 메모 필요", detail: "프레스 이후 검침/포장 전달 메모를 정리합니다.", tone: "info" },
      pdf: { title: "제작중 문서 공유 상태 확인", detail: "제작 카드 변경 후 새 문서로 다시 공유할지 기존 공유를 유지할지 확인하세요.", tone: "brand" },
    },
  },
  {
    id: "reorder-sample",
    name: "리오더 샘플",
    subtitle: "완료 제작 카드 기반 재생산",
    quantity: "120개",
    due: "24/08/05",
    status: { label: "완료", code: "completed", tone: "success" },
    pdfStatus: { label: "최종보관", code: "final_snapshot", tone: "success" },
    thumbnailTone: "success",
    fabrics: [
      { name: "린넨 혼방", supplier: "광장 린넨", color: "내추럴", quantity: "90 yd", unitPrice: "6,200", amount: "558,000", status: received },
      { name: "린넨 혼방", supplier: "광장 린넨", color: "카키", quantity: "70 yd", unitPrice: "6,200", amount: "434,000", status: received },
      { name: "포켓감", supplier: "동대문 원단 B", color: "베이지", quantity: "35 yd", unitPrice: "2,100", amount: "73,500", status: done },
      { name: "심지", supplier: "을지로 심지상사", color: "화이트", quantity: "30 yd", unitPrice: "1,000", amount: "30,000", status: done },
      { name: "예비 원단", supplier: "광장 린넨", color: "내추럴", quantity: "15 yd", unitPrice: "6,200", amount: "93,000", status: ready },
      { name: "샘플 보관분", supplier: "내부", color: "카키", quantity: "6 yd", unitPrice: "0", amount: "0", status: done },
    ],
    accessories: [
      { category: "단추", name: "우드 단추", supplier: "동대문 단추집", quantity: "380개", status: received },
      { category: "지퍼", name: "콘솔 지퍼 45cm", supplier: "을지로 지퍼", quantity: "130개", status: received },
      { category: "라벨", name: "메인 라벨", supplier: "라벨 스튜디오", quantity: "130개", status: received },
      { category: "라벨", name: "케어 라벨", supplier: "라벨 스튜디오", quantity: "130개", status: received },
      { category: "포장", name: "폴리백", supplier: "포장나라", quantity: "130개", status: done },
      { category: "포장", name: "행택", supplier: "인쇄소 B", quantity: "130개", status: done },
      { category: "끈", name: "행택 끈", supplier: "포장나라", quantity: "130개", status: done },
      { category: "봉제부속", name: "어깨 테이프", supplier: "성수 부자재몰", quantity: "40 m", status: done },
      { category: "봉제부속", name: "심지 테이프", supplier: "을지로 심지상사", quantity: "40 m", status: done },
      { category: "기타", name: "검품 스티커", supplier: "포장나라", quantity: "150개", status: done },
      { category: "기타", name: "박스 라벨", supplier: "포장나라", quantity: "12개", status: done },
      { category: "기타", name: "리오더 메모 택", supplier: "내부", quantity: "1개", status: ready },
    ],
    processes: [
      { step: "봉제", partner: "성수 샘플실 B", quantity: "120개", due: "24/08/01", status: done },
      { step: "워싱", partner: "중랑 워싱", quantity: "120개", due: "24/08/02", status: done },
      { step: "마감", partner: "성수 샘플실 B", quantity: "120개", due: "24/08/03", status: done },
      { step: "검수", partner: "내부 검수", quantity: "120개", due: "24/08/04", status: done },
      { step: "출고", partner: "내부", quantity: "120개", due: "24/08/05", status: done },
    ],
    history: [
      { time: "오늘 09:00", text: "완료 제작 카드에서 리오더 후보 생성", code: "product.reorder" },
      { time: "지난주", text: "완성 문서 보관", code: "pdf.snapshot.view" },
      { time: "지난주", text: "검수 완료 처리", code: "inspection.complete" },
      { time: "지난주", text: "봉제 공정 완료", code: "factory.complete" },
    ],
    assistant: {
      overview: { title: "리오더 복사 전 변경점만 확인하세요", detail: "완료 제작 카드의 원단/부자재를 대부분 재사용할 수 있습니다.", tone: "success" },
      fabric: { title: "예비 원단 수량만 재확인", detail: "리오더 시 내추럴 예비 원단이 충분한지 확인하면 됩니다.", tone: "info" },
      accessory: { title: "부자재는 재사용 가능", detail: "주요 부자재는 완료 상태이며 리오더 수량에 맞춰 복사할 수 있습니다.", tone: "success" },
      process: { title: "기존 공정 흐름을 복사할 수 있습니다", detail: "봉제/워싱/마감/검수 순서를 새 제작 카드에 가져오는 예시입니다.", tone: "success" },
      pdf: { title: "완성 문서를 기준으로 리오더 확인", detail: "새 리오더 제작 카드는 기존 문서를 참고하되 변경 수량을 다시 확인해야 합니다.", tone: "info" },
    },
  },
];

function imageMocks(product: ProductMock): ImageMock[] {
  return [
    {
      id: `${product.id}-front`,
      name: "shirring-front.webp",
      type: "camera",
      label: "사진",
      tone: product.thumbnailTone,
      note: `${product.name} 앞 실루엣`,
    },
    {
      id: `${product.id}-sketch-neckline`,
      name: "sketch-neckline.webp",
      type: "sketch",
      label: "스케치",
      tone: "info",
      note: "네크라인 디자인 스케치",
    },
    {
      id: `${product.id}-detail-01`,
      name: "shirring-detail-01.webp",
      type: "image",
      label: "이미지",
      tone: "warning",
      note: "카라, 단추, 봉제선 참고",
    },
    {
      id: `${product.id}-fabric-texture`,
      name: "fabric-texture-ref.webp",
      type: "reference",
      label: "참고",
      tone: "success",
      note: "조직감과 비침 정도 참고",
    },
  ];
}

function attachmentMocks(product: ProductMock): AttachmentMock[] {
  return [
    { id: `${product.id}-sample-pdf`, name: `${product.name} 샘플 참고.pdf`, type: "PDF", detail: "내부 검토용", tone: "info", included: true },
    { id: `${product.id}-button-png`, name: "단추 이미지.png", type: "PNG", detail: "부자재 참고", tone: "neutral", included: false },
    { id: `${product.id}-quote-xlsx`, name: "거래처 견적.xlsx", type: "XLSX", detail: "단가 확인용", tone: "warning", included: false },
  ];
}

const sizeSystems = ["여성복 상의", "여성복 하의", "남성복 상의", "남성복 하의", "자유 사이즈"];
const sizeOptions = ["XS", "S", "M", "L", "55", "66", "77", "95", "100"];
const measurementRows = [
  ["총장", "52", "54", "56"],
  ["어깨", "36", "38", "40"],
  ["가슴", "44", "46", "48"],
  ["허리", "34", "36", "38"],
  ["소매", "58", "59", "60"],
  ["밑단", "49", "51", "53"],
];
const colorQuantities = [
  ["아이보리", "120개"],
  ["블랙", "80개"],
  ["네이비", "40개"],
];

function defaultImageId(product: ProductMock) {
  return imageMocks(product)[0]?.id ?? null;
}

function getSelectedImage(images: ImageMock[], selectedImageId: string | null | undefined) {
  if (!selectedImageId) {
    return null;
  }

  return images.find((image) => image.id === selectedImageId) ?? null;
}

function StatusBadge({ status }: { status: StatusSample }) {
  return (
    <WaflBadge tone={status.tone} size="sm" className="max-w-full truncate">
      {status.label}
    </WaflBadge>
  );
}

function ShowroomSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-6">
      <div className="mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--pbp-brand-soft)]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--pbp-text-primary)] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--pbp-text-muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function ProductThumbnail({
  product,
  image,
  size = "md",
}: {
  product: ProductMock;
  image?: ImageMock | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-44 w-44" : size === "sm" ? "h-12 w-12" : "h-24 w-24";
  const iconSize = size === "lg" ? 72 : size === "sm" ? 24 : 42;
  const currentImage = image ?? null;
  const icon = !currentImage ? (
    <Shirt size={iconSize} strokeWidth={1.4} aria-hidden="true" />
  ) : currentImage.type === "sketch" ? (
    <Palette size={iconSize} strokeWidth={1.4} aria-hidden="true" />
  ) : currentImage.type === "camera" ? (
    <Camera size={iconSize} strokeWidth={1.4} aria-hidden="true" />
  ) : currentImage.type === "reference" ? (
    <ImagePlus size={iconSize} strokeWidth={1.4} aria-hidden="true" />
  ) : (
    <Shirt size={iconSize} strokeWidth={1.4} aria-hidden="true" />
  );

  return (
    <div
      aria-label={`${product.name} 대표 이미지: ${currentImage ? currentImage.name : "없음"}`}
      title={`대표 이미지: ${currentImage ? currentImage.name : "없음"}`}
      className={`${sizeClass} relative flex shrink-0 items-center justify-center overflow-hidden wafl-shape-surface border border-[var(--pbp-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--pbp-brand-primary)_16%,white),var(--pbp-surface)_54%,color-mix(in_srgb,var(--pbp-status-success-bg)_42%,white))] text-[var(--pbp-brand-primary)]`}
    >
      {icon}
      {currentImage && size !== "sm" ? (
        <WaflBadge tone={currentImage.tone} size="xs" className="absolute bottom-2 right-2 max-w-[80%] truncate">
          {currentImage.label}
        </WaflBadge>
      ) : null}
      {size === "lg" ? (
        <span className="absolute inset-x-3 bottom-9 truncate text-center text-xs font-bold text-[var(--pbp-text-primary)]">
          {currentImage ? currentImage.name : "대표 이미지 없음"}
        </span>
      ) : null}
    </div>
  );
}

function toInfoBoxTone(tone: WaflBadgeTone): WaflInfoBoxTone {
  if (tone === "warning" || tone === "danger" || tone === "info" || tone === "neutral") {
    return tone;
  }
  if (tone === "success" || tone === "brand") {
    return "selected";
  }
  return "muted";
}

const inputSources = ["새로 입력", "거래처에서 불러오기", "재고에서 가져오기", "이전 기록 복사"];
const baseUnits = ["yd", "m", "개", "롤", "장", "벌", "세트"];
const companyUnits = ["샘플분", "박스", "묶음"];
const baseProcesses = ["재단", "봉제", "나염", "자수", "마감", "검수", "포장"];
const companyProcesses = ["워싱", "프레스", "핸드메이드 마감", "라벨 부착", "샘플 수정"];

function parseAmount(value: string) {
  const parsed = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function parseQuantity(value: string) {
  const match = value.match(/^([\d,]+)\s*(.*)$/);
  const amount = match ? Number(match[1].replace(/,/g, "")) : 0;
  const unit = match?.[2]?.trim() || "개";
  return { amount: Number.isFinite(amount) ? amount : 0, unit };
}

function formatQuantity(value: number, unit: string) {
  return `${Math.max(value, 0).toLocaleString("ko-KR")}${unit}`;
}

function quantityFlow(quantity: string, index: number) {
  const { amount, unit } = parseQuantity(quantity);
  const stockRatio = [0.22, 0, 0.12, 0.28, 0, 0.18][index % 6];
  const stock = Math.floor(amount * stockRatio);
  const allowanceRatio = [0.12, 0.08, 0.1, 0.14, 0.06, 0.18][index % 6];
  const allowance = Math.max(Math.ceil(amount * allowanceRatio), unit === "개" ? 5 : 1);
  const totalRequired = amount + allowance;
  const rawOrder = Math.max(totalRequired - stock, 0);
  const overOrder = index % 4 === 1 ? Math.max(Math.ceil(amount * 0.04), unit === "개" ? 5 : 1) : 0;
  const order = rawOrder + overOrder;
  const leftover = Math.max(order + stock - totalRequired, 0);
  const handlingOptions = ["공장 여유분", "로스 포함", "남은 수량 재고 전환", "이번 제작에 모두 사용"];
  const handling = leftover > 0 ? handlingOptions[index % handlingOptions.length] : "남는 수량 없음";
  return {
    required: formatQuantity(amount, unit),
    allowance: formatQuantity(allowance, unit),
    totalRequired: formatQuantity(totalRequired, unit),
    stock: formatQuantity(stock, unit),
    order: formatQuantity(order, unit),
    leftover: formatQuantity(leftover, unit),
    handling,
    unit,
  };
}

function accessoryUnitPrice(item: AccessoryItem, index: number) {
  if (item.status.code === "draft" || item.supplier === "미정") {
    return 0;
  }
  const baseByCategory: Record<string, number> = {
    단추: 120,
    지퍼: 680,
    라벨: 210,
    끈: 95,
    포장: 160,
    봉제부속: 140,
    기타: 90,
  };
  return (baseByCategory[item.category] ?? 150) + (index % 3) * 20;
}

function accessoryOption(item: AccessoryItem, index: number) {
  const optionByCategory: Record<string, string[]> = {
    단추: ["아이보리", "블랙", "우드"],
    지퍼: ["52cm", "18cm", "45cm"],
    라벨: ["메인", "케어", "사이즈"],
    끈: ["아이보리", "블랙", "내추럴"],
    포장: ["투명", "무광", "화이트"],
    봉제부속: ["화이트", "블랙", "베이지"],
    기타: ["공용", "소형", "대형"],
  };
  const options = optionByCategory[item.category] ?? ["기본"];
  return options[index % options.length];
}

function materialDisplayState({
  status,
  supplier,
  unitPrice,
  amount,
  colorOrOption,
}: {
  status: StatusSample;
  supplier: string;
  unitPrice: string;
  amount: string;
  colorOrOption: string;
}) {
  if (!colorOrOption || colorOrOption === "미정") {
    return { label: "색상 없음", tone: "warning" as WaflBadgeTone };
  }
  if (!supplier || supplier === "미정") {
    return { label: "거래처 없음", tone: "warning" as WaflBadgeTone };
  }
  if (unitPrice === "미입력" || amount === "-" || amount === "계산 전") {
    return { label: "단가 없음", tone: "warning" as WaflBadgeTone };
  }
  if (status.code === "requested") {
    return { label: "발주 요청", tone: "info" as WaflBadgeTone, action: "발주 완료 처리" };
  }
  if (["ordered", "received", "done"].includes(status.code)) {
    return { label: "발주 완료", tone: "success" as WaflBadgeTone };
  }
  if (status.code === "issue") {
    return { label: "수량 확인", tone: "warning" as WaflBadgeTone };
  }
  if (status.code === "ready") {
    return { label: "발주 가능", tone: "brand" as WaflBadgeTone, action: "발주 요청" };
  }
  return { label: "입력중", tone: "neutral" as WaflBadgeTone };
}

function sheetPurposeLabel(status: StatusSample) {
  if (status.code === "ready") return { label: "발주 준비", tone: "brand" as WaflBadgeTone };
  if (status.code === "draft") return { label: "입력중", tone: "neutral" as WaflBadgeTone };
  if (status.code === "making") return { label: "공장 전달 가능", tone: "brand" as WaflBadgeTone };
  if (status.code === "completed") return { label: "완료", tone: "success" as WaflBadgeTone };
  return { label: status.label, tone: status.tone };
}

function currentPdfLabel(product: ProductMock) {
  if (product.status.code === "draft") return { label: "미완성 문서", tone: "neutral" as WaflBadgeTone };
  if (product.status.code === "ready") return { label: "제작 문서", tone: "info" as WaflBadgeTone };
  if (product.status.code === "making" || product.status.code === "ordered" || product.status.code === "inspection") {
    return { label: "제작중 문서", tone: "brand" as WaflBadgeTone };
  }
  if (product.status.code === "completed") return { label: "완성 문서", tone: "success" as WaflBadgeTone };
  return { label: "출력 문서", tone: product.pdfStatus.tone };
}

function summaryStats(product: ProductMock) {
  const fabricAmount = product.fabrics.reduce((total, item) => total + parseAmount(item.amount), 0);
  const accessoryAmount = product.accessories.reduce((total, item, index) => {
    const qty = parseQuantity(item.quantity).amount;
    return total + qty * accessoryUnitPrice(item, index);
  }, 0);
  const processAmount = product.processes.reduce((total, _item, index) => total + 48000 + index * 9000, 0);
  const totalAmount = fabricAmount + accessoryAmount + processAmount;
  const quantity = Math.max(parseQuantity(product.quantity).amount, 1);
  const missingPriceCount =
    product.fabrics.filter((item) => item.unitPrice === "미입력" || item.amount === "-").length +
    product.accessories.filter((item, index) => accessoryUnitPrice(item, index) === 0).length;
  const unorderedCount =
    product.fabrics.filter((item) => ["draft", "ready", "requested", "issue"].includes(item.status.code)).length +
    product.accessories.filter((item) => ["draft", "ready", "requested", "issue"].includes(item.status.code)).length;
  const factoryReady = product.processes.some((item) => item.status.code === "ordered" || item.status.code === "done");
  return {
    fabricAmount,
    accessoryAmount,
    processAmount,
    totalAmount,
    unitCost: totalAmount / quantity,
    missingPriceCount,
    unorderedCount,
    factoryReady,
    currentPdf: currentPdfLabel(product),
  };
}

function materialNeedsWork(status: StatusSample, unitPrice: string, amount: string) {
  return unitPrice === "미입력" || amount === "-" || amount === "계산 전" || ["draft", "ready", "requested", "issue"].includes(status.code);
}

function tabAlertCounts(product: ProductMock) {
  const fabric = product.fabrics.filter((item) => materialNeedsWork(item.status, item.unitPrice, item.amount)).length;
  const accessory = product.accessories.filter((item, index) => {
    const unitPrice = accessoryUnitPrice(item, index);
    return materialNeedsWork(item.status, unitPrice === 0 ? "미입력" : `${unitPrice}`, unitPrice === 0 ? "계산 전" : `${unitPrice}`);
  }).length;

  return { fabric, accessory };
}

function deliveryInfo(product: ProductMock) {
  const firstFabric = product.fabrics[0]?.supplier ?? "원단 거래처 미정";
  const firstAccessory = product.accessories[0]?.supplier ?? "부자재 거래처 미정";
  const factory = product.processes.find((item) => item.partner !== "미정" && item.partner !== "내부")?.partner ?? "공장 미정";
  return {
    factory,
    address: product.status.code === "draft" ? "배송지 입력 필요" : "서울 성동구 성수이로 24, 3층 샘플실 / 야간 출입은 정문 호출",
    contact: product.status.code === "draft" ? "담당자 미정" : "김생산 010-1234-5678 / 생산관리팀",
    fabricSupplier: firstFabric,
    accessorySupplier: firstAccessory,
    memo: product.status.code === "completed" ? "리오더 전 변경 수량만 확인" : "원단 입고 후 봉제 공장으로 퀵 전달",
  };
}

function quickDeliveryRequests(product: ProductMock) {
  const firstFabric = product.fabrics[0];
  const firstAccessory = product.accessories[0];
  const secondAccessory = product.accessories[2] ?? product.accessories[1];
  const delivery = deliveryInfo(product);

  return [
    {
      title: "배송요청 1",
      from: firstFabric?.supplier ?? "동대문 원단 A",
      to: delivery.factory === "공장 미정" ? "성수 샘플실 B" : delivery.factory,
      items: [
        `${firstFabric?.name ?? "코튼 30수"} ${firstFabric?.color ?? "아이보리"} 2롤`,
        `${product.fabrics[2]?.name ?? "안감 폴리"} ${product.fabrics[2]?.color ?? "크림"} 1롤`,
        `${product.fabrics[3]?.name ?? "립 배색"} ${product.fabrics[3]?.color ?? "블랙"} 1절`,
        `${product.fabrics[4]?.name ?? "테이프 원단"} ${product.fabrics[4]?.color ?? "내추럴"} 2묶음`,
      ],
      memo: "원단 검수 후 봉제 공장으로 바로 전달",
      tone: "brand" as WaflBadgeTone,
    },
    {
      title: "배송요청 2",
      from: firstAccessory?.supplier ?? "남대문 단추집",
      to: delivery.factory === "공장 미정" ? "성수 샘플실 B" : delivery.factory,
      items: [
        `${firstAccessory?.name ?? "18mm 소뿔 단추"} ${firstAccessory?.quantity ?? "500개"}`,
        `${secondAccessory?.name ?? "콘솔 지퍼"} ${secondAccessory?.quantity ?? "120개"}`,
        `${product.accessories[4]?.name ?? "메인 라벨"} ${product.accessories[4]?.quantity ?? "300장"}`,
      ],
      memo: "부자재만 따로 묶어 오후 퀵으로 요청",
      tone: "info" as WaflBadgeTone,
    },
  ];
}

function SectionTabs({
  activeTab,
  onChange,
  product,
}: {
  activeTab: SheetTab;
  onChange: (tab: SheetTab) => void;
  product: ProductMock;
}) {
  const alertCounts = tabAlertCounts(product);

  return (
    <WaflSurface component="v2-section-tabs" tone="surface" className="overflow-x-auto p-2">
      <div className="grid min-w-max grid-cols-7 gap-2">
        {sheetTabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          const alertCount = tab.id === "fabric" ? alertCounts.fabric : tab.id === "accessory" ? alertCounts.accessory : 0;
          return (
            <WaflButton
              key={tab.id}
              size="sm"
              variant={selected ? "primary" : "ghost"}
              aria-pressed={selected}
              aria-label={tab.label}
              title={tab.label}
              onClick={() => onChange(tab.id)}
              className="min-w-[6.75rem] justify-center"
            >
              <Icon size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
              {alertCount > 0 ? (
                <span
                  aria-label={`${tab.label} 작업 필요 ${alertCount}건`}
                  className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[var(--pbp-status-warning-border)] bg-[var(--pbp-status-warning-bg)] px-1 text-[10px] font-bold leading-none text-[var(--pbp-status-warning-fg)]"
                >
                  {alertCount}
                </span>
              ) : null}
            </WaflButton>
          );
        })}
      </div>
    </WaflSurface>
  );
}

function DeviceModeSwitcher({
  deviceMode,
  onChange,
}: {
  deviceMode: DeviceMode;
  onChange: (mode: DeviceMode) => void;
}) {
  return (
    <WaflCard padding="md" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--pbp-text-primary)]">
            기기 보기
          </h3>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            실제 폭에 가까운 frame으로 PC, 태블릿 세로·가로, 모바일을 확인합니다.
          </p>
        </div>
        <WaflBadge tone="success" size="sm">
          화면 보기
        </WaflBadge>
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        {deviceModes.map((mode) => {
          const Icon = mode.icon;
          const selected = mode.id === deviceMode;
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(mode.id)}
              className={`wafl-shape-control border px-3 py-3 text-left transition ${
                selected
                  ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)]"
                  : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] hover:bg-[var(--pbp-surface-muted)]"
              }`}
            >
              <div className="flex items-center justify-center gap-3 text-center md:justify-start md:text-left">
                <Icon size={18} className="text-[var(--pbp-brand-primary)]" />
                <div>
                  <p className="text-sm font-bold text-[var(--pbp-text-primary)]">
                    {mode.label}
                  </p>
                  <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">
                    {mode.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </WaflCard>
  );
}

function ProductExplorer({
  selectedProduct,
  onSelect,
  compact = false,
}: {
  selectedProduct: ProductMock;
  onSelect: (productId: string) => void;
  compact?: boolean;
}) {
  return (
    <WaflSurface component="v2-product-explorer" tone="surface" className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[var(--pbp-text-primary)]">
          {compact ? "제품 선택" : "제품 목록"}
        </h3>
        <WaflBadge tone="brand" size="xs">
          샘플 {products.length}
        </WaflBadge>
      </div>
      <WaflInput
        className="text-base"
        value={selectedProduct.name}
        readOnly
        aria-label="선택된 제품"
      />
      <div className="grid gap-2">
        {products.map((product) => {
          const selected = product.id === selectedProduct.id;
          const purpose = sheetPurposeLabel(product.status);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className={`wafl-shape-control border p-3 text-left transition ${
                selected
                  ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)]"
                  : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] hover:bg-[var(--pbp-surface-muted)]"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumbnail product={product} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold leading-5 text-[var(--pbp-text-primary)]">
                    {product.name}
                  </p>
                  <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold leading-4 text-[var(--pbp-text-muted)]">
                    {purpose.label}
                  </p>
                  {!compact ? (
                    <p className="mt-1 text-[11px] font-semibold text-[var(--pbp-text-subtle)]">
                      원단 {product.fabrics.length} / 부자재 {product.accessories.length}
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </WaflSurface>
  );
}

function CompactSummaryLine({
  items,
}: {
  items: Array<[string, ReactNode]>;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 border-y border-[var(--pbp-border)] py-2 text-xs leading-5">
      {items.map(([label, value]) => (
        <span key={label} className="inline-flex max-w-full items-baseline gap-1.5">
          <span className="shrink-0 font-bold text-[var(--pbp-text-muted)]">{label}</span>
          <span className="min-w-0 font-semibold text-[var(--pbp-text-primary)]">{value}</span>
        </span>
      ))}
    </div>
  );
}

function CompactDefinitionList({
  items,
  columns = "two",
}: {
  items: Array<[string, ReactNode]>;
  columns?: "one" | "two" | "three";
}) {
  const columnClass =
    columns === "three"
      ? "md:grid-cols-3"
      : columns === "two"
        ? "md:grid-cols-2"
        : "";

  return (
    <dl className={`grid border-y border-[var(--pbp-border)] ${columnClass}`}>
      {items.map(([label, value]) => (
        <div key={label} className="flex min-w-0 items-start justify-between gap-3 border-b border-[var(--pbp-border)] py-2 pr-3 last:border-b-0">
          <dt className="shrink-0 text-[11px] font-bold text-[var(--pbp-text-muted)]">{label}</dt>
          <dd className="min-w-0 max-w-[68%] whitespace-normal break-keep text-right text-xs font-semibold leading-5 text-[var(--pbp-text-primary)]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SheetSummaryHeader({ product, selectedImage }: { product: ProductMock; selectedImage: ImageMock | null }) {
  const purpose = sheetPurposeLabel(product.status);

  return (
    <WaflCard padding="lg" className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <ProductThumbnail product={product} image={selectedImage} size="lg" />
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pbp-brand-soft)]">
                제작 카드 입력·발주·출력 흐름
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--pbp-text-primary)]">
                {product.name}
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-[var(--pbp-text-muted)]">
                {product.subtitle} / 수량 {product.quantity} / 납기 {product.due}
              </p>
              <p className="mt-1 text-xs font-bold text-[var(--pbp-brand-primary)]">
                대표 이미지: {selectedImage ? `${selectedImage.name} · ${selectedImage.label}` : "없음"}
              </p>
            </div>
            <WaflBadge tone={purpose.tone} size="sm" className="max-w-full truncate">
              {purpose.label}
            </WaflBadge>
          </div>
          <p className="border-y border-[var(--pbp-border)] py-2 text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
            상단은 제품 식별과 대표 이미지만 보여주고, 금액은 개요의 제작 요약에서 확인합니다.
          </p>
        </div>
      </div>
    </WaflCard>
  );
}

function InputSourceBar() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-[var(--pbp-border)] py-2">
      <span className="text-[11px] font-bold text-[var(--pbp-text-muted)]">입력 출처</span>
      {inputSources.map((source, index) => (
        <span
          key={source}
          className={`wafl-shape-control border px-2.5 py-1 text-[11px] font-bold ${
            index === 2
              ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)] text-[var(--pbp-brand-primary)]"
              : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)]"
          }`}
        >
          {source}
        </span>
      ))}
      <span className="text-[11px] font-semibold text-[var(--pbp-text-subtle)]">
        재고에서 가져오면 필요 수량에서 차감해 발주 수량을 계산합니다.
      </span>
    </div>
  );
}

function UnitReferencePanel() {
  const units = [...baseUnits.map((unit) => ({ label: unit, company: false })), ...companyUnits.map((unit) => ({ label: unit, company: true }))];

  return (
    <div className="space-y-2 border-y border-[var(--pbp-border)] py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-[var(--pbp-text-primary)]">단위 선택</p>
        <WaflButton size="sm" variant="ghost">단위 추가 요청</WaflButton>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {units.map((unit) => (
          <WaflBadge key={unit.label} tone={unit.company ? "info" : "neutral"} size="xs">
            {unit.company ? `${unit.label} · 회사 기준` : unit.label}
          </WaflBadge>
        ))}
      </div>
    </div>
  );
}

function MaterialAssistTools() {
  return (
    <div className="space-y-3 border-y border-[var(--pbp-border)] py-3">
      <div>
        <p className="text-xs font-bold text-[var(--pbp-text-primary)]">보조 기능</p>
        <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
          기본 목록에서는 숨기고, 편집 화면에서 필요한 경우만 이전 기록, 재고 사용, 거래처 기록을 참고합니다.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <WaflButton size="sm" variant="secondary" width="full">이전 기록</WaflButton>
        <WaflButton size="sm" variant="secondary" width="full">재고 사용</WaflButton>
        <WaflButton size="sm" variant="secondary" width="full">거래처 기록</WaflButton>
      </div>
      <InputSourceBar />
      <UnitReferencePanel />
    </div>
  );
}

function ProcessReferencePanel() {
  const processes = [...baseProcesses.map((process) => ({ label: process, company: false })), ...companyProcesses.map((process) => ({ label: process, company: true }))];

  return (
    <div className="space-y-2 border-y border-[var(--pbp-border)] py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-[var(--pbp-text-primary)]">공정 선택</p>
        <div className="flex flex-wrap justify-center gap-2">
          <WaflButton size="sm" variant="secondary">기준에서 선택</WaflButton>
          <WaflButton size="sm" variant="ghost">공정 추가 요청</WaflButton>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {processes.map((process) => (
          <WaflBadge key={process.label} tone={process.company ? "info" : "neutral"} size="xs">
            {process.company ? `${process.label} · 회사 기준` : process.label}
          </WaflBadge>
        ))}
      </div>
    </div>
  );
}

function MaterialItemCard({
  title,
  meta,
  supplier,
  colorLabel,
  quantity,
  unit,
  unitPrice,
  amount,
  status,
  issue,
  source,
  onConfirmAction,
}: {
  title: string;
  meta: string;
  supplier: string;
  colorLabel: string;
  quantity: ReturnType<typeof quantityFlow>;
  unit: string;
  unitPrice: string;
  amount: string;
  status: StatusSample;
  issue?: string;
  source?: string;
  onConfirmAction: (action: ConfirmAction) => void;
}) {
  const display = materialDisplayState({
    status,
    supplier,
    unitPrice,
    amount,
    colorOrOption: colorLabel,
  });
  const isLocked = ["requested", "ordered", "received", "done"].includes(status.code);
  const canRequestOrder = display.action === "발주 요청" || display.tone === "warning";
  const canCompleteOrder = display.action === "발주 완료 처리";
  const canDelete = !isLocked;
  const showWarning = display.tone === "warning";
  const LockIcon = isLocked ? Lock : Unlock;
  const lockLabel = isLocked ? "읽기 전용" : "수정 가능";
  const showIssueText = Boolean(issue && issue !== display.label);
  const missing = [
    !supplier || supplier === "미정" ? "거래처를 입력하세요." : null,
    unitPrice === "미입력" || amount === "-" || amount === "계산 전" ? "단가를 입력하세요." : null,
    !colorLabel || colorLabel.includes("미정") ? "색상/옵션을 입력하세요." : null,
  ].filter(Boolean) as string[];
  const openConfirm = (kind: ConfirmActionKind) => {
    onConfirmAction({
      kind,
      itemTitle: title,
      supplier,
      quantity,
      amount,
      missing,
    });
  };

  return (
    <div
      data-wafl-component="v2-material-item-row"
      className={`space-y-3 rounded-md border p-3 ${
        isLocked
          ? "border-[var(--pbp-border)] bg-[var(--pbp-surface)] opacity-80"
          : showWarning
            ? "border-[var(--pbp-status-warning-border)] bg-[var(--pbp-status-warning-bg)]"
            : "border-[var(--pbp-border)] bg-[var(--pbp-surface)]"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-[var(--pbp-text-primary)]">
            {title}
          </p>
          <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-[var(--pbp-text-muted)]">
            {meta}
          </p>
          <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold text-[var(--pbp-text-primary)]">
            {colorLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1.5">
          <WaflBadge tone={display.tone} size="xs" className="max-w-[6rem] truncate">
            {display.label}
          </WaflBadge>
          <span
            title={lockLabel}
            aria-label={lockLabel}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--pbp-border)] text-[var(--pbp-text-muted)]"
          >
            <LockIcon size={13} aria-hidden="true" />
          </span>
          {canRequestOrder ? (
            <WaflButton
              size="sm"
              variant="ghost"
              title="발주 요청"
              aria-label={`${title} 발주 요청`}
              className="h-7 w-7 p-0"
              onClick={() => openConfirm(missing.length > 0 ? "orderMissing" : "orderRequest")}
            >
              <Send size={14} aria-hidden="true" />
            </WaflButton>
          ) : null}
          {canCompleteOrder ? (
            <WaflButton
              size="sm"
              variant="ghost"
              title="발주 완료 처리"
              aria-label={`${title} 발주 완료 처리`}
              className="h-7 w-7 p-0"
              onClick={() => openConfirm("orderComplete")}
            >
              <CheckCircle2 size={14} aria-hidden="true" />
            </WaflButton>
          ) : null}
          {canDelete ? (
            <WaflButton size="sm" variant="ghost" title="삭제" aria-label={`${title} 삭제`} className="h-7 w-7 p-0" onClick={() => openConfirm("delete")}>
              <Trash2 size={14} aria-hidden="true" />
            </WaflButton>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold leading-5 text-[var(--pbp-text-muted)]">
        <span className="whitespace-nowrap">필요 {quantity.required}</span>
        <span className="whitespace-nowrap">여유 {quantity.allowance}</span>
        <span className="whitespace-nowrap">재고 {quantity.stock}</span>
        <span className="whitespace-nowrap">발주 {quantity.order}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold leading-5 text-[var(--pbp-text-primary)]">
        <span className="whitespace-nowrap">단위 {unit}</span>
        <span className="whitespace-nowrap">단가 {unitPrice}</span>
        <span className="whitespace-nowrap">금액 {amount}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold leading-5 text-[var(--pbp-text-muted)]">
        <span className="whitespace-nowrap">총 필요 {quantity.totalRequired}</span>
        <span className="whitespace-nowrap">남음 {quantity.leftover}</span>
        <span className="whitespace-nowrap">처리 {quantity.handling}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {source ? <WaflBadge tone="neutral" size="xs">{source}</WaflBadge> : null}
        {showIssueText ? (
          <span className="min-w-0 flex-1 truncate text-right text-[11px] font-bold text-[var(--pbp-status-warning-fg)]">
            {issue}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function OverviewContent({
  product,
}: {
  product: ProductMock;
}) {
  const stats = summaryStats(product);
  const dashboardRows: Array<[string, ReactNode]> = [
    ["수량", product.quantity],
    ["납기", product.due],
    ["한벌 단가", formatWon(stats.unitCost)],
    ["총 예상", formatWon(stats.totalAmount)],
    ["원단 총액", formatWon(stats.fabricAmount)],
    ["부자재 총액", formatWon(stats.accessoryAmount)],
    ["공정 총액", formatWon(stats.processAmount)],
  ];

  return (
    <WaflCard padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[var(--pbp-text-primary)]">
            제작 요약
          </h3>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            한 화면에 모든 것을 펼치지 않고, 요약 카드 + 탭 + 상세 편집 흐름으로 들어갑니다.
          </p>
        </div>
      </div>
      <CompactDefinitionList
        columns="two"
        items={dashboardRows}
      />
    </WaflCard>
  );
}

function FabricContent({
  product,
  onAdd,
  onViewAll,
  onConfirmAction,
}: {
  product: ProductMock;
  onAdd?: () => void;
  onViewAll?: () => void;
  onConfirmAction: (action: ConfirmAction) => void;
}) {
  const stats = summaryStats(product);
  const issues = product.fabrics.filter((item) => item.issue || item.status.code === "issue").length;
  const pending = product.fabrics.filter((item) => ["draft", "ready", "requested", "issue"].includes(item.status.code)).length;
  const missingPrice = product.fabrics.filter((item) => item.unitPrice === "미입력" || item.amount === "-").length;
  const workNeeded = tabAlertCounts(product).fabric;

  return (
    <WaflCard padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--pbp-text-primary)]">원단 입력·발주</h3>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <WaflButton size="sm" variant="secondary" onClick={onViewAll}>
            <ListChecks size={14} aria-hidden="true" />
            전체 보기
          </WaflButton>
          <WaflButton size="sm" variant="secondary" onClick={onAdd}>
            <Plus size={14} aria-hidden="true" />
            원단 추가
          </WaflButton>
        </div>
      </div>
      <p className="border-y border-[var(--pbp-border)] py-2 text-center text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
        원단 {product.fabrics.length}개 · 원단 금액 {formatWon(stats.fabricAmount)} · 작업 필요 {workNeeded}건
        <span className="sr-only">단가 미입력 {missingPrice}건, 미발주 {pending}개, 확인 필요 {issues}개</span>
      </p>
      <div className="grid gap-2">
        {product.fabrics.slice(0, 4).map((item, index) => {
          const flow = quantityFlow(item.quantity, index);
          return (
            <MaterialItemCard
              key={`${item.name}-${item.color}`}
              title={item.name}
              meta={`${item.supplier} · ${item.color}`}
              supplier={item.supplier}
              colorLabel={`색상: ${item.color}`}
              quantity={flow}
              unit={flow.unit}
              unitPrice={item.unitPrice === "미입력" ? "미입력" : `${item.unitPrice}원`}
              amount={item.amount === "-" ? "계산 전" : `${item.amount}원`}
              status={item.status}
              issue={item.issue}
              onConfirmAction={onConfirmAction}
            />
          );
        })}
      </div>
    </WaflCard>
  );
}

function AccessoryContent({
  product,
  onAdd,
  onViewAll,
  onConfirmAction,
}: {
  product: ProductMock;
  onAdd?: () => void;
  onViewAll?: () => void;
  onConfirmAction: (action: ConfirmAction) => void;
}) {
  const stats = summaryStats(product);
  const pending = product.accessories.filter((item) => ["draft", "ready", "requested", "issue"].includes(item.status.code)).length;
  const missingPrice = product.accessories.filter((item, index) => accessoryUnitPrice(item, index) === 0).length;
  const workNeeded = tabAlertCounts(product).accessory;

  return (
    <WaflCard padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--pbp-text-primary)]">부자재 입력·발주</h3>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <WaflButton size="sm" variant="secondary" onClick={onViewAll}>
            <ListChecks size={14} aria-hidden="true" />
            전체 보기
          </WaflButton>
          <WaflButton size="sm" variant="secondary" onClick={onAdd}>
            <Plus size={14} aria-hidden="true" />
            부자재 추가
          </WaflButton>
        </div>
      </div>
      <p className="border-y border-[var(--pbp-border)] py-2 text-center text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
        부자재 {product.accessories.length}개 · 부자재 금액 {formatWon(stats.accessoryAmount)} · 작업 필요 {workNeeded}건
        <span className="sr-only">단가 미입력 {missingPrice}건, 미발주 {pending}개</span>
      </p>
      <div className="grid gap-2">
          {product.accessories.slice(0, 5).map((item, index) => {
            const flow = quantityFlow(item.quantity, index + 2);
            const unitPrice = accessoryUnitPrice(item, index);
            const qty = parseQuantity(item.quantity).amount;
            return (
              <MaterialItemCard
                key={`${item.category}-${item.name}`}
                title={item.name}
                meta={`${item.category} · ${item.supplier} · ${accessoryOption(item, index)}`}
                supplier={item.supplier}
                colorLabel={`옵션: ${accessoryOption(item, index)}`}
                quantity={flow}
                unit={flow.unit}
                unitPrice={unitPrice === 0 ? "미입력" : `${unitPrice.toLocaleString("ko-KR")}원`}
                amount={unitPrice === 0 ? "계산 전" : formatWon(unitPrice * qty)}
                status={item.status}
                issue={item.issue}
                onConfirmAction={onConfirmAction}
              />
            );
          })}
      </div>
    </WaflCard>
  );
}

function ImageAttachmentContent({
  images,
  attachments,
  selectedImage,
  onSelectImage,
  onAddImage,
  onAddAttachment,
  onDeleteImage,
  onDeleteAttachment,
  compactActions = false,
  previewMode = "desktop",
}: {
  images: ImageMock[];
  attachments: AttachmentMock[];
  selectedImage: ImageMock | null;
  onSelectImage: (imageId: string) => void;
  onAddImage: (sourceType: ImageMock["type"]) => void;
  onAddAttachment: () => void;
  onDeleteImage: (imageId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  compactActions?: boolean;
  previewMode?: "desktop" | "tablet" | "mobile";
}) {
  const [preview, setPreview] = useState<
    | { kind: "image"; image: ImageMock }
    | { kind: "attachment"; attachment: AttachmentMock }
    | null
  >(null);
  const isMobilePreview = previewMode === "mobile";
  const assetIcon = (image: ImageMock, size = 28) => {
    if (image.type === "sketch") return <Palette size={size} strokeWidth={1.5} aria-hidden="true" />;
    if (image.type === "camera") return <Camera size={size} strokeWidth={1.5} aria-hidden="true" />;
    if (image.type === "reference") return <ImagePlus size={size} strokeWidth={1.5} aria-hidden="true" />;
    return <Shirt size={size} strokeWidth={1.5} aria-hidden="true" />;
  };
  const actionItems: Array<{ label: string; icon: typeof ImagePlus; onClick: () => void }> = [
    { label: "이미지", icon: ImagePlus, onClick: () => onAddImage("image") },
    { label: "사진", icon: Camera, onClick: () => onAddImage("camera") },
    { label: "스케치", icon: Palette, onClick: () => onAddImage("sketch") },
    { label: "첨부", icon: Paperclip, onClick: onAddAttachment },
  ];

  return (
    <WaflCard padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--pbp-text-primary)]">이미지·첨부</h3>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            이미지를 보고 대표 이미지만 빠르게 정하고, 첨부는 파일 목록으로만 관리합니다.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {actionItems.map(({ label, icon: Icon, onClick }) => (
            <WaflButton key={label} size="sm" variant="secondary" title={`${label} 추가`} aria-label={`${label} 추가`} onClick={onClick} className={compactActions ? "h-8 w-8 p-0" : ""}>
              <Icon size={14} aria-hidden="true" />
              <span className={compactActions ? "sr-only" : "sr-only sm:not-sr-only"}>{label}</span>
            </WaflButton>
          ))}
        </div>
      </div>
      <div className="space-y-2 border-y border-[var(--pbp-border)] py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-[var(--pbp-text-primary)]">이미지 목록</p>
          <p className="truncate text-[11px] font-semibold text-[var(--pbp-text-muted)]">
            {selectedImage ? "대표 선택됨" : "대표 없음"}
          </p>
        </div>
        {images.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--pbp-border-strong)] p-4 text-center text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
            이미지가 없습니다. 첫 이미지가 추가되면 자동으로 대표 이미지가 됩니다.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((image) => {
              const selected = selectedImage?.id === image.id;
              return (
                <div
                  key={image.id}
                  className={`relative aspect-square overflow-hidden rounded-md border ${
                    selected ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface)]"
                  }`}
                  title={`${image.name} · ${image.label}`}
                >
                  <button
                    type="button"
                    onClick={() => setPreview({ kind: "image", image })}
                    className="flex h-full w-full items-center justify-center bg-[var(--pbp-surface-muted)] text-[var(--pbp-brand-primary)]"
                    title={`${image.name} 미리보기`}
                    aria-label={`${image.name} 미리보기`}
                  >
                    {assetIcon(image, compactActions ? 28 : 34)}
                  </button>
                  <div className="absolute left-1.5 top-1.5 hidden rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] font-bold text-[var(--pbp-text-muted)] sm:inline-flex">
                    {image.label}
                  </div>
                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                    <WaflButton
                      size="sm"
                      variant="ghost"
                      title={selected ? "대표 이미지" : `${image.name} 대표로 선택`}
                      aria-label={selected ? `${image.name} 대표 이미지` : `${image.name} 대표로 선택`}
                      className={`h-8 w-8 p-0 ${selected ? "text-[var(--pbp-status-warning-fg)]" : ""}`}
                      onClick={() => onSelectImage(image.id)}
                    >
                      <Crown size={15} fill={selected ? "currentColor" : "none"} aria-hidden="true" />
                    </WaflButton>
                    <WaflButton size="sm" variant="ghost" title={`${image.name} 삭제`} aria-label={`${image.name} 삭제`} className="h-8 w-8 p-0" onClick={() => onDeleteImage(image.id)}>
                      <Trash2 size={14} aria-hidden="true" />
                    </WaflButton>
                  </div>
                  {selected ? <span className="absolute bottom-1.5 left-1.5 h-2.5 w-2.5 rounded-full bg-[var(--pbp-status-warning-fg)]" aria-hidden="true" /> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="space-y-2 border-y border-[var(--pbp-border)] py-3">
        <p className="text-xs font-bold text-[var(--pbp-text-primary)]">첨부파일</p>
        <div className="grid gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={`grid gap-2 rounded-md border px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                attachment.included ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface)]"
              }`}
            >
              <button type="button" className="min-w-0 text-left" onClick={() => setPreview({ kind: "attachment", attachment })}>
                <p className="truncate text-sm font-bold text-[var(--pbp-text-primary)]">{attachment.name}</p>
                <p className="truncate text-xs font-semibold text-[var(--pbp-text-muted)]">{attachment.type} · {attachment.detail}</p>
              </button>
              <div className="flex items-center justify-end gap-1.5">
                <WaflButton size="sm" variant="ghost" title={`${attachment.name} 삭제`} aria-label={`${attachment.name} 삭제`} className="h-8 w-8 p-0" onClick={() => onDeleteAttachment(attachment.id)}>
                  <Trash2 size={14} aria-hidden="true" />
                </WaflButton>
              </div>
            </div>
          ))}
        </div>
      </div>
      {preview ? (
        <WaflSurface
          component={isMobilePreview ? "v2-asset-preview-bottom-sheet-mock" : "v2-asset-preview-panel-mock"}
          tone="selected"
          className={isMobilePreview ? "space-y-3 rounded-t-[22px] border-t border-[var(--pbp-border)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]" : "space-y-4 p-4"}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pbp-brand-soft)]">Preview mock</p>
              <h4 className="mt-1 truncate text-base font-bold text-[var(--pbp-text-primary)]">
                {preview.kind === "image" ? preview.image.name : preview.attachment.name}
              </h4>
              <p className="mt-1 text-xs font-semibold text-[var(--pbp-text-muted)]">
                {preview.kind === "image" ? preview.image.label : `${preview.attachment.type} · ${preview.attachment.detail}`}
              </p>
            </div>
            <WaflButton size="sm" variant="ghost" onClick={() => setPreview(null)} aria-label="미리보기 닫기">
              <X size={14} aria-hidden="true" />
              닫기
            </WaflButton>
          </div>
          <div className="flex min-h-44 items-center justify-center rounded-md border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-brand-primary)]">
            {preview.kind === "image" ? assetIcon(preview.image, 72) : <FileText size={72} strokeWidth={1.4} aria-hidden="true" />}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {preview.kind === "image" ? (
              <WaflButton size="sm" variant="secondary" title="대표 이미지 설정" aria-label="대표 이미지 설정" onClick={() => onSelectImage(preview.image.id)}>
                <Crown size={14} aria-hidden="true" />
                <span className={compactActions ? "sr-only" : ""}>대표</span>
              </WaflButton>
            ) : (
              <div className="flex items-center justify-center rounded-md border border-[var(--pbp-border)] px-2 py-1 text-xs font-bold text-[var(--pbp-text-muted)]">
                출력·공유에서 선택
              </div>
            )}
            <WaflButton
              size="sm"
              variant="ghost"
              title="삭제"
              aria-label="삭제"
              onClick={() => {
                if (preview.kind === "image") onDeleteImage(preview.image.id);
                else onDeleteAttachment(preview.attachment.id);
                setPreview(null);
              }}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span className={compactActions ? "sr-only" : ""}>삭제</span>
            </WaflButton>
            <WaflButton size="sm" variant="ghost" onClick={() => setPreview(null)}>
              <X size={14} aria-hidden="true" />
              <span className={compactActions ? "sr-only" : ""}>닫기</span>
            </WaflButton>
          </div>
        </WaflSurface>
      ) : null}
      <label className="grid gap-1 text-xs font-bold text-[var(--pbp-text-primary)]">
        이미지/첨부 메모
        <WaflTextarea
          className="min-h-20 text-base"
          defaultValue="대표 이미지는 작업지시서와 공장 전달 문서에 함께 표시됩니다."
          aria-label="이미지 첨부 메모"
        />
      </label>
    </WaflCard>
  );
}

function SizeColorContent({ product }: { product: ProductMock }) {
  const [unit, setUnit] = useState<"cm" | "inch">("cm");
  const [inchHelperCell, setInchHelperCell] = useState<string | null>(null);
  const inchFractions = ["없음", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"];

  return (
    <WaflCard padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--pbp-text-primary)]">사이즈·색상</h3>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            표준 사이즈를 불러온 뒤 이 제작 카드에 맞게 치수와 색상별 수량을 조정합니다.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <WaflButton size="sm" variant="secondary">시스템 표준</WaflButton>
          <WaflButton size="sm" variant="ghost">고객사 기준</WaflButton>
        </div>
      </div>
      <div className="space-y-2 border-y border-[var(--pbp-border)] py-3">
        <p className="text-xs font-bold text-[var(--pbp-text-primary)]">사이즈 체계</p>
        <div className="flex flex-wrap gap-1.5">
          {sizeSystems.map((system, index) => (
            <WaflBadge key={system} tone={index === 0 ? "brand" : "neutral"} size="xs">
              {system}
            </WaflBadge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sizeOptions.map((size, index) => (
            <button
              key={size}
              type="button"
              className={`wafl-shape-control border px-2.5 py-1 text-xs font-bold ${
                index < 3 ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)] text-[var(--pbp-brand-primary)]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-[var(--pbp-text-primary)]">치수 표</p>
        <div className="flex gap-1.5">
          {(["cm", "inch"] as const).map((value) => (
            <WaflButton key={value} size="sm" variant={unit === value ? "primary" : "ghost"} onClick={() => setUnit(value)}>
              {value}
            </WaflButton>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto border-y border-[var(--pbp-border)]">
        <table className="min-w-[520px] w-full text-left text-xs">
          <thead className="text-[var(--pbp-text-muted)]">
            <tr>
              <th className="py-2 pr-3 font-bold">측정 항목</th>
              <th className="py-2 pr-3 font-bold">XS</th>
              <th className="py-2 pr-3 font-bold">S</th>
              <th className="py-2 pr-3 font-bold">M</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pbp-border)]">
            {measurementRows.map(([label, xs, s, m]) => (
              <tr key={label}>
                <th className="py-2 pr-3 font-bold text-[var(--pbp-text-primary)]">{label}</th>
                {[xs, s, m].map((value, index) => (
                  <td key={`${label}-${index}`} className="py-2 pr-3">
                    <button
                      type="button"
                      onClick={() => unit === "inch" ? setInchHelperCell(`${label}-${index}`) : undefined}
                      className={`inline-flex min-w-14 border-b border-dashed border-[var(--pbp-border-strong)] pb-0.5 text-left font-semibold text-[var(--pbp-text-primary)] ${unit === "inch" ? "cursor-pointer" : "cursor-default"}`}
                      title={unit === "inch" ? `${label} inch 분수 입력` : `${label} ${value}cm`}
                      aria-label={unit === "inch" ? `${label} inch 분수 입력` : `${label} ${value}cm`}
                    >
                      {unit === "inch" ? `${value} 1/4"` : `${value}cm`}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {unit === "inch" && inchHelperCell ? (
        <WaflSurface component="v2-inch-fraction-helper-mock" tone="selected" className="space-y-3 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[var(--pbp-text-primary)]">inch 입력 helper</p>
              <p className="mt-1 text-[11px] font-semibold text-[var(--pbp-text-muted)]">정수 25 + 분수 선택 예시</p>
            </div>
            <WaflButton size="sm" variant="ghost" onClick={() => setInchHelperCell(null)} aria-label="inch helper 닫기">
              <X size={14} aria-hidden="true" />
              닫기
            </WaflButton>
          </div>
          <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
            <WaflInput className="text-base" defaultValue="25" inputMode="numeric" aria-label="inch 정수 입력" />
            <div className="flex flex-wrap gap-1.5">
              {inchFractions.map((fraction) => (
                <button
                  key={fraction}
                  type="button"
                  className={`wafl-shape-control border px-2.5 py-1 text-xs font-bold ${
                    fraction === "1/4" ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)] text-[var(--pbp-brand-primary)]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)]"
                  }`}
                >
                  {fraction}
                </button>
              ))}
            </div>
          </div>
        </WaflSurface>
      ) : null}
      <div className="space-y-2 border-y border-[var(--pbp-border)] py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-[var(--pbp-text-primary)]">제품 색상 / 색상별 수량</p>
          <WaflButton size="sm" variant="secondary">색상 추가</WaflButton>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {colorQuantities.map(([color, quantity]) => (
            <div key={color} className="flex items-center justify-between gap-2 rounded-md border border-[var(--pbp-border)] px-3 py-2">
              <span className="text-sm font-bold text-[var(--pbp-text-primary)]">{color}</span>
              <span className="text-xs font-semibold text-[var(--pbp-text-muted)]">{quantity}</span>
              <WaflButton size="sm" variant="ghost" title={`${color} 삭제`} aria-label={`${color} 삭제`}>
                <Trash2 size={14} aria-hidden="true" />
              </WaflButton>
            </div>
          ))}
        </div>
        <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">
          색상별 합계 {product.quantity} 기준으로 작업지시서와 공장 전달 작업지시서에 반영되는 mock입니다.
        </p>
      </div>
    </WaflCard>
  );
}

function ProcessWorkCard({
  item,
  index,
  label,
}: {
  item: ProcessItem;
  index: number;
  label: string;
}) {
  const quantity = parseQuantity(item.quantity);
  const unitPrice = 48000 + index * 9000;
  const amount = unitPrice * Math.max(quantity.amount, 1);

  return (
    <div data-wafl-component="v2-process-card" className="space-y-2 border-y border-[var(--pbp-border)] py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[var(--pbp-text-muted)]">{label} · 순서 {index + 1}</p>
          <p className="mt-1 truncate text-sm font-bold text-[var(--pbp-text-primary)]">{item.step}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[var(--pbp-text-muted)]">
            제작 공장/거래처: {item.partner}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            title="길게 눌러 순서 변경"
            aria-label="길게 눌러 순서 변경"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--pbp-border)] text-[var(--pbp-text-muted)]"
          >
            <GripVertical size={14} aria-hidden="true" />
          </span>
          <WaflButton size="sm" variant="ghost" title={`${item.step} 삭제`} aria-label={`${item.step} 삭제`} className="h-7 w-7 p-0">
            <Trash2 size={14} aria-hidden="true" />
          </WaflButton>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold leading-5 text-[var(--pbp-text-primary)]">
        {[
          ["수량", item.quantity],
          ["단위", quantity.unit],
          ["단가", formatWon(unitPrice)],
          ["금액", formatWon(amount)],
          ["납기", item.due],
        ].map(([field, value]) => (
          <span key={`${item.step}-${field}`} className="whitespace-nowrap border-b border-dashed border-[var(--pbp-border-strong)] pb-0.5">
            <span className="font-bold text-[var(--pbp-text-muted)]">{field}</span> {value}
          </span>
        ))}
      </div>
      {item.issue ? <p className="text-xs font-bold text-[var(--pbp-status-warning-fg)]">{item.issue}</p> : null}
    </div>
  );
}

function ProcessContent({
  product,
}: {
  product: ProductMock;
}) {
  const stats = summaryStats(product);
  const primaryProcess = product.processes.find((item) => item.step === "봉제") ?? product.processes[0];
  const additionalProcesses = product.processes.filter((item) => item !== primaryProcess);
  const processCards = [primaryProcess, ...additionalProcesses].filter(Boolean) as ProcessItem[];

  return (
    <WaflCard padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--pbp-text-primary)]">제작 플로우</h3>
        </div>
      </div>
      <p className="border-y border-[var(--pbp-border)] py-2 text-center text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
        제작 공장 1개 · 추가 공정 {additionalProcesses.length}개 · 공정 금액 {formatWon(stats.processAmount)}
      </p>
      <div className="grid gap-2">
        {processCards.slice(0, 7).map((item, index) => (
          <ProcessWorkCard
            key={`${item.step}-${index}`}
            item={item}
            index={index}
            label={index === 0 ? "제작 공장" : "추가 공정"}
          />
        ))}
      </div>
    </WaflCard>
  );
}

function PdfContent({
  product,
  selectedImage,
  attachments,
  onToggleAttachmentIncluded,
  previewMode = "desktop",
}: {
  product: ProductMock;
  selectedImage: ImageMock | null;
  attachments: AttachmentMock[];
  onToggleAttachmentIncluded: (attachmentId: string) => void;
  previewMode?: "desktop" | "tablet" | "mobile";
}) {
  const stats = summaryStats(product);
  const documentTypes: Array<[string, string, WaflBadgeTone]> = [
    ["작업지시서", "제품, 수량, 원부자재, 금액 요약 중심", product.status.code === "ready" ? "brand" : "neutral"],
    ["공장 전달 작업지시서", "공장, 공정, 사용 원부자재, 납기 중심", stats.factoryReady ? "success" : "warning"],
  ];
  const quickRequests = quickDeliveryRequests(product);
  const [selectedDocument, setSelectedDocument] = useState(documentTypes[0][0]);
  const [attachmentPickerOpen, setAttachmentPickerOpen] = useState(false);
  const [selectedRequestTitle, setSelectedRequestTitle] = useState<string | null>(null);
  const includedAttachments = attachments.filter((attachment) => attachment.included);
  const selectedRequest = quickRequests.find((request) => request.title === selectedRequestTitle) ?? null;
  const isMobilePreview = previewMode === "mobile";
  const summarizeItems = (items: string[]) => {
    if (items.length <= 1) return items[0] ?? "보낼 항목 없음";
    const first = items[0].replace(/\s+\d.*$/, "");
    return `${first} 외 ${items.length - 1}개`;
  };

  return (
    <WaflCard padding="md" className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div data-wafl-component="v2-current-pdf-document" className="space-y-3 border-y border-[var(--pbp-border)] py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[var(--pbp-text-muted)]">문서 출력</p>
              <h3 className="mt-1 text-xl font-bold text-[var(--pbp-text-primary)]">{stats.currentPdf.label}</h3>
            </div>
            <WaflBadge tone={stats.currentPdf.tone} size="sm">{product.status.label}</WaflBadge>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-2">
            <ProductThumbnail product={product} image={selectedImage} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--pbp-text-primary)]">대표 이미지</p>
              <p className="truncate text-[11px] font-semibold text-[var(--pbp-text-muted)]">
                {selectedImage ? selectedImage.label : "대표 이미지 없음"}
              </p>
            </div>
          </div>
        </div>
        <CompactSummaryLine
          items={[
            ["작업지시서", "보기·공유·인쇄"],
            ["공장 전달 작업지시서", stats.factoryReady ? "준비됨" : "확인 필요"],
            ["배송요청서", `${quickRequests.length}건`],
          ]}
        />
      </div>
      <CompactDefinitionList
        columns="two"
        items={[
          ["사이즈·색상", `${sizeOptions.slice(0, 3).join("/")} · ${colorQuantities.length}색`],
          ["원단/부자재", `원단 ${product.fabrics.length}개 · 부자재 ${product.accessories.length}개`],
          ["제작 플로우", `${product.processes.length}개 공정과 공장 전달 메모 포함`],
          ["메모", "기본 포함"],
        ]}
      />
      <div className="space-y-2 border-y border-[var(--pbp-border)] py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-[var(--pbp-text-primary)]">포함 첨부</p>
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">제작 문서에 넣을 첨부를 출력·공유에서 선택합니다.</p>
          </div>
          <WaflButton size="sm" variant="secondary" onClick={() => setAttachmentPickerOpen((value) => !value)}>
            <Paperclip size={14} aria-hidden="true" />
            첨부 선택
          </WaflButton>
        </div>
        {includedAttachments.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--pbp-border-strong)] px-3 py-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
            선택된 첨부가 없습니다.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {includedAttachments.map((attachment) => (
              <button
                key={attachment.id}
                type="button"
                onClick={() => onToggleAttachmentIncluded(attachment.id)}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)] px-2.5 py-1 text-xs font-bold text-[var(--pbp-brand-primary)]"
                title={`${attachment.name} 포함 해제`}
                aria-label={`${attachment.name} 포함 해제`}
              >
                <span className="max-w-40 truncate">{attachment.name}</span>
                <X size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        {attachmentPickerOpen ? (
          <WaflSurface
            component={isMobilePreview ? "v2-document-attachment-picker-bottom-sheet-mock" : "v2-document-attachment-picker-mock"}
            tone="selected"
            className={isMobilePreview ? "space-y-3 rounded-t-[22px] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]" : "space-y-3 p-3"}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[var(--pbp-text-primary)]">첨부 선택</p>
              <WaflButton size="sm" variant="ghost" onClick={() => setAttachmentPickerOpen(false)} aria-label="첨부 선택 닫기">
                <X size={14} aria-hidden="true" />
                닫기
              </WaflButton>
            </div>
            <div className="grid gap-2">
              {attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => onToggleAttachmentIncluded(attachment.id)}
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-3 py-2 text-left ${
                    attachment.included ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface)]"
                  }`}
                >
                  <FileText size={16} aria-hidden="true" className="text-[var(--pbp-brand-primary)]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[var(--pbp-text-primary)]">{attachment.name}</span>
                    <span className="block truncate text-xs font-semibold text-[var(--pbp-text-muted)]">{attachment.type} · {attachment.detail}</span>
                  </span>
                  {attachment.included ? <CheckCircle2 size={16} aria-hidden="true" className="text-[var(--pbp-brand-primary)]" /> : <span className="h-4 w-4 rounded-full border border-[var(--pbp-border-strong)]" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </WaflSurface>
        ) : null}
      </div>
      <div className="divide-y divide-[var(--pbp-border)] border-y border-[var(--pbp-border)]">
        {documentTypes.map(([title, detail]) => (
          <div key={title} data-wafl-component="v2-document-kind-row" className="grid gap-2 py-3 md:grid-cols-[0.65fr_1fr_auto] md:items-center">
            <button type="button" onClick={() => setSelectedDocument(title)} className="min-w-0 text-left">
              <p className="text-sm font-bold text-[var(--pbp-text-primary)]">{title}</p>
              <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">{selectedDocument === title ? "미리보기 선택됨" : "row 선택으로 미리보기"}</p>
            </button>
            <p className="text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">{detail}</p>
            <div className="grid grid-cols-2 gap-1.5">
              <WaflButton size="sm" variant="ghost" title={`${title} 공유`} aria-label={`${title} 공유`}>
                <Share2 size={14} aria-hidden="true" />
              </WaflButton>
              <WaflButton size="sm" variant="ghost" title={`${title} 인쇄`} aria-label={`${title} 인쇄`}>
                <Printer size={14} aria-hidden="true" />
              </WaflButton>
            </div>
          </div>
        ))}
      </div>
      <WaflSurface component="v2-document-row-preview-mock" tone="muted" className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[var(--pbp-text-muted)]">문서 미리보기 mock</p>
            <p className="mt-1 text-sm font-bold text-[var(--pbp-text-primary)]">{selectedDocument}</p>
          </div>
          <WaflBadge tone={documentTypes.find(([title]) => title === selectedDocument)?.[2] ?? "neutral"} size="xs">
            선택됨
          </WaflBadge>
        </div>
      </WaflSurface>
      <div className="space-y-3 border-y border-[var(--pbp-border)] py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--pbp-text-primary)]">
              <Truck size={16} aria-hidden="true" />
              배송요청서 만들기
            </h4>
          </div>
          <WaflButton size="sm" variant="secondary">
            <Plus size={14} aria-hidden="true" />
            배송요청 추가하기
          </WaflButton>
        </div>
        <div className="grid gap-2">
          {quickRequests.map((request) => (
            <div key={request.title} className="grid min-h-[92px] gap-2 rounded-md border border-[var(--pbp-border)] px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <button type="button" onClick={() => setSelectedRequestTitle(request.title)} className="min-w-0 text-left">
                <p className="text-sm font-bold text-[var(--pbp-text-primary)]">{request.title}</p>
                <p className="mt-1 truncate text-xs font-semibold text-[var(--pbp-text-muted)]">{request.from} → {request.to}</p>
                <p className="mt-1 truncate text-xs font-semibold text-[var(--pbp-text-primary)]">{summarizeItems(request.items)}</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-[var(--pbp-text-muted)]">전달 메모 있음</p>
              </button>
              <div className="grid grid-cols-3 gap-1.5">
                <WaflButton size="sm" variant="ghost" title="배송요청 공유" aria-label="배송요청 공유" className="h-8 w-8 p-0">
                  <Share2 size={14} aria-hidden="true" />
                  <span className="sr-only">공유</span>
                </WaflButton>
                <WaflButton size="sm" variant="ghost" title="배송요청 인쇄" aria-label="배송요청 인쇄" className="h-8 w-8 p-0">
                  <Printer size={14} aria-hidden="true" />
                  <span className="sr-only">인쇄</span>
                </WaflButton>
                <WaflButton size="sm" variant="ghost" title="배송요청 저장" aria-label="배송요청 저장" className="h-8 w-8 p-0">
                  <Download size={14} aria-hidden="true" />
                  <span className="sr-only">저장</span>
                </WaflButton>
              </div>
            </div>
          ))}
        </div>
        {selectedRequest ? (
          <WaflSurface
            component={isMobilePreview ? "v2-delivery-request-bottom-sheet-mock" : "v2-delivery-request-detail-mock"}
            tone="selected"
            className={isMobilePreview ? "space-y-3 rounded-t-[22px] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]" : "space-y-3 p-3"}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--pbp-text-muted)]">배송요청 상세 mock</p>
                <h4 className="mt-1 text-sm font-bold text-[var(--pbp-text-primary)]">{selectedRequest.title}</h4>
              </div>
              <WaflButton size="sm" variant="ghost" onClick={() => setSelectedRequestTitle(null)} aria-label="배송요청 상세 닫기">
                <X size={14} aria-hidden="true" />
                닫기
              </WaflButton>
            </div>
            <CompactDefinitionList
              columns="one"
              items={[
                ["출발지", selectedRequest.from],
                ["도착지", selectedRequest.to],
                ["보낼 항목", selectedRequest.items.join(" / ")],
                ["전달 메모", selectedRequest.memo],
              ]}
            />
            <div className="grid grid-cols-3 gap-2">
              <WaflButton size="sm" variant="secondary" title="배송요청 공유" aria-label="배송요청 공유">
                <Share2 size={14} aria-hidden="true" />
                <span className={isMobilePreview ? "sr-only" : ""}>공유</span>
              </WaflButton>
              <WaflButton size="sm" variant="ghost" title="배송요청 인쇄" aria-label="배송요청 인쇄">
                <Printer size={14} aria-hidden="true" />
                <span className={isMobilePreview ? "sr-only" : ""}>인쇄</span>
              </WaflButton>
              <WaflButton size="sm" variant="ghost" title="배송요청 저장" aria-label="배송요청 저장">
                <Download size={14} aria-hidden="true" />
                <span className={isMobilePreview ? "sr-only" : ""}>저장</span>
              </WaflButton>
            </div>
          </WaflSurface>
        ) : null}
      </div>
    </WaflCard>
  );
}

function SectionContent({
  product,
  activeTab,
  images,
  attachments,
  selectedImage,
  onSelectImage,
  onAddImage,
  onAddAttachment,
  onDeleteImage,
  onDeleteAttachment,
  onToggleAttachmentIncluded,
  onAddFabric,
  onAddAccessory,
  onOpenDrawer,
  onConfirmAction,
  compactImageActions = false,
  previewMode = "desktop",
}: {
  product: ProductMock;
  activeTab: SheetTab;
  images: ImageMock[];
  attachments: AttachmentMock[];
  selectedImage: ImageMock | null;
  onSelectImage: (imageId: string) => void;
  onAddImage: (sourceType: ImageMock["type"]) => void;
  onAddAttachment: () => void;
  onDeleteImage: (imageId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onToggleAttachmentIncluded: (attachmentId: string) => void;
  onAddFabric?: () => void;
  onAddAccessory?: () => void;
  onOpenDrawer: (kind: DrawerKind) => void;
  onConfirmAction: (action: ConfirmAction) => void;
  compactImageActions?: boolean;
  previewMode?: "desktop" | "tablet" | "mobile";
}) {
  if (activeTab === "overview") {
    return <OverviewContent product={product} />;
  }
  if (activeTab === "images") {
    return (
      <ImageAttachmentContent
        images={images}
        attachments={attachments}
        selectedImage={selectedImage}
        onSelectImage={onSelectImage}
        onAddImage={onAddImage}
        onAddAttachment={onAddAttachment}
        onDeleteImage={onDeleteImage}
        onDeleteAttachment={onDeleteAttachment}
        compactActions={compactImageActions}
        previewMode={previewMode}
      />
    );
  }
  if (activeTab === "sizeColor") {
    return <SizeColorContent product={product} />;
  }
  if (activeTab === "fabric") {
    return <FabricContent product={product} onAdd={onAddFabric} onViewAll={() => onOpenDrawer("fabric")} onConfirmAction={onConfirmAction} />;
  }
  if (activeTab === "accessory") {
    return <AccessoryContent product={product} onAdd={onAddAccessory} onViewAll={() => onOpenDrawer("accessory")} onConfirmAction={onConfirmAction} />;
  }
  if (activeTab === "process") {
    return <ProcessContent product={product} />;
  }
  if (activeTab === "pdf") {
    return (
      <PdfContent
        product={product}
        selectedImage={selectedImage}
        attachments={attachments}
        onToggleAttachmentIncluded={onToggleAttachmentIncluded}
        previewMode={previewMode}
      />
    );
  }
  return <OverviewContent product={product} />;
}

function DrawerPanel({
  product,
  kind,
  onClose,
  mode = "desktop",
}: {
  product: ProductMock;
  kind: DrawerKind;
  onClose: () => void;
  mode?: "desktop" | "tablet" | "mobile";
}) {
  if (!kind) {
    return null;
  }

  const titleMap: Record<Exclude<DrawerKind, null>, string> = {
    fabric: "원단 리스트",
    accessory: "부자재 리스트",
    process: "공정 리스트",
    pdf: "출력 문서",
  };
  const stats = summaryStats(product);
  const rows =
    kind === "fabric"
      ? product.fabrics.map((item, index) => {
          const flow = quantityFlow(item.quantity, index);
          return [item.color, item.name, `여유 ${flow.allowance} · 발주 ${flow.order}`, flow.handling];
        })
      : kind === "accessory"
        ? product.accessories.map((item, index) => {
            const flow = quantityFlow(item.quantity, index);
            return [item.category, item.name, `여유 ${flow.allowance} · 발주 ${flow.order}`, flow.handling];
          })
        : kind === "process"
          ? product.processes.map((item) => [item.step, item.partner, item.quantity, item.status.label])
          : [["문서 출력", stats.currentPdf.label, "보기", "공유/인쇄"]];

  return (
    <WaflSurface
      component={mode === "mobile" ? "v2-bottom-sheet-mock" : "v2-inline-drawer-mock"}
      tone="selected"
      className={mode === "mobile" ? "space-y-3 rounded-t-[22px] border-t border-[var(--pbp-border)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]" : "space-y-4 p-4"}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pbp-brand-soft)]">
            {mode === "mobile" ? "Bottom sheet" : "Detail drawer"}
          </p>
          <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
            {titleMap[kind]}
          </h3>
          <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">
            전체 리스트와 편집 진입 위치를 한 패널에서 확인합니다.
          </p>
        </div>
        <WaflButton size="sm" variant="ghost" onClick={onClose} aria-label="패널 닫기">
          <X size={14} aria-hidden="true" />
          닫기
        </WaflButton>
      </div>
      {kind === "fabric" || kind === "accessory" ? <MaterialAssistTools /> : null}
      {kind === "process" ? <ProcessReferencePanel /> : null}
      <div className="max-h-[360px] overflow-y-auto wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)]">
        <div className="divide-y divide-[var(--pbp-border)]">
          {rows.map(([a, b, c, d]) => (
            <div key={`${a}-${b}`} className="grid gap-2 px-3 py-3 text-xs sm:grid-cols-[0.7fr_1fr_0.7fr_0.7fr]">
              <span className="font-bold text-[var(--pbp-brand-primary)]">{a}</span>
              <span className="font-semibold text-[var(--pbp-text-primary)]">{b}</span>
              <span className="text-[var(--pbp-text-muted)]">{c}</span>
              <span className="text-[var(--pbp-text-muted)]">{d}</span>
            </div>
          ))}
        </div>
      </div>
    </WaflSurface>
  );
}

function ConfirmActionPanel({
  action,
  onClose,
  mode = "desktop",
}: {
  action: ConfirmAction;
  onClose: () => void;
  mode?: "desktop" | "tablet" | "mobile";
}) {
  if (!action) {
    return null;
  }

  const titleMap: Record<ConfirmActionKind, string> = {
    delete: "이 항목을 삭제할까요?",
    orderRequest: "발주 요청을 보낼까요?",
    orderMissing: "발주 요청 전 확인이 필요합니다.",
    orderComplete: "발주 완료로 처리할까요?",
  };
  const primaryLabelMap: Record<ConfirmActionKind, string> = {
    delete: "삭제",
    orderRequest: "발주 요청",
    orderMissing: "입력하기",
    orderComplete: "발주 완료",
  };
  const tone: WaflInfoBoxTone = action.kind === "delete" || action.kind === "orderMissing" ? "warning" : "info";
  const isMobile = mode === "mobile";

  return (
    <WaflSurface
      component={isMobile ? "v2-confirm-bottom-sheet-mock" : "v2-confirm-panel-mock"}
      tone="selected"
      className={isMobile ? "space-y-3 rounded-t-[22px] border-t border-[var(--pbp-border)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]" : "space-y-4 p-4"}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pbp-brand-soft)]">
            Confirm mock
          </p>
          <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">{titleMap[action.kind]}</h3>
          <p className="mt-1 truncate text-xs font-semibold text-[var(--pbp-text-muted)]">{action.itemTitle}</p>
        </div>
        <WaflButton size="sm" variant="ghost" onClick={onClose} aria-label="확인 패널 닫기">
          <X size={14} aria-hidden="true" />
          닫기
        </WaflButton>
      </div>
      <WaflInfoBox tone={tone}>
        {action.kind === "delete" ? (
          <p className="text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
            삭제하면 이 제작 카드 mock에서만 제거되는 흐름을 보여줍니다. 실제 파일 삭제나 DB 변경은 연결하지 않습니다.
          </p>
        ) : action.kind === "orderMissing" ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
              발주 요청 전에 아래 정보가 필요합니다.
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs font-bold text-[var(--pbp-text-primary)]">
              {action.missing?.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ) : (
          <CompactDefinitionList
            columns="one"
            items={[
              ["거래처", action.supplier || "미정"],
              ["필요/여유/재고", `${action.quantity.required} · ${action.quantity.allowance} · ${action.quantity.stock}`],
              ["발주 수량", action.quantity.order],
              ["예상 금액", action.amount],
            ]}
          />
        )}
      </WaflInfoBox>
      <div className="grid grid-cols-2 gap-2">
        <WaflButton size="md" variant="secondary" width="full" onClick={onClose}>
          취소
        </WaflButton>
        <WaflButton size="md" variant={action.kind === "delete" ? "danger" : "primary"} width="full" onClick={onClose}>
          {primaryLabelMap[action.kind]}
        </WaflButton>
      </div>
    </WaflSurface>
  );
}

function AssistantPanel({
  product,
  activeTab,
  collapsed = false,
  onToggle,
}: {
  product: ProductMock;
  activeTab: SheetTab;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const tabFallback: Record<SheetTab, { title: string; detail: string; tone: WaflBadgeTone }> = {
    overview: {
      title: "현재 제작 카드 확인",
      detail: "선택한 섹션의 입력 상태를 보고 다음 작업을 정합니다.",
      tone: "info",
    },
    images: {
      title: "대표 이미지와 첨부 확인",
      detail: "대표 이미지는 작업지시서와 공유 문서에 함께 보이는 기준 이미지입니다.",
      tone: "info",
    },
    sizeColor: {
      title: "사이즈·색상 수량 확인",
      detail: "표준 사이즈를 불러온 뒤 색상별 수량 합계가 제작 수량과 맞는지 확인합니다.",
      tone: "warning",
    },
    fabric: {
      title: "원단 발주 정보 확인",
      detail: "거래처, 단가, 재고 사용, 로스/여유를 확인한 뒤 발주 요청으로 진행합니다.",
      tone: "warning",
    },
    accessory: {
      title: "부자재 발주 정보 확인",
      detail: "카테고리별 옵션과 공급처를 확인한 뒤 필요한 항목만 발주 요청합니다.",
      tone: "warning",
    },
    process: {
      title: "제작 플로우 메모 확인",
      detail: "제작 공장과 추가 공정에 전달할 수량, 단가, 메모를 확인합니다.",
      tone: "info",
    },
    pdf: {
      title: "출력·공유 전 포함 항목 확인",
      detail: "대표 이미지, 사이즈·색상, 원부자재, 제작 플로우가 문서에 포함되는지 확인합니다.",
      tone: "brand",
    },
  };
  const action = product.assistant[activeTab] ?? tabFallback[activeTab];
  const actionTone = toInfoBoxTone(action.tone);
  const stats = summaryStats(product);
  const blockingCount = stats.missingPriceCount + stats.unorderedCount;

  return (
    <WaflSurface as="aside" component="v2-assistant-panel" tone="surface" className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pbp-brand-soft)]">
            Assistant
          </p>
          <h3 className="mt-1 text-lg font-bold text-[var(--pbp-text-primary)]">
            다음 작업
          </h3>
        </div>
        {onToggle ? (
          <WaflButton size="sm" variant="ghost" onClick={onToggle}>
            {collapsed ? "펼치기" : "접기"}
          </WaflButton>
        ) : (
          <Sparkles className="text-[var(--pbp-brand-primary)]" size={20} />
        )}
      </div>
      {collapsed ? (
        <WaflInfoBox tone={actionTone}>
          <p className="text-sm font-bold text-[var(--pbp-text-primary)]">{action.title}</p>
        </WaflInfoBox>
      ) : (
        <>
          <WaflInfoBox tone={actionTone} component="v2-next-action-card">
            <div className="flex items-start gap-3">
              <Share2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-[var(--pbp-text-primary)]">{action.title}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">{action.detail}</p>
              </div>
            </div>
          </WaflInfoBox>
          <CompactDefinitionList
            columns="one"
            items={[
              ["현재 막힘", blockingCount > 0 ? "확인 필요 있음" : "큰 막힘 없음"],
              ["다음 추천", action.title],
              ["출력·공유 가능 여부", stats.currentPdf.label],
            ]}
          />
          <div className="grid gap-2">
            <WaflButton size="md" variant="primary" width="full">현재 섹션 작업</WaflButton>
            <WaflButton size="md" variant="secondary" width="full">출력·공유 확인</WaflButton>
          </div>
        </>
      )}
    </WaflSurface>
  );
}

function DesktopPrototype({
  selectedProduct,
  activeTab,
  images,
  attachments,
  selectedImage,
  confirmAction,
  drawerKind,
  onProduct,
  onTab,
  onSelectImage,
  onAddImage,
  onAddAttachment,
  onDeleteImage,
  onDeleteAttachment,
  onToggleAttachmentIncluded,
  onDrawer,
  onConfirmAction,
  onCloseConfirm,
}: {
  selectedProduct: ProductMock;
  activeTab: SheetTab;
  images: ImageMock[];
  attachments: AttachmentMock[];
  selectedImage: ImageMock | null;
  confirmAction: ConfirmAction;
  drawerKind: DrawerKind;
  onProduct: (productId: string) => void;
  onTab: (tab: SheetTab) => void;
  onSelectImage: (imageId: string) => void;
  onAddImage: (sourceType: ImageMock["type"]) => void;
  onAddAttachment: () => void;
  onDeleteImage: (imageId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onToggleAttachmentIncluded: (attachmentId: string) => void;
  onDrawer: (kind: DrawerKind) => void;
  onConfirmAction: (action: ConfirmAction) => void;
  onCloseConfirm: () => void;
}) {
  return (
    <div className="grid h-[min(780px,calc(100vh-8rem))] min-h-[640px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <div className="min-h-0 overflow-y-auto pr-1">
        <ProductExplorer selectedProduct={selectedProduct} onSelect={onProduct} />
      </div>
      <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
        <SheetSummaryHeader product={selectedProduct} selectedImage={selectedImage} />
        <SectionTabs activeTab={activeTab} onChange={onTab} product={selectedProduct} />
        <SectionContent
          product={selectedProduct}
          activeTab={activeTab}
          images={images}
          attachments={attachments}
          selectedImage={selectedImage}
          onSelectImage={onSelectImage}
          onAddImage={onAddImage}
          onAddAttachment={onAddAttachment}
          onDeleteImage={onDeleteImage}
          onDeleteAttachment={onDeleteAttachment}
          onToggleAttachmentIncluded={onToggleAttachmentIncluded}
          onOpenDrawer={onDrawer}
          onConfirmAction={onConfirmAction}
        />
        <ConfirmActionPanel action={confirmAction} onClose={onCloseConfirm} />
        <DrawerPanel product={selectedProduct} kind={drawerKind} onClose={() => onDrawer(null)} />
      </div>
      <div className="min-h-0 overflow-y-auto pl-1">
        <AssistantPanel product={selectedProduct} activeTab={activeTab} />
      </div>
    </div>
  );
}

function TabletPrototype({
  selectedProduct,
  activeTab,
  images,
  attachments,
  selectedImage,
  confirmAction,
  drawerKind,
  assistantOpen,
  orientation,
  onProduct,
  onTab,
  onSelectImage,
  onAddImage,
  onAddAttachment,
  onDeleteImage,
  onDeleteAttachment,
  onToggleAttachmentIncluded,
  onDrawer,
  onConfirmAction,
  onCloseConfirm,
  onAssistantToggle,
}: {
  selectedProduct: ProductMock;
  activeTab: SheetTab;
  images: ImageMock[];
  attachments: AttachmentMock[];
  selectedImage: ImageMock | null;
  confirmAction: ConfirmAction;
  drawerKind: DrawerKind;
  assistantOpen: boolean;
  orientation: "portrait" | "landscape";
  onProduct: (productId: string) => void;
  onTab: (tab: SheetTab) => void;
  onSelectImage: (imageId: string) => void;
  onAddImage: (sourceType: ImageMock["type"]) => void;
  onAddAttachment: () => void;
  onDeleteImage: (imageId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onToggleAttachmentIncluded: (attachmentId: string) => void;
  onDrawer: (kind: DrawerKind) => void;
  onConfirmAction: (action: ConfirmAction) => void;
  onCloseConfirm: () => void;
  onAssistantToggle: () => void;
}) {
  const isLandscape = orientation === "landscape";
  const [selectorOpen, setSelectorOpen] = useState(false);

  return (
    <div className="overflow-x-auto pb-2">
      <WaflCard
        padding="lg"
        className={`relative mx-auto h-[760px] w-[768px] max-w-none overflow-hidden ${isLandscape ? "h-[680px] w-[1024px]" : ""}`}
      >
        <div className={`grid h-full min-h-0 gap-4 ${isLandscape ? "grid-cols-[230px_minmax(0,1fr)_260px]" : "grid-cols-1 grid-rows-[minmax(0,1fr)_auto]"}`}>
          {isLandscape ? (
            <div className="min-h-0 overflow-y-auto pr-1">
              <ProductExplorer selectedProduct={selectedProduct} onSelect={onProduct} compact />
            </div>
          ) : null}
          <div className="min-h-0 min-w-0 space-y-4 overflow-y-auto pr-1">
            {!isLandscape ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <WaflButton size="sm" variant="secondary" onClick={() => setSelectorOpen((value) => !value)}>
                  제품 선택
                </WaflButton>
                <WaflBadge tone="neutral" size="xs">선택: {selectedProduct.name}</WaflBadge>
              </div>
            ) : null}
            <SheetSummaryHeader product={selectedProduct} selectedImage={selectedImage} />
            <SectionTabs activeTab={activeTab} onChange={onTab} product={selectedProduct} />
            <SectionContent
              product={selectedProduct}
              activeTab={activeTab}
              images={images}
              attachments={attachments}
              selectedImage={selectedImage}
              onSelectImage={onSelectImage}
              onAddImage={onAddImage}
              onAddAttachment={onAddAttachment}
              onDeleteImage={onDeleteImage}
              onDeleteAttachment={onDeleteAttachment}
              onToggleAttachmentIncluded={onToggleAttachmentIncluded}
              onOpenDrawer={onDrawer}
              onConfirmAction={onConfirmAction}
              compactImageActions={!isLandscape}
              previewMode="tablet"
            />
            <ConfirmActionPanel action={confirmAction} onClose={onCloseConfirm} mode="tablet" />
            <DrawerPanel product={selectedProduct} kind={drawerKind} onClose={() => onDrawer(null)} mode="tablet" />
          </div>
          <div className="min-h-0 overflow-y-auto pl-1">
            <AssistantPanel
              product={selectedProduct}
              activeTab={activeTab}
              collapsed={!assistantOpen}
              onToggle={onAssistantToggle}
            />
          </div>
        </div>
        {!isLandscape && selectorOpen ? (
          <div className="absolute inset-x-4 bottom-4 max-h-[360px] overflow-y-auto shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
            <ProductExplorer selectedProduct={selectedProduct} onSelect={(productId) => {
              onProduct(productId);
              setSelectorOpen(false);
            }} compact />
          </div>
        ) : null}
      </WaflCard>
    </div>
  );
}

function MobileProductSelector({
  selectedProduct,
  onSelect,
  onClose,
}: {
  selectedProduct: ProductMock;
  onSelect: (productId: string) => void;
  onClose: () => void;
}) {
  return (
    <WaflSurface component="v2-mobile-product-selector" tone="selected" className="space-y-3 rounded-t-[22px] border-t border-[var(--pbp-border)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[var(--pbp-text-primary)]">제품 선택</h3>
        <WaflButton size="sm" variant="ghost" onClick={onClose}>
          <X size={14} aria-hidden="true" />
          닫기
        </WaflButton>
      </div>
      <WaflInput className="text-base" value={selectedProduct.name} readOnly aria-label="제품 검색" />
      <div className="grid gap-2">
        {products.map((product) => (
          <button
            key={`${product.id}-mobile-select`}
            type="button"
            onClick={() => {
              onSelect(product.id);
              onClose();
            }}
            className={`wafl-shape-control border p-3 text-left ${
              product.id === selectedProduct.id
                ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-bg)]"
                : "border-[var(--pbp-border)] bg-[var(--pbp-surface)]"
            }`}
          >
            <p className="truncate text-sm font-bold text-[var(--pbp-text-primary)]">{product.name}</p>
            <p className="mt-1 text-xs font-semibold text-[var(--pbp-text-muted)]">
              {product.quantity} · 납기 {product.due}
            </p>
          </button>
        ))}
      </div>
    </WaflSurface>
  );
}

function MobileMaterialEditor({
  kind,
  onClose,
}: {
  kind: Exclude<EditorKind, null>;
  onClose: () => void;
}) {
  const isFabric = kind === "fabric";
  const fields = isFabric
    ? [
        ["원단명", "코튼 30수"],
        ["색상", "아이보리"],
        ["거래처", "거래처에서 불러오기"],
        ["필요 수량", "180"],
        ["로스/여유", "20"],
        ["단위", "yd"],
        ["단가", "3,800원"],
        ["재고 사용", "40yd"],
        ["발주 수량", "160yd"],
        ["남는 수량 처리", "남는 수량 없음"],
      ]
    : [
        ["부자재명", "18mm 소뿔 단추"],
        ["카테고리", "단추"],
        ["색상/옵션", "18mm / 무광 / 니켈"],
        ["거래처", "거래처에서 불러오기"],
        ["필요 수량", "520"],
        ["로스/여유", "20"],
        ["단위", "개"],
        ["단가", "120원"],
        ["재고 사용", "80개"],
        ["발주 수량", "460개"],
        ["남는 수량 처리", "공장 여유분"],
      ];

  return (
    <WaflSurface
      component="v2-mobile-material-editor"
      tone="selected"
      className="space-y-3 rounded-t-[22px] border-t border-[var(--pbp-border)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--pbp-brand-soft)]">입력 패널</p>
          <h3 className="mt-1 text-base font-bold text-[var(--pbp-text-primary)]">
            {isFabric ? "원단 추가" : "부자재 추가"}
          </h3>
        </div>
        <WaflButton size="sm" variant="ghost" onClick={onClose}>
          <X size={14} aria-hidden="true" />
          닫기
        </WaflButton>
      </div>
      <div className="grid gap-2">
        {fields.map(([label, value]) => (
          <label key={label} className="grid gap-1 text-xs font-bold text-[var(--pbp-text-primary)]">
            {label}
            <WaflInput className="text-base" defaultValue={value} aria-label={label} />
          </label>
        ))}
        <label className="grid gap-1 text-xs font-bold text-[var(--pbp-text-primary)]">
          메모
          <WaflTextarea
            className="min-h-20 text-base"
            defaultValue={isFabric ? "재고 사용 후 로스분을 포함해 부족분만 발주합니다." : "초과 발주는 공장 여유분으로 표시합니다."}
            aria-label="메모"
          />
        </label>
      </div>
      <div className="grid gap-2">
        <p className="text-[11px] font-bold text-[var(--pbp-text-muted)]">보조 기능</p>
        <div className="grid grid-cols-3 gap-1.5">
          <WaflButton size="sm" variant="secondary">이전 기록</WaflButton>
          <WaflButton size="sm" variant="secondary">재고 사용</WaflButton>
          <WaflButton size="sm" variant="secondary">거래처 기록</WaflButton>
        </div>
      </div>
      <div className="grid gap-2">
        <p className="text-[11px] font-bold text-[var(--pbp-text-muted)]">단위 선택</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {[...baseUnits.slice(0, 5), ...companyUnits.slice(0, 2)].map((unit) => (
            <WaflBadge key={`${kind}-${unit}`} tone={unit === (isFabric ? "yd" : "개") ? "brand" : "neutral"} size="xs">
              {unit}
            </WaflBadge>
          ))}
          <WaflBadge tone="warning" size="xs">단위 추가 요청</WaflBadge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <WaflButton size="md" variant="secondary" width="full" onClick={onClose}>
          닫기
        </WaflButton>
        <WaflButton size="md" variant="primary" width="full" onClick={onClose}>
          저장
        </WaflButton>
      </div>
    </WaflSurface>
  );
}

function MobilePrototype({
  selectedProduct,
  activeTab,
  images,
  attachments,
  selectedImage,
  confirmAction,
  drawerKind,
  onProduct,
  onTab,
  onSelectImage,
  onAddImage,
  onAddAttachment,
  onDeleteImage,
  onDeleteAttachment,
  onToggleAttachmentIncluded,
  onDrawer,
  onConfirmAction,
  onCloseConfirm,
}: {
  selectedProduct: ProductMock;
  activeTab: SheetTab;
  images: ImageMock[];
  attachments: AttachmentMock[];
  selectedImage: ImageMock | null;
  confirmAction: ConfirmAction;
  drawerKind: DrawerKind;
  onProduct: (productId: string) => void;
  onTab: (tab: SheetTab) => void;
  onSelectImage: (imageId: string) => void;
  onAddImage: (sourceType: ImageMock["type"]) => void;
  onAddAttachment: () => void;
  onDeleteImage: (imageId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onToggleAttachmentIncluded: (attachmentId: string) => void;
  onDrawer: (kind: DrawerKind) => void;
  onConfirmAction: (action: ConfirmAction) => void;
  onCloseConfirm: () => void;
}) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editorKind, setEditorKind] = useState<EditorKind>(null);
  const stats = summaryStats(selectedProduct);
  const purpose = sheetPurposeLabel(selectedProduct.status);
  const alertCounts = tabAlertCounts(selectedProduct);

  return (
    <div className="overflow-x-auto pb-2">
    <div className="mx-auto w-[390px] max-w-none overflow-hidden wafl-shape-surface border border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)]">
      <div className="sticky top-0 z-10 border-b border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--pbp-text-primary)]">{selectedProduct.name}</p>
            <p className="truncate text-xs font-semibold text-[var(--pbp-text-muted)]">{purpose.label} · {selectedProduct.quantity}</p>
          </div>
          <ProductThumbnail product={selectedProduct} image={selectedImage} size="sm" />
        </div>
        <p className="mt-2 truncate border-y border-[var(--pbp-border)] py-1.5 text-[11px] font-semibold text-[var(--pbp-text-muted)]">
          총 예상 <span className="text-[var(--pbp-text-primary)]">{formatWon(stats.totalAmount)}</span>
          <span className="mx-1.5 text-[var(--pbp-border-strong)]">/</span>
          제작 상태 <span className="text-[var(--pbp-text-primary)]">{purpose.label}</span>
        </p>
        <WaflButton size="sm" variant="secondary" width="full" className="mt-3" onClick={() => setSelectorOpen((value) => !value)}>
          제품 검색·선택
        </WaflButton>
        <div className="mt-2 grid grid-flow-col auto-cols-[4.75rem] gap-2 overflow-x-auto">
          {sheetTabs.map((tab) => {
            const Icon = tab.icon;
            const alertCount = tab.id === "fabric" ? alertCounts.fabric : tab.id === "accessory" ? alertCounts.accessory : 0;
            return (
              <WaflButton
                key={`${tab.id}-mobile`}
                size="sm"
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                aria-label={tab.label}
                title={tab.label}
                onClick={() => onTab(tab.id)}
                className="relative"
              >
                <Icon size={14} aria-hidden="true" />
                {alertCount > 0 ? (
                  <span
                    aria-label={`${tab.label} 작업 필요 ${alertCount}건`}
                    className="absolute right-1 top-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-[var(--pbp-status-warning-border)] bg-[var(--pbp-status-warning-bg)] px-1 text-[9px] font-bold leading-none text-[var(--pbp-status-warning-fg)]"
                  >
                    {alertCount}
                  </span>
                ) : null}
                <span className="sr-only">{tab.label}</span>
              </WaflButton>
            );
          })}
        </div>
      </div>
      <div className="grid gap-3 p-3">
        {selectorOpen ? (
          <MobileProductSelector selectedProduct={selectedProduct} onSelect={onProduct} onClose={() => setSelectorOpen(false)} />
        ) : null}
        {editorKind ? (
          <MobileMaterialEditor kind={editorKind} onClose={() => setEditorKind(null)} />
        ) : (
          <SectionContent
            product={selectedProduct}
            activeTab={activeTab}
            images={images}
            attachments={attachments}
            selectedImage={selectedImage}
            onSelectImage={onSelectImage}
            onAddImage={onAddImage}
            onAddAttachment={onAddAttachment}
            onDeleteImage={onDeleteImage}
            onDeleteAttachment={onDeleteAttachment}
            onToggleAttachmentIncluded={onToggleAttachmentIncluded}
            onAddFabric={() => setEditorKind("fabric")}
            onAddAccessory={() => setEditorKind("accessory")}
            onOpenDrawer={onDrawer}
            onConfirmAction={onConfirmAction}
            compactImageActions
            previewMode="mobile"
          />
        )}
      </div>
      <ConfirmActionPanel action={confirmAction} onClose={onCloseConfirm} mode="mobile" />
      {drawerKind ? (
        <DrawerPanel product={selectedProduct} kind={drawerKind} onClose={() => onDrawer(null)} mode="mobile" />
      ) : null}
    </div>
    </div>
  );
}

function InteractivePrototypeShowroom() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const [activeTab, setActiveTab] = useState<SheetTab>("overview");
  const [drawerKind, setDrawerKind] = useState<DrawerKind>(null);
  const [tabletAssistantOpen, setTabletAssistantOpen] = useState(false);
  const [imageAssets, setImageAssets] = useState<Record<string, ImageMock[]>>(() =>
    Object.fromEntries(products.map((product) => [product.id, imageMocks(product)]))
  );
  const [attachmentAssets, setAttachmentAssets] = useState<Record<string, AttachmentMock[]>>(() =>
    Object.fromEntries(products.map((product) => [product.id, attachmentMocks(product)]))
  );
  const [selectedImageIds, setSelectedImageIds] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(products.map((product) => [product.id, defaultImageId(product)]))
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0];
  const images = imageAssets[selectedProduct.id] ?? [];
  const attachments = attachmentAssets[selectedProduct.id] ?? [];
  const selectedImageId = selectedImageIds[selectedProduct.id] ?? null;
  const selectedImage = getSelectedImage(images, selectedImageId);

  const handleProduct = (productId: string) => {
    setSelectedProductId(productId);
    setDrawerKind(null);
    setConfirmAction(null);
  };

  const handleTab = (tab: SheetTab) => {
    setActiveTab(tab);
    setDrawerKind(null);
    setConfirmAction(null);
  };

  const handleSelectImage = (imageId: string) => {
    setSelectedImageIds((current) => ({ ...current, [selectedProduct.id]: imageId }));
  };

  const handleAddImage = (sourceType: ImageMock["type"]) => {
    const labelMap: Record<ImageMock["type"], { label: string; tone: WaflBadgeTone; prefix: string }> = {
      image: { label: "이미지", tone: "brand", prefix: "upload-image" },
      camera: { label: "사진", tone: "success", prefix: "camera-shot" },
      sketch: { label: "스케치", tone: "info", prefix: "sketch-result" },
      reference: { label: "참고", tone: "warning", prefix: "reference" },
    };
    const meta = labelMap[sourceType];
    setImageAssets((current) => {
      const currentImages = current[selectedProduct.id] ?? [];
      const nextIndex = currentImages.length + 1;
      const nextImage: ImageMock = {
        id: `${selectedProduct.id}-${meta.prefix}-${Date.now()}`,
        name: `${meta.prefix}-${String(nextIndex).padStart(2, "0")}.webp`,
        type: sourceType,
        label: meta.label,
        tone: meta.tone,
        note: "local mock으로 추가된 이미지 자산",
      };
      if (currentImages.length === 0) {
        setSelectedImageIds((selected) => ({ ...selected, [selectedProduct.id]: nextImage.id }));
      }
      return { ...current, [selectedProduct.id]: [...currentImages, nextImage] };
    });
  };

  const handleDeleteImage = (imageId: string) => {
    setImageAssets((current) => {
      const currentImages = current[selectedProduct.id] ?? [];
      const nextImages = currentImages.filter((image) => image.id !== imageId);
      setSelectedImageIds((selected) => {
        if (selected[selectedProduct.id] !== imageId) {
          return selected;
        }
        return { ...selected, [selectedProduct.id]: nextImages[0]?.id ?? null };
      });
      return { ...current, [selectedProduct.id]: nextImages };
    });
  };

  const handleAddAttachment = () => {
    setAttachmentAssets((current) => {
      const currentAttachments = current[selectedProduct.id] ?? [];
      const nextIndex = currentAttachments.length + 1;
      const nextAttachment: AttachmentMock = {
        id: `${selectedProduct.id}-attachment-${Date.now()}`,
        name: `추가 첨부-${String(nextIndex).padStart(2, "0")}.pdf`,
        type: "PDF",
        detail: "local mock 첨부",
        tone: "neutral",
        included: false,
      };
      return { ...current, [selectedProduct.id]: [...currentAttachments, nextAttachment] };
    });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachmentAssets((current) => ({
      ...current,
      [selectedProduct.id]: (current[selectedProduct.id] ?? []).filter((attachment) => attachment.id !== attachmentId),
    }));
  };

  const handleToggleAttachmentIncluded = (attachmentId: string) => {
    setAttachmentAssets((current) => ({
      ...current,
      [selectedProduct.id]: (current[selectedProduct.id] ?? []).map((attachment) =>
        attachment.id === attachmentId ? { ...attachment, included: !attachment.included } : attachment
      ),
    }));
  };

  return (
    <ShowroomSection
      eyebrow="Interactive prototype"
      title="PC / Tablet / Mobile 입력·발주·출력 흐름"
      description="저장, 공유, 발주 실행은 연결하지 않고 화면 흐름만 확인합니다."
    >
      <div className="space-y-4">
        <DeviceModeSwitcher deviceMode={deviceMode} onChange={setDeviceMode} />
        {deviceMode === "desktop" ? (
          <DesktopPrototype
            selectedProduct={selectedProduct}
            activeTab={activeTab}
            images={images}
            attachments={attachments}
            selectedImage={selectedImage}
            confirmAction={confirmAction}
            drawerKind={drawerKind}
            onProduct={handleProduct}
            onTab={handleTab}
            onSelectImage={handleSelectImage}
            onAddImage={handleAddImage}
            onAddAttachment={handleAddAttachment}
            onDeleteImage={handleDeleteImage}
            onDeleteAttachment={handleDeleteAttachment}
            onToggleAttachmentIncluded={handleToggleAttachmentIncluded}
            onDrawer={setDrawerKind}
            onConfirmAction={setConfirmAction}
            onCloseConfirm={() => setConfirmAction(null)}
          />
        ) : null}
        {deviceMode === "tabletPortrait" ? (
          <TabletPrototype
            selectedProduct={selectedProduct}
            activeTab={activeTab}
            images={images}
            attachments={attachments}
            selectedImage={selectedImage}
            confirmAction={confirmAction}
            drawerKind={drawerKind}
            assistantOpen={tabletAssistantOpen}
            orientation="portrait"
            onProduct={handleProduct}
            onTab={handleTab}
            onSelectImage={handleSelectImage}
            onAddImage={handleAddImage}
            onAddAttachment={handleAddAttachment}
            onDeleteImage={handleDeleteImage}
            onDeleteAttachment={handleDeleteAttachment}
            onToggleAttachmentIncluded={handleToggleAttachmentIncluded}
            onDrawer={setDrawerKind}
            onConfirmAction={setConfirmAction}
            onCloseConfirm={() => setConfirmAction(null)}
            onAssistantToggle={() => setTabletAssistantOpen((value) => !value)}
          />
        ) : null}
        {deviceMode === "tabletLandscape" ? (
          <TabletPrototype
            selectedProduct={selectedProduct}
            activeTab={activeTab}
            images={images}
            attachments={attachments}
            selectedImage={selectedImage}
            confirmAction={confirmAction}
            drawerKind={drawerKind}
            assistantOpen={tabletAssistantOpen}
            orientation="landscape"
            onProduct={handleProduct}
            onTab={handleTab}
            onSelectImage={handleSelectImage}
            onAddImage={handleAddImage}
            onAddAttachment={handleAddAttachment}
            onDeleteImage={handleDeleteImage}
            onDeleteAttachment={handleDeleteAttachment}
            onToggleAttachmentIncluded={handleToggleAttachmentIncluded}
            onDrawer={setDrawerKind}
            onConfirmAction={setConfirmAction}
            onCloseConfirm={() => setConfirmAction(null)}
            onAssistantToggle={() => setTabletAssistantOpen((value) => !value)}
          />
        ) : null}
        {deviceMode === "mobile" ? (
          <MobilePrototype
            selectedProduct={selectedProduct}
            activeTab={activeTab}
            images={images}
            attachments={attachments}
            selectedImage={selectedImage}
            confirmAction={confirmAction}
            drawerKind={drawerKind}
            onProduct={handleProduct}
            onTab={handleTab}
            onSelectImage={handleSelectImage}
            onAddImage={handleAddImage}
            onAddAttachment={handleAddAttachment}
            onDeleteImage={handleDeleteImage}
            onDeleteAttachment={handleDeleteAttachment}
            onToggleAttachmentIncluded={handleToggleAttachmentIncluded}
            onDrawer={setDrawerKind}
            onConfirmAction={setConfirmAction}
            onCloseConfirm={() => setConfirmAction(null)}
          />
        ) : null}
      </div>
    </ShowroomSection>
  );
}

function ResponsiveComparison() {
  return (
    <ShowroomSection
      eyebrow="Comparison"
      title="Device별 구조 요약"
      description="세 prototype을 한꺼번에 길게 나열하지 않고, 보기 전환으로 하나씩 확인하는 구조입니다."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {deviceModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <WaflCard key={mode.id} padding="lg" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[var(--pbp-text-primary)]">{mode.label}</h3>
                <Icon size={20} className="text-[var(--pbp-brand-primary)]" />
              </div>
              <p className="text-sm font-medium leading-6 text-[var(--pbp-text-muted)]">{mode.description}</p>
              <WaflBadge tone={mode.id === "desktop" ? "brand" : mode.id === "tabletPortrait" ? "info" : mode.id === "tabletLandscape" ? "warning" : "success"}>
                화면 보기
              </WaflBadge>
            </WaflCard>
          );
        })}
      </div>
    </ShowroomSection>
  );
}

function UploadArea() {
  return (
    <WaflCard padding="lg" className="overflow-hidden">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-h-[260px] overflow-hidden wafl-shape-surface border border-[var(--pbp-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--pbp-brand-primary)_16%,white),var(--pbp-surface)_48%,color-mix(in_srgb,var(--pbp-status-success-bg)_40%,white))] p-4">
          <div className="flex h-full min-h-[228px] flex-col justify-between">
            <div className="flex justify-between gap-3">
              <WaflBadge tone="brand">대표 이미지</WaflBadge>
              <Camera size={20} className="text-[var(--pbp-brand-primary)]" />
            </div>
            <div>
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[28px] border border-white/70 bg-white/55 text-[var(--pbp-brand-primary)] shadow-none">
                <Shirt size={64} strokeWidth={1.4} aria-hidden="true" />
              </div>
              <p className="mt-5 text-center text-lg font-bold text-[var(--pbp-text-primary)]">
                WAFL v2 prototype
              </p>
              <p className="mt-2 text-center text-sm font-medium leading-6 text-[var(--pbp-text-muted)]">
                실제 업로드 없이 이미지 우선 배치를 보여줍니다.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <WaflAddCardButton
            label="대표 이미지 올리기"
            description="모바일 촬영 또는 파일 선택 위치 예시"
            icon={<ImagePlus size={18} aria-hidden="true" />}
            density="spacious"
            className="w-full"
          />
        </div>
      </div>
    </WaflCard>
  );
}

function FormFieldSamples() {
  return (
    <WaflCard padding="lg" className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-[var(--pbp-text-primary)]">
          제품/스타일명
          <WaflInput className="text-base" defaultValue="셔링 원피스" aria-label="제품 스타일명" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-[var(--pbp-text-primary)]">
          수량
          <WaflInput className="text-base" inputMode="numeric" defaultValue="240" aria-label="수량" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-[var(--pbp-text-primary)]">
        공장 전달 메모
        <WaflTextarea
          className="text-base"
          defaultValue="원단/부자재 단가와 수량을 확인한 뒤 공장 전달 작업지시서를 확정합니다."
          aria-label="공장 전달 메모"
        />
      </label>
      <p className="text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
        모바일 input/textarea는 실제 텍스트 크기 16px 이상을 유지합니다.
      </p>
    </WaflCard>
  );
}

export default function V2ShowroomPrototype({
  appVersion,
  runtimeMode,
}: {
  appVersion: string;
  runtimeMode: string;
}) {
  return (
    <div
      data-wafl-v2-showroom="alpha-27"
      className="space-y-8 rounded-[28px] border border-[var(--pbp-border-strong)] bg-[color-mix(in_srgb,var(--pbp-surface)_86%,var(--pbp-brand-muted))] p-4 shadow-none sm:p-5 lg:p-6"
    >
      <WaflSurface as="header" component="v2-showroom-hero" tone="surface" className="overflow-hidden p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <WaflBadge tone="brand">WAFL v2 showroom</WaflBadge>
              <WaflBadge tone="info">v{appVersion}</WaflBadge>
              <WaflBadge tone="success">화면 흐름</WaflBadge>
              <WaflBadge tone="neutral">runtime: {runtimeMode}</WaflBadge>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-[var(--pbp-text-primary)] sm:text-4xl">
              제작 카드 핵심 입력·발주 prototype
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-[var(--pbp-text-muted)] sm:text-base">
              PC와 태블릿 가로는 패널별 내부 스크롤로 나누고, 모바일은 현재 섹션 안에서 필요한 추가·발주 액션만 보여줍니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <WaflButton variant="primary">
                <ListChecks size={16} aria-hidden="true" />
                Prototype 보기
              </WaflButton>
              <WaflButton variant="secondary">
                <Layers3 size={16} aria-hidden="true" />
                기기 전환
              </WaflButton>
            </div>
          </div>
          <UploadArea />
        </div>
      </WaflSurface>

      <InteractivePrototypeShowroom />
      <ResponsiveComparison />

      <ShowroomSection
        eyebrow="Design memo"
        title="설계 메모"
        description="업무 화면 안의 설명은 줄이고, 실제 연결하지 않는 경계는 접힌 메모에서만 확인합니다."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <FormFieldSamples />
          <details className="wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
            <summary className="cursor-pointer text-sm font-bold text-[var(--pbp-text-primary)]">
              설계 메모 보기
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--pbp-text-primary)]">상태 라벨</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sheetStatuses.map((status) => <StatusBadge key={status.code} status={status} />)}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cardStatuses.map((status) => <StatusBadge key={status.code} status={status} />)}
                </div>
              </div>
              <WaflInfoBox tone="danger">
                실제 저장, API, DB, R2, Worker, 문서 생성, 공유 링크 생성, 발주 실행은 연결하지 않습니다.
              </WaflInfoBox>
            </div>
          </details>
        </div>
      </ShowroomSection>
    </div>
  );
}
