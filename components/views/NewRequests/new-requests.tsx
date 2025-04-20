"use client"
import React, { useEffect, useState } from 'react';
import { MapPin, Eye, Plus, X, Trash, Scale, Recycle, Filter } from 'lucide-react';
import { axiosService } from '@/lib/axiosService';
import { toast } from '@/hooks/use-toast';
import { API } from '@/services/const';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';

const MapWithNoSSR = dynamic(() => import('@/components/views/NewRequest/steps/map-component'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      در حال بارگذاری نقشه...
    </div>
  ),
});

interface TimeSlot {
  date: string;
  time: string;
  _id: string;
}

interface Location {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Material {
  _id: string;
  title: string;
  type: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
}

interface Request {
  _id: string;
  description: string;
  status: 'pending' | 'collecting' | 'completed' | 'canceled';
  location: Location;
  items: Material[];
  date: string;
  timeSlot: TimeSlot;
  totalPrice: number;
  user: User;
  collector?: User;
}

interface RequestBody {
  userId?: string;
  status?: string;
}

const units = [
  {
    title: 'گرم',
    key: 'g'
  },
  {
    title: 'کیلوگرم',
    key: 'kg'
  },
  {
    title: 'تن',
    key: 'ton'
  }
];

const statusOptions = [
  // { value: '', label: 'همه' },
  { value: 'pending', label: 'در انتظار' },
  // { value: 'collecting', label: 'در حال جمع‌آوری' },
  // { value: 'completed', label: 'تکمیل شده' },
  // { value: 'canceled', label: 'لغو شده' }
];

function NewRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [doLoading, setDoLoading] = useState<boolean>(false);
  const [newMaterial, setNewMaterial] = useState<any>({});
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [materialTypes, setMaterialTypes] = useState<Material[]>([]);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const defaultCenter = { lat: 35.6892, lng: 51.3890 }; // تهران

  const getData = () => {
    setLoading(true);
    axiosService({
      url: API.GET_MATERIAL,
      method: 'get',
    })
      .then((res: any) => {
        setMaterialTypes(res?.data);
        setLoading(false);
      })
      .catch((err) => {
        toast({
          variant: 'destructive',
          title: 'ناموفق',
          description: 'متاسفانه انجام نشد صفحه را دوباره بارگزاری کنید',
        });
        setLoading(false);
      });
  };

  const getRequests = () => {
    setLoading(true);
    const requestBody: RequestBody = {
      userId: user?.id
    };

    if (selectedStatus) {
      requestBody.status = 'pending';
    }

    axiosService({
      url: API.GET_PENDING_REQUESTS,
      method: 'post',
      body: requestBody
    })
      .then((res: any) => {
        setRequests(res?.data?.results || []);
        setLoading(false);
      })
      .catch((err) => {
        toast({
          variant: 'destructive',
          title: 'ناموفق',
          description: 'متاسفانه دریافت درخواست‌ها با خطا مواجه شد',
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      getRequests();
    }
  }, [selectedStatus, user]);

  const handleAddMaterial = () => {
    setError('');
    if (!newMaterial._id) {
      setError('لطفاً نوع ماده را انتخاب کنید');
      return;
    }
    if (newMaterial.quantity <= 0) {
      setError('مقدار باید بیشتر از صفر باشد');
      return;
    }

    const selectedMaterialType = materialTypes.find(m => m._id === newMaterial._id);
    if (selectedMaterialType) {
      const material: Material = {
        ...selectedMaterialType,
        quantity: newMaterial.quantity
      };
      setMaterials([...materials, material]);
      setNewMaterial({ _id: '', quantity: 0 });
    }
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter(m => m._id !== id));
  };

  const formatUnit = (unit: string) => {
    return units.find((item) => item?.key === unit)?.title;
  };

  const calculateItemPrice = (material: Material) => {
    return material.quantity * material.pricePerUnit;
  };

  const calculateTotalPrice = () => {
    return materials.reduce((total, material) => total + calculateItemPrice(material), 0);
  };

  const handleSaveRequest = () => {
    if (selectedRequest) {
      // اینجا باید API مربوط به آپدیت درخواست اضافه شود
      axiosService({
        url: API.UPDATE_ITEMS_REQUESTS,
        method: 'put',
        body: {
          requestId: selectedRequest?._id,
          items: materials
        }
      })
        .then((res: any) => {
          setIsDetailsModalOpen(false);
          setMaterials([]);
          setError('');
          getRequests();
        })
        .catch((err) => {
          toast({
            variant: 'destructive',
            title: 'ناموفق',
            description: 'متاسفانه دریافت درخواست‌ها با خطا مواجه شد',
          });
          setLoading(false);
        });
    }
  };

  const collect = (requestId: any) => {
    setDoLoading(true)
    axiosService({
      url: API.UPDATE_REQUESTS,
      method: 'put',
      body: {
        id: requestId,
        collector: user?.id
      }
    })
      .then((res: any) => {
        setLoading(false)
        toast({
          variant: 'success',
          title: 'موفق',
          description: 'با موفقیت انجام شد',
        });
        getRequests();
      })
      .catch((err) => {
        setLoading(false)
        toast({
          variant: 'destructive',
          title: 'ناموفق',
          description: 'متاسفانه دریافت درخواست‌ها با خطا مواجه شد',
        });
        setLoading(false);
      });
    // بروزرسانی لیست درخواست‌ها
  }

  const getStatusColor = (status: Request['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'collecting':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'canceled':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusText = (status: Request['status']) => {
    return statusOptions.find(option => option.value === status)?.label || status;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-[120px] sm:py-[120px] px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Recycle className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              لیست درخواست‌های جدید
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border-0 focus:ring-0 text-sm"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500">هیچ درخواستی یافت نشد</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {requests.map((request) => (
              <div
                key={request._id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-3 w-full sm:w-auto">
                    <h3 className="text-xl font-semibold text-gray-900">درخواست بازیافت</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">تاریخ ثبت:</span>
                      <span className="text-gray-700">{new Date(request.date).toLocaleDateString('fa-IR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">زمان جمع‌آوری:</span>
                      <span className="text-gray-700">{request.timeSlot.date} - {request.timeSlot.time}</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                    <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{request.location.title || 'آدرس'}</span>
                        <span className="text-sm text-gray-600">{request.location.address || 'جزئیات آدرس موجود نیست'}</span>
                      </div>
                    </div>
                    {request.collector && (
                      <div className="bg-blue-50 p-3 rounded-xl">
                        <p className="text-sm font-medium text-blue-800">جمع‌آوری کننده:</p>
                        <p className="text-sm text-blue-700">
                          {request.collector.first_name} {request.collector.last_name} - {request.collector.phone}
                        </p>
                      </div>
                    )}
                    {request.description && (
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-sm text-gray-600">{request.description}</p>
                      </div>
                    )}
                    {!request.collector && (
                      <div className="w-full">
                        <Button
                          onClick={() => {
                            collect(request._id)
                          }}
                          className='bg-secondary' size='sm'>انجام می دهم</Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    {/* <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setMaterials(request.items);
                        setIsDetailsModalOpen(true);
                      }}
                      className="flex-1 sm:flex-none p-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl transition-all duration-200 group flex items-center justify-center gap-2"
                      title="جزئیات و جمع‌آوری"
                    >
                      <span className="sm:hidden">جزئیات</span>
                      <Eye className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    </button> */}
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsAddressModalOpen(true);
                      }}
                      className="flex-1 sm:flex-none p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-200 group flex items-center justify-center gap-2"
                      title="نمایش آدرس"
                    >
                      <span className="sm:hidden">آدرس</span>
                      <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Address Modal */}
        {isAddressModalOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm modal-overlay flex items-center justify-center p-4 z-[1000000]">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl transform transition-all duration-300">
              <div className="p-6">
                <div className="flex flex-row-reverse justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">آدرس محل جمع‌آوری</h2>
                  <button
                    onClick={() => setIsAddressModalOpen(false)}
                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl">
                    <h3 className="font-semibold text-lg text-blue-900 mb-3">{selectedRequest.location.title || 'آدرس'}</h3>
                    <p className="text-blue-800 leading-relaxed">{selectedRequest.location.address || 'جزئیات آدرس موجود نیست'}</p>
                  </div>
                </div>
                <div className="relative h-[350px] rounded-lg mb-6 overflow-hidden border-2 border-gray-200 mt-4">
                  <MapWithNoSSR
                    center={defaultCenter}
                    onLocationSelect={() => { }}
                    selectedLocation={selectedRequest.location}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {isDetailsModalOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm modal-overlay flex items-center justify-center p-4 z-[1000000]">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex flex-row-reverse justify-between items-center mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold">جزئیات درخواست</h2>
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setError('');
                    }}
                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <Scale className="w-5 h-5" />
                      افزودن مواد بازیافتی
                    </h3>

                    {error && (
                      <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                        {error}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <select
                        value={newMaterial._id}
                        onChange={(e) => {
                          const selectedType = materialTypes.find(type => type._id === e.target.value);
                          setNewMaterial({ ...newMaterial, ...selectedType });
                        }}
                        className="flex-1 py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200"
                      >
                        <option value="">انتخاب نوع ماده</option>
                        {materialTypes.map((type) => (
                          <option key={type._id} value={type._id}>
                            {type.title}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3 items-center">
                        <input
                          type="number"
                          value={newMaterial.quantity || ''}
                          onChange={(e) => setNewMaterial({ ...newMaterial, quantity: Number(e.target.value) })}
                          placeholder="مقدار"
                          className="w-full sm:w-32 py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 text-left"
                          min="0"
                        />
                        <span className="text-gray-500 whitespace-nowrap">{formatUnit(newMaterial.unit)}</span>
                      </div>
                      <button
                        onClick={handleAddMaterial}
                        className="w-full sm:w-auto px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow"
                      >
                        <Plus className="w-5 h-5" />
                        افزودن
                      </button>
                    </div>

                    <div className="space-y-3">
                      {materials.map((material) => (
                        <div
                          key={material._id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-all duration-200 gap-4"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                            <span className="font-medium text-gray-900">{material.title}</span>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                              <span className="text-gray-600 bg-white px-3 py-1.5 rounded-full text-sm border border-gray-200">
                                {formatNumber(material.quantity)} {formatUnit(material.unit)}
                              </span>
                              <span className="text-gray-600 bg-white px-3 py-1.5 rounded-full text-sm border border-gray-200">
                                {formatNumber(material.pricePerUnit)} تومان / {formatUnit(material.unit)}
                              </span>
                              <span className="text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm border border-green-200">
                                {formatNumber(calculateItemPrice(material))} تومان
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveMaterial(material._id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all duration-200 sm:flex-shrink-0"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {materials.length === 0 && (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                          هنوز موردی اضافه نشده است
                        </div>
                      )}

                      {materials.length > 0 && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">جمع کل:</span>
                            <span className="font-bold text-lg">
                              {formatNumber(calculateTotalPrice())} تومان
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-start gap-4 pt-6 border-t">
                    <button
                      onClick={handleSaveRequest}
                      // disabled={materials.length === 0}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow flex items-center justify-center gap-2"
                    >
                      ثبت درخواست
                    </button>
                    <button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        setError('');
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewRequestsPage;