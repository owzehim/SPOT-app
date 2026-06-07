// src/hooks/useRegisterMember.js
//
// React-specific orchestration hook.
// ❌ Do NOT copy to React Native — rewrite with RN patterns.
// But the logic flow (validate → register → confirm OTP → navigate) is the same.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateRegistrationForm } from '../domain/member/memberRegistration';
import { registerMember } from '../api/memberRepository';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  studentNumber: '',
  yearOfBirth: '',
  gender: '',
  countryOfOrigin: '',
  university: 'University of Amsterdam',
  major: 'Business Administration',
  educationLevel: '',
  yearNumber: '',
};

export function useRegisterMember() {
  const navigate = useNavigate();

  const [step, setStep] = useState('form');        // 'form' | 'confirm'
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  // ── Generic field change ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Reset year when education level changes ────────────────────────────────
  const handleEducationLevelChange = (e) => {
    const level = e.target.value;
    setFormData(prev => ({ ...prev, educationLevel: level, yearNumber: '' }));
  };

  // ── Step 1: submit registration form ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const validationError = validateRegistrationForm({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      studentNumber: formData.studentNumber,
      gender: formData.gender,
      countryOfOrigin: formData.countryOfOrigin,
      educationLevel: formData.educationLevel,
      yearNumber: formData.yearNumber || null,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await registerMember({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentNumber: formData.studentNumber,
        yearOfBirth: formData.yearOfBirth ? Number(formData.yearOfBirth) : null,
        gender: formData.gender,
        countryOfOrigin: formData.countryOfOrigin,
        university: formData.university,
        major: formData.major,
        educationLevel: formData.educationLevel,
        yearNumber: formData.yearNumber ? Number(formData.yearNumber) : null,
      });
      // Account created — now ask for the 6-digit confirmation code
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify the 6-digit signup OTP ─────────────────────────────────
  const handleConfirmOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: 'signup',   // ← must be 'signup' for registration confirmation
      });
      if (verifyError) throw verifyError;
      // Email confirmed — go to login
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend confirmation code ───────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });
      if (resendError) throw resendError;
      setOtp('');
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Go back to the form ────────────────────────────────────────────────────
  const handleBack = () => {
    setStep('form');
    setOtp('');
    setError('');
    setResendSuccess(false);
  };

  return {
    // State
    step,
    formData,
    otp,
    setOtp,
    loading,
    error,
    resendSuccess,
    // Actions
    handleChange,
    handleEducationLevelChange,
    handleSubmit,
    handleConfirmOtp,
    handleResendOtp,
    handleBack,
  };
}
