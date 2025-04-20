'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Banknote, Cross, FileClock, Home, LogOut } from "lucide-react";

export function Navigation() {
    const pathname = usePathname(); // Get the current path

    const isActive = (link:string) => pathname === link; // Check if the link matches the current URL

    return (
        <div className="fixed bottom-3 right-0 left-0 z-[10000]">
            <div className="flex justify-center">
                <div className="flex items-center justify-around p-4 shadow-custom-elevated rounded-[230px] w-[90%] max-w-[450px] bg-secondary/100 backdrop-blur supports-[backdrop-filter]:bg-secondary/100">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`text-background hover:text-secondary-foreground ${
                            isActive("/") ? "bg-white text-black" : ""
                        }`}
                        asChild
                    >
                        <Link href="/">
                            <Home className="h-6 w-6" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        className={`text-background hover:text-secondary-foreground ${
                            isActive("/new-requests") ? "bg-white text-black" : ""
                        }`}
                        size="icon"
                    >
                        <Link href="/new-requests">
                            <Cross className="h-6 w-6" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`text-background hover:text-secondary-foreground ${
                            isActive("/requests") ? "bg-white text-black" : ""
                        }`}
                        asChild
                    >
                        <Link href="/requests">
                            <FileClock className="h-6 w-6" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`text-background hover:text-secondary-foreground ${
                            isActive("/tariff") ? "bg-white text-black" : ""
                        }`}
                        asChild
                    >
                        <Link href="/tariff">
                            <Banknote className="h-6 w-6" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
