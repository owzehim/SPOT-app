// src/hooks/useRegisterMember.js
//
// React-specific orchestration hook.
// ❌ Do NOT copy to React Native — rewrite with RN patterns.
//    But the logic flow (validate → register → navigate) is the same.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  // Generic field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset year when education level changes
  const handleEducationLevelChange = (e) => {
    const level = e.target.value;
    setFormData(prev => ({ ...prev, educationLevel: level, yearNumber: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 1. Client-side validation (domain layer)
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const validationError = validateRegistrationForm({
      firstName:      formData.firstName,
      lastName:       formData.lastName,
      email:          formData.email,
      studentNumber:  formData.studentNumber,
      gender:         formData.gender,
      countryOfOrigin: formData.countryOfOrigin,
      educationLevel: formData.educationLevel,
      yearNumber:     formData.yearNumber || null,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    // 2. Call API layer
    setLoading(true);
    try {
      await registerMember({
        email:          formData.email,
        password:       formData.password,
        firstName:      formData.firstName,
        lastName:       formData.lastName,
        studentNumber:  formData.studentNumber,
        yearOfBirth:    formData.yearOfBirth ? Number(formData.yearOfBirth) : null,
        gender:         formData.gender,
        countryOfOrigin: formData.countryOfOrigin,
        university:     formData.university,
        major:          formData.major,
        educationLevel: formData.educationLevel,
        yearNumber:     formData.yearNumber ? Number(formData.yearNumber) : null,
      });

      setSuccess(true);
      setFormData(INITIAL_FORM);

      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);

    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    error,
    success,
    handleChange,
    handleEducationLevelChange,
    handleSubmit,
  };
}
