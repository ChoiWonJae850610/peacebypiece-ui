import type {
  DrawingSceneV1,
  DrawingViewportTransform,
} from "./contracts";

export type DrawingRenderRequest = Readonly<{
  scene: DrawingSceneV1;
  transform: DrawingViewportTransform;
}>;

export interface DrawingRendererAdapter<Frame> {
  render(request: DrawingRenderRequest): Frame;
}

export interface DrawingEditorAdapter<Session> {
  open(scene: DrawingSceneV1): Session;
  readScene(session: Session): DrawingSceneV1;
  close(session: Session): void;
}

export type DrawingExportFormat = "png" | "svg";

export type DrawingExportRequest = Readonly<{
  scene: DrawingSceneV1;
  format: DrawingExportFormat;
}>;

export interface DrawingExportAdapter<Artifact> {
  export(request: DrawingExportRequest): Promise<Artifact>;
}
