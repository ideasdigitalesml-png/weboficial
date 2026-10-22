import { redirect } from "next/navigation";

// There's only ever one plan -- "Actualizar plan" (the button that used to
// link here) was removed from /dashboard/suscripcion since there's nothing
// to switch between. Kept as a redirect, not deleted, in case anything
// external still links to this path.
export default function PlanPage() {
  redirect("/dashboard/suscripcion");
}
