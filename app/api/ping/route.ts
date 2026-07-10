import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const t0 = Date.now();
  const { error } = await supabase.from("profiles").select("id").limit(1);
  const ms = Date.now() - t0;

  return NextResponse.json({
    ok: !error,
    supabase_ms: ms,
    error: error?.message ?? null,
    region: process.env.VERCEL_REGION ?? "local",
    ts: new Date().toISOString(),
  });
}
