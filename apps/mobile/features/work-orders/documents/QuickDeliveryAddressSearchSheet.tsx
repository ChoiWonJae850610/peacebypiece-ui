import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { MapPin, Search } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { MobileApiError } from "@/domain/mobileContract";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflSheetTextInput from "@/features/inputs/WaflSheetTextInput";
import { searchAddresses, type AddressSearchItem } from "@/lib/api/addressSearchApi";

const SEARCH_DEBOUNCE_MS = 350;
const SEARCH_UNAVAILABLE_CODE = "ADDRESS_SEARCH_NOT_CONFIGURED";

function messageFor(error: unknown) {
  if (error instanceof MobileApiError && error.rawCode === SEARCH_UNAVAILABLE_CODE) {
    return "주소 검색을 사용할 수 없습니다. 직접 입력해주세요.";
  }
  return "주소 검색에 실패했습니다. 다시 시도해주세요.";
}

export default function QuickDeliveryAddressSearchSheet(props: {
  readonly visible: boolean;
  readonly presentationGeneration?: number;
  readonly onCancel: () => void;
  readonly onAfterClose: () => void;
  readonly onSelect: (item: AddressSearchItem) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<readonly AddressSearchItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    const normalized = keyword.normalize("NFC").trim();
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    if (Array.from(normalized).length < 2) return;
    const timer = setTimeout(() => {
      setStatus("loading");
      setMessage(null);
      void searchAddresses(normalized, 1).then((result) => {
        if (generationRef.current !== generation) return;
        setItems(result.items);
        setPage(result.page);
        setHasMore(result.hasMore);
        setStatus("loaded");
        setMessage(result.items.length === 0 ? "검색 결과가 없습니다." : null);
      }).catch((error: unknown) => {
        if (generationRef.current !== generation) return;
        setItems([]);
        setHasMore(false);
        setStatus("error");
        setMessage(messageFor(error));
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  function changeKeyword(value: string) {
    setKeyword(value);
    if (Array.from(value.normalize("NFC").trim()).length >= 2) return;
    generationRef.current += 1;
    setItems([]);
    setPage(1);
    setHasMore(false);
    setStatus("idle");
    setMessage(null);
  }

  async function loadMore() {
    if (status === "loading" || !hasMore) return;
    const normalized = keyword.normalize("NFC").trim();
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setStatus("loading");
    setMessage(null);
    try {
      const result = await searchAddresses(normalized, page + 1);
      if (generationRef.current !== generation) return;
      const seen = new Set(items.map((item) => item.id));
      setItems([...items, ...result.items.filter((item) => !seen.has(item.id))]);
      setPage(result.page);
      setHasMore(result.hasMore);
      setStatus("loaded");
    } catch (error) {
      if (generationRef.current !== generation) return;
      setStatus("error");
      setMessage(messageFor(error));
    }
  }

  function selectItem(item: AddressSearchItem) {
    props.onSelect(item);
  }

  return <WaflInputSheet
    cancelAccessibilityLabel="주소 검색 닫기"
    confirmAccessibilityLabel="주소 검색 닫기"
    onCancel={props.onCancel}
    onAfterClose={props.onAfterClose}
    onConfirm={props.onCancel}
    presentationGeneration={props.presentationGeneration}
    sizing="expandable"
    title="주소 검색"
    visible={props.visible}
  >
    <View style={styles.searchField}>
      <Search color={WAFL_THEME.color.readOnly} size={17}/>
      <WaflSheetTextInput
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        onChangeText={changeKeyword}
        placeholder="도로명, 건물명 또는 지번 검색"
        placeholderTextColor={WAFL_THEME.color.disabled}
        returnKeyType="search"
        style={styles.searchInput}
        value={keyword}
      />
    </View>
    <View style={styles.results}>
      {items.map((item) => <Pressable accessibilityRole="button" key={item.id} onPress={() => selectItem(item)} style={styles.resultCard}>
        <MapPin color={WAFL_THEME.color.brickOrange} size={17}/>
        <View style={styles.resultCopy}>
          <Text style={styles.roadAddress}>{item.roadAddress}</Text>
          {item.jibunAddress ? <Text style={styles.secondary}>지번 · {item.jibunAddress}</Text> : null}
          <Text style={styles.secondary}>우편번호 {item.postalCode}{item.buildingName ? ` · ${item.buildingName}` : ""}</Text>
        </View>
      </Pressable>)}
      {status === "loading" ? <View style={styles.feedback}><ActivityIndicator color={WAFL_THEME.color.brickOrange}/><Text style={styles.feedbackText}>주소를 찾고 있습니다.</Text></View> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
      {hasMore && status !== "loading" ? <Pressable accessibilityRole="button" onPress={() => void loadMore()} style={styles.moreButton}><Text style={styles.moreText}>더보기</Text></Pressable> : null}
      <Text style={styles.manualHelp}>검색이 어렵다면 닫은 뒤 주소를 직접 입력할 수 있습니다.</Text>
    </View>
  </WaflInputSheet>;
}

const styles = StyleSheet.create({
  searchField: { alignItems: "center", backgroundColor: WAFL_THEME.color.paperMuted, borderColor: WAFL_THEME.color.border, borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 8, marginTop: 10, minHeight: 46, paddingHorizontal: 12 },
  searchInput: { color: WAFL_THEME.color.deepNavy, flex: 1, fontFamily: WAFL_FONTS.body, fontSize: 13, minHeight: 44, paddingVertical: 0 },
  results: { gap: 8, paddingBottom: 8, paddingTop: 10 },
  resultCard: { alignItems: "flex-start", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 9, padding: 11 },
  resultCopy: { flex: 1, gap: 3, minWidth: 0 },
  roadAddress: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 12, lineHeight: 18 },
  secondary: { color: "#82766b", fontFamily: WAFL_FONTS.body, fontSize: 10, lineHeight: 15 },
  feedback: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 52 },
  feedbackText: { color: "#75695f", fontFamily: WAFL_FONTS.medium, fontSize: 11 },
  message: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 17, paddingVertical: 10, textAlign: "center" },
  moreButton: { alignItems: "center", borderColor: WAFL_THEME.color.border, borderRadius: 9, borderWidth: 1, justifyContent: "center", minHeight: 42 },
  moreText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  manualHelp: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.body, fontSize: 10, lineHeight: 15, paddingTop: 4, textAlign: "center" },
});
