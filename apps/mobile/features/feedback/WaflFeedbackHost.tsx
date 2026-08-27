import { useSyncExternalStore } from "react";
import WaflAlertHost from "./WaflAlertHost";
import WaflDecisionSheet from "./WaflDecisionSheet";
import { dismissWaflAlert, getWaflFeedbackSnapshot, subscribeWaflFeedback } from "./waflFeedbackStore";

export default function WaflFeedbackHost() {
  const feedback = useSyncExternalStore(subscribeWaflFeedback, getWaflFeedbackSnapshot, getWaflFeedbackSnapshot);
  return <>
    <WaflDecisionSheet decision={feedback.decision} testID="wafl-global-decision" />
    <WaflAlertHost alert={feedback.alert} onDismiss={dismissWaflAlert} />
  </>;
}
