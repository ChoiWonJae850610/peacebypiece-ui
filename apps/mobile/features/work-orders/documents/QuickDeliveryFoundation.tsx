import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type TextInput } from "react-native";
import { ChevronRight, Eye, MapPin, Search, Truck, UserRound } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { MaterialPartnerOption, WorkOrderMaterialLine } from "@/domain/mobileContract";
import {
  matchesWaflNestedSheetFocusIntent,
  type WaflNestedSheetFocusIntent,
} from "@/domain/waflNestedSheetTransitionPolicy";
import {
  resolveQuickDeliveryEndpointEntryRoute,
  type QuickDeliveryEndpointMode,
} from "@/domain/quickDeliveryEndpointRoutingPolicy";
import MaterialPartnerPickerSheet from "@/features/materials/MaterialPartnerPickerSheet";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflInputModeSwitch from "@/features/inputs/WaflInputModeSwitch";
import WaflSheetValueField from "@/features/inputs/WaflSheetValueField";
import { useWaflNestedSheetHandoff } from "@/features/inputs/useWaflNestedSheetHandoff";
import { WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";
import type { AddressSearchItem } from "@/lib/api/addressSearchApi";
import QuickDeliveryAddressSearchSheet from "./QuickDeliveryAddressSearchSheet";
import { buildQuickDeliveryGroups, quickDeliveryFactoryOptions } from "./quickDeliveryPolicy";
import { presentQuickDeliveryLocation } from "./quickDeliveryLocationPresentation";

type LocationKind = "origin" | "destination";
type QuickNestedRoute = "picker" | "direct" | "address" | "preview";
type QuickFocusIntent = WaflNestedSheetFocusIntent<LocationKind, "detail-address">;
type LocationDraft = {
  readonly mode: QuickDeliveryEndpointMode;
  readonly partnerId: string;
  readonly place: string;
  readonly zonecode: string;
  readonly basicAddress: string;
  readonly detailAddress: string;
  readonly contact: string;
};

const EMPTY_LOCATION: LocationDraft = { mode: "unset", partnerId: "", place: "", zonecode: "", basicAddress: "", detailAddress: "", contact: "" };

export default function QuickDeliveryFoundation(props: {
  readonly lines: readonly WorkOrderMaterialLine[];
  readonly partners: readonly MaterialPartnerOption[];
}) {
  const groups = useMemo(() => buildQuickDeliveryGroups(props.lines, props.partners), [props.lines, props.partners]);
  const factories = useMemo(() => quickDeliveryFactoryOptions(props.partners), [props.partners]);
  const [groupId, setGroupId] = useState(groups[0]?.partnerId ?? "");
  const [origin, setOrigin] = useState<LocationDraft>(EMPTY_LOCATION);
  const [destination, setDestination] = useState<LocationDraft>(EMPTY_LOCATION);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [memo, setMemo] = useState("");
  const nested = useWaflNestedSheetHandoff<QuickNestedRoute>("picker", { initialVisible: false });
  const [activeEndpoint, setActiveEndpoint] = useState<LocationKind | null>(null);
  const [pickerBaseline, setPickerBaseline] = useState<LocationDraft | null>(null);
  const [directDraft, setDirectDraft] = useState<LocationDraft>(EMPTY_LOCATION);
  const [focusIntent, setFocusIntent] = useState<QuickFocusIntent | null>(null);
  const detailAddressInputRef = useRef<TextInput>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);

  const effectiveGroupId = groups.some((candidate) => candidate.partnerId === groupId) ? groupId : groups[0]?.partnerId ?? "";
  const group = groups.find((candidate) => candidate.partnerId === effectiveGroupId) ?? null;
  const originPartner = props.partners.find((item) => item.id === origin.partnerId);
  const destinationPartner = factories.find((item) => item.id === destination.partnerId);
  const originPresentation = presentQuickDeliveryLocation({ ...origin, partnerName: originPartner?.name, partnerContact: origin.contact }, WAFL_UNSET_PLACEHOLDER);
  const destinationPresentation = presentQuickDeliveryLocation({ ...destination, partnerName: destinationPartner?.name, partnerContact: destination.contact }, WAFL_UNSET_PLACEHOLDER);
  const activeItems = activeEndpoint === "destination" ? factories : props.partners;
  const activeLocation = activeEndpoint === "destination" ? destination : origin;

  function setLocation(kind: LocationKind, value: LocationDraft) {
    if (kind === "origin") setOrigin(value);
    else setDestination(value);
  }

  function openEndpoint(kind: LocationKind) {
    const current = kind === "origin" ? origin : destination;
    const route = resolveQuickDeliveryEndpointEntryRoute(current.mode);
    if (!nested.present(route)) return;
    setPickerBaseline(current);
    setActiveEndpoint(kind);
    setFocusIntent(null);
    setAddressMessage(null);
    if (route === "direct") setDirectDraft(current);
  }

  function openPreview() {
    if (!nested.present("preview")) return;
    setActiveEndpoint(null);
    setPickerBaseline(null);
    setFocusIntent(null);
  }

  function closePreview() {
    nested.dismiss();
  }

  function cancelPicker() {
    if (activeEndpoint && pickerBaseline) setLocation(activeEndpoint, pickerBaseline);
    nested.dismiss();
    setActiveEndpoint(null);
    setPickerBaseline(null);
  }

  function selectPartner(partnerId: string) {
    if (!activeEndpoint) return;
    const partner = activeItems.find((item) => item.id === partnerId);
    setLocation(activeEndpoint, partner ? {
      ...EMPTY_LOCATION,
      mode: "partner",
      partnerId: partner.id,
      place: partner.name,
      contact: [partner.contactPerson, partner.contact].filter(Boolean).join(" · "),
    } : EMPTY_LOCATION);
    nested.dismiss();
    setActiveEndpoint(null);
    setPickerBaseline(null);
  }

  function selectUnset() {
    if (!activeEndpoint) return;
    setLocation(activeEndpoint, EMPTY_LOCATION);
    nested.dismiss();
    setActiveEndpoint(null);
    setPickerBaseline(null);
  }

  function openDirectEditor() {
    if (!activeEndpoint) return;
    const kind = activeEndpoint;
    const current = kind === "origin" ? origin : destination;
    setDirectDraft(current.mode === "direct" ? current : { ...EMPTY_LOCATION, mode: "direct" });
    setAddressMessage(null);
    nested.transition("direct");
  }

  function cancelDirectEditor() {
    const parent = activeEndpoint;
    if (parent && pickerBaseline) setLocation(parent, pickerBaseline);
    nested.dismiss();
    setFocusIntent(null);
    setActiveEndpoint(null);
    setPickerBaseline(null);
  }

  function returnToPicker() {
    if (!activeEndpoint) return;
    setFocusIntent(null);
    nested.transition("picker");
  }

  function applyDirectEditor() {
    if (!activeEndpoint) return;
    setLocation(activeEndpoint, { ...directDraft, mode: "direct", partnerId: "", place: "" });
    nested.dismiss();
    setActiveEndpoint(null);
    setPickerBaseline(null);
    setFocusIntent(null);
  }

  function openAddressSearch() {
    if (!activeEndpoint) return;
    setAddressMessage(null);
    nested.transition("address");
  }

  function cancelAddressSearch() {
    setFocusIntent(null);
    nested.transition("direct");
  }

  function selectAddress(item: AddressSearchItem) {
    if (!activeEndpoint) return;
    setDirectDraft((current) => ({ ...current, zonecode: item.postalCode, basicAddress: item.roadAddress }));
    setAddressMessage("주소를 선택했습니다. 상세 주소를 입력해 주세요.");
    setFocusIntent({ endpoint: activeEndpoint, generation: nested.presentationGeneration + 1, target: "detail-address" });
    nested.transition("direct");
  }

  function finishNestedClose() {
    nested.finishClose();
  }

  function handleDirectAfterOpen() {
    if (!activeEndpoint || !focusIntent) return;
    if (!matchesWaflNestedSheetFocusIntent(focusIntent, {
      endpoint: activeEndpoint,
      generation: nested.presentationGeneration,
      target: "detail-address",
    })) return;
    setFocusIntent(null);
    requestAnimationFrame(() => detailAddressInputRef.current?.focus());
  }

  if (groups.length === 0) {
    return <View style={styles.section} testID="quick-delivery-foundation"><View style={styles.titleRow}><Truck color={WAFL_THEME.color.deepNavy} size={18}/><Text style={styles.title}>퀵 전달</Text></View><Text style={styles.empty}>퀵 전달할 발주 항목이 없습니다.</Text></View>;
  }

  return <View style={styles.section} testID="quick-delivery-foundation">
    <View style={styles.titleRow}><Truck color={WAFL_THEME.color.deepNavy} size={18}/><Text style={styles.title}>퀵 전달</Text></View>
    <Text style={styles.help}>발주요청한 원단·부자재를 거래처별로 묶어 전달 내용을 미리 확인합니다.</Text>
    {groups.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupRail}>{groups.map((item) => <Pressable key={item.partnerId} onPress={() => setGroupId(item.partnerId)} style={[styles.groupChip, item.partnerId === group?.partnerId && styles.groupChipSelected]}><Text style={[styles.groupChipText, item.partnerId === group?.partnerId && styles.groupChipTextSelected]}>{item.partnerName} · {item.items.length}</Text></Pressable>)}</ScrollView> : null}
    <View style={styles.deliveryCard}>
      <Pressable onPress={() => openEndpoint("origin")} style={styles.summaryRow}><MapPin color={WAFL_THEME.color.brickOrange} size={17}/><View style={styles.flex}><Text style={styles.summaryLabel}>출발지</Text><Text style={styles.summaryValue}>{originPresentation.primary}</Text></View><ChevronRight color={WAFL_THEME.color.readOnly} size={17}/></Pressable>
      <Text style={styles.meta}>{originPresentation.secondary ?? "등록된 주소 정보 없음"}</Text>
    </View>
    <View style={styles.deliveryCard}>
      <Pressable onPress={() => openEndpoint("destination")} style={styles.summaryRow}><MapPin color={WAFL_THEME.color.deepNavy} size={17}/><View style={styles.flex}><Text style={styles.summaryLabel}>도착지</Text><Text style={styles.summaryValue}>{destinationPresentation.primary}</Text></View><ChevronRight color={WAFL_THEME.color.readOnly} size={17}/></Pressable>
      <Text style={styles.meta}>{destinationPresentation.secondary ?? "등록된 주소 정보 없음"}</Text>
    </View>
    <View style={styles.deliveryCard}><View style={styles.titleRow}><UserRound color={WAFL_THEME.color.deepNavy} size={17}/><Text style={styles.summaryLabel}>기사 정보</Text></View><Text style={styles.meta}>최근 이용 기사 없음</Text><WaflSheetValueField label="기사명 (선택)" value={driverName} placeholder="직접 입력" onChange={setDriverName}/><WaflSheetValueField keyboardType="phone-pad" label="연락처" value={driverPhone} placeholder="연락처 입력" onChange={setDriverPhone}/><WaflSheetValueField label="메모" value={memo} placeholder="전달 메모" onChange={setMemo}/></View>
    <View style={styles.itemList}>{group?.items.map((item) => <View key={item.materialLineId} style={styles.itemRow}><View style={styles.flex}><Text style={styles.itemName}>{item.name}{item.colorOption ? ` · ${item.colorOption}` : ""}</Text><Text style={styles.meta}>{item.materialType === "fabric" ? "원단" : "부자재"}</Text></View><Text style={styles.itemQuantity}>{Number(item.quantity).toLocaleString("ko-KR")} {item.unitCode}</Text></View>)}</View>
    <Pressable accessibilityRole="button" onPress={openPreview} style={styles.previewButton}><Eye color="#fff" size={18}/><Text style={styles.previewButtonText}>퀵 전달 요청 미리보기</Text></Pressable>

    <MaterialPartnerPickerSheet allowUnset items={activeItems} onAfterClose={finishNestedClose} onCancel={cancelPicker} onSelect={selectPartner} onSwitchToDirectInput={openDirectEditor} onUnset={selectUnset} presentationGeneration={nested.presentationGeneration} selectedId={activeLocation.mode === "partner" ? activeLocation.partnerId : ""} visible={nested.visible && nested.route === "picker"}/>
    <WaflInputSheet cancelAccessibilityLabel="직접 입력 취소" confirmAccessibilityLabel="직접 입력 적용" keyboardAutoExpand keyboardFocusRevealContext={WAFL_THEME.sheet.textEntryFocusRevealClearance} keyboardMode="directInput" onAfterClose={finishNestedClose} onAfterOpen={handleDirectAfterOpen} onCancel={cancelDirectEditor} onConfirm={applyDirectEditor} presentationGeneration={nested.presentationGeneration} sizing="expandable" title={`${activeEndpoint === "origin" ? "출발지" : "도착지"} 직접 입력`} visible={nested.visible && nested.route === "direct"}>
      <View style={styles.directFields}>
        <WaflInputModeSwitch mode="direct" onPress={returnToPicker} testID="quick-delivery-return-to-picker" />
        <View style={styles.addressHeader}><Text style={styles.fieldLabel}>주소</Text><Pressable accessibilityRole="button" onPress={openAddressSearch} style={styles.addressSearchButton}><Search color={WAFL_THEME.color.deepNavy} size={15}/><Text style={styles.addressSearchText}>주소 검색</Text></Pressable></View>
        <WaflSheetValueField editable={false} label="우편번호" value={directDraft.zonecode} placeholder="주소 검색으로 입력"/>
        <WaflSheetValueField editable={false} label="기본 주소" value={directDraft.basicAddress} placeholder="주소 검색으로 입력"/>
        <WaflSheetValueField inputRef={detailAddressInputRef} label="상세주소 (선택)" value={directDraft.detailAddress} placeholder="상세주소" onChange={(detailAddress) => setDirectDraft((current) => ({ ...current, detailAddress }))}/>
        <WaflSheetValueField keyboardType="phone-pad" label="연락처" value={directDraft.contact} placeholder="연락처" onChange={(contact) => setDirectDraft((current) => ({ ...current, contact }))}/>
        {addressMessage ? <Text accessibilityLiveRegion="polite" style={styles.addressMessage}>{addressMessage}</Text> : null}
      </View>
    </WaflInputSheet>
    <QuickDeliveryAddressSearchSheet onAfterClose={finishNestedClose} onCancel={cancelAddressSearch} onSelect={selectAddress} presentationGeneration={nested.presentationGeneration} visible={nested.visible && nested.route === "address"}/>
    <WaflInputSheet cancelAccessibilityLabel="퀵 전달 미리보기 닫기" confirmAccessibilityLabel="퀵 전달 미리보기 확인" onAfterClose={finishNestedClose} onCancel={closePreview} onConfirm={closePreview} presentationGeneration={nested.presentationGeneration} sizing="adaptiveExpandable" title="퀵 전달 요청 미리보기" visible={nested.visible && nested.route === "preview"}>
      <View style={styles.previewScroll}><Text style={styles.previewLine}>출발 · {originPresentation.primary}</Text>{originPresentation.secondary ? <Text style={styles.previewMeta}>{originPresentation.secondary}</Text> : null}<Text style={styles.previewLine}>도착 · {destinationPresentation.primary}</Text>{destinationPresentation.secondary ? <Text style={styles.previewMeta}>{destinationPresentation.secondary}</Text> : null}<Text style={styles.previewLine}>기사 · {driverName.trim() || "미지정"}{driverPhone.trim() ? ` · ${driverPhone.trim()}` : ""}</Text>{group?.items.map((item) => <Text key={item.materialLineId} style={styles.previewLine}>• {item.name} {Number(item.quantity).toLocaleString("ko-KR")} {item.unitCode}</Text>)}<Text style={styles.previewLine}>메모 · {memo.trim() || "미지정"}</Text><Text style={styles.deferred}>미리보기만 제공됩니다. 요청 저장과 발행은 다음 단계에서 지원합니다.</Text></View>
    </WaflInputSheet>
  </View>;
}

const styles = StyleSheet.create({
  previewMeta:{color:"#8a7c70",fontFamily:WAFL_FONTS.body,fontSize:10,lineHeight:15,paddingBottom:5},
  section:{gap:WAFL_THEME.layout.controlGap},titleRow:{alignItems:"center",flexDirection:"row",gap:WAFL_THEME.layout.actionTileGap},title:{color:WAFL_THEME.color.deepNavy,fontFamily:WAFL_FONTS.bold,fontSize:WAFL_THEME.typography.cardTitle.fontSize,lineHeight:WAFL_THEME.typography.cardTitle.lineHeight},help:{color:WAFL_THEME.color.readOnly,fontFamily:WAFL_FONTS.body,fontSize:WAFL_THEME.typography.meta.fontSize,lineHeight:WAFL_THEME.typography.meta.lineHeight},empty:{color:WAFL_THEME.color.disabled,fontFamily:WAFL_FONTS.medium,fontSize:WAFL_THEME.typography.bodyText.fontSize},groupRail:{gap:WAFL_THEME.layout.actionTileGap},groupChip:{backgroundColor:WAFL_THEME.color.paperMuted,borderColor:WAFL_THEME.color.border,borderRadius:WAFL_THEME.radius.pill,borderWidth:WAFL_THEME.border.hairline,paddingHorizontal:10,paddingVertical:7},groupChipSelected:{backgroundColor:WAFL_THEME.color.deepNavy,borderColor:WAFL_THEME.color.deepNavy},groupChipText:{color:WAFL_THEME.color.deepNavy,fontFamily:WAFL_FONTS.semibold,fontSize:WAFL_THEME.typography.meta.fontSize},groupChipTextSelected:{color:"#fff"},deliveryCard:{backgroundColor:WAFL_THEME.color.paper,borderColor:WAFL_THEME.color.border,borderRadius:WAFL_THEME.radius.cardCompact,borderWidth:WAFL_THEME.border.hairline,gap:7,padding:WAFL_THEME.layout.compactCardPadding},summaryRow:{alignItems:"center",flexDirection:"row",gap:WAFL_THEME.layout.controlGap,minHeight:WAFL_THEME.touch.minimum},summaryLabel:{color:WAFL_THEME.color.readOnly,fontFamily:WAFL_FONTS.semibold,fontSize:WAFL_THEME.typography.meta.fontSize},summaryValue:{color:WAFL_THEME.color.deepNavy,fontFamily:WAFL_FONTS.bold,fontSize:WAFL_THEME.typography.bodyText.fontSize,marginTop:2},flex:{flex:1,minWidth:0},directFields:{gap:WAFL_THEME.layout.controlGap,paddingBottom:WAFL_THEME.spacing.xs},field:{gap:3},fieldLabel:{color:WAFL_THEME.color.readOnly,fontFamily:WAFL_FONTS.semibold,fontSize:WAFL_THEME.typography.meta.fontSize},input:{backgroundColor:WAFL_THEME.color.paperMuted,borderColor:WAFL_THEME.color.border,borderRadius:WAFL_THEME.radius.field,borderWidth:WAFL_THEME.border.hairline,color:WAFL_THEME.color.deepNavy,fontFamily:WAFL_FONTS.body,fontSize:WAFL_THEME.typography.bodyText.fontSize,minHeight:WAFL_THEME.touch.minimum,paddingHorizontal:10},addressHeader:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},addressSearchButton:{alignItems:"center",backgroundColor:WAFL_THEME.color.fabricBeige,borderRadius:WAFL_THEME.radius.field,flexDirection:"row",gap:5,minHeight:38,paddingHorizontal:10},addressSearchText:{color:WAFL_THEME.color.deepNavy,fontFamily:WAFL_FONTS.bold,fontSize:WAFL_THEME.typography.meta.fontSize},addressMessage:{color:WAFL_THEME.color.brickOrange,fontFamily:WAFL_FONTS.semibold,fontSize:WAFL_THEME.typography.meta.fontSize,lineHeight:WAFL_THEME.typography.meta.lineHeight},meta:{color:WAFL_THEME.color.readOnly,fontFamily:WAFL_FONTS.body,fontSize:WAFL_THEME.typography.meta.fontSize,lineHeight:WAFL_THEME.typography.meta.lineHeight},itemList:{gap:2},itemRow:{alignItems:"center",borderBottomColor:WAFL_THEME.color.border,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:"row",gap:WAFL_THEME.layout.controlGap,minHeight:WAFL_THEME.touch.minimum,paddingVertical:6},itemName:{color:WAFL_THEME.color.deepNavy,fontFamily:WAFL_FONTS.semibold,fontSize:11},itemQuantity:{color:WAFL_THEME.color.deepNavy,fontFamily:WAFL_FONTS.bold,fontSize:11},previewButton:{alignItems:"center",backgroundColor:WAFL_THEME.color.navyInk,borderRadius:WAFL_THEME.radius.cardCompact,flexDirection:"row",gap:7,justifyContent:"center",minHeight:46},previewButtonText:{color:"#fff",fontFamily:WAFL_FONTS.bold,fontSize:WAFL_THEME.typography.bodyText.fontSize},previewScroll:{maxHeight:420,marginTop:10},previewLine:{borderBottomColor:WAFL_THEME.color.border,borderBottomWidth:StyleSheet.hairlineWidth,color:WAFL_THEME.color.deepNavy,fontFamily:WAFL_FONTS.body,fontSize:WAFL_THEME.typography.bodyText.fontSize,lineHeight:WAFL_THEME.typography.bodyText.lineHeight,paddingVertical:7},deferred:{color:WAFL_THEME.color.brickOrange,fontFamily:WAFL_FONTS.semibold,fontSize:11,lineHeight:17,paddingVertical:10},
});
