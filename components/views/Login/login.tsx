'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, User, ShieldCheck, ArrowRight, Loader2, Lock } from 'lucide-react';
import axios from "axios";
import { API } from '@/services/const';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [verifyCodeStatus, setVerifyCodeStatus] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState<number>();
  const [enteredCode, setEnteredCode] = useState('');
  const [timer, setTimer] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [activeTab, setActiveTab] = useState('user');
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer]);

  function generateFourDigitCode() {
    return Math.floor(1000 + Math.random() * 9000);
  }

  function formatTimer(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);
    setVerifyCodeStatus(false);
    setEnteredCode('');

    if (/^09\d{9}$/.test(value) || value === '') {
      setPhoneError('');
    } else {
      setPhoneError('شماره موبایل معتبر نیست');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (value.length < 6) {
      setPasswordError('رمز عبور باید حداقل ۶ کاراکتر باشد');
    } else {
      setPasswordError('');
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');

    if (value.length <= 4) {
      setEnteredCode(value);
    }

    if (value.length === 4) {
      setCodeError('');
    } else if (value.length > 0) {
      setCodeError('کد تایید باید ۴ رقم باشد');
    } else {
      setCodeError('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = activeTab === 'admin' ? API.SIGN_UP : API.SIGN_UP;

    axios.post(endpoint, {
      phone: `${phone}`,
      password: password
    })
      .then((res: any) => {
        setLoading(false);
        const token = res.data.token;
        Cookies.set('auth_token', token, { expires: 1 });
        login({ id: res.data.user?._id || '1', phone: phone, token });
        toast({
          variant: 'success',
          title: 'موفقیت',
          description: 'با موفقیت وارد شدید',
        });
        router.push(activeTab === 'admin' ? '/admin/dashboard' : '/');
      }).catch((err) => {
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'ناموفق',
          description: err?.response?.data?.message || 'متاسفانه انجام نشد مجدد تلاش کنید',
        });
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">شهروند</h1>
          <p className="text-muted-foreground">سامانه جمع‌آوری هوشمند پسماند</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              ورود به سیستم
            </span>
          </div>
        </div>

        <Tabs defaultValue="user" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              کاربر
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              مدیر
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle>ورود کاربر</CardTitle>
                <CardDescription>
                  برای استفاده از خدمات شهروند وارد شوید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm
                  phone={phone}
                  password={password}
                  loading={loading}
                  verifyCodeStatus={verifyCodeStatus}
                  phoneError={phoneError}
                  passwordError={passwordError}
                  enteredCode={enteredCode}
                  timer={timer}
                  handlePhoneChange={handlePhoneChange}
                  handlePasswordChange={handlePasswordChange}
                  handleCodeChange={handleCodeChange}
                  handleLogin={handleLogin}
                  formatTimer={formatTimer}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>ورود مدیر</CardTitle>
                <CardDescription>
                  پنل مدیریت سیستم جمع‌آوری پسماند
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm
                  phone={phone}
                  password={password}
                  loading={loading}
                  verifyCodeStatus={verifyCodeStatus}
                  phoneError={phoneError}
                  passwordError={passwordError}
                  enteredCode={enteredCode}
                  timer={timer}
                  handlePhoneChange={handlePhoneChange}
                  handlePasswordChange={handlePasswordChange}
                  handleCodeChange={handleCodeChange}
                  handleLogin={handleLogin}
                  formatTimer={formatTimer}
                  isAdmin
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface LoginFormProps {
  phone: string;
  password: string;
  loading: boolean;
  verifyCodeStatus: boolean;
  phoneError: string;
  passwordError: string;
  enteredCode: string;
  timer: number;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLogin: (e: React.FormEvent) => void;
  formatTimer: (seconds: number) => string;
  isAdmin?: boolean;
}

function LoginForm({
  phone,
  password,
  loading,
  verifyCodeStatus,
  phoneError,
  passwordError,
  enteredCode,
  timer,
  handlePhoneChange,
  handlePasswordChange,
  handleCodeChange,
  handleLogin,
  formatTimer,
  isAdmin
}: LoginFormProps) {
  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      <div className="space-y-2">
        <Label htmlFor="phone">شماره همراه</Label>
        <div className="relative">
          <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            placeholder={`${isAdmin ? 'شماره همراه مدیر' : 'شماره همراه'} را وارد کنید`}
            type="tel"
            value={phone}
            disabled={loading || verifyCodeStatus}
            onChange={handlePhoneChange}
            className="pr-10"
            required
          />
        </div>
        {phoneError && (
          <p className="text-destructive text-sm">{phoneError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">رمز عبور</Label>
        <div className="relative">
          <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            placeholder="رمز عبور خود را وارد کنید"
            type="password"
            value={password}
            disabled={loading}
            onChange={handlePasswordChange}
            className="pr-10"
            required
          />
        </div>
        {passwordError && (
          <p className="text-destructive text-sm">{passwordError}</p>
        )}
      </div>

      {verifyCodeStatus && (
        <div className="space-y-2">
          <Label htmlFor="code">کد تایید</Label>
          <Input
            id="code"
            placeholder="کد ۴ رقمی را وارد کنید"
            type="number"
            maxLength={4}
            value={enteredCode}
            disabled={loading}
            onChange={handleCodeChange}
            className="pr-10"
            required
          />
          {timer > 0 && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              {formatTimer(timer)} تا ارسال مجدد کد
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || phone.length !== 11 || password.length < 6 || !!phoneError || !!passwordError}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            ورود
            <ArrowRight className="mr-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}