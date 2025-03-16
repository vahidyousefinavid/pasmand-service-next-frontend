import AddressesPage from "@/components/views/Requests/requests";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'آدرس های ثبت شده',
  description: ''
}

export default function Addresses() {
  return (
    <AddressesPage />
  );
}