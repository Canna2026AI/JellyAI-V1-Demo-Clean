import { redirect } from "next/navigation";
import { getCustomerWebUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default function TenantAppRedirectPage() {
  redirect(getCustomerWebUrl("/?module=conversations"));
}
