'use client';

import { useEffect, useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, Package2Icon, TruckIcon, BanknoteIcon, ScaleIcon } from 'lucide-react';
import { axiosService } from '@/lib/axiosService';
import { API } from '@/services/const';
import Cookies from 'js-cookie';
import { toast } from '@/hooks/use-toast';
import { formatDateToJalali } from '@/lib/utils';

interface HistoryItem {
  _id: string;
  date: string;
  items: {
    name: string;
    weight: number;
    price: number;
  }[];
  status: 'pending' | 'collecting' | 'completed' | 'canceled';
  totalPrice: number;
  location: {
    address: string
  };
}

const statusMap = {
  pending: { label: 'در انتظار تایید', color: 'bg-yellow-100 text-yellow-800' },
  collecting: { label: 'در حال جمع‌آوری', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'تکمیل شده', color: 'bg-green-100 text-green-800' },
  canceled: { label: 'لغو شده', color: 'bg-red-100 text-red-800' }
};

export default function HistoryPage() {
  const [sortBy, setSortBy] = useState<'date' | 'totalPrice'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');



  const formatPrice = (price: number) => {
    return price?.toLocaleString('fa-IR');
  };

  const [loading, setLoading] = useState(false)
  const [requestsItems, setRequestsItems] = useState<HistoryItem[]>([])

  const getRequests = () => {
    setLoading(true)
    axiosService({
      url: API.USER_REQUESTS,
      method: 'get',
      token: Cookies.get('auth_token')
    })
      .then((res: any) => {
        setRequestsItems(res?.data?.requests || [])
        setLoading(false)
      }).catch((err) => {
        toast({
          variant: 'destructive',
          title: 'ناموفق',
          description: 'متاسفانه انجام نشد صفحه را دوباره بارگزاری کنید',
        });
        setLoading(false)
      })
  }

  useEffect(() => {
    getRequests()
  }, [])

  const sortedHistory = [...requestsItems].sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'date') {
      return order * (new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return order * (a.totalPrice - b.totalPrice);
  });

  // محاسبه آمار کلی
  const stats = requestsItems.reduce((acc, curr) => {
    if (curr.status === 'completed') {
      acc.totalEarnings += curr.totalPrice;
      acc.totalWeight += curr.items.reduce((sum, item) => sum + item.weight, 0);
    }
    acc.totalOrders += 1;
    return acc;
  }, {
    totalEarnings: 0,
    totalWeight: 0,
    totalOrders: 0
  });

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          سوابق فروش
        </h1>

        {/* آمار کلی */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">درآمد کل</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalEarnings)} تومان</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <BanknoteIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">وزن کل بازیافت</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWeight} کیلوگرم</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ScaleIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">تعداد درخواست‌ها</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package2Icon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* دکمه‌های مرتب‌سازی */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              if (sortBy === 'date') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('date');
                setSortOrder('desc');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            تاریخ
            {sortBy === 'date' && (
              sortOrder === 'asc' ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />
            )}
          </button>
          <button
            onClick={() => {
              if (sortBy === 'totalPrice') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('totalPrice');
                setSortOrder('desc');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            مبلغ
            {sortBy === 'totalPrice' && (
              sortOrder === 'asc' ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />
            )}
          </button>
        </div>

        {/* لیست سوابق */}
        <div className="space-y-4">
          {sortedHistory?.map((item: HistoryItem) => (
            <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex flex-wrap gap-4 justify-between items-start mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">شماره درخواست: {item._id}</p>
                    <p className="text-sm text-gray-500">تاریخ ثبت: {formatDateToJalali(item.date)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${statusMap[item.status].color}`}>
                    {statusMap[item.status].label}
                  </span>
                </div>

                {item.status === 'pending' ? null : <div className="border-t border-b border-gray-100 py-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">اقلام:</h3>
                  <div className="space-y-2">
                    {item?.items?.map((subItem, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{subItem.name} ({subItem.weight} کیلوگرم)</span>
                        <span>{formatPrice(subItem.price)} تومان</span>
                      </div>
                    ))}
                  </div>
                </div>}

                <div className="flex flex-wrap gap-4 justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <p>آدرس: {item?.location?.address}</p>
                  </div>
                  {item.status === 'pending' ? null :<div className="text-lg font-bold">
                    {formatPrice(item?.totalPrice)} تومان
                  </div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}