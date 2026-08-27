import WaflActionConfirmationCard from "@/features/feedback/WaflActionConfirmationCard";

export default function WaflActionProcessingBlocker({ message, helper = null, testID = "wafl-action-processing-blocker" }: {
  readonly message: string | null;
  readonly helper?: string | null;
  readonly testID?: string;
}) {
  return <WaflActionConfirmationCard processingHelper={helper} processingMessage={message} testID={testID} />;
}
