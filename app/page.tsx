import { redirect } from "next/navigation";

// Entry point. Becomes auth-aware in step 3 (signed in -> /today, new visitor -> /welcome).
export default function Home() {
  redirect("/welcome");
}
