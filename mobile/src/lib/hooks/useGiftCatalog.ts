import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import { GiftCatalogItem } from "@/lib/types";

export function useGiftCatalog() {
  return useQuery<GiftCatalogItem[] | null>({
    queryKey: ["gifts-catalog"],
    queryFn: () => api.get<GiftCatalogItem[]>("/api/gifts/catalog"),
    staleTime: 5 * 60_000,
  });
}
