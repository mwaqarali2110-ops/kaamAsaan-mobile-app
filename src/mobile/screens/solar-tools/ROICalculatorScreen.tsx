import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Coins,
  FileDown,
  Info,
  Landmark,
  LineChart,
  PiggyBank,
  TrendingUp,
  Zap
} from 'lucide-react-native';

const fallbackROIInput = {
  systemSize: 10,
  batterySize: 0,
  systemCost: 1800000,
  estimatedMonthlySavings: 56250,
  monthlyUnitsOffset: 1250,
  effectiveElectricityRate: 45,
  annualMaintenanceCost: 15000,
  yearlyTariffEscalation: 0.08,
  solarDegradation: 0.005,
  analysisYears: 10
};

type ProjectionRow = {
  year: number;
  annualSavings: number;
  cumulativeSavings: number;
  roiPercent: number;
};

type ROIInput = typeof fallbackROIInput;
type ROIReportData = ReturnType<typeof calculateProjection> &
  ROIInput & {
    generatedDate: string;
    breakevenLabel: string;
  };

const cleanNumber = (value: string) => value.replace(/[^0-9.]/g, '');
const formatCurrency = (value: number) => {
  const numeric = Number(value || 0);
  return `PKR ${numeric.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
};
const formatCompactCurrency = (value: number) => {
  if (Math.abs(value) >= 10000000) return `PKR ${(value / 10000000).toFixed(1)}Cr`;
  if (Math.abs(value) >= 100000) return `PKR ${(value / 100000).toFixed(1)}L`;
  return formatCurrency(value);
};
const formatPercent = (value: number) => {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(Math.abs(numeric) >= 100 ? 0 : 1)}%`;
};
const formatYears = (value: number) => {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(1)} years`;
};
const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const calculateProjection = (input: ROIInput) => {
  const projectionData: ProjectionRow[] = [];

  for (let year = 1; year <= input.analysisYears; year += 1) {
    const annualSavings = Math.max(
      0,
      input.estimatedMonthlySavings *
        12 *
        Math.pow(1 + input.yearlyTariffEscalation, year - 1) *
        Math.pow(1 - input.solarDegradation, year - 1) -
        input.annualMaintenanceCost
    );
    const cumulativeSavings = annualSavings + (projectionData[year - 2]?.cumulativeSavings ?? 0);
    const roiPercent = ((cumulativeSavings - input.systemCost) / input.systemCost) * 100;
    projectionData.push({ year, annualSavings, cumulativeSavings, roiPercent });
  }

  const annualSavingsYear1 = projectionData[0]?.annualSavings ?? 0;
  const cumulativeSavings10 = projectionData[projectionData.length - 1]?.cumulativeSavings ?? 0;
  const breakeven = projectionData.find((row) => row.cumulativeSavings >= input.systemCost);

  return {
    monthlySavings: input.estimatedMonthlySavings,
    annualSavingsYear1,
    paybackPeriod: annualSavingsYear1 > 0 ? input.systemCost / annualSavingsYear1 : 0,
    breakevenYear: breakeven?.year,
    cumulativeSavings10,
    roi10: ((cumulativeSavings10 - input.systemCost) / input.systemCost) * 100,
    netProfit10: cumulativeSavings10 - input.systemCost,
    projectionData
  };
};

const buildROIReportHtml = (data: ROIReportData) => {
  const rows = Array.isArray(data.projectionData) ? data.projectionData : [];
  const projectionRows = rows.length
    ? rows
        .map(
          (row) => `
        <tr>
          <td>Year ${escapeHtml(row.year)}</td>
          <td>${escapeHtml(formatCurrency(row.annualSavings))}</td>
          <td>${escapeHtml(formatCurrency(row.cumulativeSavings))}</td>
          <td class="${row.roiPercent >= 0 ? 'positive' : 'negative'}">${escapeHtml(formatPercent(row.roiPercent))}</td>
        </tr>
      `
        )
        .join('')
    : '<tr><td colspan="4">No yearly projection data available.</td></tr>';
  const monthlyFormula =
    data.monthlyUnitsOffset && data.effectiveElectricityRate
      ? `
        <p class="formula">Estimated Monthly Savings = Monthly Units Offset x Effective Electricity Rate</p>
        <table>
          <tr><th>Monthly Units Offset</th><td>${escapeHtml(Math.round(data.monthlyUnitsOffset).toLocaleString('en-PK'))} units</td></tr>
          <tr><th>Effective Electricity Rate</th><td>${escapeHtml(formatCurrency(data.effectiveElectricityRate))} / unit</td></tr>
          <tr><th>Estimated Monthly Savings</th><td>${escapeHtml(Math.round(data.monthlyUnitsOffset).toLocaleString('en-PK'))} x ${escapeHtml(formatCurrency(data.effectiveElectricityRate))} = ${escapeHtml(formatCurrency(data.monthlySavings))}</td></tr>
        </table>
      `
      : '<p>Monthly savings are estimated using your expected solar generation, units offset, and current electricity rate.</p>';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 32px; background: #ffffff; color: #0F172A; font-family: Arial, sans-serif; }
          .brand { color: #D99A00; font-size: 15px; font-weight: 800; letter-spacing: 0.4px; }
          h1 { margin: 8px 0 4px; font-size: 30px; line-height: 1.15; }
          h2 { margin: 28px 0 12px; font-size: 18px; color: #0F172A; }
          p { margin: 0 0 10px; color: #475569; font-size: 12px; line-height: 1.55; }
          .header { padding-bottom: 18px; border-bottom: 3px solid #F5B400; }
          .subtitle { font-size: 13px; font-weight: 700; color: #64748B; }
          .date { margin-top: 10px; color: #64748B; font-size: 11px; font-weight: 700; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 20px; }
          .card { border: 1px solid #F0E3CF; border-radius: 16px; background: #FFFBF2; padding: 14px; }
          .label { color: #64748B; font-size: 11px; font-weight: 800; }
          .value { margin-top: 6px; color: #0F172A; font-size: 20px; font-weight: 900; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; overflow: hidden; border-radius: 12px; }
          th { background: #FFF4D6; color: #8A6B14; text-align: left; font-size: 11px; padding: 10px; }
          td { border-bottom: 1px solid #EFE7DA; color: #0F172A; font-size: 11px; font-weight: 700; padding: 10px; }
          tr:last-child td { border-bottom: 0; }
          .formula { background: #FFF8E6; border-left: 4px solid #F5B400; border-radius: 10px; padding: 10px; color: #0F172A; font-weight: 800; }
          .positive { color: #168A4A; }
          .negative { color: #D14343; }
          .note { margin-top: 18px; padding: 12px; border-radius: 14px; background: #F8FAFC; color: #64748B; font-size: 10.5px; }
          .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #EFE7DA; color: #94A3B8; font-size: 10px; }
        </style>
      </head>
      <body>
        <section class="header">
          <div class="brand">KaamAsaan</div>
          <h1>ROI Estimate Report</h1>
          <p class="subtitle">Solar savings and payback projection</p>
          <p class="date">Generated: ${escapeHtml(data.generatedDate)}</p>
        </section>

        <section class="summary-grid">
          <div class="card"><div class="label">Estimated Monthly Savings</div><div class="value">${escapeHtml(formatCurrency(data.monthlySavings))}</div></div>
          <div class="card"><div class="label">Estimated Annual Savings</div><div class="value">${escapeHtml(formatCurrency(data.annualSavingsYear1))}</div></div>
          <div class="card"><div class="label">Payback Period</div><div class="value">${escapeHtml(formatYears(data.paybackPeriod))}</div></div>
          <div class="card"><div class="label">10-Year ROI</div><div class="value">${escapeHtml(formatPercent(data.roi10))}</div></div>
        </section>

        <h2>How Estimated Monthly Savings Are Calculated</h2>
        ${monthlyFormula}

        <h2>Investment & Breakeven Summary</h2>
        <table>
          <tr><th>Total System Cost</th><td>${escapeHtml(formatCurrency(data.systemCost))}</td></tr>
          <tr><th>Breakeven Year</th><td>${escapeHtml(data.breakevenLabel)}</td></tr>
          <tr><th>10-Year Cumulative Savings</th><td>${escapeHtml(formatCurrency(data.cumulativeSavings10))}</td></tr>
          <tr><th>Net Profit After 10 Years</th><td>${escapeHtml(formatCurrency(data.netProfit10))}</td></tr>
        </table>

        <h2>10-Year Savings Projection</h2>
        <table>
          <tr>
            <th>Year</th>
            <th>Annual Savings</th>
            <th>Cumulative Savings</th>
            <th>ROI %</th>
          </tr>
          ${projectionRows}
        </table>

        <p class="note">
          ${escapeHtml(
            data.breakevenYear
              ? `Your cumulative savings are expected to cross the system cost in Year ${data.breakevenYear}.`
              : 'Your cumulative savings are expected to cross the system cost beyond 10 years.'
          )}
        </p>

        <p class="footer">
          Note: This ROI estimate is based on the information provided and current assumptions for electricity rates, system performance, and annual savings. Actual savings may vary depending on site conditions, usage pattern, electricity tariff changes, system quality, and maintenance.
        </p>
      </body>
    </html>
  `;
};

export const ROICalculatorScreen = ({ navigation }: any) => {
  const [systemSize, setSystemSize] = useState('');
  const [batterySize, setBatterySize] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const hasSystemSize = Number(systemSize) > 0;
  const hasTotalCost = Number(totalCost) > 0;
  const hasError = submitted && (!hasSystemSize || !hasTotalCost);

  const calculate = () => {
    setSubmitted(true);
    if (!hasSystemSize || !hasTotalCost) return;

    const parsedSystemSize = Number(systemSize);
    navigation.navigate('ROIResult', {
      systemSize: parsedSystemSize,
      batterySize: Number(batterySize) || 0,
      totalCost: Number(totalCost),
      estimatedMonthlySavings: Math.round(parsedSystemSize * 5625)
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.topIconButton} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <ArrowLeft color="#10213A" size={20} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.topTitle}>ROI Calculator</Text>
            <Text style={styles.topSubtitle}>Enter your quoted system details</Text>
          </View>
          <View style={styles.topIconButton}>
            <Zap color="#F5A400" size={20} fill="#F5A400" strokeWidth={2.2} />
          </View>
        </View>

        <View style={styles.inputCard}>
          <Field
            label="Solar System Size (kW)"
            placeholder="Enter system size"
            value={systemSize}
            onChangeText={(value) => setSystemSize(cleanNumber(value))}
            helper="Typical homes use 5-10 kW systems"
            error={submitted && !hasSystemSize}
          />

          <View style={styles.divider} />

          <Field
            label="Battery Size (kWh) (optional)"
            placeholder="Enter battery size"
            value={batterySize}
            onChangeText={(value) => setBatterySize(cleanNumber(value))}
            helper="Optional - add only if backup is included"
          />

          <View style={styles.divider} />

          <Field
            label="Total System Cost (PKR)"
            placeholder="Enter total cost"
            value={totalCost}
            onChangeText={(value) => setTotalCost(value.replace(/[^0-9]/g, ''))}
            helper="Enter complete quoted price including installation"
            prefix="PKR"
            error={submitted && !hasTotalCost}
          />
        </View>

        {hasError ? <Text style={styles.errorText}>Enter system size and total system cost to calculate ROI.</Text> : null}

        <Pressable style={styles.calculateButton} onPress={calculate}>
          <Text style={styles.calculateText}>Calculate ROI</Text>
          <ArrowRight color="#10213A" size={18} strokeWidth={2.6} />
        </Pressable>

        <View style={styles.helpCard}>
          <View>
            <Text style={styles.helpTitle}>Need a recommended package?</Text>
            <Text style={styles.helpText}>Build a system with guided solar planning.</Text>
          </View>
          <Pressable style={styles.helpArrow} onPress={() => navigation.navigate('DesignFlow')}>
            <ArrowRight color="#B07800" size={16} strokeWidth={2.4} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export const ROIResultScreen = ({ navigation, route }: any) => {
  const { width } = useWindowDimensions();
  const [isPreparingReport, setIsPreparingReport] = useState(false);
  const chartWidth = Math.max(240, Math.min(width - 64, 380));
  const estimatedMonthlySavings =
    Number(route.params?.estimatedMonthlySavings) ||
    Math.round((Number(route.params?.systemSize) || fallbackROIInput.systemSize) * 5625);
  const effectiveElectricityRate = fallbackROIInput.effectiveElectricityRate;
  const input: ROIInput = {
    ...fallbackROIInput,
    systemSize: Number(route.params?.systemSize) || fallbackROIInput.systemSize,
    batterySize: Number(route.params?.batterySize) || fallbackROIInput.batterySize,
    systemCost: Number(route.params?.totalCost) || fallbackROIInput.systemCost,
    estimatedMonthlySavings,
    effectiveElectricityRate,
    monthlyUnitsOffset: Math.round(estimatedMonthlySavings / effectiveElectricityRate)
  };
  const projection = useMemo(() => calculateProjection(input), [input]);
  const breakevenLabel = projection.breakevenYear ? `Year ${projection.breakevenYear}` : 'Beyond 10 years';
  const generatedDate = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const reportData: ROIReportData = {
    ...input,
    ...projection,
    generatedDate,
    breakevenLabel
  };

  const downloadROIReport = async () => {
    if (isPreparingReport) return;

    setIsPreparingReport(true);
    try {
      const safeROIData: ROIReportData = {
        ...reportData,
        estimatedMonthlySavings: Number(reportData.estimatedMonthlySavings || 0),
        annualSavingsYear1: Number(reportData.annualSavingsYear1 || 0),
        systemCost: Number(reportData.systemCost || 0),
        paybackPeriod: Number(reportData.paybackPeriod || 0),
        roi10: Number(reportData.roi10 || 0),
        cumulativeSavings10: Number(reportData.cumulativeSavings10 || 0),
        netProfit10: Number(reportData.netProfit10 || 0),
        monthlyUnitsOffset: Number(reportData.monthlyUnitsOffset || 0),
        effectiveElectricityRate: Number(reportData.effectiveElectricityRate || 0),
        breakevenLabel: reportData.breakevenLabel || 'Beyond 10 years',
        projectionData: Array.isArray(reportData.projectionData) ? reportData.projectionData : []
      };
      console.log('ROI report data:', safeROIData);

      const html = buildROIReportHtml(safeROIData);
      console.log('Generated ROI report HTML length:', html?.length);
      if (!html || typeof html !== 'string') {
        throw new Error('ROI report HTML is empty or invalid');
      }

      const printResult = await Print.printToFileAsync({ html, base64: true });
      console.log('PDF base64 returned:', Boolean(printResult.base64));
      if (!printResult?.base64) {
        throw new Error('PDF base64 was not returned by expo-print');
      }

      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      if (!baseDir) {
        throw new Error('No writable app directory available');
      }

      const reportsDir = `${baseDir}roi-reports/`;
      console.log('Base directory:', baseDir);
      console.log('Reports directory:', reportsDir);

      const dirInfo = await FileSystem.getInfoAsync(reportsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(reportsDir, { intermediates: true });
      }

      const fileName = `KaamAsaan-ROI-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
      const pdfUri = `${reportsDir}${fileName}`;
      console.log('PDF URI:', pdfUri);

      await FileSystem.writeAsStringAsync(pdfUri, printResult.base64, {
        encoding: FileSystem.EncodingType.Base64
      });

      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      console.log('PDF file info:', fileInfo);
      if (!fileInfo.exists) {
        throw new Error('PDF file was not created successfully');
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('ROI report generated', 'Your ROI report has been saved successfully.');
        return;
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download ROI Report',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('ROI PDF generation failed:', error);
      Alert.alert('Unable to generate ROI report', 'Please try again.');
    } finally {
      setIsPreparingReport(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultTop}>
          <Pressable style={styles.backButtonLight} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <ArrowLeft color="#10213A" size={20} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.resultHeaderCopy}>
            <Text style={styles.resultTitle}>ROI Estimate</Text>
            <Text style={styles.resultSubtitle}>See your savings and payback over time</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard Icon={PiggyBank} label="Estimated Monthly Savings" value={formatCurrency(projection.monthlySavings)} helper={`${input.systemSize} kW solar estimate`} />
          <SummaryCard Icon={Coins} label="Estimated Annual Savings" value={formatCurrency(projection.annualSavingsYear1)} helper="Year 1 after maintenance" />
          <SummaryCard Icon={CalendarClock} label="Payback Period" value={`${projection.paybackPeriod.toFixed(1)} yrs`} helper={`Breakeven: ${breakevenLabel}`} />
          <SummaryCard Icon={TrendingUp} label="10-Year ROI" value={formatPercent(projection.roi10)} helper="Net return vs cost" />
        </View>

        <View style={styles.investmentCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Investment Summary</Text>
              <Text style={styles.sectionSubtitle}>Based on 10-year solar production</Text>
            </View>
            <View style={styles.sectionIcon}>
              <Landmark color="#B07800" size={20} strokeWidth={2.4} />
            </View>
          </View>
          <MetricRow label="Total System Cost" value={formatCurrency(input.systemCost)} />
          <MetricRow label="Breakeven Year" value={breakevenLabel} />
          <MetricRow label="10-Year Cumulative Savings" value={formatCurrency(projection.cumulativeSavings10)} />
          <MetricRow label="Net Profit After 10 Years" value={formatCurrency(projection.netProfit10)} strong last />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>10-Year Savings Projection</Text>
              <Text style={styles.sectionSubtitle}>Bars show annual savings, line shows cumulative savings</Text>
            </View>
            <View style={styles.sectionIcon}>
              <BarChart3 color="#B07800" size={20} strokeWidth={2.4} />
            </View>
          </View>
          <SavingsProjectionChart
            width={chartWidth}
            systemCost={input.systemCost}
            projectionData={projection.projectionData}
            breakevenYear={projection.breakevenYear}
          />
          <Text style={styles.chartNote}>
            {projection.breakevenYear
              ? `Cumulative savings cross your system cost at Year ${projection.breakevenYear}.`
              : 'Cumulative savings are projected to cross system cost beyond 10 years.'}
          </Text>
        </View>

        <View style={styles.breakdownCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Year-by-Year Breakdown</Text>
              <Text style={styles.sectionSubtitle}>Annual savings, cumulative savings and ROI</Text>
            </View>
            <View style={styles.sectionIcon}>
              <LineChart color="#B07800" size={20} strokeWidth={2.4} />
            </View>
          </View>

          <View style={styles.breakdownHeader}>
            <Text style={[styles.breakdownHeaderText, styles.yearCell]}>Year</Text>
            <Text style={styles.breakdownHeaderText}>Annual</Text>
            <Text style={styles.breakdownHeaderText}>Cumulative</Text>
            <Text style={[styles.breakdownHeaderText, styles.roiCell]}>ROI</Text>
          </View>
          {projection.projectionData.map((row, index) => (
            <View key={row.year} style={[styles.breakdownRow, index === projection.projectionData.length - 1 && styles.breakdownRowLast]}>
              <Text style={[styles.breakdownYear, styles.yearCell]}>Year {row.year}</Text>
              <Text style={styles.breakdownValue}>{formatCompactCurrency(row.annualSavings)}</Text>
              <Text style={styles.breakdownValue}>{formatCompactCurrency(row.cumulativeSavings)}</Text>
              <Text style={[styles.breakdownRoi, styles.roiCell, row.roiPercent >= 0 && styles.breakdownRoiPositive]}>{formatPercent(row.roiPercent)}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.reviewButton, isPreparingReport && styles.reviewButtonDisabled]}
          onPress={downloadROIReport}
          disabled={isPreparingReport}
        >
          <FileDown color="#10213A" size={20} strokeWidth={2.5} />
          <Text style={styles.reviewButtonText}>{isPreparingReport ? 'Preparing Report…' : 'Download ROI Report'}</Text>
          <ArrowRight color="#10213A" size={18} strokeWidth={2.6} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({
  label,
  placeholder,
  value,
  onChangeText,
  helper,
  prefix,
  error
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  helper: string;
  prefix?: string;
  error?: boolean;
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputWrap, error && styles.inputError]}>
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />
    </View>
    <View style={styles.helperRow}>
      <Info color="#F5A400" size={14} strokeWidth={2.2} />
      <Text style={styles.helperText}>{helper}</Text>
    </View>
  </View>
);

const SummaryCard = ({
  Icon,
  label,
  value,
  helper
}: {
  Icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }>;
  label: string;
  value: string;
  helper: string;
}) => (
  <View style={styles.summaryCard}>
    <View style={styles.summaryIcon}>
      <Icon color="#B07800" size={18} strokeWidth={2.4} />
    </View>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryMain} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>
      {value}
    </Text>
    <Text style={styles.summaryHelper} numberOfLines={1}>{helper}</Text>
  </View>
);

const MetricRow = ({ label, value, strong = false, last = false }: { label: string; value: string; strong?: boolean; last?: boolean }) => (
  <View style={[styles.metricRow, last && styles.metricRowLast]}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, strong && styles.metricValueStrong]}>{value}</Text>
  </View>
);

const SavingsProjectionChart = ({
  width,
  projectionData,
  systemCost,
  breakevenYear
}: {
  width: number;
  projectionData: ProjectionRow[];
  systemCost: number;
  breakevenYear?: number;
}) => {
  const height = 230;
  const paddingLeft = 36;
  const paddingRight = 14;
  const paddingTop = 18;
  const paddingBottom = 38;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(systemCost, ...projectionData.map((row) => row.cumulativeSavings), ...projectionData.map((row) => row.annualSavings)) * 1.08;
  const barSlot = chartWidth / projectionData.length;
  const barWidth = Math.min(18, barSlot * 0.48);
  const xFor = (index: number) => paddingLeft + barSlot * index + barSlot / 2;
  const yFor = (value: number) => paddingTop + chartHeight - (value / maxValue) * chartHeight;
  const linePath = projectionData
    .map((row, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index).toFixed(1)} ${yFor(row.cumulativeSavings).toFixed(1)}`)
    .join(' ');
  const costY = yFor(systemCost);
  const breakevenIndex = breakevenYear ? breakevenYear - 1 : -1;

  return (
    <View style={styles.chartWrap}>
      <Svg width={width} height={height}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + chartHeight * ratio;
          return <Line key={ratio} x1={paddingLeft} x2={width - paddingRight} y1={y} y2={y} stroke="#EEE4D5" strokeWidth={1} />;
        })}

        <Line x1={paddingLeft} x2={width - paddingRight} y1={costY} y2={costY} stroke="#D99A00" strokeWidth={1.4} strokeDasharray="5 5" />
        <SvgText x={paddingLeft} y={Math.max(12, costY - 6)} fill="#B07800" fontSize="10" fontWeight="700">
          System cost
        </SvgText>

        {projectionData.map((row, index) => {
          const x = xFor(index) - barWidth / 2;
          const y = yFor(row.annualSavings);
          return (
            <React.Fragment key={row.year}>
              <Rect x={x} y={y} width={barWidth} height={paddingTop + chartHeight - y} rx={5} fill="#F5B400" opacity={0.82} />
              <SvgText x={xFor(index)} y={height - 16} textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="700">
                Y{row.year}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Path d={linePath} fill="none" stroke="#10213A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {projectionData.map((row, index) => (
          <Circle key={`dot-${row.year}`} cx={xFor(index)} cy={yFor(row.cumulativeSavings)} r={3.4} fill="#10213A" />
        ))}

        {breakevenIndex >= 0 ? (
          <>
            <Line
              x1={xFor(breakevenIndex)}
              x2={xFor(breakevenIndex)}
              y1={paddingTop}
              y2={paddingTop + chartHeight}
              stroke="#168A4A"
              strokeWidth={1.3}
              strokeDasharray="4 4"
            />
            <Circle cx={xFor(breakevenIndex)} cy={yFor(projectionData[breakevenIndex].cumulativeSavings)} r={6} fill="#168A4A" />
          </>
        ) : null}

        <SvgText x={4} y={paddingTop + 5} fill="#64748B" fontSize="9" fontWeight="700">
          {formatCompactCurrency(maxValue)}
        </SvgText>
        <SvgText x={6} y={paddingTop + chartHeight} fill="#64748B" fontSize="9" fontWeight="700">
          PKR 0
        </SvgText>
      </Svg>

      <View style={styles.chartLegend}>
        <LegendItem color="#F5B400" label="Annual savings" />
        <LegendItem color="#10213A" label="Cumulative" />
        <LegendItem color="#D99A00" label="System cost" dashed />
      </View>
    </View>
  );
};

const LegendItem = ({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, { backgroundColor: dashed ? 'transparent' : color, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFBF2'
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 42
  },
  topBar: {
    minHeight: 62,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  topIconButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.72)',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2
  },
  topCopy: {
    flex: 1
  },
  topTitle: {
    color: '#10213A',
    fontSize: 22,
    fontWeight: '900'
  },
  topSubtitle: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  },
  inputCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3
  },
  field: {
    gap: 9
  },
  fieldLabel: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900'
  },
  inputWrap: {
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  inputError: {
    borderColor: '#EF4444'
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 13,
    color: '#10213A',
    fontSize: 13,
    fontWeight: '800'
  },
  prefix: {
    height: '100%',
    minWidth: 48,
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: 15
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  helperText: {
    flex: 1,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700'
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF0F2',
    marginVertical: 16
  },
  errorText: {
    marginTop: 10,
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800'
  },
  calculateButton: {
    height: 54,
    marginTop: 20,
    borderRadius: 17,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 3
  },
  calculateText: {
    color: '#10213A',
    fontSize: 15,
    fontWeight: '900'
  },
  helpCard: {
    minHeight: 64,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(232,217,190,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 12
  },
  helpTitle: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900'
  },
  helpText: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700'
  },
  helpArrow: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#F5D482',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultContent: {
    padding: 16,
    paddingBottom: 42,
    gap: 14
  },
  resultTop: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  backButtonLight: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE4D5'
  },
  resultHeaderCopy: {
    flex: 1
  },
  resultTitle: {
    color: '#10213A',
    fontSize: 24,
    fontWeight: '900'
  },
  resultSubtitle: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  summaryCard: {
    width: '48.5%',
    minHeight: 142,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0E3CF',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800'
  },
  summaryMain: {
    marginTop: 7,
    color: '#10213A',
    fontSize: 20,
    fontWeight: '900'
  },
  summaryHelper: {
    marginTop: 5,
    color: '#8A6B14',
    fontSize: 11,
    fontWeight: '800'
  },
  investmentCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E3CF',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  },
  chartCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E3CF',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  },
  breakdownCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E3CF',
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12
  },
  sectionTitle: {
    color: '#10213A',
    fontSize: 16,
    fontWeight: '900'
  },
  sectionSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700'
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricRow: {
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E8DA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  metricRowLast: {
    borderBottomWidth: 0
  },
  metricLabel: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800'
  },
  metricValue: {
    color: '#10213A',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right'
  },
  metricValueStrong: {
    color: '#168A4A',
    fontSize: 14
  },
  chartWrap: {
    alignItems: 'center'
  },
  chartLegend: {
    width: '100%',
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  legendSwatch: {
    width: 16,
    height: 8,
    borderRadius: 999,
    borderWidth: 1.5
  },
  legendText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800'
  },
  chartNote: {
    marginTop: 10,
    color: '#526174',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center'
  },
  breakdownHeader: {
    minHeight: 30,
    borderRadius: 12,
    backgroundColor: '#FFF7E6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  breakdownHeaderText: {
    flex: 1,
    color: '#8A6B14',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'right'
  },
  breakdownRow: {
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E8DA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  breakdownRowLast: {
    borderBottomWidth: 0
  },
  yearCell: {
    flex: 0.82,
    textAlign: 'left'
  },
  roiCell: {
    flex: 0.62
  },
  breakdownYear: {
    color: '#10213A',
    fontSize: 12,
    fontWeight: '900'
  },
  breakdownValue: {
    flex: 1,
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right'
  },
  breakdownRoi: {
    color: '#D14343',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right'
  },
  breakdownRoiPositive: {
    color: '#168A4A'
  },
  reviewButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#D79300',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 3
  },
  reviewButtonDisabled: {
    opacity: 0.68
  },
  reviewButtonText: {
    color: '#10213A',
    fontSize: 15,
    fontWeight: '900'
  }
});
