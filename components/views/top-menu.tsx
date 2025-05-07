'use client';

import { CircleUser, MenuIcon, LogIn } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "../ui/button";
import InstallButton from "./InstallButton";

export function TopMenu() {
    const [open, setOpen] = useState(false);
    const { isAuthenticated } = useAuth();

    const menuItems = [
        {
            title: 'صفحه اصلی',
            href: '/'
        },
        {
            title: 'درخواست های جدید',
            href: '/new-requests'
        },
        {
            title: 'درخواست های من',
            href: '/requests'
        },
        {
            title: 'تعرفه قیمت‌ها',
            href: '/tariff'
        },
        {
            title: 'راهنما',
            href: '/guide'
        },
    ];

    return (
        <div className="fixed shadow-custom-elevated rounded-b-[20px] top-0 right-0 left-0 py-2 z-[10000] bg-secondary/100 backdrop-blur supports-[backdrop-filter]:bg-secondary/100">
            <div className="flex items-center justify-between p-4 text-xl text-white">
                <div className="flex gap-4">
                    <div className="flex md:hidden">
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger>
                                <MenuIcon />
                            </SheetTrigger>
                            <SheetContent side={'right'} className="pt-24 flex flex-col z-[10000]">
                                <div className="flex flex-col gap-12">
                                    {
                                        menuItems?.map((item, index) => (
                                            <Link key={index} href={item?.href} className="font-bold text-xl">
                                                {item?.title}
                                            </Link>
                                        ))
                                    }
                                    <InstallButton />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                    <h1 className="text-xl text-white font-bold">برنامه خدمات شهر</h1>
                </div>
                <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                        <Link href="/profile">
                            <CircleUser className="cursor-pointer w-7 h-7" />
                        </Link>
                    ) : (
                        <Link href="/login">
                            <Button variant="ghost" className="text-white gap-2">
                                <LogIn className="w-5 h-5" />
                                ورود / ثبت نام
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}