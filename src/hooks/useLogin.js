// src/hooks/useLogin.js
//
// React orchestration hook for the full login flow.
// ❌ Do NOT copy to React Native — rewrite with RN navigation patterns.
//    But the state machine logic (step: 'credentials' → 'otp' → done)
//    is identical and can be ported directly.

import { useState } from 'react'
import { isOtpExempt, validateOtpInput, mapAuthError } from '../domain/auth/authRules'
import {
  signInWithPassword,
  sendLoginOtp,
  verifyLoginOtp,
  resendConfirmationEmail,
} from '../api/authRepository'

/**
 * Login flow states:
 *  'credentials'      — user enters email + password
 *  'otp'              — user enters the 6-digit code sent to their email
 *  'unconfirmed'      — email not confirmed yet, show resend button
 */

export function useLogin() {
  const [step, setStep] = useState('credentials')   // 'credentials' | 'otp' | 'unconfirmed'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)

  // ── Step 1: submit email + password ────────────────────────────────────────
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Always verify credentials first
      await signInWithPassword(email, password)

      if (isOtpExempt(email)) {
        // Exempt accounts: password auth already set the session → done.
        // App.jsx will pick up the session change via onAuthStateChange.
        return
      }

      // Non-exempt: sign out the temp session, then send OTP.
      // The real session will be established after OTP verification.
      await import('../lib/supabase').then(({ supabase }) =>
        supabase.auth.signOut()
      )
      await sendLoginOtp(email)
      setStep('otp')

    } catch (err) {
      const mapped = mapAuthError(err.message)

      if (mapped === 'EMAIL_NOT_CONFIRMED') {
        setStep('unconfirmed')
      } else {
        setError(mapped)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: submit OTP ─────────────────────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validateOtpInput(otp)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await verifyLoginOtp(email, otp)
      // Session is now set — App.jsx onAuthStateChange handles redirect.
    } catch (err) {
      setError(mapAuthError(err.message))
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP (on OTP screen) ─────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      await sendLoginOtp(email)
      setOtp('')
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 4000)
    } catch (err) {
      setError(mapAuthError(err.message))
    } finally {
      setLoading(false)
    }
  }

  // ── Resend confirmation email (on unconfirmed screen) ─────────────────────
  const handleResendConfirmation = async () => {
    setError('')
    setLoading(true)
    try {
      await resendConfirmationEmail(email)
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 4000)
    } catch (err) {
      setError(mapAuthError(err.message))
    } finally {
      setLoading(false)
    }
  }

  // ── Go back to credentials screen ─────────────────────────────────────────
  const handleBack = () => {
    setStep('credentials')
    setOtp('')
    setError('')
    setResendSuccess(false)
  }

  return {
    // State
    step,
    email, setEmail,
    password, setPassword,
    otp, setOtp,
    loading,
    error,
    resendSuccess,
    // Actions
    handleCredentialsSubmit,
    handleOtpSubmit,
    handleResendOtp,
    handleResendConfirmation,
    handleBack,
  }
}
