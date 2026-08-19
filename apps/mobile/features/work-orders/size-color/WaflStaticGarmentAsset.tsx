import { G, Path } from "react-native-svg";

import { WAFL_THEME } from "@/constants/theme";
import {
  getWaflStaticGarmentAsset,
  type WaflStaticGarmentAssetCode,
  type WaflStaticGarmentViewDefinition,
} from "./staticGarmentAssetDefinitions";

type Props = {
  readonly categoryCode: WaflStaticGarmentAssetCode;
};

function GarmentView({ categoryCode, view }: { readonly categoryCode: WaflStaticGarmentAssetCode; readonly view: WaflStaticGarmentViewDefinition }) {
  return <G transform={view.overlayTransform}>
    <G fill={WAFL_THEME.color.paper} stroke={WAFL_THEME.color.deepNavy} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.4}>
      {view.outlinePaths.map((path, index) => <Path d={path} key={`${categoryCode}-${view.side}-asset-outline-${index}`} />)}
    </G>
    <G fill="none" opacity={0.52} stroke={WAFL_THEME.color.navyInk} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.45}>
      {view.detailPaths.map((path, index) => <Path d={path} key={`${categoryCode}-${view.side}-asset-detail-${index}`} />)}
    </G>
  </G>;
}

export default function WaflStaticGarmentAsset({ categoryCode }: Props) {
  const asset = getWaflStaticGarmentAsset(categoryCode);
  return <G>
    <GarmentView categoryCode={categoryCode} view={asset.front} />
    <GarmentView categoryCode={categoryCode} view={asset.back} />
  </G>;
}
