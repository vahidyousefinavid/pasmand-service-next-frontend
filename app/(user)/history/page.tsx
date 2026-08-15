import HistoryPage from "@/components/views/History/history";
import NewRequestView from "@/components/views/NewRequest/new-request";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'سوابق و درآمد',
  description: ''
}

export default function History() {
  return (
    <HistoryPage />
  );
}