import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import {
  calculatePanelLayoutScale,
  formatPanelDimensionFt,
  type PanelLayoutResult,
  type PanelOrientation
} from '@/utils/calculations';
import type { Product } from '@/types/product.types';

const solarPanelLayoutPicture = require('../../../solar panel layout picture.png');
const AnimatedPath = Animated.createAnimatedComponent(Path);

const PANEL_COLUMN_GAP = 1;
const PANEL_ROW_GAP = 1;
const PANEL_IMAGE_VISUAL_SCALE = 1.58;

type PanelLayoutVisualizerProps = {
  selectedPanelProduct?: Product | null;
  panelWattage: number;
  panelQuantity: number;
  orientation: PanelOrientation;
  onOrientationChange: (orientation: PanelOrientation) => void;
  layout: PanelLayoutResult;
  alternateLayout: PanelLayoutResult;
  emptyMessage?: string;
};

const SolarPanelTile = ({
  width,
  height,
  orientation
}: {
  width: number;
  height: number;
  orientation: PanelOrientation;
}) => (
  <View style={[styles.panelImageTile, { width, height }]}>
    <Image
      source={solarPanelLayoutPicture}
      resizeMode="contain"
      style={[
        styles.panelImage,
        orientation === 'portrait'
          ? {
              width: height * PANEL_IMAGE_VISUAL_SCALE,
              height: width * PANEL_IMAGE_VISUAL_SCALE,
              transform: [{ rotate: '90deg' }]
            }
          : {
              width: width * PANEL_IMAGE_VISUAL_SCALE,
              height: height * PANEL_IMAGE_VISUAL_SCALE
            }
      ]}
    />
  </View>
);

const BorderSpark = ({
  x,
  y,
  delay,
  reducedMotion
}: {
  x: number;
  y: number;
  delay: number;
  reducedMotion: boolean;
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 760,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        }),
        Animated.delay(1400)
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reducedMotion]);

  const opacity = progress.interpolate({ inputRange: [0, 0.18, 0.56, 1], outputRange: [0, 0.95, 0.75, 0] });
  const scale = progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.65, 1.28, 0.82] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.borderSpark, { left: x, top: y, opacity, transform: [{ scale }] }]}
    />
  );
};

const PanelLayoutIllustration = ({
  panelCount,
  layout
}: {
  panelCount: number;
  layout: PanelLayoutResult;
}) => {
  const borderProgress = useRef(new Animated.Value(0)).current;
  const secondaryBorderProgress = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState(280);
  const normalizedPanelCount = Math.max(1, Math.ceil(panelCount || 1));
  const columns = Math.max(1, layout.columns);
  const rows = Math.max(1, Math.ceil(normalizedPanelCount / columns));
  const containerWidth = Math.max(260, Math.min(measuredWidth || 280, 320));
  const containerHeight = Math.round(containerWidth * 0.88);
  const availableWidth = containerWidth - 96;
  const availableHeight = containerHeight - 100;
  const scale = calculatePanelLayoutScale({
    layout,
    columns,
    rows,
    availableWidth,
    availableHeight,
    columnGapPx: PANEL_COLUMN_GAP,
    rowGapPx: PANEL_ROW_GAP
  });
  const totalColumnGapWidth = Math.max(0, columns - 1) * PANEL_COLUMN_GAP;
  const totalRowGapHeight = Math.max(0, rows - 1) * PANEL_ROW_GAP;
  const panelPixelWidth = layout.panelWidth * scale;
  const panelPixelHeight = layout.panelHeight * scale;
  const gridPixelWidth = columns * panelPixelWidth + totalColumnGapWidth;
  const gridPixelHeight = rows * panelPixelHeight + totalRowGapHeight;
  const gridLeft = 30 + (availableWidth - gridPixelWidth) / 2;
  const gridTop = 48 + (availableHeight - gridPixelHeight) / 2;
  const formattedWidth = formatPanelDimensionFt(layout.width);
  const formattedHeight = formatPanelDimensionFt(layout.height);
  const borderInset = 5;
  const borderWidth = containerWidth - borderInset * 2;
  const borderHeight = containerHeight - borderInset * 2;
  const borderPathLength = 2 * (borderWidth + borderHeight);
  const borderRadius = 18;
  const borderPath = `M${borderInset + borderRadius} ${borderInset} H${containerWidth - borderInset - borderRadius} Q${containerWidth - borderInset} ${borderInset} ${containerWidth - borderInset} ${borderInset + borderRadius} V${containerHeight - borderInset - borderRadius} Q${containerWidth - borderInset} ${containerHeight - borderInset} ${containerWidth - borderInset - borderRadius} ${containerHeight - borderInset} H${borderInset + borderRadius} Q${borderInset} ${containerHeight - borderInset} ${borderInset} ${containerHeight - borderInset - borderRadius} V${borderInset + borderRadius} Q${borderInset} ${borderInset} ${borderInset + borderRadius} ${borderInset}`;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(Boolean(enabled));
    });
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReducedMotion);
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const primary = Animated.loop(
      Animated.timing(borderProgress, {
        toValue: 1,
        duration: 3900,
        easing: Easing.linear,
        useNativeDriver: false
      })
    );
    const secondary = Animated.loop(
      Animated.timing(secondaryBorderProgress, {
        toValue: 1,
        duration: 4500,
        easing: Easing.linear,
        useNativeDriver: false
      })
    );
    primary.start();
    secondary.start();
    return () => {
      primary.stop();
      secondary.stop();
    };
  }, [borderProgress, reducedMotion, secondaryBorderProgress]);

  const borderDashOffset = borderProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -borderPathLength] });
  const secondaryBorderDashOffset = secondaryBorderProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -borderPathLength] });

  return (
    <View
      style={[styles.animatedLayoutBox, { height: containerHeight }]}
      onLayout={(event) => setMeasuredWidth(Math.round(event.nativeEvent.layout.width))}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${containerWidth} ${containerHeight}`} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={borderPath} fill="none" stroke="#F2E6C7" strokeWidth="1.1" />
        <AnimatedPath d={borderPath} fill="none" stroke="#FFD246" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${Math.round(borderPathLength * 0.15)} ${Math.round(borderPathLength * 0.08)} ${Math.round(borderPathLength * 0.07)} ${Math.round(borderPathLength * 0.7)}`} strokeDashoffset={secondaryBorderDashOffset as unknown as number} opacity="0.28" />
        <AnimatedPath d={borderPath} fill="none" stroke="#FFD86A" strokeWidth="2.4" strokeLinecap="round" strokeDasharray={`${Math.round(borderPathLength * 0.06)} ${Math.round(borderPathLength * 0.045)} ${Math.round(borderPathLength * 0.035)} ${Math.round(borderPathLength * 0.1)} ${Math.round(borderPathLength * 0.035)} ${Math.round(borderPathLength * 0.72)}`} strokeDashoffset={borderDashOffset as unknown as number} opacity="0.98" />
        <AnimatedPath d={borderPath} fill="none" stroke="#FFF4BE" strokeWidth="1.1" strokeLinecap="round" strokeDasharray={`${Math.round(borderPathLength * 0.025)} ${Math.round(borderPathLength * 0.16)} ${Math.round(borderPathLength * 0.018)} ${Math.round(borderPathLength * 0.78)}`} strokeDashoffset={borderDashOffset as unknown as number} opacity="0.9" />
      </Svg>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <BorderSpark x={containerWidth - 32} y={10} delay={0} reducedMotion={reducedMotion} />
        <BorderSpark x={containerWidth - 16} y={containerHeight - 42} delay={720} reducedMotion={reducedMotion} />
        <BorderSpark x={22} y={containerHeight - 22} delay={1420} reducedMotion={reducedMotion} />
        <BorderSpark x={8} y={28} delay={2140} reducedMotion={reducedMotion} />
      </View>

      <View style={styles.dimensionBadge}>
        <Text style={styles.dimensionBadgeText}>{formattedWidth}' × {formattedHeight}'</Text>
      </View>

      <View style={[styles.realPanelGrid, { left: gridLeft, top: gridTop, width: gridPixelWidth, height: gridPixelHeight }]}>
        {Array.from({ length: normalizedPanelCount }).map((_, panelIndex) => {
          const row = Math.floor(panelIndex / columns);
          const column = panelIndex % columns;
          return (
            <View key={`panel-${panelIndex}`} style={{ position: 'absolute', left: column * (panelPixelWidth + PANEL_COLUMN_GAP), top: row * (panelPixelHeight + PANEL_ROW_GAP), width: panelPixelWidth, height: panelPixelHeight }}>
              <SolarPanelTile width={panelPixelWidth} height={panelPixelHeight} orientation={layout.panelWidth > layout.panelHeight ? 'landscape' : 'portrait'} />
            </View>
          );
        })}
      </View>

      <View style={[styles.verticalDimension, { top: gridTop, right: Math.max(14, containerWidth - gridLeft - gridPixelWidth - 42), height: gridPixelHeight }]}>
        <Svg width="28" height={gridPixelHeight} viewBox={`0 0 28 ${gridPixelHeight}`} pointerEvents="none">
          <Line x1="14" y1="9" x2="14" y2={gridPixelHeight - 9} stroke="#7B8794" strokeWidth="1.2" />
          <Path d="M14 2 L9 11 H19 Z" fill="#7B8794" />
          <Path d={`M14 ${gridPixelHeight - 2} L9 ${gridPixelHeight - 11} H19 Z`} fill="#7B8794" />
          <Line x1="4" y1="9" x2="24" y2="9" stroke="#CBD5E1" strokeWidth="1" />
          <Line x1="4" y1={gridPixelHeight - 9} x2="24" y2={gridPixelHeight - 9} stroke="#CBD5E1" strokeWidth="1" />
        </Svg>
        <Text style={styles.verticalDimensionText}>{formattedHeight} ft</Text>
      </View>

      <View style={[styles.horizontalDimension, { left: gridLeft, bottom: 24, width: gridPixelWidth }]}>
        <Text style={styles.horizontalDimensionText}>{formattedWidth} ft</Text>
        <Svg width={gridPixelWidth} height="24" viewBox={`0 0 ${gridPixelWidth} 24`} pointerEvents="none">
          <Line x1="13" y1="13" x2={gridPixelWidth - 13} y2="13" stroke="#7B8794" strokeWidth="1.2" />
          <Path d="M3 13 L14 7 V19 Z" fill="#7B8794" />
          <Path d={`M${gridPixelWidth - 3} 13 L${gridPixelWidth - 14} 7 V19 Z`} fill="#7B8794" />
          <Line x1="13" y1="4" x2="13" y2="22" stroke="#CBD5E1" strokeWidth="1" />
          <Line x1={gridPixelWidth - 13} y1="4" x2={gridPixelWidth - 13} y2="22" stroke="#CBD5E1" strokeWidth="1" />
        </Svg>
      </View>
    </View>
  );
};

export const PanelLayoutVisualizer = ({
  selectedPanelProduct,
  panelWattage,
  panelQuantity,
  orientation,
  onOrientationChange,
  layout,
  alternateLayout,
  emptyMessage = 'Panel layout is unavailable.'
}: PanelLayoutVisualizerProps) => {
  const hasPanelLayout = panelQuantity > 0 && panelWattage > 0;
  const productIdentity = selectedPanelProduct?.id ?? 'fallback-panel-dimensions';

  return (
    <View style={styles.layoutCard} testID={`panel-layout-visualizer-${productIdentity}`}>
      <View style={styles.layoutHead}>
        <View>
          <Text style={styles.metricLabel}>PANEL LAYOUT</Text>
          <Text style={styles.layoutTitle}>{hasPanelLayout ? `${panelQuantity} panels x ${panelWattage}W` : emptyMessage}</Text>
        </View>
        <View style={styles.areaBadge}>
          <Text style={styles.areaBadgeText}>{hasPanelLayout ? layout.area : 0} sq ft</Text>
        </View>
      </View>

      <View style={styles.toggle}>
        {(['landscape', 'portrait'] as PanelOrientation[]).map((item) => {
          const selected = orientation === item;
          return (
            <Pressable key={item} style={selected ? styles.toggleActive : styles.toggleInactive} onPress={() => onOrientationChange(item)}>
              <Text style={selected ? styles.toggleActiveText : styles.toggleInactiveText}>{item === 'landscape' ? 'Landscape' : 'Portrait'}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.orientationCard}>
        <Text style={styles.orientationTitle}>{orientation === 'landscape' ? 'LANDSCAPE' : 'PORTRAIT'} ORIENTATION</Text>
        <View style={styles.orientationControls}>
          <View style={styles.rowsPill}>
            <Text style={styles.rowsButton}>-</Text>
            <Text style={styles.rowsText}>{layout.rows} rows</Text>
            <Text style={styles.rowsButton}>+</Text>
          </View>
          <Text style={styles.compactText}>{layout.columns} columns</Text>
          <Text style={styles.compactText}>{layout.area <= alternateLayout.area ? 'Best fit' : 'Alt. fit available'}</Text>
        </View>
        <View style={styles.panelPreviewRow}>
          {hasPanelLayout ? <PanelLayoutIllustration panelCount={panelQuantity} layout={layout} /> : (
            <View style={styles.emptyPanelPreview}><Text style={styles.noWattageText}>{emptyMessage}</Text></View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  layoutCard: { borderRadius: 18, backgroundColor: '#FFFFFF', padding: 14, gap: 12 },
  layoutHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metricLabel: { color: '#A27500', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  layoutTitle: { marginTop: 5, color: '#1F2A3D', fontSize: 14, fontWeight: '900' },
  areaBadge: { borderRadius: 999, backgroundColor: '#FFF5DA', borderWidth: 1, borderColor: '#F2D990', paddingHorizontal: 13, paddingVertical: 7 },
  areaBadgeText: { color: '#8C6503', fontSize: 10, fontWeight: '900' },
  toggle: { height: 38, borderRadius: 12, backgroundColor: '#F4F4F5', flexDirection: 'row', padding: 2 },
  toggleActive: { flex: 1, borderRadius: 10, backgroundColor: '#F5B700', alignItems: 'center', justifyContent: 'center' },
  toggleInactive: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toggleActiveText: { color: '#111827', fontSize: 12, fontWeight: '900' },
  toggleInactiveText: { color: '#6B7280', fontSize: 12, fontWeight: '800' },
  orientationCard: { borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', padding: 12, gap: 12 },
  orientationTitle: { color: '#6B7280', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  orientationControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowsPill: { height: 30, borderRadius: 999, backgroundColor: '#EEF2F7', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 8 },
  rowsButton: { width: 22, textAlign: 'center', color: '#64748B', fontSize: 15, fontWeight: '900' },
  rowsText: { color: '#1F2A3D', fontSize: 11, fontWeight: '900' },
  compactText: { color: '#64748B', fontSize: 10, fontWeight: '900' },
  panelPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyPanelPreview: { minHeight: 220, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  noWattageText: { flex: 1, color: '#64748B', fontSize: 11, fontWeight: '800', lineHeight: 16 },
  animatedLayoutBox: { width: '100%', maxWidth: 320, minWidth: 260, borderRadius: 18, backgroundColor: '#FFFFFF', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 },
  dimensionBadge: { position: 'absolute', top: 13, right: 14, zIndex: 3, borderRadius: 999, backgroundColor: '#FFF4D6', borderWidth: 1, borderColor: '#F2D990', paddingHorizontal: 9, paddingVertical: 5 },
  dimensionBadgeText: { color: '#7A5700', fontSize: 10, fontWeight: '900' },
  realPanelGrid: { position: 'absolute', alignItems: 'flex-start', justifyContent: 'flex-start' },
  panelImageTile: { alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  panelImage: { flexShrink: 0 },
  borderSpark: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF4BE', shadowColor: '#FFD86A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.95, shadowRadius: 7, elevation: 3 },
  horizontalDimension: { position: 'absolute', bottom: 24, alignItems: 'center' },
  horizontalDimensionText: { color: '#334155', fontSize: 11, fontWeight: '900', marginBottom: -2 },
  verticalDimension: { position: 'absolute', width: 44, alignItems: 'center', justifyContent: 'center' },
  verticalDimensionText: { position: 'absolute', color: '#334155', fontSize: 11, fontWeight: '900', transform: [{ rotate: '90deg' }], width: 68, textAlign: 'center', backgroundColor: '#FFFFFF' }
});
