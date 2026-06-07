import { useNavigate } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { useLogin } from '../hooks/useLogin'

export default function LoginPage() {
  const navigate = useNavigate()
  const {
    step,
    email, setEmail,
    password, setPassword,
    otp, setOtp,
    loading,
    error,
    resendSuccess,
    handleCredentialsSubmit,
    handleOtpSubmit,
    handleResendOtp,
    handleResendConfirmation,
    handleBack,
  } = useLogin()

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center px-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">

        {/* Close button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate('/public')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/uvain logo.png" alt="UvA-IN Logo" className="w-24 h-24" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">UvA-IN</h1>
          <p className="text-gray-500 text-sm mt-1">University of Amsterdam 한국인 학생회</p>
        </div>

        {/* ── STEP 1: Email + Password ── */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="student@student.uva.nl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '확인 중...' : '로그인'}
            </button>

            {/* Register link */}
            <p className="text-center text-xs text-gray-400 pt-1">
              계정이 없으신가요?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-orange-500 font-medium hover:underline"
              >
                회원가입
              </button>
            </p>
          </form>
        )}

        {/* ── STEP 2: OTP verification ── */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{email}</span>로<br />
                6자리 인증 코드를 전송했습니다.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">인증 코드</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="000000"
                autoFocus
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {resendSuccess && (
              <p className="text-green-600 text-sm text-center">새 코드를 전송했습니다 ✓</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '확인 중...' : '인증 확인'}
            </button>

            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <button type="button" onClick={handleBack} className="hover:text-gray-600">
                ← 뒤로
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-orange-500 hover:underline disabled:opacity-50"
              >
                코드 재전송
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Email not confirmed ── */}
        {step === 'unconfirmed' && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">📧</div>
            <p className="text-sm font-medium text-gray-900">이메일 인증이 필요합니다</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-medium">{email}</span>으로 전송된<br />
              인증 링크를 클릭한 후 다시 로그인해 주세요.
            </p>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {resendSuccess && (
              <p className="text-green-600 text-sm">인증 이메일을 재전송했습니다 ✓</p>
            )}

            <button
              onClick={handleResendConfirmation}
              disabled={loading}
              className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '전송 중...' : '인증 이메일 재전송'}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full text-xs text-gray-400 hover:text-gray-600 pt-1"
            >
              ← 뒤로
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
