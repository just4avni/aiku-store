import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";
export const dynamic = "force-dynamic";
export default async function AdminPage(){const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=/admin");const {data:admin}=await supabase.from("admin_roles").select("role").eq("user_id",user.id).maybeSingle();if(!admin)redirect("/");return <AdminClient userEmail={user.email??"Admin"} role={admin.role}/>}
