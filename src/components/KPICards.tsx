import { useMemo, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';
import { PriceChange, ProductWithPrices } from '../types';

interface KPICardsProps {
  maxIncrease: PriceChange | null;
  maxDecrease: PriceChange | null;
  currentWeek: number;
  products: ProductWithPrices[];
  adherencePercent?: number;
  methodologyText?: string;
}

function formatSignedPercent(v: number, decimals = 2) {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v).toFixed(decimals)}%`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Default methodology text (Arabic) if you don't pass one from App.
 * You can replace it with your final text anytime.
 */
const DEFAULT_METHODOLOGY = `العنوان: حركة أسعار سلع أساسية مختارة خلال شهر رمضان المبارك
المصدر: الجهاز المركزي للإحصاء الفلسطيني
الشركاء: وزارة الاقتصاد الوطني، وجمعية حماية المستهلك الفلسطينية

الهدف:
•	تسليط الضوء على حركة أسعار بعض السلع الأساسية المختارة خلال شهر رمضان المبارك، تلك التي يزداد الإقبال عليها خلال الشهر الفضيل، بحيث تصبح ذات أثر كبير على دخل الأسر الفلسطينية، ومقارنتها بالسعر الاسترشادي الصادر عن وزارة الاقتصاد الوطني.
•	تسليط الضوء بشكل أسبوعي على حركة أسعار السلع المختارة، في الأسواق الفلسطينية، مقارنة مع السعر الاسترشادي، لقياس مستوى الالتزام بالسعر الاسترشادي، وكذلك توضيح مستوى التغيرات التي تطرأ عليها بشكل أسبوعي خلال شهر رمضان.
•	ستوفر هذه المنصة سلسلة بيانات لتلك المجموعة من السلع، على مستوى السلعة على مدار شهر رمضان المبارك. 

المتغيرات: السعر، نسبة التغير، مدى الالتزام.
التغطية الجغرافية: الضفة الغربية.
بداية الفترة: الأسبوع الثاني من شهر 2-2026
نهاية الفترة: الأسبوع الثالث من شهر 3-2026

المنهجية:
•	تم اختيار 25 سلعة أساسية يزداد استهلاكها بشكل كبير خلال شهر رمضان المبارك، تتركز في الأرز، والزيت، واللحوم، والدواجن، واللبن، والجبن، والبيض، والسكر، والحلاوة، والطحينية، والقطايف، والبقوليات "عدس، وحمص، وفريكة"، التمور والعجوة، السميد.
•	تجمع هذه السلع من 8 محافظات رئيسية في أسواق الضفة الغربية وهي "جنين، ونابلس، وقلقيلية، وطولكرم، ورام الله والبيرة، وأريحا، وبيت لحم، والخليل".
•	يتم تجميع حوالي 1650 مشاهدة سعرية بمعدل 412 تسعيرة بشكل أسبوعي لهذه السلع، لتحقيق أكبر تغطية جغرافية، تغطي تباين الأسعار لهذه السلع، في أسواق الضفة العربية. 
•	تجمع من حوالي 600 منفذ بيع موزعة على مدار الفترة بين مختلف المحافظات.
•	يتم حساب معدلات الأسعار على مستوى السلعة، ومقارنة متوسط السعر بشكل أسبوع مع السعر الاسترشادي، ومع متوسط السعر للأسبوع السابق، بحيث يتم رصد التغيرات الأسبوعية لمعدلات الأسعار، ودرجة الالتزام بالأسعار الاسترشادية لتلك السلع.
•	تحديد السعر الاسترشادي "وزارة الاقتصاد":
  1.	تم اعتماد 25 سلعة ذات اهمية في سلة المستهلك الفلسطيني بشكل عام وفي رمضان بشكل خاص.
  2.	في المرحلة الأولى يتم جمع أسعار هذه السلع من محلات البيع بالتجزئة للمستهلك، حيث يتم جمع السلع من ثلاثة مصادر (محلات تجارية صغيرة، متوسطة، كبيرة الحجم)، وتجمع الأسعار من جميع المحافظات في الضفة الغربية.
  3.	يتم تجميع الاسعار وفحص منطقية البيانات، بحث يتم عمل متوسط، والسعر الاعلى، والسعر الاقل، وفي حال هناك اي قيم شاذة في البيانات، يتم الرجوع والتأكد منها من الميدان.
  4.	في المرحلة الثانية، يتم جمع اسعار بعض السلع من كبار التجار والموزعين، من أجل ضمان عدالة السعر للمستهلك وتاجر التجزئة.

`;

export function KPICards({
  maxIncrease,
  maxDecrease,
  currentWeek,
  products,
  adherencePercent,
  methodologyText,
}: KPICardsProps) {
  const [openMethodology, setOpenMethodology] = useState(false);

const computedAdherence = useMemo(() => {
  if (typeof adherencePercent === 'number') {
    return clamp(adherencePercent, 0, 100);
  }
  if (!products?.length) return 0;

  const count = products.reduce((acc, p) => {
    const price = p.prices.find(x => x.week_number === currentWeek)?.price ?? 0;
    const ref = p.reference_price ?? 0;
    if (ref <= 0) return acc;
    return price <= ref ? acc + 1 : acc;
  }, 0);

  return Math.round((count / products.length) * 100);
}, [adherencePercent, products, currentWeek]);


const adherence = computedAdherence; // number
const adherenceLevel = adherence >= 70 ? 'good' : adherence >= 40 ? 'warn' : 'bad';

  const adherenceStyles =
    adherenceLevel === 'good'
      ? {
          ring: 'bg-green-100',
          text: 'text-green-700',
          value: 'text-green-700',
          icon: <CheckCircle2 className="text-green-600" width={34} height={34} />,
          hint: 'مستوى التزام مرتفع',
        }
      : adherenceLevel === 'warn'
      ? {
          ring: 'bg-amber-100',
          text: 'text-amber-800',
          value: 'text-amber-800',
          icon: <AlertTriangle className="text-amber-600" width={34} height={34} />,
          hint: 'يحتاج متابعة',
        }
      : {
          ring: 'bg-red-100',
          text: 'text-red-700',
          value: 'text-red-700',
          icon: <AlertTriangle className="text-red-600" width={34} height={34} />,
          hint: 'مستوى التزام منخفض',
        };

  const methodText = methodologyText?.trim() ? methodologyText : DEFAULT_METHODOLOGY;

  // If increase/decrease not ready, still show the other two cards.
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Card 3: Adherence */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-shadow">
          <div className={`${adherenceStyles.ring} rounded-full p-4 flex-shrink-0`}>
            {adherenceStyles.icon}
          </div>

          <div className="text-right flex-1 min-w-0">
            <h3 className="text-gray-700 font-bold text-base mb-1">
              نسبة الالتزام بالسعر الاسترشادي
            </h3>

            <div className="flex items-end justify-between gap-3">
              <p className={`text-3xl font-black ${adherenceStyles.value}`}>
                {adherence}%
              </p>
              <p className={`text-sm font-semibold ${adherenceStyles.text}`}>
                {adherenceStyles.hint}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    adherenceLevel === 'good'
                      ? 'bg-green-500'
                      : adherenceLevel === 'warn'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${clamp(adherence, 0, 100)}%` }}
                  aria-label="نسبة الالتزام"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={clamp(adherence, 0, 100)}
                  role="progressbar"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              الأسبوع {currentWeek}
            </p>
          </div>
        </div>

        {/* Card 1: Highest increase */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-shadow">
          <div className="bg-red-100 rounded-full p-4 flex-shrink-0">
            <TrendingUp className="text-red-600" width={32} height={32} />
          </div>
          <div className="text-right flex-1 min-w-0">
            <h3 className="text-gray-700 font-bold text-base mb-1">أعلى نسبة ارتفاع عن السعر الاسترشادي</h3>
            <p className="text-lg font-bold text-red-600 mb-1 truncate">
              {maxIncrease?.product?.name ?? '—'}
            </p>
            <p className="text-2xl font-black text-red-600">
              {maxIncrease ? formatSignedPercent(maxIncrease.percent, 2) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">عن الاسترشادي - أسبوع {currentWeek}</p>
          </div>
        </div>

        {/* Card 2: Biggest decrease */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-shadow">
          <div className="bg-green-100 rounded-full p-4 flex-shrink-0">
            <TrendingDown className="text-green-600" width={32} height={32} />
          </div>
          <div className="text-right flex-1 min-w-0">
            <h3 className="text-gray-700 font-bold text-base mb-1">أكبر نسبة انخفاض عن السعر الاسترشادي </h3>
            <p className="text-lg font-bold text-green-600 mb-1 truncate">
              {maxDecrease?.product?.name ?? '—'}
            </p>
            <p className="text-2xl font-black text-green-600">
              {maxDecrease ? formatSignedPercent(maxDecrease.percent, 2) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">عن الاسترشادي - أسبوع {currentWeek}</p>
          </div>
        </div>



        {/* Card 4: Methodology */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-shadow">
          <div className="bg-blue-100 rounded-full p-4 flex-shrink-0">
            <Info className="text-blue-700" width={32} height={32} />
          </div>
          <div className="text-right flex-1 min-w-0">
            <h3 className="text-gray-700 font-bold text-base mb-2">المنهجية</h3>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">
              {methodText.substring(0, 100)}...
            </p>

            <button
              type="button"
              onClick={() => setOpenMethodology(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition"
            >
              <Info className="w-4 h-4" />
              عرض التفاصيل
            </button>
          </div>
        </div>
      </div>

      {/* Modal (popup) */}
      {openMethodology && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpenMethodology(false)}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-black text-gray-800">المنهجية</h3>
              <button
                type="button"
                onClick={() => setOpenMethodology(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-auto">
              <pre className="whitespace-pre-wrap text-sm leading-7 text-gray-800" style={{ fontSize: '20px', fontFamily: 'sans-serif' }}>
                {methodText}
              </pre>
            </div>

            <div className="px-6 py-4 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setOpenMethodology(false)}
                className="px-5 py-2 rounded-lg bg-gray-800 hover:bg-black text-white font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
