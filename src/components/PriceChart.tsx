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

// 1. PLUGIN: Draws the reference line across the entire chart area (even for 1 point)
const persistentRefLinePlugin: Plugin = {
  id: 'persistentRefLine',
  afterDraw: (chart) => {
    const { ctx, chartArea: { left, right }, scales: { yBar } } = chart;
    const pluginOptions = chart.options.plugins as any;
    const config = pluginOptions.persistentRefLine;

    if (!yBar || !config || config.refValue === undefined || !config.display) return;

    const yPos = yBar.getPixelForValue(config.refValue);

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = '#dc2626'; // Red
    ctx.moveTo(left, yPos);
    ctx.lineTo(right, yPos);
    ctx.stroke();
    ctx.restore();
  },
};

const whiteBackgroundPlugin: Plugin = {
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

type ViewMode = 'all' | 'price' | 'change';

interface PriceChartProps {
  products: ProductWithPrices[];
  currentWeek?: number;
}

export function PriceChart({ products, currentWeek = 1 }: PriceChartProps) {
  const product = products[0];
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const chartRef = useRef<any>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const changeGreen = 'rgb(22, 163, 74)';

  const { labels, weeklyPrices, pctVsRef, ref, yBarLimits, yLineLimits } = useMemo(() => {
    if (!product) return { labels: [], weeklyPrices: [], pctVsRef: [], ref: 0, yBarLimits: {}, yLineLimits: {} };

    const sorted = [...product.prices]
      .filter((p) => p.week_number <= currentWeek)
      .sort((a, b) => a.week_number - b.week_number);

    const lbls = sorted.map((p) => formatWeekLabel(p.week_number, 'ar', p.week_date));
    const prices = sorted.map((p) => Number(p.price) || 0);
    const refPrice = Number(product.reference_price) || 0;
    const pct = prices.map((p) => (refPrice ? +(((p - refPrice) / refPrice) * 100).toFixed(2) : 0));

    // --- SCALE SYNC LOGIC ---
    // Calculate limits so refPrice on left axis matches 0% on right axis
    const maxPriceDist = Math.max(...prices.map(p => Math.abs(p - refPrice)), refPrice * 0.1);
    const maxPctDist = Math.max(...pct.map(Math.abs), 10);

    return {
      labels: lbls,
      weeklyPrices: prices,
      pctVsRef: pct,
      ref: refPrice,
      yBarLimits: { min: Math.max(0, refPrice - maxPriceDist * 1.2), max: refPrice + maxPriceDist * 1.2 },
      yLineLimits: { min: -(maxPctDist * 1.2), max: maxPctDist * 1.2 }
    };
  }, [product, currentWeek]);

  if (!product) return null;

  const datasets: any[] = [];
  const showPrice = viewMode === 'all' || viewMode === 'price';
  const showChange = viewMode === 'all' || viewMode === 'change';

  if (showPrice) {
    datasets.push({
      label: 'السعر الأسبوعي',
      type: 'bar',
      data: weeklyPrices,
      backgroundColor: 'rgba(0,86,179,0.7)',
      borderColor: 'rgba(0,86,179,1)',
      borderWidth: 1,
      yAxisID: 'yBar',
    });
    
    // Dataset for Legend only
    datasets.push({
      label: 'السعر الاسترشادي',
      type: 'line',
      data: [], 
      borderColor: '#dc2626',
      borderDash: [8, 4],
      borderWidth: 2,
    });
  }

  if (showChange) {
    datasets.push({
      label: 'التغير % عن الاسترشادي',
      type: 'line',
      data: pctVsRef,
      borderColor: changeGreen,
      borderWidth: 3,
      borderDash: [6, 4], // Always dashed as requested
      pointRadius: 4,
      pointBackgroundColor: changeGreen,
      tension: 0.3,
      yAxisID: 'yLine',
    });
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      persistentRefLine: { refValue: ref, display: showPrice },
      legend: {
        rtl: true,
        labels: { font: { size: isMobile ? 11 : 14, weight: 'bold' }, usePointStyle: true }
      },
      tooltip: {
        rtl: true,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y;
            if (ctx.dataset.yAxisID === 'yLine') return `${ctx.dataset.label}: ${val > 0 ? '+' : ''}${val}%`;
            return `${ctx.dataset.label}: ₪${val.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } },
      yBar: {
        display: showPrice,
        position: 'left',
        min: yBarLimits.min,
        max: yBarLimits.max,
        title: { display: true, text: 'السعر (₪)', font: { weight: 'bold' } },
      },
      yLine: {
        display: showChange,
        position: 'right',
        min: yLineLimits.min,
        max: yLineLimits.max,
        title: { display: true, text: 'نسبة التغير %', font: { weight: 'bold' } },
        ticks: { callback: (v: any) => `${v}%` },
        grid: { drawOnChartArea: false }
      }
    }
  };

  const downloadChart = () => {
    const url = chartRef.current?.toBase64Image();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.name}-chart.png`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {(['all', 'price', 'change'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-full text-xs font-bold ${viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              {mode === 'all' ? 'الكل' : mode === 'price' ? 'السعر' : 'التغير'}
            </button>
          ))}
        </div>
        <button onClick={downloadChart} className="p-2 border rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-black text-gray-800">{product.name}</h3>
      </div>

      <div className="h-[400px]">
        <Chart
          ref={chartRef}
          type="bar"
          data={{ labels, datasets }}
          options={options}
          plugins={[whiteBackgroundPlugin, persistentRefLinePlugin]}
        />
      </div>
    </div>
  );
}
