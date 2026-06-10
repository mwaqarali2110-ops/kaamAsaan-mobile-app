import React, { useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, MessageCircle, Ruler } from 'lucide-react-native';

type Orientation = 'landscape' | 'portrait';

const PANEL_LONG_FT = 7.5;
const PANEL_SHORT_FT = 3.75;
const PANEL_SPACING_FT = 1 / 12;

const getLayout = (panelCount: number, orientation: Orientation) => {
  const panelWidth = orientation === 'landscape' ? PANEL_LONG_FT : PANEL_SHORT_FT;
  const panelHeight = orientation === 'landscape' ? PANEL_SHORT_FT : PANEL_LONG_FT;
  const columns = Math.max(1, Math.ceil(Math.sqrt((panelCount * panelHeight) / panelWidth)));
  const rows = Math.max(1, Math.ceil(panelCount / columns));
  const width = columns * panelWidth + Math.max(0, columns - 1) * PANEL_SPACING_FT;
  const height = rows * panelHeight + Math.max(0, rows - 1) * PANEL_SPACING_FT;

  return {
    columns,
    rows,
    width,
    height,
    area: Math.ceil(width * height),
    panelWidth,
    panelHeight
  };
};

const BackgroundVideo = () => {
  if (Platform.OS === 'web') {
    return React.createElement('video', {
      src: '/roof-space-video.mp4',
      autoPlay: true,
      muted: true,
      loop: true,
      playsInline: true,
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0
      }
    });
  }

  return (
    <View style={styles.nativeBackdrop}>
      <View style={styles.graphLineOne} />
      <View style={styles.graphLineTwo} />
      <View style={styles.panelPlane}>
        {Array.from({ length: 18 }).map((_, index) => (
          <View key={index} style={styles.backdropPanelCell} />
        ))}
      </View>
    </View>
  );
};

const PanelGrid = ({ panelCount, layout }: { panelCount: number; layout: ReturnType<typeof getLayout> }) => (
  <View style={styles.layoutCanvas}>
    <Text style={styles.widthDimension}>{layout.width.toFixed(1)} ft</Text>
    <View
      style={[
        styles.panelGrid,
        {
          width: Math.min(230, layout.columns * 42 + Math.max(0, layout.columns - 1) * 5),
          gridTemplateColumns: Platform.OS === 'web' ? `repeat(${layout.columns}, 1fr)` : undefined
        } as any
      ]}
    >
      {Array.from({ length: layout.rows * layout.columns }).map((_, index) => (
        <View key={index} style={[styles.panelTile, index >= panelCount && styles.panelTileGhost]}>
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <View key={cellIndex} style={styles.panelTileLine} />
          ))}
        </View>
      ))}
    </View>
    <Text style={styles.heightDimension}>{layout.height.toFixed(1)} ft</Text>
  </View>
);

export const RoofSpaceToolScreen = ({ navigation }: any) => {
  const [panelCount, setPanelCount] = useState('');
  const [calculatedPanels, setCalculatedPanels] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(true);
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [isCalculating, setIsCalculating] = useState(false);
  const inputOpacity = useRef(new Animated.Value(1)).current;
  const inputTranslate = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultTranslate = useRef(new Animated.Value(14)).current;

  const normalizedPanels = Math.max(1, Number.parseInt(panelCount, 10) || 12);
  const layout = useMemo(() => getLayout(calculatedPanels || normalizedPanels, orientation), [calculatedPanels, normalizedPanels, orientation]);
  const alternate = useMemo(() => getLayout(calculatedPanels || normalizedPanels, orientation === 'landscape' ? 'portrait' : 'landscape'), [calculatedPanels, normalizedPanels, orientation]);

  const calculate = () => {
    const nextPanels = normalizedPanels;
    setIsCalculating(true);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(inputOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(inputTranslate, { toValue: -8, duration: 220, useNativeDriver: true })
      ]).start(() => {
        setCalculatedPanels(nextPanels);
        setShowInput(false);
        setIsCalculating(false);
        resultOpacity.setValue(0);
        resultTranslate.setValue(14);
        Animated.parallel([
          Animated.timing(resultOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(resultTranslate, { toValue: 0, duration: 260, useNativeDriver: true })
        ]).start();
      });
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <BackgroundVideo />
      <View style={styles.readabilityOverlay} />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <ArrowLeft color="#111827" size={18} strokeWidth={2.3} />
        </Pressable>
        <Text style={styles.topTitle}>Roof Space</Text>
        <Pressable style={styles.toolButton} accessibilityLabel="Roof space settings">
          <Ruler color="#C98300" size={17} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, showInput ? styles.inputContent : styles.resultContent]}
        showsVerticalScrollIndicator={false}
      >
        {showInput ? (
          <Animated.View style={[styles.inputCard, { opacity: inputOpacity, transform: [{ translateY: inputTranslate }] }]}>
            <Text style={styles.heading}>
              Check Your <Text style={styles.headingAccent}>Roof{'\n'}Space</Text>
            </Text>
            <Text style={styles.subtitle}>Enter your panel count to calculate required roof space.</Text>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>NUMBER OF PANELS</Text>
              <TextInput
                value={panelCount}
                onChangeText={(value) => setPanelCount(value.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="e.g. 12"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
              <Text style={styles.tip}>Tip: Most homes use 8-20 panels</Text>
            </View>

            <Pressable style={[styles.checkButton, isCalculating && styles.disabledButton]} onPress={calculate} disabled={isCalculating}>
              <Text style={styles.checkButtonText}>{isCalculating ? 'Calculating...' : 'Check Roof Space'}</Text>
              {!isCalculating ? <ArrowRight color="#111827" size={16} strokeWidth={2.4} /> : null}
            </Pressable>
          </Animated.View>
        ) : null}

        {calculatedPanels ? (
          <Animated.View style={[styles.results, { opacity: resultOpacity, transform: [{ translateY: resultTranslate }] }]}>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>TOTAL ROOF SPACE</Text>
              <Text style={styles.areaValue}>{layout.area} sq ft</Text>
              <Text style={styles.resultSubtext}>{calculatedPanels} panels at full module coverage</Text>
            </View>

            <View style={styles.layoutCard}>
              <View style={styles.layoutHeader}>
                <View>
                  <Text style={styles.resultLabel}>PANEL LAYOUT</Text>
                  <Text style={styles.layoutMeta}>{layout.rows} rows x {layout.columns} columns</Text>
                </View>
                <View style={styles.sizeBadge}>
                  <Text style={styles.sizeBadgeText}>{layout.area} sq ft</Text>
                </View>
              </View>

              <View style={styles.toggle}>
                {(['landscape', 'portrait'] as Orientation[]).map((item) => (
                  <Pressable key={item} style={[styles.toggleItem, orientation === item && styles.toggleItemActive]} onPress={() => setOrientation(item)}>
                    <Text style={[styles.toggleText, orientation === item && styles.toggleTextActive]}>{item === 'landscape' ? 'Landscape' : 'Portrait'}</Text>
                  </Pressable>
                ))}
              </View>

              <PanelGrid panelCount={calculatedPanels} layout={layout} />
            </View>

            <View style={styles.bestCard}>
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>BEST LAYOUT</Text>
              </View>
              <Text style={styles.bestText}>
                {layout.area <= alternate.area
                  ? `${orientation === 'landscape' ? 'Landscape' : 'Portrait'} layout gives the cleanest footprint for this roof.`
                  : `${orientation === 'landscape' ? 'Portrait' : 'Landscape'} may use slightly less roof area for this panel count.`}
              </Text>
            </View>

            <Pressable style={styles.buildButton} onPress={() => navigation.navigate('DesignFlow')}>
              <Text style={styles.buildButtonText}>Build Your System</Text>
              <ArrowRight color="#111827" size={17} strokeWidth={2.5} />
            </Pressable>
          </Animated.View>
        ) : null}
      </ScrollView>

      <Pressable style={styles.expertButton} accessibilityLabel="Solar Expert">
        <MessageCircle color="#FFFFFF" size={16} strokeWidth={2.2} />
        <Text style={styles.expertText}>Solar Expert</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#F8F3E8', overflow: 'hidden' },
  readabilityOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,252,244,0.62)',
    zIndex: 1
  },
  nativeBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E7E5DF',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.86,
    zIndex: 0
  },
  graphLineOne: {
    position: 'absolute',
    top: 86,
    left: 10,
    right: 16,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    transform: [{ rotate: '-10deg' }]
  },
  graphLineTwo: {
    position: 'absolute',
    top: 124,
    left: 22,
    right: 8,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.68)',
    transform: [{ rotate: '12deg' }]
  },
  panelPlane: {
    width: 320,
    height: 190,
    borderRadius: 16,
    backgroundColor: 'rgba(186,196,198,0.42)',
    transform: [{ rotate: '-13deg' }, { skewX: '-12deg' }],
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 6
  },
  backdropPanelCell: {
    width: 43,
    height: 34,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)'
  },
  topBar: {
    height: 42,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,248,241,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218,211,203,0.62)',
    zIndex: 3
  },
  backButton: {
    width: 31,
    height: 31,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  topTitle: { flex: 1, color: '#172031', textAlign: 'center', fontSize: 13, fontWeight: '900' },
  toolButton: {
    width: 31,
    height: 31,
    borderRadius: 999,
    backgroundColor: '#FFF2D1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scroll: { flex: 1, zIndex: 2 },
  content: { minHeight: 760, paddingBottom: 116 },
  inputContent: { paddingHorizontal: 33, paddingTop: 178 },
  resultContent: { paddingHorizontal: 0, paddingTop: 6 },
  inputCard: {
    width: '100%',
    maxWidth: 292,
    alignSelf: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,249,235,0.91)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingTop: 21,
    paddingBottom: 17,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8
  },
  heading: { color: '#0F1E33', textAlign: 'center', fontSize: 27, lineHeight: 31, fontWeight: '900', marginBottom: 10 },
  headingAccent: { color: '#E6A400' },
  subtitle: { color: '#6B7280', textAlign: 'center', fontSize: 11, lineHeight: 15, fontWeight: '600', paddingHorizontal: 24, marginBottom: 17 },
  inputBlock: { marginBottom: 17 },
  inputLabel: { color: '#9AA4B2', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8, marginBottom: 7 },
  input: {
    height: 40,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    color: '#111827',
    fontSize: 12,
    fontWeight: '800'
  },
  tip: { color: '#7C8797', fontSize: 10.5, fontWeight: '600', marginTop: 8 },
  checkButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FDB813',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  disabledButton: { opacity: 0.72 },
  checkButtonText: { color: '#111827', fontSize: 12.5, fontWeight: '900' },
  results: { gap: 10 },
  resultCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.9)',
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 10,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  resultLabel: { color: '#9B7A2D', fontSize: 9.5, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 },
  areaValue: { color: '#0F1E33', fontSize: 25, fontWeight: '900', lineHeight: 29 },
  resultSubtext: { color: '#64748B', fontSize: 10.5, fontWeight: '800', marginTop: 1 },
  layoutCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.9)',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    overflow: 'hidden'
  },
  layoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  layoutMeta: { color: '#172031', fontSize: 11, fontWeight: '900' },
  sizeBadge: { borderRadius: 999, backgroundColor: '#FFF1CC', borderWidth: 1, borderColor: '#F5D482', paddingHorizontal: 9, paddingVertical: 5 },
  sizeBadgeText: { color: '#9B6800', fontSize: 9, fontWeight: '900' },
  toggle: { height: 31, borderRadius: 10, backgroundColor: '#F3F4F6', flexDirection: 'row', padding: 3, marginBottom: 12 },
  toggleItem: { flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  toggleItemActive: { backgroundColor: '#FDB813' },
  toggleText: { color: '#64748B', fontSize: 10.5, fontWeight: '900' },
  toggleTextActive: { color: '#111827' },
  layoutCanvas: {
    minHeight: 220,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    paddingBottom: 12
  },
  widthDimension: { position: 'absolute', top: 9, color: '#334155', fontSize: 10.5, fontWeight: '900' },
  heightDimension: { position: 'absolute', right: 7, top: '47%', color: '#334155', fontSize: 10.5, fontWeight: '900', transform: [{ rotate: '90deg' }] },
  panelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center'
  },
  panelTile: {
    width: 40,
    height: 27,
    borderRadius: 4,
    backgroundColor: '#0E325D',
    borderWidth: 1,
    borderColor: '#6BA6D8',
    overflow: 'hidden',
    opacity: 0.98
  },
  panelTileGhost: { opacity: 0 },
  panelTileLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(111,166,216,0.45)',
    marginTop: 3
  },
  bestCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,248,231,0.95)',
    borderWidth: 1,
    borderColor: '#F5D482',
    padding: 11
  },
  bestBadge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#FDB813', paddingHorizontal: 9, paddingVertical: 4, marginBottom: 8 },
  bestBadgeText: { color: '#111827', fontSize: 9, fontWeight: '900' },
  bestText: { color: '#172031', fontSize: 12, lineHeight: 17, fontWeight: '800' },
  buildButton: {
    height: 47,
    borderRadius: 8,
    backgroundColor: '#FDB813',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 8
  },
  buildButtonText: { color: '#111827', fontSize: 13, fontWeight: '900' },
  expertButton: {
    position: 'absolute',
    right: 16,
    bottom: 70,
    height: 41,
    borderRadius: 999,
    backgroundColor: '#08213F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 8,
    shadowColor: '#08213F',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 4
  },
  expertText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '900' }
});
