import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Pdf from "react-native-pdf";
import ReactNativeBlobUtil from "react-native-blob-util";
import { X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { WorkOrderAttachmentAsset } from "@/domain/mobileContract";
import WaflPrimaryActionButton from "@/features/inputs/WaflPrimaryActionButton";

type Ready = { readonly path: string; readonly dispose: () => void };

export default function WaflNativeAttachmentViewer({ preview, onClose }: {
  readonly preview: { readonly attachment: WorkOrderAttachmentAsset; readonly url: string } | null;
  readonly onClose: () => void;
}) {
  const [pdf, setPdf] = useState<Ready | null>(null);
  const [errorPreviewUrl, setErrorPreviewUrl] = useState<string | null>(null);
  const isPdf = preview?.attachment.mimeType.toLowerCase() === "application/pdf";
  useEffect(() => {
    if (!preview || !isPdf) return undefined;
    let active = true;
    let response: Awaited<ReturnType<typeof ReactNativeBlobUtil.fetch>> | null = null;
    void ReactNativeBlobUtil.config({ appendExt: "pdf", fileCache: true, timeout: 60_000 }).fetch("GET", preview.url, { Accept: "application/pdf", "Cache-Control": "no-store" }).then(async (next) => {
      response = next;
      const stat = await ReactNativeBlobUtil.fs.stat(next.path());
      const signature = String(await ReactNativeBlobUtil.fs.readFile(next.path(), "base64")).slice(0, 7);
      if (!active || next.info().status !== 200 || stat.size < 5 || signature !== "JVBERi0") throw new Error("ATTACHMENT_PDF_INVALID");
      setPdf({ path: next.path(), dispose: () => { try { next.flush(); } catch { /* best effort */ } } });
    }).catch(() => { if (active) setErrorPreviewUrl(preview.url); });
    return () => { active = false; try { response?.flush(); } catch { /* best effort */ } setPdf(null); };
  }, [isPdf, preview]);
  const pdfSource = useMemo(() => pdf ? { uri: `file://${pdf.path}` } : null, [pdf]);
  return <Modal animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" visible={Boolean(preview)}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text numberOfLines={1} style={styles.title}>{preview?.attachment.filename ?? "첨부 보기"}</Text><Pressable accessibilityLabel="첨부 보기 닫기" accessibilityRole="button" onPress={onClose} style={styles.close}><X color={WAFL_THEME.color.deepNavy} size={22}/></Pressable></View>
      <View style={styles.body}>
        {!preview ? null : isPdf ? pdfSource ? <Pdf enableDoubleTapZoom horizontal={false} maxScale={3} minScale={1} source={pdfSource} style={styles.pdf}/> : <View style={styles.center}>{errorPreviewUrl === preview.url ? <Text style={styles.error}>PDF를 열 수 없습니다.</Text> : <ActivityIndicator color={WAFL_THEME.color.brickOrange}/>}</View> :
          <ScrollView contentContainerStyle={styles.imageContent} maximumZoomScale={4} minimumZoomScale={1} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} style={styles.imageScroll}>
            <Image accessibilityLabel={preview.attachment.filename} alt={preview.attachment.filename} resizeMode="contain" source={{ uri: preview.url }} style={styles.image}/>
          </ScrollView>}
      </View>
      {isPdf ? <View style={styles.pdfFooter} testID="attachment-pdf-viewer-footer"><WaflPrimaryActionButton accessibilityLabel="첨부 PDF 보기 닫기" label="닫기" onPress={onClose} testID="attachment-pdf-viewer-close" /></View> : null}
    </SafeAreaView>
  </Modal>;
}

const styles=StyleSheet.create({safe:{backgroundColor:WAFL_THEME.color.paper,flex:1},header:{alignItems:"center",borderBottomColor:WAFL_THEME.color.border,borderBottomWidth:WAFL_THEME.border.hairline,flexDirection:"row",minHeight:56,paddingHorizontal:12},title:{color:WAFL_THEME.color.deepNavy,flex:1,fontFamily:WAFL_FONTS.bold,fontSize:14},close:{alignItems:"center",height:44,justifyContent:"center",width:44},body:{backgroundColor:WAFL_THEME.color.paperMuted,flex:1},center:{alignItems:"center",flex:1,justifyContent:"center"},error:{color:WAFL_THEME.color.deepNavy,fontFamily:WAFL_FONTS.medium,fontSize:12},pdf:{backgroundColor:WAFL_THEME.color.paperMuted,flex:1,width:"100%"},pdfFooter:{backgroundColor:WAFL_THEME.color.paper,borderTopColor:WAFL_THEME.color.border,borderTopWidth:WAFL_THEME.border.hairline,paddingBottom:WAFL_THEME.spacing.sm,paddingHorizontal:WAFL_THEME.spacing.sm,paddingTop:WAFL_THEME.spacing.xs},imageScroll:{flex:1},imageContent:{alignItems:"center",flexGrow:1,justifyContent:"center"},image:{height:"100%",minHeight:520,width:"100%"}});
