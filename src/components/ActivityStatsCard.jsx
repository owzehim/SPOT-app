import { useActivityStats } from '../hooks/useActivityStats'

/**
 * Displays this month's activity summary for the logged-in member.
 * Place this between the profile card and the Check-In button in QRTab.
 *
 * Props:
 *   userId  — member.user_id (uuid string from Supabase auth)
 */
export default function ActivityStatsCard({ userId }) {
  const { stats, loading } = useActivityStats(userId)

  const now = new Date()
  const monthLabel = `${now.getMonth() + 1}월`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">📊</span>
        <h3 className="font-semibold text-gray-900 text-sm">
          {monthLabel} 활동 통계
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 bg-gray-100 rounded animate-pulse"
              style={{ width: `${60 + i * 10}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <StatRow
            emoji="💰"
            label="받은 할인"
            value={stats.discountCount}
            unit="회"
          />
          <StatRow
            emoji="⭐"
            label="남긴 리뷰"
            value={stats.reviewCount}
            unit="개"
          />
          <StatRow
            emoji="🔥"
            label="연속 방문"
            value={stats.streakDays}
            unit="일"
            highlight={stats.streakDays >= 3}
          />
        </div>
      )}
    </div>
  )
}

function StatRow({ emoji, label, value, unit, highlight = false }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-600">
        <span>{emoji}</span>
        <span>{label}</span>
      </div>
      <span
        className={
          'font-semibold ' +
          (highlight ? 'text-orange-500' : 'text-gray-900')
        }
      >
        {value} <span className="font-normal text-gray-400">{unit}</span>
      </span>
    </div>
  )
}
