import { apiFetch } from "@/common/api/apiClient";
import {
  FinanceEntity,
  FinancePatchEntity,
  FinanceStatusPatchEntity,
} from "./entity";

export async function getAllFinances(): Promise<FinanceEntity[]> {
  return apiFetch<FinanceEntity[]>("/finances", { method: "GET" });
}

export async function getFinance(id: string): Promise<FinanceEntity> {
  return apiFetch<FinanceEntity>(`/finances/${id}`, { method: "GET" });
}

export async function createFinance(data: FormData): Promise<FinanceEntity> {
  return apiFetch<FinanceEntity>("/finances", {
    method: "POST",
    body: data,
  });
}

export async function updateFinanceStatus(
  id: string,
  data: FinanceStatusPatchEntity,
): Promise<FinanceEntity> {
  return apiFetch<FinanceEntity>(`/finances/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function patchFinance(
  id: string,
  data: FinancePatchEntity,
): Promise<FinanceEntity> {
  return apiFetch<FinanceEntity>(`/finances/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
