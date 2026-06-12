import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRecentVisits(userId, limit = 3) {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const fetchVisits = async () => {
      setLoading(true)

      // 1) 최근 redemptions 불러오기 (store_id + redeemed_at)
      const { data: redemptions, error: redemptionsError } = await supabase
        .from('redemptions')
        .select('store_id, redeemed_at')
        .eq('user_id', userId)
        .order('redeemed_at', { ascending: false })
        .limit(limit)

      if (redemptionsError || !redemptions) {
        console.error('recent visits: redemptions error', redemptionsError)
        if (!cancelled) {
          setVisits([])
          setLoading(false)
        }
        return
      }

      // 2) 관련 매장 이름들 불러오기
      const storeIds = [
        ...new Set(
          redemptions.map((r) => r.store_id).filter((id) => id != null)
        ),
      ]

      let namesById = {}
      if (storeIds.length > 0) {
        const { data: stores, error: storesError } = await supabase
          .from('partnerships')
          .select('id, name')
          .in('id', storeIds)

        if (storesError) {
          console.error('recent visits: partnerships error', storesError)
        } else if (stores) {
          namesById = Object.fromEntries(
            stores.map((s) => [s.id, s.name]),
          )
        }
      }

      if (!cancelled) {
        setVisits(
          redemptions.map((r) => ({
            placeName: namesById[r.store_id] || '알 수 없는 매장',
            redeemedAt: r.redeemed_at,
          })),
        )
        setLoading(false)
      }
    }

    fetchVisits()

    return () => {
      cancelled = true
    }
  }, [userId, limit])

  return { visits, loading }
}