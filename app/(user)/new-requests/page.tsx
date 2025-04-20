import NewRequestsPage from "@/components/views/NewRequests/new-requests";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'درخواست های جدید',
  description: ''
}

export default function NewRequests() {
  return (
    <NewRequestsPage/>
  );
}