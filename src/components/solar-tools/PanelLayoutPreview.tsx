import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { calculateRoofSpace } from '@/utils/calculations';
import { colors } from '@/constants/colors';

type PanelLayoutPreviewProps = {
  panelCount: number;
  orientation: 'portrait' | 'landscape';
};

export const PanelLayoutPreview = ({ panelCount, orientation }: PanelLayoutPreviewProps) => {
  const layout = useMemo(() => {
    const columns = Math.ceil(Math.sqrt(panelCount * (orientation === 'landscape' ? 1.5 : 0.75)));
    const rows = Math.ceil(panelCount / columns);
    const panelWidth = orientation === 'landscape' ? 34 : 20;
    const panelHeight = orientation === 'landscape' ? 20 : 34;
    return { columns, rows, panelWidth, panelHeight, width: columns * (panelWidth + 5), height: rows * (panelHeight + 5) };
  }, [orientation, panelCount]);

  const roof = calculateRoofSpace(panelCount);

  return (
    <View className="rounded-3xl border border-kaam-line bg-white p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-extrabold text-kaam-navy">{orientation === 'landscape' ? 'Landscape' : 'Portrait'} layout</Text>
        <Text className="text-xs font-bold text-kaam-muted">{roof.areaSqFt} sq ft</Text>
      </View>
      <View className="items-center rounded-2xl bg-kaam-surface p-3">
        <Svg width={Math.min(300, layout.width + 20)} height={Math.min(250, layout.height + 20)}>
          {Array.from({ length: panelCount }).map((_, index) => {
            const row = Math.floor(index / layout.columns);
            const col = index % layout.columns;
            return (
              <Rect
                key={index}
                x={10 + col * (layout.panelWidth + 5)}
                y={10 + row * (layout.panelHeight + 5)}
                width={layout.panelWidth}
                height={layout.panelHeight}
                rx={4}
                fill="#133D63"
                stroke={colors.yellow}
                strokeWidth={1}
              />
            );
          })}
        </Svg>
      </View>
      <Text className="mt-3 text-center text-xs font-semibold text-kaam-muted">
        {panelCount} panels drawn automatically from recommended system size
      </Text>
    </View>
  );
};
