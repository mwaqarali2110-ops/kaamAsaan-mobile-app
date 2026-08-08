import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, MessageCircle, Ruler } from 'lucide-react-native';
import { calculatePanelLayout } from '@/utils/calculations';
import { PanelLayoutVisualizer } from '@/components/solar-tools/PanelLayoutVisualizer';
import { useProducts } from '@/hooks/useProducts';
import { useSystemStore } from '@/store/useSystemStore';
import { extractPanelWattage, isPanelProduct } from '@/utils/packageBuilder';
import { selectDefaultPanelProduct } from '@/utils/panelProducts';

const roofSpaceVideo = require('../../../../roof-space-video.mp4');

const RoofSpaceVideoBackground = () => {
  const isFocused = useIsFocused();
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);
  const player = useVideoPlayer(roofSpaceVideo, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.staysActiveInBackground = false;
  });
  const playerStatus = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (isFocused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isFocused, player]);

  useEffect(() => {
    if (__DEV__ && playerStatus.status === 'error') {
      console.warn('Roof-space background video could not be played.', playerStatus.error?.message);
    }
  }, [playerStatus.error?.message, playerStatus.status]);

  if (playerStatus.status === 'error') return null;

  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="cover"
      playsInline
      pointerEvents="none"
      useExoShutter={false}
      surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
      style={[styles.backgroundVideo, !hasRenderedFrame && styles.backgroundVideoLoading]}
      onFirstFrameRender={() => setHasRenderedFrame(true)}
    />
  );
};

export const RoofSpaceToolScreen = ({ navigation }: any) => {
  const [panelCount, setPanelCount] = useState('');
  const [calculatedPanels, setCalculatedPanels] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(true);
  const orientation = useSystemStore((state) => state.panelOrientation);
  const setOrientation = useSystemStore((state) => state.setPanelOrientation);
  const storedPanel = useSystemStore((state) => state.selectedPanels);
  const storedPanelWattage = useSystemStore((state) => state.panelWattage);
  const setPanelLayoutSelection = useSystemStore((state) => state.setPanelLayoutSelection);
  const panelProductsQuery = useProducts('panel');
  const panelProducts = useMemo(
    () => (panelProductsQuery.data ?? []).filter(isPanelProduct).filter((product) => extractPanelWattage(product) > 0),
    [panelProductsQuery.data]
  );
  const selectedPanel = panelProducts.find((product) => product.id === storedPanel?.id) ??
    (storedPanel && isPanelProduct(storedPanel) && extractPanelWattage(storedPanel) > 0 ? storedPanel : null) ??
    selectDefaultPanelProduct(panelProducts, storedPanelWattage);
  const selectedPanelWattage = selectedPanel ? extractPanelWattage(selectedPanel) : Math.max(1, storedPanelWattage || 610);
  const [isCalculating, setIsCalculating] = useState(false);
  const inputOpacity = useRef(new Animated.Value(1)).current;
  const inputTranslate = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultTranslate = useRef(new Animated.Value(14)).current;

  const normalizedPanels = Math.max(1, Number.parseInt(panelCount, 10) || 12);
  const layout = useMemo(
    () => calculatePanelLayout({ panelCount: calculatedPanels || normalizedPanels, orientation }),
    [calculatedPanels, normalizedPanels, orientation]
  );
  const alternate = useMemo(
    () => calculatePanelLayout({ panelCount: calculatedPanels || normalizedPanels, orientation: orientation === 'landscape' ? 'portrait' : 'landscape' }),
    [calculatedPanels, normalizedPanels, orientation]
  );

  const buildSystem = () => {
    if (!calculatedPanels) return;
    setPanelLayoutSelection({
      panelQuantity: calculatedPanels,
      panelWattage: selectedPanelWattage,
      orientation,
      panelProduct: selectedPanel
    });
    navigation.navigate('DesignFlow', { screen: 'roof' });
  };

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
    <View style={styles.screen}>
      <RoofSpaceVideoBackground />
      <View pointerEvents="none" style={styles.videoReadabilityOverlay} />

      <SafeAreaView style={styles.foreground} edges={['top']}>
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
          keyboardShouldPersistTaps="handled"
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

            <PanelLayoutVisualizer
              selectedPanelProduct={selectedPanel}
              panelWattage={selectedPanelWattage}
              panelQuantity={calculatedPanels}
              orientation={orientation}
              onOrientationChange={setOrientation}
              layout={layout}
              alternateLayout={alternate}
            />

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

            <Pressable style={styles.buildButton} onPress={buildSystem}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, position: 'relative', backgroundColor: '#F7F3EA', overflow: 'hidden' },
  foreground: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
    // Keeps the entire calculator hierarchy above Android's native video texture.
    elevation: 2
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    zIndex: 0
  },
  backgroundVideoLoading: { opacity: 0 },
  videoReadabilityOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Platform.OS === 'android'
      ? 'rgba(247, 243, 234, 0.28)'
      : 'rgba(247, 243, 234, 0.32)',
    zIndex: 1
  },
  topBar: {
    height: 42,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 248, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218,211,203,0.62)',
    zIndex: 3,
    elevation: 3
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
  scroll: { flex: 1 },
  content: { minHeight: 760, paddingBottom: 116 },
  inputContent: { paddingHorizontal: 33, paddingTop: 178 },
  resultContent: { paddingHorizontal: 0, paddingTop: 6 },
  inputCard: {
    width: '100%',
    maxWidth: 292,
    alignSelf: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 252, 243, 0.94)',
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
    zIndex: 3,
    elevation: 3
  },
  expertText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '900' }
});
