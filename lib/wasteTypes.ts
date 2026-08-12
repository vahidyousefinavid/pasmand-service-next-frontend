import { Trash2, Recycle, Battery, Box, Car, Construction, type LucideIcon } from 'lucide-react';
import { WASTE_COLOR } from '@/components/ui/tokens';

/**
 * One catalogue of waste types for every screen that shows them.
 *
 * The ids are the values the API already stores on a request (`wasteType`), so
 * this is a presentation layer over data that exists — home, the waste-types
 * page, the new-request wizard and the history list all read it, which is why
 * the same category is the same colour and the same icon everywhere.
 */
export interface WasteType {
  id: string;
  name: string;
  /** One line, for cards and chips. */
  short: string;
  /** The full explanation, for the guide-style list. */
  description: string;
  /** What a citizen most often hands over in this category. */
  examples: string[];
  color: string;
  Icon: LucideIcon;
}

export const WASTE_TYPES: WasteType[] = [
  {
    id: 'recyclable',
    name: 'قابل بازیافت',
    short: 'کاغذ، پلاستیک، شیشه و فلز',
    description:
      'موادی مثل بطری‌های پلاستیکی، قوطی‌های فلزی، کاغذ باطله، مقوا و شیشه که در صورت تمیز و خشک بودن دوباره وارد چرخهٔ تولید می‌شوند. این دسته بیشترین ارزش خرید را دارد.',
    examples: ['بطری نوشابه', 'قوطی کنسرو', 'روزنامه و مقوا', 'شیشهٔ سالم'],
    color: WASTE_COLOR.recyclable,
    Icon: Recycle,
  },
  {
    id: 'household',
    name: 'پسماند خانگی',
    short: 'پسماند روزمرهٔ آشپزخانه',
    description:
      'زباله‌های روزمره مثل پوست میوه، ته‌ماندهٔ غذا و دستمال کاغذی مصرف‌شده. بهتر است از موارد قابل بازیافت جدا نگه داشته شود تا بازیافت بقیه بی‌نتیجه نماند.',
    examples: ['ته‌ماندهٔ غذا', 'پوست میوه', 'دستمال مصرف‌شده'],
    color: WASTE_COLOR.household,
    Icon: Trash2,
  },
  {
    id: 'electronic',
    name: 'الکترونیکی',
    short: 'لوازم برقی و باتری',
    description:
      'لوازم برقی خراب یا بلااستفاده مثل باتری، گوشی قدیمی، شارژر، کابل، لپ‌تاپ و تلویزیون. این وسایل نباید با پسماند دیگر مخلوط شوند، چون فلزات سنگین‌شان خاک و آب را آلوده می‌کند.',
    examples: ['باتری و پاوربانک', 'گوشی و شارژر', 'لپ‌تاپ و مانیتور'],
    color: WASTE_COLOR.electronic,
    Icon: Battery,
  },
  {
    id: 'bulky',
    name: 'اقلام حجیم',
    short: 'مبلمان و وسایل بزرگ',
    description:
      'اشیای بزرگ مثل مبل، تشک، کمد و لوازم چوبی که در سطل زباله جا نمی‌شوند و به جمع‌آوری ویژه با خودروی بزرگ‌تر نیاز دارند.',
    examples: ['مبل و صندلی', 'تشک و کمد', 'درب و پنجرهٔ چوبی'],
    color: WASTE_COLOR.bulky,
    Icon: Box,
  },
  {
    id: 'automotive',
    name: 'خودرو',
    short: 'روغن، باتری و لاستیک',
    description:
      'روغن سوخته، باتری خودرو، لاستیک فرسوده و قطعات یدکی. چون بخشی از این‌ها خطرناک است، جمع‌آوری‌شان مسیر جداگانه‌ای دارد.',
    examples: ['روغن سوخته', 'باتری خودرو', 'لاستیک فرسوده'],
    color: WASTE_COLOR.automotive,
    Icon: Car,
  },
  {
    id: 'construction',
    name: 'ساختمانی',
    short: 'نخاله و مصالح',
    description:
      'آجر، گچ، سیمان، سرامیک شکسته و نخالهٔ حاصل از تعمیرات یا ساخت‌وساز. معمولاً وزن بالایی دارد و با هماهنگی جداگانه جمع‌آوری می‌شود.',
    examples: ['نخالهٔ تعمیرات', 'سرامیک شکسته', 'گچ و سیمان'],
    color: WASTE_COLOR.construction,
    Icon: Construction,
  },
];

export function wasteMeta(id?: string): WasteType {
  return WASTE_TYPES.find((w) => w.id === id) ?? WASTE_TYPES[0];
}
