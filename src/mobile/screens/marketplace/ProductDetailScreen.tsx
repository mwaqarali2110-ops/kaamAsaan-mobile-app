import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowLeft, ArrowRight, Award, BatteryCharging, Bookmark, Box, Calculator, Check, ChevronDown, ChevronRight, ClipboardList, Clock3, HelpCircle, Info, MessageCircle, Package, PenLine, Settings, Share2, ShieldCheck, Star, Sun, Tag, Wrench, X, Zap } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { AppButton } from '@/components/ui/AppButton';
import { InfoCard } from '@/components/cards/InfoCard';
import { SafeImage } from '@/components/ui/SafeImage';
import { useBrands, useCompatibleBatteryBrands, useProduct, useProducts } from '@/hooks/useProducts';
import { useSystemStore } from '@/store/useSystemStore';
import type { Product } from '@/types/product.types';
import { formatPkr } from '@/utils/formatters';

type BuilderStep =
  | 'panelSize'
  | 'inverterType'
  | 'inverterSize'
  | 'inverterSelect'
  | 'batteryDecision'
  | 'batterySelect'
  | 'orderProduct';

const INVERTER_SIZES = [3, 5, 6, 8, 10, 12, 15, 20];
const WATTAGE_OPTIONS = [550, 575, 585, 600, 610, 620];
const INVERTER_TYPES = ['Hybrid', 'On-Grid', 'Off-Grid'];
const batteryImage = require('../../../assets/home/battery.webp');

const toKw = (value: number) => Number.isInteger(value) ? `${value}kW` : `${value.toFixed(1)}kW`;

const productCategoryLabel = {
  panel: 'SOLAR PANEL',
  inverter: 'INVERTER',
  battery: 'BATTERY',
  accessory: 'SOLAR ACCESSORY'
};

const detailSubtitle = (product: Product) => {
  if (product.category === 'panel') return `${product.specs[0] ?? '550W'} | ${product.specs[1] ?? 'Monocrystalline PERC'}`;
  if (product.category === 'inverter') return `${product.specs[0] ?? 'Hybrid'} | ${product.specs[1] ?? 'Smart inverter'}`;
  if (product.category === 'battery') return `${product.specs[0] ?? 'Lithium'} | ${product.specs[1] ?? 'Backup storage'}`;
  return product.specs.join(' | ') || 'Installation accessory';
};

const detailSpecRows = (product: Product) => {
  if (product.category === 'panel') {
    return [
      ['Category', 'Solar Panel'],
      ['Capacity', product.specs[0] ?? '550W'],
      ['Technology', product.specs[1] ?? 'Monocrystalline PERC'],
      ['Efficiency', '21.3%'],
      ['Warranty', product.specs[2] ? `${product.specs[2]} Product / 25 Yr Linear Output` : '12 Yr Product / 25 Yr Linear Output'],
      ['Best For', 'Residential Rooftops']
    ];
  }

  if (product.category === 'inverter') {
    return [
      ['Category', 'Inverter'],
      ['Capacity', product.specs[0] ?? 'Hybrid'],
      ['Technology', product.specs[1] ?? 'Hybrid'],
      ['Efficiency', 'High efficiency'],
      ['Warranty', product.specs[2] ?? '5 Years'],
      ['Best For', 'Home Solar Systems']
    ];
  }

  if (product.category === 'battery') {
    return [
      ['Category', 'Battery'],
      ['Capacity', product.specs[0] ?? '5 kWh'],
      ['Technology', product.specs[1] ?? 'Lithium'],
      ['Efficiency', 'Deep cycle backup'],
      ['Warranty', product.specs[2] ?? '10 Years'],
      ['Best For', 'Backup Power']
    ];
  }

  return [
    ['Category', 'Solar Accessory'],
    ['Type', product.brand],
    ['Spec 1', product.specs[0] ?? 'Install Ready'],
    ['Spec 2', product.specs[1] ?? 'Durable'],
    ['Warranty', product.specs[2] ?? 'On request'],
    ['Best For', 'Solar Installations']
  ];
};

const detailBenefits = (product: Product) => {
  if (product.category === 'panel') {
    return [
      'Solid efficiency for standard residential systems',
      'Ideal wattage for Pakistani residential rooftops',
      'Tier-1 global manufacturer - bankable quality and proven reliability',
      '25-year linear output warranty for exceptional long-term ROI'
    ];
  }

  return [
    'Verified specs for reliable solar installations',
    'Suitable for Pakistani residential energy systems',
    'Compatible with KaamAsaan approved product flows',
    'Supported by expert survey and installation guidance'
  ];
};

const OptionGrid = ({ options, selected, onSelect, suffix = '' }: { options: number[]; selected: number; onSelect: (value: number) => void; suffix?: string }) => (
  <View className="flex-row flex-wrap gap-2">
    {options.map((item) => (
      <Pressable key={item} className={`rounded-2xl px-4 py-3 ${selected === item ? 'bg-kaam-yellow' : 'bg-white'}`} onPress={() => onSelect(item)}>
        <Text className="text-xs font-extrabold text-kaam-navy">{item}{suffix}</Text>
      </Pressable>
    ))}
  </View>
);

const ProductListPicker = ({ title, subtitle, options, onSelect }: { title: string; subtitle: string; options: Product[]; onSelect: (product: Product) => void }) => (
  <Screen>
    <Header title={title} subtitle={subtitle} />
    <View className="gap-3">
      {options.length === 0 ? <InfoCard title="No active products available" subtitle="Add matching products in the admin dashboard, then try again." /> : null}
      {options.map((item, index) => (
        <Pressable key={item.id} className={`rounded-3xl border bg-white p-4 shadow-sm ${index === 0 ? 'border-kaam-yellow' : 'border-kaam-line'}`} onPress={() => onSelect(item)}>
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-kaam-navy">{item.name}</Text>
              <Text className="mt-1 text-xs font-bold text-kaam-muted">{item.brand} • {item.specs.join(' • ')}</Text>
            </View>
            <Text className="text-xs font-extrabold text-kaam-navy">{formatPkr(item.price)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  </Screen>
);

export const ProductDetailScreen = ({ route, navigation }: any) => {
  const productQuery = useProduct(route.params.productId);
  const { data: product } = productQuery;
  const productsQuery = useProducts();
  const panelBrandsQuery = useBrands('panel');
  const setSelectedProduct = useSystemStore((state) => state.setSelectedProduct);
  const setRecommendedSolarKw = useSystemStore((state) => state.setRecommendedSolarKw);
  const setPanelWattage = useSystemStore((state) => state.setPanelWattage);
  const setSelectedPanelBrand = useSystemStore((state) => state.setSelectedPanelBrand);
  const setBackupDecision = useSystemStore((state) => state.setBackupDecision);
  const selectedInverter = useSystemStore((state) => state.selectedInverter);
  const selectedPanels = useSystemStore((state) => state.selectedPanels);
  const selectedBattery = useSystemStore((state) => state.selectedBattery);
  const [step, setStep] = useState<BuilderStep | null>(null);
  const [guidedVisible, setGuidedVisible] = useState(false);
  const [solarKw, setSolarKw] = useState(10);
  const [customSolarKw, setCustomSolarKw] = useState('');
  const [inverterSize, setInverterSize] = useState(6);
  const [wattage, setWattage] = useState(550);
  const [panelBrand, setPanelBrand] = useState('Longi');
  const [wattageOpen, setWattageOpen] = useState(false);
  const [panelBrandOpen, setPanelBrandOpen] = useState(false);
  const [batteryChoiceId, setBatteryChoiceId] = useState('fox-batt-5');
  const [inverterType, setInverterType] = useState('Hybrid');
  const [quantity, setQuantity] = useState('1');
  const [city, setCity] = useState('Islamabad');
  const [phone, setPhone] = useState('+923351351472');
  const [serviceOption, setServiceOption] = useState<'product-only' | 'product-installation'>('product-only');
  const [submitted, setSubmitted] = useState(false);

  const inverterOptions = useMemo(() => (productsQuery.data ?? []).filter((item) => item.category === 'inverter'), [productsQuery.data]);
  const compatibleBatteryBrandsQuery = useCompatibleBatteryBrands(selectedInverter?.brand);
  const batteryOptions = useMemo(() => {
    const all = (productsQuery.data ?? []).filter((item) => item.category === 'battery');
    if (!selectedInverter) return all;
    const brands = compatibleBatteryBrandsQuery.data ?? [];
    return all.filter((item) => brands.includes(item.brand));
  }, [compatibleBatteryBrandsQuery.data, productsQuery.data, selectedInverter]);
  const panelBrandOptions = useMemo(() => panelBrandsQuery.data?.map((item) => item.name) ?? [], [panelBrandsQuery.data]);

  useEffect(() => {
    if (panelBrandOptions.length && !panelBrandOptions.includes(panelBrand)) setPanelBrand(panelBrandOptions[0]);
  }, [panelBrand, panelBrandOptions]);

  if (!product) {
    return <Screen><Header title="Product" onBack={() => navigation.goBack()} /><InfoCard title={productQuery.isError ? 'Unable to load product' : 'Loading product...'} subtitle={productQuery.isError ? 'Please go back and try again.' : 'Fetching live marketplace details.'} /></Screen>;
  }

  const goSummary = () => navigation.navigate('SystemSummary');

  const startAddToSystem = () => {
    setSelectedProduct(product);
    if (product.category === 'battery') setBackupDecision('yes');
    if (product.category === 'accessory') goSummary();
    else setGuidedVisible(true);
  };

  const handleGuidedChoice = (target: 'panels' | 'inverter' | 'batteries' | 'summary') => {
    setGuidedVisible(false);
    setSelectedProduct(product);
    if (target === 'summary') {
      goSummary();
    } else if (target === 'panels') {
      setStep('panelSize');
    } else if (target === 'inverter') {
      setStep(product.category === 'panel' ? 'inverterType' : 'inverterSize');
    } else {
      setBackupDecision('yes');
      setStep('batterySelect');
    }
  };

  const submitOrder = () => {
    setSubmitted(true);
    if (Number(quantity) < 1 || city.trim().length < 2 || phone.trim().length < 7) return;
    setSelectedProduct(product);
    goSummary();
  };

  if (step === 'orderProduct') {
    const orderQuantity = Math.max(1, Number(quantity) || 1);
    const productTotal = (product.price ?? 0) * orderQuantity;
    const hasInstallation = serviceOption === 'product-installation';
    const changeOrderQuantity = (delta: number) => setQuantity(String(Math.max(1, orderQuantity + delta)));

    return (
      <SafeAreaView style={orderStyles.screen}>
        <View style={orderStyles.header}>
          <Pressable style={orderStyles.headerButton} onPress={() => setStep(null)}>
            <ArrowLeft size={22} color="#10213A" strokeWidth={2.4} />
          </Pressable>
          <View style={orderStyles.headerCopy}>
            <Text style={orderStyles.headerTitle}>Order Product</Text>
            <Text style={orderStyles.headerSubtitle}>Final quotation</Text>
          </View>
          <Pressable style={orderStyles.headerButton}>
            <Settings size={21} color="#FDB813" strokeWidth={2.3} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={orderStyles.content}>
          <View style={orderStyles.productCard}>
            <View style={orderStyles.productVisual}>
              <ProductVisual product={product} />
            </View>
            <View style={orderStyles.productCopy}>
              <Text style={orderStyles.productTitle}>{product.name}</Text>
              <View style={orderStyles.categoryBadge}>
                <Text style={orderStyles.categoryBadgeText}>{productCategoryLabel[product.category].replace('SOLAR ', '')}</Text>
              </View>
              <Text style={orderStyles.productPrice}>{formatPkr(product.price)}</Text>
              <View style={orderStyles.stockBadge}>
                <View style={orderStyles.stockDot} />
                <Text style={orderStyles.stockText}>In Stock</Text>
              </View>
            </View>
          </View>

          <View style={orderStyles.card}>
            <SectionHeading Icon={ClipboardList} title="Order Details" />
            <View style={orderStyles.quantityRow}>
              <Text style={orderStyles.fieldLabel}>Quantity</Text>
              <View style={orderStyles.stepper}>
                <Pressable style={orderStyles.stepperButton} onPress={() => changeOrderQuantity(-1)}>
                  <Text style={orderStyles.stepperText}>-</Text>
                </Pressable>
                <Text style={orderStyles.quantityValue}>{orderQuantity}</Text>
                <Pressable style={[orderStyles.stepperButton, orderStyles.stepperButtonPlus]} onPress={() => changeOrderQuantity(1)}>
                  <Text style={orderStyles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>
            <Text style={orderStyles.inputLabel}>City</Text>
            <View style={orderStyles.inputShell}>
              <TextInput style={orderStyles.input} value={city} onChangeText={setCity} placeholder="Islamabad" />
              <ChevronDown size={18} color="#10213A" strokeWidth={2.4} />
            </View>
            <Text style={orderStyles.inputLabel}>Phone</Text>
            <View style={orderStyles.inputShell}>
              <TextInput style={orderStyles.input} value={phone} onChangeText={setPhone} placeholder="+923351351472" keyboardType="phone-pad" />
            </View>
          </View>

          <View style={orderStyles.card}>
            <SectionHeading Icon={ShieldCheck} title="Service Option" />
            <View style={orderStyles.serviceRow}>
              <ServiceOption
                Icon={Package}
                title="Product only"
                subtitle="Only product will be delivered"
                selected={serviceOption === 'product-only'}
                onPress={() => setServiceOption('product-only')}
              />
              <ServiceOption
                Icon={Wrench}
                title="Product + installation"
                subtitle="Product with professional installation"
                selected={serviceOption === 'product-installation'}
                onPress={() => setServiceOption('product-installation')}
              />
            </View>
          </View>

          <View style={orderStyles.card}>
            <SectionHeading Icon={Calculator} title="Price Summary" />
            <PriceRow Icon={Box} label="Product Price" value={formatPkr(product.price)} />
            <PriceRow Icon={Tag} label="Quantity" value={String(orderQuantity)} />
            <PriceRow Icon={Wrench} label="Installation" value={hasInstallation ? 'Included' : 'Not included'} />
            <View style={orderStyles.totalBox}>
              <Text style={orderStyles.totalLabel}>Estimated Total</Text>
              <Text style={orderStyles.totalValue}>{formatPkr(productTotal)}</Text>
            </View>
          </View>

          {submitted && (Number(quantity) < 1 || city.trim().length < 2 || phone.trim().length < 7) ? (
            <Text style={orderStyles.errorText}>Enter quantity, city and phone to request a quotation.</Text>
          ) : null}
        </ScrollView>

        <View style={orderStyles.footer}>
          <Pressable style={orderStyles.continueButton} onPress={submitOrder}>
            <Text style={orderStyles.continueText}>Continue to System Summary</Text>
            <ArrowRight size={20} color="#111827" strokeWidth={2.7} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'panelSize') {
    const fromBattery = product.category === 'battery';
    const customSolarValue = Number(customSolarKw);
    const hasCustomSolarSize = customSolarKw.trim().length > 0;
    const validCustomSolarSize = !hasCustomSolarSize || (Number.isFinite(customSolarValue) && customSolarValue >= 1 && customSolarValue <= 100);
    const activeSolarKw = hasCustomSolarSize && validCustomSolarSize ? customSolarValue : solarKw;
    const estimatedPanelCount = Math.ceil((activeSolarKw * 1000) / wattage);
    const estimatedRoofSpace = estimatedPanelCount * 25;
    const savePanelSelection = () => {
      const normalizedBrand = panelBrand;
      const exactPanel = (productsQuery.data ?? []).find((item) => item.category === 'panel' && item.brand === normalizedBrand && item.specs.some((spec) => spec.includes(`${wattage}W`)));
      const brandPanel = (productsQuery.data ?? []).find((item) => item.category === 'panel' && item.brand === normalizedBrand);
      const selectedPanel: Product = exactPanel ?? {
        id: brandPanel?.id ?? `${normalizedBrand.toLowerCase().replace(/\s+/g, '-')}-${wattage}`,
        category: 'panel',
        brand: normalizedBrand,
        name: `${panelBrand} ${wattage}W Panel`,
        tag: brandPanel?.tag,
        price: brandPanel?.price ?? null,
        specs: [`${wattage}W`, brandPanel?.specs[1] ?? 'Solar Panel', brandPanel?.specs[2] ?? '25 Years']
      };
      setSelectedPanelBrand(panelBrand);
      setSelectedProduct(selectedPanel);
    };

    const ctaTitle = 'Continue';

    return (
      <SafeAreaView style={solarSizeStyles.screen}>
        <View style={solarSizeStyles.header}>
          <Pressable style={solarSizeStyles.backButton} onPress={() => setStep(null)}>
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <View style={solarSizeStyles.headerCopy}>
            <Text style={solarSizeStyles.headerTitle}>{fromBattery ? 'Select Panel Size' : 'Choose Solar Size'}</Text>
            <Text style={solarSizeStyles.headerSubtitle}>{product.name}</Text>
          </View>
          <Pressable style={solarSizeStyles.helpButton}>
            <HelpCircle size={18} color="#0F172A" />
            <Text style={solarSizeStyles.helpText}>Help</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={solarSizeStyles.content}>
          <View style={solarSizeStyles.mainCard}>
            <View style={solarSizeStyles.controlSection}>
              <View style={solarSizeStyles.sectionHeader}>
                <View style={solarSizeStyles.sectionIcon}>
                  <Zap size={23} color="#FDB813" fill="#FDB813" />
                </View>
                <View style={solarSizeStyles.sectionText}>
                  <Text style={solarSizeStyles.sectionTitle}>Solar Capacity</Text>
                  <Text style={solarSizeStyles.sectionSubtitle}>Choose the total system size</Text>
                </View>
              </View>
              <View style={solarSizeStyles.compactSizeGrid}>
                {[5, 10, 15, 20].map((item) => {
                  const active = !hasCustomSolarSize && solarKw === item;
                  return (
                    <Pressable
                      key={item}
                      style={[solarSizeStyles.compactSizeButton, active && solarSizeStyles.sizeButtonActive]}
                      onPress={() => {
                        setSolarKw(item);
                        setCustomSolarKw('');
                      }}
                    >
                      <Text style={[solarSizeStyles.sizeText, active && solarSizeStyles.sizeTextActive]}>{item}kW</Text>
                      {active ? (
                        <View style={solarSizeStyles.sizeCheck}>
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={solarSizeStyles.softDivider} />

            <View style={solarSizeStyles.controlSection}>
              <View style={solarSizeStyles.sectionHeader}>
                <View style={[solarSizeStyles.sectionIcon, solarSizeStyles.greenSectionIcon]}>
                  <PenLine size={20} color="#15803D" />
                </View>
                <View style={solarSizeStyles.sectionText}>
                  <Text style={solarSizeStyles.sectionTitle}>Custom Size <Text style={solarSizeStyles.optionalText}>(optional)</Text></Text>
                </View>
              </View>
              <View style={[solarSizeStyles.inputShell, !validCustomSolarSize && solarSizeStyles.inputShellError]}>
                <TextInput
                  style={solarSizeStyles.customInput}
                  keyboardType="decimal-pad"
                  placeholder="7"
                  placeholderTextColor="#9CA3AF"
                  value={customSolarKw}
                  onChangeText={(value) => setCustomSolarKw(value.replace(/[^0-9.]/g, ''))}
                />
                <View style={solarSizeStyles.inputDivider} />
                <Text style={solarSizeStyles.inputSuffix}>kW</Text>
              </View>
              {!validCustomSolarSize ? (
                <Text style={solarSizeStyles.errorText}>Enter a solar size between 1kW and 100kW.</Text>
              ) : null}
            </View>

            <View style={solarSizeStyles.softDivider} />

            <View style={solarSizeStyles.controlSection}>
              <View style={solarSizeStyles.sectionHeader}>
                <View style={[solarSizeStyles.sectionIcon, solarSizeStyles.greenSectionIcon]}>
                  <Sun size={21} color="#15803D" />
                </View>
                <View style={solarSizeStyles.sectionText}>
                  <Text style={solarSizeStyles.sectionTitle}>Panel Wattage</Text>
                </View>
              </View>
              <Pressable style={solarSizeStyles.dropdown} onPress={() => setWattageOpen((open) => !open)}>
                <Text style={solarSizeStyles.dropdownValue}>{wattage}W</Text>
                <ChevronRight size={21} color="#6B7280" style={[solarSizeStyles.dropdownChevron, wattageOpen && solarSizeStyles.dropdownChevronOpen]} />
              </Pressable>
              {wattageOpen ? (
                <View style={solarSizeStyles.dropdownMenu}>
                  {WATTAGE_OPTIONS.map((item) => (
                    <Pressable
                      key={item}
                      style={[solarSizeStyles.dropdownOption, wattage === item && solarSizeStyles.dropdownOptionActive]}
                      onPress={() => {
                        setWattage(item);
                        setWattageOpen(false);
                      }}
                    >
                      <Text style={[solarSizeStyles.dropdownOptionText, wattage === item && solarSizeStyles.dropdownOptionTextActive]}>{item}W</Text>
                      {wattage === item ? <Check size={15} color="#111827" strokeWidth={3} /> : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={solarSizeStyles.softDivider} />

            <View style={solarSizeStyles.controlSection}>
              <View style={solarSizeStyles.sectionHeader}>
                <View style={[solarSizeStyles.sectionIcon, solarSizeStyles.greenSectionIcon]}>
                  <ShieldCheck size={20} color="#15803D" />
                </View>
                <View style={solarSizeStyles.sectionText}>
                  <Text style={solarSizeStyles.sectionTitle}>Select Brand</Text>
                </View>
              </View>
              <Pressable style={solarSizeStyles.dropdown} onPress={() => setPanelBrandOpen((open) => !open)}>
                <Text style={solarSizeStyles.dropdownValue}>{panelBrand}</Text>
                <ChevronRight size={21} color="#6B7280" style={[solarSizeStyles.dropdownChevron, panelBrandOpen && solarSizeStyles.dropdownChevronOpen]} />
              </Pressable>
              {panelBrandOpen ? (
                <View style={solarSizeStyles.dropdownMenu}>
                  {panelBrandOptions.map((item) => (
                    <Pressable
                      key={item}
                      style={[solarSizeStyles.dropdownOption, panelBrand === item && solarSizeStyles.dropdownOptionActive]}
                      onPress={() => {
                        setPanelBrand(item);
                        setPanelBrandOpen(false);
                      }}
                    >
                      <Text style={[solarSizeStyles.dropdownOptionText, panelBrand === item && solarSizeStyles.dropdownOptionTextActive]}>{item}</Text>
                      {panelBrand === item ? <Check size={15} color="#111827" strokeWidth={3} /> : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          <View style={solarSizeStyles.summaryCard}>
            <View style={solarSizeStyles.summaryTop}>
              <View style={solarSizeStyles.summaryIcon}>
                <Sun size={33} color="#15803D" />
              </View>
              <View>
                <Text style={solarSizeStyles.summaryTitle}>{estimatedPanelCount} Panels Required</Text>
                <Text style={solarSizeStyles.summarySubtitle}>{toKw(activeSolarKw)} System • {wattage}W Panels • {panelBrand}</Text>
              </View>
            </View>
            <View style={solarSizeStyles.summaryStats}>
              <View style={solarSizeStyles.statItem}>
                <Text style={solarSizeStyles.statLabel}>Est. Roof Space</Text>
                <Text style={solarSizeStyles.statValue}>~{estimatedRoofSpace} sq ft</Text>
              </View>
              <View style={solarSizeStyles.statDivider} />
              <View style={solarSizeStyles.statItem}>
                <Text style={solarSizeStyles.statLabel}>Best For</Text>
                <Text style={solarSizeStyles.statValue}>Homes & Shops</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={solarSizeStyles.footer}>
          <Pressable
            disabled={!validCustomSolarSize}
            style={[solarSizeStyles.ctaButton, !validCustomSolarSize && solarSizeStyles.ctaButtonDisabled]}
            onPress={() => {
              setSolarKw(activeSolarKw);
              setRecommendedSolarKw(activeSolarKw);
              setPanelWattage(wattage);
              savePanelSelection();
              if (product.category === 'battery') goSummary();
              else setStep(product.category === 'panel' ? 'inverterType' : 'batteryDecision');
            }}
          >
            <Text style={solarSizeStyles.ctaText}>{ctaTitle}</Text>
            <ArrowRight size={22} color="#111827" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'inverterType') {
    return (
      <Screen>
        <Header title="Choose Inverter Type" subtitle={`Matched to your ${toKw(solarKw)} panel setup`} onBack={() => setStep('panelSize')} />
        <View className="gap-3">
          {INVERTER_TYPES.map((type) => (
            <Pressable key={type} className={`rounded-3xl border p-4 ${inverterType === type ? 'border-kaam-yellow bg-kaam-yellow/20' : 'border-kaam-line bg-white'}`} onPress={() => setInverterType(type)}>
              <Text className="text-base font-extrabold text-kaam-navy">{type}</Text>
              <Text className="mt-1 text-xs font-bold text-kaam-muted">{type === 'Hybrid' ? 'Solar + battery + grid, recommended for load shedding.' : type === 'On-Grid' ? 'Grid-tied solar only, lower upfront cost.' : 'Standalone system with battery backup.'}</Text>
            </Pressable>
          ))}
          <AppButton title="View Compatible Inverters" onPress={() => setStep('inverterSize')} />
        </View>
      </Screen>
    );
  }

  if (step === 'inverterSize') {
    return (
      <Screen>
        <Header title="Select Inverter Size" subtitle={product.category === 'battery' ? 'Choose a compatible inverter capacity' : 'Choose inverter capacity'} onBack={() => setStep(product.category === 'panel' ? 'inverterType' : null)} />
        <View className="gap-4">
          <OptionGrid options={INVERTER_SIZES} selected={inverterSize} onSelect={setInverterSize} suffix="kW" />
          <InfoCard title={`${toKw(inverterSize)} selected`} subtitle="Next, choose a compatible inverter model." />
          <AppButton title="Select Inverter" onPress={() => setStep('inverterSelect')} />
        </View>
      </Screen>
    );
  }

  if (step === 'inverterSelect') {
    return <ProductListPicker title="Select Inverter" subtitle={`${toKw(inverterSize)} preferred size`} options={inverterOptions} onSelect={(item) => { setSelectedProduct(item); setStep(product.category === 'battery' ? 'panelSize' : 'batteryDecision'); }} />;
  }

  if (step === 'batteryDecision') {
    return (
      <Screen>
        <Header title="Battery Backup" subtitle="Need backup during load shedding?" onBack={() => setStep(product.category === 'panel' ? 'inverterSelect' : 'panelSize')} />
        <View className="gap-3">
          <InfoCard title="Need backup during load shedding?" subtitle="Battery backup keeps essential appliances running." />
          <AppButton title="Yes, Add Battery" onPress={() => { setBackupDecision('yes'); setStep('batterySelect'); }} />
          <AppButton title="No, Go to Summary" tone="secondary" onPress={() => { setBackupDecision('no'); goSummary(); }} />
        </View>
      </Screen>
    );
  }

  if (step === 'batterySelect') {
    const inverterBrand = selectedInverter?.brand ?? 'Selected';
    const guidedBatteryOptions = batteryOptions;
    const selectedChoice = guidedBatteryOptions.find((item) => item.id === batteryChoiceId) ?? guidedBatteryOptions[0];
    if (!selectedChoice) return <Screen><Header title="Select Battery" subtitle={`Compatible with ${inverterBrand}`} onBack={() => setStep('batteryDecision')} /><InfoCard title={compatibleBatteryBrandsQuery.isLoading || productsQuery.isLoading ? 'Loading compatible batteries...' : 'No compatible batteries available'} subtitle={compatibleBatteryBrandsQuery.isError || productsQuery.isError ? 'Unable to load live battery options. Please try again.' : 'Add a compatible active battery product in the admin dashboard.'} /></Screen>;
    const capacity = selectedChoice.capacity ?? selectedChoice.specs[0] ?? 'Capacity on request';
    const backupEstimate = selectedChoice.capacity && Number.parseFloat(selectedChoice.capacity) >= 10 ? '7-8 hours' : selectedChoice.capacity && Number.parseFloat(selectedChoice.capacity) < 5 ? '2-3 hours' : '3-4 hours';

    return (
      <SafeAreaView style={batterySelectStyles.screen}>
        <View style={batterySelectStyles.header}>
          <Pressable style={batterySelectStyles.headerButton} onPress={() => setStep('batteryDecision')}>
            <ArrowLeft size={22} color="#10213A" strokeWidth={2.4} />
          </Pressable>
          <View style={batterySelectStyles.headerCopy}>
            <Text style={batterySelectStyles.headerTitle}>Select Battery</Text>
            <Text style={batterySelectStyles.headerSubtitle}>Compatible with {inverterBrand}</Text>
          </View>
          <Pressable style={batterySelectStyles.headerButton}>
            <Zap size={21} color="#FDB813" strokeWidth={2.4} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={batterySelectStyles.content}>
          <View style={batterySelectStyles.infoCard}>
            <View style={batterySelectStyles.infoIcon}>
              <Info size={21} color="#F5A400" strokeWidth={2.4} />
            </View>
            <View style={batterySelectStyles.infoCopy}>
              <Text style={batterySelectStyles.infoTitle}>{inverterBrand} inverter supports {inverterBrand} compatible batteries.</Text>
              <Text style={batterySelectStyles.infoText}>Select battery capacity based on your backup requirement.</Text>
            </View>
          </View>

          <View style={batterySelectStyles.optionList}>
            {guidedBatteryOptions.map((item) => {
              const active = selectedChoice.id === item.id;
              return (
                <Pressable key={item.id} style={[batterySelectStyles.optionCard, active && batterySelectStyles.optionCardActive]} onPress={() => setBatteryChoiceId(item.id)}>
                  <View style={batterySelectStyles.productImageWrap}>
                    <SafeImage source={item.image ? { uri: item.image } : undefined} fallbackSource={batteryImage} style={batterySelectStyles.productImage} resizeMode="contain" />
                  </View>
                  <View style={batterySelectStyles.optionCopy}>
                    <Text style={batterySelectStyles.optionTitle}>{item.name}</Text>
                    <Text style={batterySelectStyles.optionMeta}>{item.brand}  |  {item.specs[1]}  |  {item.specs[2]}</Text>
                    <View style={batterySelectStyles.capacityBadge}>
                      <Text style={batterySelectStyles.capacityText}>{item.specs[0]}</Text>
                    </View>
                  </View>
                  <View style={batterySelectStyles.optionRight}>
                    <View style={[batterySelectStyles.selectionCircle, active && batterySelectStyles.selectionCircleActive]}>
                      {active ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
                    </View>
                    <Text style={batterySelectStyles.optionPrice}>{formatPkr(item.price)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={batterySelectStyles.recommendCard}>
            <View style={batterySelectStyles.recommendIcon}>
              <Award size={23} color="#16A34A" strokeWidth={2.3} />
            </View>
            <View>
              <Text style={batterySelectStyles.recommendTitle}>Recommended for your backup load</Text>
              <Text style={batterySelectStyles.recommendValue}>{capacity.replace(' ', '')}</Text>
            </View>
          </View>

          <View style={batterySelectStyles.summaryCard}>
            <View style={batterySelectStyles.summaryColumn}>
              <View style={batterySelectStyles.summaryIcon}><BatteryCharging size={20} color="#16A34A" strokeWidth={2.3} /></View>
              <Text style={batterySelectStyles.summaryLabel}>Selected Battery</Text>
              <Text style={batterySelectStyles.summaryValue}>{selectedChoice.name.replace(' Battery', '')}</Text>
            </View>
            <View style={batterySelectStyles.summaryDivider} />
            <View style={batterySelectStyles.summaryColumn}>
              <View style={batterySelectStyles.summaryIcon}><Clock3 size={20} color="#16A34A" strokeWidth={2.3} /></View>
              <Text style={batterySelectStyles.summaryLabel}>Estimated Backup</Text>
              <Text style={batterySelectStyles.summaryValue}>{backupEstimate}</Text>
              <Text style={batterySelectStyles.summarySub}>for selected appliances</Text>
            </View>
          </View>
        </ScrollView>

        <View style={batterySelectStyles.footer}>
          <Pressable
            style={batterySelectStyles.continueButton}
            onPress={() => {
              setSelectedProduct(selectedChoice);
              setBackupDecision('yes');
              goSummary();
            }}
          >
            <Text style={batterySelectStyles.continueText}>Continue</Text>
            <ArrowRight size={21} color="#111827" strokeWidth={2.7} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const specs = detailSpecRows(product);
  const benefits = detailBenefits(product);

  return (
    <SafeAreaView style={detailStyles.screen}>
      <View style={detailStyles.topBar}>
        <Pressable style={detailStyles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#10213A" size={18} strokeWidth={2.4} />
          <Text style={detailStyles.backText}>Back</Text>
        </Pressable>
        <Text style={detailStyles.topTitle}>Product Detail</Text>
        <View style={detailStyles.topActions}>
          <Pressable style={detailStyles.iconButton}>
            <Share2 color="#10213A" size={17} strokeWidth={2.2} />
          </Pressable>
          <Pressable style={detailStyles.iconButton}>
            <Bookmark color="#10213A" size={17} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={detailStyles.content}>
        <View style={detailStyles.hero}>
          <ProductVisual product={product} />
        </View>

        <Text style={detailStyles.categoryLabel}>{productCategoryLabel[product.category]}</Text>
        <Text style={detailStyles.productTitle}>{product.name}</Text>
        <Text style={detailStyles.productSubtitle}>{detailSubtitle(product)}</Text>

        <View style={detailStyles.priceCard}>
          <View>
            <Text style={detailStyles.price}>{formatPkr(product.price)}</Text>
            <Text style={detailStyles.priceSub}>Per unit · Ex-warehouse Pakistan</Text>
          </View>
          <View style={detailStyles.stockBadge}>
            <Text style={detailStyles.stockText}>In Stock</Text>
          </View>
        </View>

        <View style={detailStyles.trustRow}>
          <TrustChip Icon={Star} text="4.7 Rating" />
          <TrustChip Icon={ShieldCheck} text="Verified Specs" />
          <TrustChip Icon={Check} text="12 Yr Product / 25 Yr Linear Output" wide />
        </View>

        <Text style={detailStyles.sectionTitle}>Technical Specifications</Text>
        <View style={detailStyles.specGrid}>
          {specs.map(([label, value]) => (
            <View key={label} style={detailStyles.specCard}>
              <Text style={detailStyles.specLabel}>{label}</Text>
              <Text style={detailStyles.specValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={detailStyles.sectionTitle}>Benefits</Text>
        <View style={detailStyles.benefitsCard}>
          {benefits.map((item) => (
            <View key={item} style={detailStyles.benefitRow}>
              <View style={detailStyles.checkDot}>
                <Check color="#047857" size={12} strokeWidth={2.5} />
              </View>
              <Text style={detailStyles.benefitText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={detailStyles.sectionTitle}>Compatible with</Text>
        <View style={detailStyles.compatWrap}>
          <Text style={detailStyles.compatChip}>Works with 10kW system using about 19 panels</Text>
          <Text style={detailStyles.compatChip}>Hybrid ready for residential systems</Text>
        </View>

        <View style={detailStyles.installCard}>
          <View style={detailStyles.installCopy}>
            <Text style={detailStyles.installTitle}>Need installation?</Text>
            <Text style={detailStyles.installText}>Get matched with KaamAsaan-vetted installers for survey.</Text>
          </View>
          <Pressable style={detailStyles.quoteButton}>
            <Text style={detailStyles.quoteText}>Get Quote</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={detailStyles.systemChip}>
        <Text style={detailStyles.systemEyebrow}>MY SYSTEM</Text>
        <View style={detailStyles.systemValues}>
          <Text style={detailStyles.systemValue}>☀ 3 kW</Text>
          <Text style={detailStyles.systemValue}>⚡ 4 kW</Text>
          <Text style={detailStyles.systemValue}>🔋 6kWh</Text>
        </View>
      </View>
      <Pressable style={detailStyles.chatButton}>
        <MessageCircle color="#FFFFFF" size={18} strokeWidth={2.2} />
      </Pressable>

      <GuidedAddSheet
        visible={guidedVisible}
        product={product}
        hasPanels={Boolean(selectedPanels || product.category === 'panel')}
        hasInverter={Boolean(selectedInverter || product.category === 'inverter')}
        hasBattery={Boolean(selectedBattery || product.category === 'battery')}
        onClose={() => setGuidedVisible(false)}
        onChoose={handleGuidedChoice}
      />

      <View style={detailStyles.footer}>
        <Pressable style={detailStyles.addButton} onPress={startAddToSystem}>
          <Text style={detailStyles.addText}>Add to My System</Text>
        </Pressable>
        <Pressable style={detailStyles.orderButton} onPress={() => setStep('orderProduct')}>
          <Text style={detailStyles.orderText}>Order Product</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const ProductVisual = ({ product }: { product: Product }) => (
  <View style={detailStyles.visualWrap}>
    {product.image ? (
      <SafeImage source={{ uri: product.image }} style={detailStyles.remoteProductImage} resizeMode="contain" fallback={<ProductFallbackVisual category={product.category} />} />
    ) : product.category === 'panel' ? (
      <View style={detailStyles.panelVisual}>
        {Array.from({ length: 18 }).map((_, index) => <View key={index} style={detailStyles.panelCell} />)}
      </View>
    ) : product.category === 'battery' ? (
      <View style={detailStyles.batteryVisual}>
        <BatteryCharging color="#10213A" size={42} strokeWidth={1.8} />
      </View>
    ) : product.category === 'inverter' ? (
      <View style={detailStyles.inverterVisual}>
        <Zap color="#047857" size={33} strokeWidth={2.1} />
      </View>
    ) : (
      <View style={detailStyles.accessoryVisual}>
        <Sun color="#B07800" size={40} strokeWidth={1.8} />
      </View>
    )}
    <Text style={detailStyles.visualBrand}>{product.brand}</Text>
  </View>
);

const ProductFallbackVisual = ({ category }: { category: Product['category'] }) => (
  category === 'panel' ? (
    <View style={detailStyles.panelVisual}>
      {Array.from({ length: 18 }).map((_, index) => <View key={index} style={detailStyles.panelCell} />)}
    </View>
  ) : category === 'battery' ? (
    <View style={detailStyles.batteryVisual}>
      <BatteryCharging color="#10213A" size={42} strokeWidth={1.8} />
    </View>
  ) : category === 'inverter' ? (
    <View style={detailStyles.inverterVisual}>
      <Zap color="#047857" size={33} strokeWidth={2.1} />
    </View>
  ) : (
    <View style={detailStyles.accessoryVisual}>
      <Sun color="#B07800" size={40} strokeWidth={1.8} />
    </View>
  )
);

const SectionHeading = ({ Icon, title }: { Icon: any; title: string }) => (
  <View style={orderStyles.sectionHeading}>
    <View style={orderStyles.sectionIcon}>
      <Icon size={17} color="#C48A00" strokeWidth={2.3} />
    </View>
    <Text style={orderStyles.sectionTitle}>{title}</Text>
  </View>
);

const ServiceOption = ({ Icon, title, subtitle, selected, onPress }: { Icon: any; title: string; subtitle: string; selected: boolean; onPress: () => void }) => (
  <Pressable style={[orderStyles.serviceCard, selected && orderStyles.serviceCardSelected]} onPress={onPress}>
    {selected ? (
      <View style={orderStyles.selectedCheck}>
        <Check size={13} color="#FFFFFF" strokeWidth={3} />
      </View>
    ) : null}
    <View style={[orderStyles.serviceIcon, selected && orderStyles.serviceIconSelected]}>
      <Icon size={19} color={selected ? '#FFFFFF' : '#64748B'} strokeWidth={2.2} />
    </View>
    <Text style={orderStyles.serviceTitle}>{title}</Text>
    <Text style={orderStyles.serviceSubtitle}>{subtitle}</Text>
  </Pressable>
);

const PriceRow = ({ Icon, label, value }: { Icon: any; label: string; value: string }) => (
  <View style={orderStyles.priceRow}>
    <Icon size={16} color="#64748B" strokeWidth={2.2} />
    <Text style={orderStyles.priceLabel}>{label}</Text>
    <Text style={orderStyles.priceValue}>{value}</Text>
  </View>
);

const TrustChip = ({ Icon, text, wide }: { Icon: any; text: string; wide?: boolean }) => (
  <View style={[detailStyles.trustChip, wide && detailStyles.trustChipWide]}>
    <Icon color="#047857" size={13} strokeWidth={2.2} />
    <Text style={detailStyles.trustText} numberOfLines={wide ? 2 : 1}>{text}</Text>
  </View>
);

const GuidedAddSheet = ({
  visible,
  product,
  hasPanels,
  hasInverter,
  hasBattery,
  onClose,
  onChoose
}: {
  visible: boolean;
  product: Product;
  hasPanels: boolean;
  hasInverter: boolean;
  hasBattery: boolean;
  onClose: () => void;
  onChoose: (target: 'panels' | 'inverter' | 'batteries' | 'summary') => void;
}) => {
  const options = product.category === 'battery'
    ? [
        { target: 'panels' as const, Icon: Sun, title: 'Select Panels', helper: 'Choose solar panels that match your battery backup.' },
        { target: 'inverter' as const, Icon: Zap, title: 'Select Inverter', helper: 'Pick a compatible inverter for charging and backup.' }
      ]
    : product.category === 'panel'
      ? [
          { target: 'inverter' as const, Icon: Zap, title: 'Select Inverter', helper: 'Match an inverter size with your selected panels.' },
          { target: 'batteries' as const, Icon: BatteryCharging, title: 'Select Batteries', helper: 'Add backup storage if you need load-shedding support.' }
        ]
      : [
          { target: 'batteries' as const, Icon: BatteryCharging, title: 'Select Batteries', helper: 'Choose compatible backup batteries for this inverter.' },
          { target: 'panels' as const, Icon: Sun, title: 'Select Panels', helper: 'Add solar panels to complete your generation setup.' }
        ];
  const complete = hasPanels && hasInverter && hasBattery;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={guidedStyles.backdrop}>
        <Pressable style={guidedStyles.scrim} onPress={onClose} />
        <View style={guidedStyles.sheet}>
          <View style={guidedStyles.handle} />
          <View style={guidedStyles.header}>
            <View>
              <Text style={guidedStyles.title}>Complete Your System</Text>
              <Text style={guidedStyles.subtitle}>Select the remaining components to build a compatible solar setup.</Text>
            </View>
            <Pressable style={guidedStyles.closeButton} onPress={onClose}>
              <X color="#10213A" size={18} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={guidedStyles.messageCard}>
            <Text style={guidedStyles.messageText}>You’ve selected <Text style={guidedStyles.messageStrong}>{product.name}</Text>.</Text>
            <Text style={guidedStyles.messageSub}>To complete your system, choose:</Text>
          </View>

          <View style={guidedStyles.options}>
            {options.map(({ target, Icon, title, helper }) => (
              <Pressable key={target} style={guidedStyles.optionCard} onPress={() => onChoose(target)}>
                <View style={guidedStyles.optionIcon}>
                  <Icon color="#B07800" size={20} strokeWidth={2.3} />
                </View>
                <View style={guidedStyles.optionCopy}>
                  <Text style={guidedStyles.optionTitle}>{title}</Text>
                  <Text style={guidedStyles.optionHelper}>{helper}</Text>
                </View>
                <ChevronRight color="#94A3B8" size={19} strokeWidth={2.4} />
              </Pressable>
            ))}
            {complete ? (
              <Pressable style={[guidedStyles.optionCard, guidedStyles.summaryCard]} onPress={() => onChoose('summary')}>
                <View style={guidedStyles.optionIcon}>
                  <ShieldCheck color="#047857" size={20} strokeWidth={2.3} />
                </View>
                <View style={guidedStyles.optionCopy}>
                  <Text style={guidedStyles.optionTitle}>View System Summary</Text>
                  <Text style={guidedStyles.optionHelper}>All core components are selected.</Text>
                </View>
                <ChevronRight color="#047857" size={19} strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const guidedStyles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,23,42,0.34)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#F8F3E8',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 999, backgroundColor: '#D8CBB2', marginBottom: 14 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { color: '#10213A', fontSize: 19, fontWeight: '900' },
  subtitle: { marginTop: 5, maxWidth: 268, color: '#64748B', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  messageCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#F5D482',
    padding: 13
  },
  messageText: { color: '#10213A', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  messageStrong: { fontWeight: '900' },
  messageSub: { marginTop: 5, color: '#7A5600', fontSize: 12, fontWeight: '800' },
  options: { marginTop: 12, gap: 10 },
  optionCard: {
    minHeight: 76,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.86)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 11
  },
  summaryCard: { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionCopy: { flex: 1 },
  optionTitle: { color: '#10213A', fontSize: 14, fontWeight: '900' },
  optionHelper: { marginTop: 4, color: '#64748B', fontSize: 11, fontWeight: '700', lineHeight: 15 }
});

const batterySelectStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF8F1' },
  header: { minHeight: 70, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', alignItems: 'center', justifyContent: 'center', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 11, elevation: 2 },
  headerCopy: { flex: 1 },
  headerTitle: { color: '#10213A', fontSize: 22, fontWeight: '900' },
  headerSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '700', marginTop: 2 },
  content: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 88, gap: 11 },
  infoCard: { borderRadius: 19, backgroundColor: '#FFF9EB', borderWidth: 1, borderColor: '#F5D482', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  infoIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF0BF', alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1 },
  infoTitle: { color: '#10213A', fontSize: 12.5, fontWeight: '900', lineHeight: 17 },
  infoText: { color: '#64748B', fontSize: 11.5, fontWeight: '700', lineHeight: 16, marginTop: 5 },
  optionList: { gap: 10 },
  optionCard: { minHeight: 132, borderRadius: 19, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.06, shadowRadius: 13, elevation: 2 },
  optionCardActive: { borderColor: '#F5A400', shadowColor: '#D79300', shadowOpacity: 0.13, elevation: 3 },
  productImageWrap: { width: 76, height: 96, borderRadius: 13, backgroundColor: '#F8F6F0', alignItems: 'center', justifyContent: 'center' },
  productImage: { width: 68, height: 86 },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { color: '#10213A', fontSize: 13.5, lineHeight: 17, fontWeight: '900' },
  optionMeta: { color: '#64748B', fontSize: 10.5, lineHeight: 15, fontWeight: '700', marginTop: 6 },
  capacityBadge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#FFF0BF', paddingHorizontal: 10, paddingVertical: 6, marginTop: 9 },
  capacityText: { color: '#7A5600', fontSize: 11.5, fontWeight: '900' },
  optionRight: { width: 88, minHeight: 102, alignItems: 'flex-end', justifyContent: 'space-between' },
  selectionCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#D8CBB2', alignItems: 'center', justifyContent: 'center' },
  selectionCircleActive: { backgroundColor: '#FDB813', borderColor: '#FDB813' },
  optionPrice: { color: '#10213A', fontSize: 12.5, fontWeight: '900', textAlign: 'right' },
  recommendCard: { borderRadius: 18, backgroundColor: '#F1FAF1', borderWidth: 1, borderColor: '#D4ECD5', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  recommendIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E6F7E8', alignItems: 'center', justifyContent: 'center' },
  recommendTitle: { color: '#14532D', fontSize: 12.5, fontWeight: '900' },
  recommendValue: { color: '#16A34A', fontSize: 18, fontWeight: '900', marginTop: 4 },
  summaryCard: { minHeight: 132, borderRadius: 19, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', padding: 13, flexDirection: 'row', alignItems: 'stretch', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.06, shadowRadius: 13, elevation: 2 },
  summaryColumn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  summaryIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E6F7E8', alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  summaryDivider: { width: 1, backgroundColor: '#E9E2D5', marginVertical: 4 },
  summaryLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  summaryValue: { color: '#10213A', fontSize: 12.5, lineHeight: 16, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  summarySub: { color: '#64748B', fontSize: 10.5, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, backgroundColor: 'rgba(251,248,241,0.98)', borderTopWidth: 1, borderTopColor: 'rgba(232,217,190,0.72)' },
  continueButton: { height: 50, borderRadius: 16, backgroundColor: '#FDB813', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#D79300', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 3 },
  continueText: { color: '#111827', fontSize: 14, fontWeight: '900' }
});

const orderStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBF8F1' },
  header: { minHeight: 70, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,217,190,0.72)', shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 11, elevation: 2 },
  headerCopy: { flex: 1 },
  headerTitle: { color: '#10213A', fontSize: 22, fontWeight: '900' },
  headerSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '700', marginTop: 2 },
  content: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 92, gap: 12 },
  productCard: { minHeight: 132, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 13, shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 2 },
  productVisual: { width: 106, height: 106, borderRadius: 15, backgroundColor: '#F8F6F0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productCopy: { flex: 1, alignItems: 'flex-start' },
  productTitle: { color: '#10213A', fontSize: 15, lineHeight: 19, fontWeight: '900' },
  categoryBadge: { marginTop: 7, borderRadius: 9, backgroundColor: '#FFF3D6', paddingHorizontal: 9, paddingVertical: 5 },
  categoryBadgeText: { color: '#9A6B00', fontSize: 10.5, fontWeight: '900', textTransform: 'capitalize' },
  productPrice: { color: '#10213A', fontSize: 18, fontWeight: '900', marginTop: 10 },
  stockBadge: { marginTop: 7, borderRadius: 999, backgroundColor: '#ECFDF3', paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  stockText: { color: '#15803D', fontSize: 11, fontWeight: '900' },
  card: { borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(232,217,190,0.76)', padding: 13, shadowColor: '#6B5B43', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  sectionIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF3D6', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: '#10213A', fontSize: 15, fontWeight: '900' },
  quantityRow: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { color: '#10213A', fontSize: 13, fontWeight: '900' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  stepperButton: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  stepperButtonPlus: { borderColor: '#F5D482', backgroundColor: '#FFF2C2' },
  stepperText: { color: '#10213A', fontSize: 18, fontWeight: '800', lineHeight: 20 },
  quantityValue: { minWidth: 18, color: '#10213A', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  inputLabel: { color: '#10213A', fontSize: 12, fontWeight: '900', marginTop: 11, marginBottom: 5, marginLeft: 2 },
  inputShell: { height: 44, borderRadius: 13, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: '100%', color: '#10213A', fontSize: 13, fontWeight: '800' },
  serviceRow: { flexDirection: 'row', gap: 9 },
  serviceCard: { position: 'relative', flex: 1, minHeight: 114, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 11 },
  serviceCardSelected: { borderColor: '#FDB813', backgroundColor: '#FFF8E5' },
  selectedCheck: { position: 'absolute', right: 8, top: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FDB813', alignItems: 'center', justifyContent: 'center' },
  serviceIcon: { width: 35, height: 35, borderRadius: 18, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center' },
  serviceIconSelected: { backgroundColor: '#FDB813' },
  serviceTitle: { color: '#10213A', fontSize: 12, fontWeight: '900', marginTop: 9 },
  serviceSubtitle: { color: '#64748B', fontSize: 10.5, lineHeight: 14, fontWeight: '700', marginTop: 4 },
  priceRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#EEF0F2' },
  priceLabel: { flex: 1, color: '#4B5563', fontSize: 12.5, fontWeight: '800' },
  priceValue: { color: '#10213A', fontSize: 12.5, fontWeight: '900' },
  totalBox: { minHeight: 50, borderRadius: 13, backgroundColor: '#FFF8E5', borderWidth: 1, borderColor: '#F5D482', paddingHorizontal: 11, marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#10213A', fontSize: 14, fontWeight: '900' },
  totalValue: { color: '#10213A', fontSize: 17, fontWeight: '900' },
  errorText: { color: '#DC2626', fontSize: 11, fontWeight: '800' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, backgroundColor: 'rgba(251,248,241,0.98)', borderTopWidth: 1, borderTopColor: 'rgba(232,217,190,0.72)' },
  continueButton: { height: 50, borderRadius: 16, backgroundColor: '#FDB813', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#D79300', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 3 },
  continueText: { color: '#111827', fontSize: 14, fontWeight: '900' }
});

const detailStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F3E8' },
  topBar: {
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 70
  },
  backText: { color: '#10213A', fontSize: 13, fontWeight: '900' },
  topTitle: { flex: 1, color: '#10213A', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  topActions: { minWidth: 70, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.78)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: { paddingHorizontal: 15, paddingBottom: 150 },
  hero: {
    minHeight: 210,
    borderRadius: 24,
    backgroundColor: '#FFF4DC',
    borderWidth: 1,
    borderColor: '#F3D28B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 2
  },
  visualWrap: { alignItems: 'center', justifyContent: 'center' },
  remoteProductImage: { width: 182, height: 150 },
  visualBrand: { marginTop: 12, color: '#64748B', fontSize: 12, fontWeight: '900' },
  panelVisual: {
    width: 118,
    height: 142,
    borderRadius: 10,
    backgroundColor: '#0E325D',
    borderWidth: 4,
    borderColor: '#DDEBFF',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 7,
    gap: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4
  },
  panelCell: { width: 30, height: 18, borderRadius: 2, backgroundColor: 'rgba(111,166,216,0.55)' },
  inverterVisual: {
    width: 108,
    height: 132,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  batteryVisual: {
    width: 104,
    height: 136,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  accessoryVisual: {
    width: 116,
    height: 116,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryLabel: { marginTop: 18, color: '#B07800', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  productTitle: { marginTop: 6, color: '#10213A', fontSize: 23, fontWeight: '900' },
  productSubtitle: { marginTop: 6, color: '#64748B', fontSize: 13, fontWeight: '700' },
  priceCard: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.78)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2
  },
  price: { color: '#10213A', fontSize: 21, fontWeight: '900' },
  priceSub: { marginTop: 5, color: '#64748B', fontSize: 11.5, fontWeight: '700' },
  stockBadge: { borderRadius: 999, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6 },
  stockText: { color: '#047857', fontSize: 10.5, fontWeight: '900' },
  trustRow: { marginTop: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trustChip: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10
  },
  trustChipWide: { maxWidth: 190 },
  trustText: { color: '#334155', fontSize: 10.5, fontWeight: '800' },
  sectionTitle: { marginTop: 20, marginBottom: 10, color: '#10213A', fontSize: 16, fontWeight: '900' },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specCard: {
    width: '48%',
    minHeight: 76,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.78)',
    padding: 12
  },
  specLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '900' },
  specValue: { marginTop: 7, color: '#10213A', fontSize: 12.5, fontWeight: '900', lineHeight: 17 },
  benefitsCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.78)',
    padding: 13,
    gap: 11
  },
  benefitRow: { flexDirection: 'row', gap: 9 },
  checkDot: {
    width: 21,
    height: 21,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  benefitText: { flex: 1, color: '#334155', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  compatWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  compatChip: {
    borderRadius: 999,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#F5D482',
    color: '#7A5600',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  installCard: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: '#26331F',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  installCopy: { flex: 1 },
  installTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  installText: { marginTop: 5, color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontWeight: '700', lineHeight: 16 },
  quoteButton: { borderRadius: 14, backgroundColor: '#FDB813', paddingHorizontal: 14, paddingVertical: 10 },
  quoteText: { color: '#111827', fontSize: 12, fontWeight: '900' },
  systemChip: {
    position: 'absolute',
    left: 16,
    bottom: 82,
    borderRadius: 15,
    backgroundColor: 'rgba(45,52,38,0.94)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5
  },
  systemEyebrow: { color: '#F5B700', fontSize: 7.5, fontWeight: '900' },
  systemValues: { marginTop: 5, flexDirection: 'row', gap: 8 },
  systemValue: { color: '#F8F5D9', fontSize: 10.5, fontWeight: '800' },
  chatButton: {
    position: 'absolute',
    right: 18,
    bottom: 86,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#071D35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#071D35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,217,190,0.82)',
    backgroundColor: 'rgba(248,243,232,0.98)',
    flexDirection: 'row',
    gap: 10
  },
  addButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FDB813',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addText: { color: '#111827', fontSize: 13, fontWeight: '900' },
  orderButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#26331F',
    alignItems: 'center',
    justifyContent: 'center'
  },
  orderText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' }
});

const solarSizeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F3E8'
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4B5563',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3
  },
  headerCopy: {
    flex: 1
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '900'
  },
  headerSubtitle: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  },
  helpButton: {
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#4B5563',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3
  },
  helpText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900'
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 98,
    gap: 12
  },
  introCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDDBB',
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    shadowColor: '#7C5A18',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF1CF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  introCopy: {
    flex: 1
  },
  introTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22
  },
  introText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 7
  },
  card: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDDBB',
    padding: 16,
    shadowColor: '#7C5A18',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  smallIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF1CF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDB813',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBadgeText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900'
  },
  greenIcon: {
    backgroundColor: '#EAF8EC'
  },
  cardCopy: {
    flex: 1
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900'
  },
  cardText: {
    color: '#4B5563',
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 5
  },
  sizeGrid: {
    marginTop: 17,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  sizeButton: {
    position: 'relative',
    width: 74,
    height: 54,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4B5563',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 1
  },
  sizeButtonActive: {
    backgroundColor: '#FDB813',
    borderColor: '#E9A700'
  },
  wattageGrid: {
    marginTop: 17,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  wattageButton: {
    position: 'relative',
    width: 78,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4B5563',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 1
  },
  sizeText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900'
  },
  sizeTextActive: {
    color: '#111827'
  },
  sizeCheck: {
    position: 'absolute',
    right: -7,
    top: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 18
  },
  orLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D7DCE2'
  },
  orBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F1EF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  orText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '900'
  },
  inputShell: {
    marginTop: 10,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  inputShellError: {
    borderColor: '#EF4444'
  },
  customInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900'
  },
  inputDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#E5E7EB'
  },
  inputSuffix: {
    width: 56,
    color: '#4B5563',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900'
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8
  },
  estimateCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDDBB',
    padding: 16,
    shadowColor: '#7C5A18',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2
  },
  estimateTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  estimateIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EAF8EC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  estimateCopy: {
    flex: 1
  },
  estimateTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900'
  },
  estimateText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5
  },
  estimateBadge: {
    borderRadius: 12,
    backgroundColor: '#EAF8EC',
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  estimateBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '900'
  },
  estimateDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 15,
    marginBottom: 14
  },
  calcText: {
    color: '#4B5563',
    fontSize: 12.5,
    fontWeight: '700'
  },
  noteBox: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#F0F8ED',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  noteText: {
    flex: 1,
    color: '#4B5563',
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 16
  },
  benefitStrip: {
    borderRadius: 22,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F2E2BF',
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  benefitItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5
  },
  benefitTitle: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 7
  },
  benefitText: {
    color: '#4B5563',
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 4
  },
  benefitDivider: {
    width: 1,
    backgroundColor: '#E7D6B7',
    marginVertical: 7
  },
  compactCard: {
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDDBB',
    padding: 12,
    shadowColor: '#7C5A18',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  mainCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDDBB',
    paddingHorizontal: 15,
    paddingVertical: 16,
    shadowColor: '#7C5A18',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.08,
    shadowRadius: 17,
    elevation: 3
  },
  controlSection: {
    width: '100%'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF1CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  greenSectionIcon: {
    backgroundColor: '#EAF8EC'
  },
  sectionText: {
    flex: 1
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900'
  },
  sectionSubtitle: {
    color: '#6B7280',
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 3
  },
  optionalText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '800'
  },
  compactSizeGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  compactSizeButton: {
    position: 'relative',
    width: 70,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4B5563',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 9,
    elevation: 1
  },
  softDivider: {
    height: 1,
    backgroundColor: '#EEE7DA',
    marginVertical: 15
  },
  dropdown: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0D4BF',
    backgroundColor: '#FFFDF8',
    marginTop: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dropdownValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900'
  },
  dropdownChevron: {
    transform: [{ rotate: '90deg' }]
  },
  dropdownChevronOpen: {
    transform: [{ rotate: '-90deg' }]
  },
  dropdownMenu: {
    marginTop: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0D4BF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
  dropdownOption: {
    minHeight: 38,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1E7D8'
  },
  dropdownOptionActive: {
    backgroundColor: '#FFF3C4'
  },
  dropdownOptionText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '800'
  },
  dropdownOptionTextActive: {
    color: '#111827',
    fontWeight: '900'
  },
  summaryCard: {
    borderRadius: 17,
    backgroundColor: '#F3FBF3',
    borderWidth: 1,
    borderColor: '#CDECD1',
    padding: 13,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13
  },
  summaryIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EAF8EC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900'
  },
  summarySubtitle: {
    color: '#4B5563',
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 5
  },
  summaryBadge: {
    borderRadius: 12,
    backgroundColor: '#E7F8EA',
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  summaryBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '900'
  },
  summaryStats: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D8EEDD',
    paddingTop: 11,
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    flex: 1
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '800'
  },
  statValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#D8EEDD',
    marginHorizontal: 12
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: 'rgba(248,243,232,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,217,190,0.9)'
  },
  ctaButton: {
    height: 56,
    borderRadius: 17,
    backgroundColor: '#FDB813',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 3
  },
  ctaButtonDisabled: {
    opacity: 0.5
  },
  ctaText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900'
  }
});
