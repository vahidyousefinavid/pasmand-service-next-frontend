import LoginPage from "@/components/views/Login/login";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'ورود جمع‌آور',
  description: ''
}

export default function Login() {
  return (
    <LoginPage />
  );
}