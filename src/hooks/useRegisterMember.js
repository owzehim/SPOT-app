// src/hooks/useRegisterMember.js
//
// React-specific orchestration hook.
// ❌ Do NOT copy to React Native — rewrite with RN patterns.
// But the logic flow (validate → register → show "check email") is the same.

import { useState } from 'react';
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
  // Defaults match the UI options
  university: 'University of Amsterdam (UvA)',
  major: 'Business Administration',
  educationLevel: '',
  yearNumber: '',
};

export function useRegisterMember() {
  // 'about' | 'academic' | 'account' | 'email'
  const [step, setStep] = useState('about');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Generic field change ────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Reset year when education level changes ─────────────────────────────
  const handleEducationLevelChange = (e) => {
    const level = e.target.value;
    setFormData((prev) => ({
      ...prev,
      educationLevel: level,
      yearNumber: '',
    }));
  };

  // ── Step navigation ─────────────────────────────────────────────────────
  const goNext = () => {
    setStep((prev) => {
      if (prev === 'about') return 'academic';
      if (prev === 'academic') return 'account';
      return prev;
    });
  };

  const goBack = () => {
    setStep((prev) => {
      if (prev === 'account') return 'academic';
      if (prev === 'academic') return 'about';
      return prev;
    });
  };

  // ── Final submit (after step 3) ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side password checks
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
        yearOfBirth: formData.yearOfBirth
          ? Number(formData.yearOfBirth)
          : null,
        gender: formData.gender,
        countryOfOrigin: formData.countryOfOrigin,
        university: formData.university,
        major: formData.major,
        educationLevel: formData.educationLevel,
        yearNumber: formData.yearNumber
          ? Number(formData.yearNumber)
          : null,
      });

      // Account created — now tell user to check their email.
      setStep('email');
    } catch (err) {
      setError(
        err.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    formData,
    loading,
    error,
    handleChange,
    handleEducationLevelChange,
    handleSubmit,
    goNext,
    goBack,
  };
}