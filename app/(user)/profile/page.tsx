import ProfilePage from "@/components/views/Profile/profile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'پروفایل',
  description: ''
}

export default function Profile() {
  return (
    <ProfilePage />
  );
}