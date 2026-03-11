import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return new Response(
        JSON.stringify({ error: "Token and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token exists and is active
    const { data: shareLink, error: linkError } = await supabase
      .from("initiative_share_links")
      .select("id, initiative_id, is_active")
      .eq("token", token)
      .single();

    if (linkError || !shareLink) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired share link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!shareLink.is_active) {
      return new Response(
        JSON.stringify({ error: "This share link has been deactivated" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email is in allowed viewers
    const normalizedEmail = email.toLowerCase().trim();
    const { data: viewer, error: viewerError } = await supabase
      .from("initiative_share_viewers")
      .select("id")
      .eq("share_link_id", shareLink.id)
      .ilike("email", normalizedEmail)
      .single();

    if (viewerError || !viewer) {
      return new Response(
        JSON.stringify({ error: "You are not authorized to view this initiative" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch initiative details
    const { data: initiative, error: initError } = await supabase
      .from("initiatives")
      .select(`
        id, title, description, status, start_date, end_date, created_at,
        owner:users_profile!initiatives_owner_id_fkey(id, name)
      `)
      .eq("id", shareLink.initiative_id)
      .single();

    if (initError || !initiative) {
      return new Response(
        JSON.stringify({ error: "Initiative not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch tasks and subtasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select(`
        id, title, status, start_date, due_date, parent_task_id, color,
        assignee:users_profile!tasks_assignee_user_id_fkey(id, name),
        assignee_team:teams!tasks_assignee_team_id_fkey(id, name)
      `)
      .eq("initiative_id", shareLink.initiative_id)
      .order("created_at", { ascending: true });

    // Fetch linked KRs
    const { data: krLinks } = await supabase
      .from("initiative_kr_links")
      .select(`
        id, weight,
        key_result:key_results(
          id, title, description,
          owner:users_profile!key_results_owner_id_fkey(id, name)
        )
      `)
      .eq("initiative_id", shareLink.initiative_id);

    // Fetch KR metric configs and latest values for linked KRs
    const krIds = (krLinks || []).map((l: any) => l.key_result?.id).filter(Boolean);
    let metricsData: any[] = [];
    if (krIds.length > 0) {
      const { data: metrics } = await supabase
        .from("kr_metric_config")
        .select(`
          id, key_result_id, metric_name, unit, direction,
          start_value, target_value, start_date, end_date
        `)
        .in("key_result_id", krIds);

      if (metrics && metrics.length > 0) {
        const configIds = metrics.map((m: any) => m.id);
        const { data: values } = await supabase
          .from("kr_metric_values")
          .select("kr_metric_config_id, value, date")
          .in("kr_metric_config_id", configIds)
          .order("date", { ascending: false });

        metricsData = metrics.map((m: any) => ({
          ...m,
          latest_value: values?.find((v: any) => v.kr_metric_config_id === m.id) || null,
        }));
      }
    }

    // Fetch updates/comments
    const { data: updates } = await supabase
      .from("updates")
      .select(`
        id, content, update_kind, pinned, created_at,
        user:users_profile!updates_user_id_fkey(id, name, avatar_url)
      `)
      .eq("entity_type", "initiative")
      .eq("entity_id", shareLink.initiative_id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    return new Response(
      JSON.stringify({
        initiative,
        tasks: tasks || [],
        krLinks: (krLinks || []).map((l: any) => ({
          ...l,
          metrics: metricsData.filter((m: any) => m.key_result_id === l.key_result?.id),
        })),
        updates: updates || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
