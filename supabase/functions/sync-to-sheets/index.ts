import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth ──────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, message: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Parse body ────────────────────────────────────────────
    const { redemption_id, store_id, rating, tags, comment } = await req.json()

    if (!redemption_id || !store_id || !rating || !tags) {
      return new Response(
        JSON.stringify({ success: false, message: '필수 항목이 누락되었습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Supabase admin client ─────────────────────────────────
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!serviceKey) {
      return new Response(
        JSON.stringify({ success: false, message: '서버 설정 오류입니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    // ── Verify user ───────────────────────────────────────────
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, message: '로그인이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Fetch partnership URLs from Supabase ──────────────────
    const { data: partnership, error: partnershipError } = await admin
      .from('partnerships')
      .select('name, sheet_name, master_apps_script_url, partner_apps_script_url')
      .eq('id', store_id)
      .single()

    if (partnershipError || !partnership) {
      console.error('Partnership lookup failed:', partnershipError)
      return new Response(
        JSON.stringify({ success: false, message: '매장 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Build review payload for both sheets ──────────────────
    // tags is a raw array e.g. ['GREAT_FOOD', 'GOOD_VALUE']
    const tagsArray: string[] = Array.isArray(tags) ? tags : []

    const reviewPayload = {
      type:           'review',
      sheet_name:     partnership.sheet_name || partnership.name,
      redemption_id:  String(redemption_id),
      rating:         rating,
      tags:           tagsArray,   // Apps Script reads tags.includes('GREAT_FOOD') etc.
      comment:        comment || '',
    }

    // ── POST to both Apps Scripts ─────────────────────────────
    const [masterRes, storeRes] = await Promise.all([
      fetch(partnership.master_apps_script_url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(reviewPayload),
      }),
      fetch(partnership.partner_apps_script_url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(reviewPayload),
      }),
    ])

    if (!masterRes.ok || !storeRes.ok) {
      const masterText = await masterRes.text()
      const storeText  = await storeRes.text()
      console.error('Sheet sync failed — master:', masterText, '| store:', storeText)
      // Non-fatal: review is already saved in Supabase
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    console.error('sync-to-sheets fatal error:', err)
    return new Response(
      JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
