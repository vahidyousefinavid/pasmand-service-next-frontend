"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosService } from "@/lib/axiosService";
import { API } from "@/services/const";
import Cookies from "js-cookie";

export type IUser = {
  created_at: string;
  display_name: string | null;
  email: string;
  id: string;
  image_url: string | null;
  provider: string;
  quest_counts: number;
  enable_custom_quest: boolean;
  notification: boolean;
  strike: {
    count: number;
    user_id: string;
  } | null;
  challenger: {
    reviewer_id: string;
  } | null;
} | null;

export default function useUser() {
  return useQuery<IUser>({
    queryKey: ["user"],
    queryFn: async () => {
      const token = Cookies.get("auth_token");

      const res = await axiosService<{ user: IUser }>({
        url: API.GET_PROFILE,
        method: "get",
        token: token,
      });

      return res.data?.user || null;
    },
  });
}
