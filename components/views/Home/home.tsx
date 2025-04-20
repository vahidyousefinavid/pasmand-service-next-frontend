'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Cross,
    Banknote,
    FileClock,
    MapPinned,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Leaf,
    Gift,
    Recycle,
    ArrowUpRight
} from 'lucide-react';
import { Navigation } from '@/components/views/navigation';
import { TopMenu } from '@/components/views/top-menu';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation as SwiperNavigation, EffectFade, EffectCreative } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-creative';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const items = [
    {
        icon: <MapPinned className="h-7 w-7" />,
        title: 'درخواست های من',
        description: 'درخواست های من',
        color: 'text-[hsl(25,84%,48%)]',
        bgColor: 'bg-[hsl(25,84%,48%)]/10',
        href: 'requests'
    },
    {
        icon: <Cross className="h-7 w-7" />,
        title: 'درخواست های جدید',
        description: 'درخواست جمع آوری جهت تصفیه و کمک به محیط زیست',
        color: 'text-[hsl(25,84%,48%)]',
        bgColor: 'bg-[hsl(25,84%,48%)]/10',
        href: '/new-requests'
    },
    {
        icon: <Banknote className="h-7 w-7" />,
        title: 'تعرفه قیمت‌ها',
        description: 'قیمت روز تمامی اقلام',
        color: 'text-[hsl(25,84%,48%)]',
        bgColor: 'bg-[hsl(25,84%,48%)]/10',
        href: 'tariff'
    },
    // {
    //     icon: <FileClock className="h-7 w-7" />,
    //     title: 'سوابق جمع آوری',
    //     description: ' لیست سوابق درخواست های شما',
    //     color: 'text-[hsl(25,84%,48%)]',
    //     bgColor: 'bg-[hsl(25,84%,48%)]/10',
    //     href: 'history'
    // },
    {
        icon: <HelpCircle className="h-7 w-7" />,
        title: 'راهنمای استفاده',
        description: 'آموزش استفاده از اپلیکیشن',
        color: 'text-[hsl(25,84%,48%)]',
        bgColor: 'bg-[hsl(25,84%,48%)]/10',
        href: 'guide'
    },
];

const banners = [
    {
        title: 'تخفیف ویژه برای جمع آوری بیش از ۵ کیلوگرم!',
        description: 'با جمع آوری بیشتر، به محیط زیست کمک کنید و از تخفیف های ویژه بهره مند شوید.',
        bgColor: 'from-[hsl(25,84%,48%)] to-[hsl(25,84%,58%)]',
        textColor: 'text-white',
        icon: <Recycle className="h-8 w-8 mb-0" />,
        buttonText: 'درخواست جمع‌آوری',
        buttonLink: '/new-request',
        image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1470&auto=format&fit=crop'
    },
    {
        title: 'همراه با ما در حفظ محیط زیست سهیم باشید',
        description: 'با تفکیک زباله‌ها و بازیافت آنها، به حفظ منابع طبیعی کمک کنید.',
        bgColor: 'from-emerald-600 to-emerald-500',
        textColor: 'text-white',
        icon: <Leaf className="h-8 w-8 mb-0" />,
        buttonText: 'مشاهده راهنما',
        buttonLink: '/guide',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1474&auto=format&fit=crop'
    },
    {
        title: 'جایزه ویژه برای کاربران فعال',
        description: 'با ثبت بیش از ۵ درخواست در ماه، شانس خود را برای دریافت جوایز نقدی امتحان کنید.',
        bgColor: 'from-blue-600 to-blue-500',
        textColor: 'text-white',
        icon: <Gift className="h-8 w-8 mb-0" />,
        buttonText: 'شرایط دریافت جایزه',
        buttonLink: '/guide',
        image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab0?q=80&w=1470&auto=format&fit=crop'
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

export default function HomeView() {
    const [mounted, setMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <TopMenu />
            <div className="pt-[120px] px-[20px]">
                <motion.div
                    dir="rtl"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-20"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {items.map((item, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <Link href={item?.href}>
                                <Card
                                    className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-none cursor-pointer rounded-xl group"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex justify-start items-center space-x-4">
                                            <div className="space-y-2 flex-1">
                                                <h3 className="font-medium text-lg leading-none group-hover:text-[hsl(25,84%,48%)] transition-colors duration-300">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                            <div className={`p-3 rounded-xl ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                                                {item.icon}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
            {/* </ScrollArea> */}
            <Navigation />
        </div>
    );
}