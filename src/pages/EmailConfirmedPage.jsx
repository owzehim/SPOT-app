// src/pages/EmailConfirmedPage.jsx
//
// Landing page for the Supabase email confirmation link.
// Opens in the external browser — intentionally has NO navigation to the app.
// Just confirms the email is verified and tells the user to return to the PWA.

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function EmailConfirmedPage() {
  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Supabase puts the token in the URL hash as #access_token=...&type=signup
    // Calling getSession() triggers Supabase to process the hash automatically.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setErrorMsg(error.message)
        setStatus('error')
        return
      }
      if (data?.session) {
        // Session established = email confirmed successfully.
        // Immediately sign out — we don't want to log them in via the browser.
        // They should log in properly through the PWA.
        supabase.auth.signOut().then(() => setStatus('success'))
      } else {
        // No session means the link was already used or expired.
        setStatus('error')
        setErrorMsg('This link has already been used or has expired.')
      }
    })
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {status === 'verifying' && (
          <>
            <div style={styles.spinner} />
            <p style={styles.message}>Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={styles.icon}>✅</div>
            <h1 style={styles.title}>Email verified!</h1>
            <p style={styles.message}>
              Your email address has been confirmed.
            </p>
            <p style={styles.instruction}>
              You can close this tab and return to the <strong>UvA-IN app</strong> on your home screen to log in.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={styles.icon}>❌</div>
            <h1 style={{ ...styles.title, color: '#b91c1c' }}>Verification failed</h1>
            <p style={styles.message}>{errorMsg || 'Something went wrong.'}</p>
            <p style={styles.instruction}>
              Please return to the app and request a new confirmation email.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06)',
    padding: '48px 32px',
    maxWidth: '380px',
    width: '100%',
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px',
  },
  message: {
    fontSize: '15px',
    color: '#374151',
    margin: '0 0 12px',
    lineHeight: 1.5,
  },
  instruction: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.6,
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '12px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #f97316',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
}
