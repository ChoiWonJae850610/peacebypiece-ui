import DocumentViewerClient from "./DocumentViewerClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "WAFL 작업지시서",
  description: "WAFL에서 공유한 작업지시서를 안전하게 확인합니다.",
  openGraph: {
    title: "WAFL 작업지시서",
    description: "WAFL에서 공유한 작업지시서를 안전하게 확인합니다.",
    type: "website",
  },
};

export default function PublicDocumentViewerPage() {
  return <DocumentViewerClient/>;
}
