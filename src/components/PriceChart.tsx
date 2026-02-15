import React, { useMemo, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  ChartOptions,
  Plugin,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Download } from 'lucide-react';
import { ProductWithPrices } from '../types';
import { formatWeekLabel } from '../lib/weekLabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

interface PriceChartProps {
  products: ProductWithPrices[];
  currentWeek?: number;
}


// White canvas background (useful when exporting the chart as an image).
const whiteBackgroundPlugin: Plugin<'bar'> = {
  id: 'whiteBackground',
  beforeDraw: (chart) => {
    const ctx = chart.canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

export function PriceChart({ products, currentWeek = 1 }: PriceChartProps) {
  const product = products[0];
  const chartRef = useRef<any>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const legendFontSize = isMobile ? 11 : 14;
  const tickFontSize = isMobile ? 10 : 14;
  const axisTitleFontSize = isMobile ? 12 : 16;
  const tooltipTitleSize = isMobile ? 12 : 14;
  const tooltipBodySize = isMobile ? 11 : 13;

  const titleText =
    'نسبة التغير عن السعر الاسترشادي خلال شهر رمضان';

  const changeLabel = 'نسبة التغير %';
  const baselineLabel = 'السعر الاسترشادي (0%)';

  // Tailwind-like green used across the UI (close to: rgb(134 239 172)).
  const changeGreen = 'rgb(22, 163, 74)';
  const changeRed = 'rgb(220, 38, 38)';
  const axisColor = '#334155';

  const { labels, pctVsRef, ref, yLineMin, yLineMax } = useMemo(() => {
    if (!product) {
      return { labels: [], pctVsRef: [], ref: 0, yLineMin: -10, yLineMax: 10 };
    }

    // Show only weeks up to the selected week (e.g., week 2 shows weeks 1-2).
    const sorted = [...product.prices]
      .filter((p) => p.week_number <= currentWeek)
      .sort((a, b) => a.week_number - b.week_number);

    const lbls = sorted.map((p) => formatWeekLabel(p.week_number, 'ar', p.week_date));
    const prices = sorted.map((p) => Number(p.price) || 0);

    const refPrice = Number(product.reference_price) || 0;
    const pct = prices.map((p) =>
      refPrice ? +(((p - refPrice) / refPrice) * 100).toFixed(2) : 0
    );

    // Force the % axis to be centered around 0 (reference baseline) with padding.
    const vals = [...pct, 0];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const spread = Math.max(1, max - min);
    const pad = Math.max(5, spread * 0.2);
    const yMin = Math.floor((min - pad) * 100) / 100;
    const yMax = Math.ceil((max + pad) * 100) / 100;

    return { labels: lbls, pctVsRef: pct, ref: refPrice, yLineMin: yMin, yLineMax: yMax };
  }, [product, currentWeek]);

  if (!product) return null;

  const datasets: any[] = [];

  // Show percentage change as bars with color coding
  datasets.push({
    label: changeLabel,
    type: 'bar' as const,
    data: pctVsRef,
    backgroundColor: pctVsRef.map(val => val >= 0 ? 'rgba(220, 38, 38, 0.7)' : 'rgba(22, 163, 74, 0.7)'),
    borderColor: pctVsRef.map(val => val >= 0 ? changeRed : changeGreen),
    borderWidth: 2,
    borderRadius: 4,
    yAxisID: 'yLine',
  });

  // Show 0% baseline (reference price line)
  datasets.push({
    label: baselineLabel,
    type: 'line' as const,
    data: labels.map(() => 0),
    borderColor: '#334155',
    borderWidth: 3,
    borderDash: [6, 6],
    pointRadius: 0,
    pointHoverRadius: 0,
    tension: 0,
    fill: false,
    yAxisID: 'yLine',
  });

  const data = { labels, datasets };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    barPercentage: 0.6,
    categoryPercentage: 0.8,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { size: legendFontSize, weight: 'bold' },
          padding: isMobile ? 10 : 16,
          usePointStyle: true,
          generateLabels: (chart) => {
            const base = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            base.forEach((l: any) => {
              const ds: any = chart.data.datasets?.[l.datasetIndex];
              const isLine = ds?.type === 'line';

              if (isLine) {
                l.pointStyle = 'line';
                l.lineWidth = ds.borderWidth ?? 3;
                l.strokeStyle = ds.borderColor;
                l.fillStyle = 'rgba(0,0,0,0)';
              } else {
                l.pointStyle = 'rectRounded';
                l.fillStyle = ds.backgroundColor?.[0] || ds.backgroundColor;
                l.strokeStyle = ds.borderColor?.[0] || ds.borderColor;
                l.lineWidth = 0;
              }
            });
            return base;
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.9)',
        titleFont: { size: tooltipTitleSize, weight: 'bold' },
        bodyFont: { size: tooltipBodySize },
        padding: isMobile ? 10 : 14,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y;
            if (ctx.dataset.label === baselineLabel) return `${baselineLabel}`;
            return `${ctx.dataset.label}: ${val > 0 ? '+' : ''}${Number(val).toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: tickFontSize, weight: 'bold' }, maxRotation: 0, minRotation: 0 },
      },
      yLine: {
        display: true,
        position: 'left',
        suggestedMin: yLineMin,
        suggestedMax: yLineMax,
        title: {
          display: true,
          text: 'نسبة التغير عن السعر الاسترشادي %',
          font: { size: axisTitleFontSize, weight: 'bold' },
          color: axisColor,
        },
        ticks: {
          color: axisColor,
          font: { size: tickFontSize },
          callback: (v) => `${Number(v).toFixed(1)}%`,
        },
        grid: { 
          color: (context) => {
            if (context.tick.value === 0) {
              return 'rgba(51, 65, 85, 0.3)'; // Darker line for zero
            }
            return 'rgba(0,0,0,0.06)';
          },
          lineWidth: (context) => {
            if (context.tick.value === 0) {
              return 2;
            }
            return 1;
          },
        },
      },
    },
  };

  const downloadChart = () => {
    const instance = chartRef.current;
    const chart = instance?.chart ?? instance;
    const url = chart?.toBase64Image?.();
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.name}-chart.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">
      <div className="flex justify-center">
        <button
          onClick={downloadChart}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm"
          title="تنزيل الرسم كصورة"
        >
          <Download className="w-4 h-4" />
          تنزيل الرسم
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs sm:text-sm text-gray-600 font-semibold">{titleText}</p>
        <h3 className="text-base sm:text-xl font-black text-gray-800 mt-2">{product.name}</h3>
      </div>

      <div className="h-[380px] sm:h-[440px]">
        <Chart
          ref={chartRef}
          type="bar"
          data={data as any}
          options={options}
          plugins={[whiteBackgroundPlugin] as any}
        />
      </div>

      <div className="flex justify-center gap-6 pt-2 border-t border-gray-100 text-xs sm:text-sm text-gray-600">
        <span>
          السعر الاسترشادي: <strong className="text-gray-800">₪{ref.toFixed(2)}</strong>
        </span>
        <span>
          الأسبوع المعروض: <strong className="text-blue-600">الأسبوع {currentWeek}</strong>
        </span>
      </div>
    </div>
  );
}