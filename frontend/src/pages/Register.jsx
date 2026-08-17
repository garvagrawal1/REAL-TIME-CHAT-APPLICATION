import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import {
  Sparkles,
  User,
  AtSign,
  Mail,
  Lock,
  UserPlus,
  KeyRound,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Step 1: User details, Step 2: Email OTP verification
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [devOtpNotice, setDevOtpNotice] = useState(null);

  // Resend OTP countdown
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Compute password strength score (0 to 4)
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabels = ['Too Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = [
    'bg-slate-700',
    'bg-rose-500',
    'bg-amber-500',
    'bg-indigo-500',
    'bg-emerald-500',
  ];

  // Step 1 Submit: Validate & Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (!name || !username || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await authService.sendOtp(email.trim().toLowerCase(), name.trim(), 'register');
      if (data.success) {
        setStep(2);
        setResendCooldown(60);
        setSuccessMessage(`A 6-digit verification code was sent to ${email}`);
        if (data.devOtp) {
          setDevOtpNotice(`DEV MODE CODE: ${data.devOtp}`);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to send verification code. Please check your email.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await authService.sendOtp(email.trim().toLowerCase(), name.trim(), 'register');
      if (data.success) {
        setResendCooldown(60);
        setSuccessMessage(`New verification code sent to ${email}`);
        if (data.devOtp) {
          setDevOtpNotice(`DEV MODE CODE: ${data.devOtp}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Submit: Verify OTP & Complete Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await register({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        otp: otp.trim(),
      });

      if (data.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Verification failed. Please check the OTP and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-white to-purple-300 bg-clip-text text-transparent">
            ChatFlow AI
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
          {step === 1 ? 'Create your account' : 'Verify your email'}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {step === 1
            ? 'Join the real-time AI messaging platform'
            : `Enter the 6-digit code sent to ${email}`}
        </p>
      </div>

      {/* Auth Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800/80 shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {devOtpNotice && (
            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-[11px] text-indigo-300 font-mono text-center">
              {devOtpNotice}
            </div>
          )}

          {step === 1 ? (
            /* Step 1 Form */
            <form onSubmit={handleRequestOtp} className="space-y-3.5">
              <Input
                label="Full Name"
                id="register-name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={User}
                required
                autoFocus
              />

              <Input
                label="Username"
                id="register-username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                icon={AtSign}
                required
              />

              <Input
                label="Email Address"
                id="register-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                required
              />

              <div>
                <Input
                  label="Password"
                  id="register-password"
                  isPassword={true}
                  placeholder="Enter a strong password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={Lock}
                  required
                />

                {/* Password strength bar */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthColors[strength]} transition-all duration-300`}
                        style={{ width: `${(strength / 4) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Strength: {strengthLabels[strength]}</span>
                      <span>Min 6 characters</span>
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                id="register-confirm"
                isPassword={true}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={Lock}
                required
              />

              <Button
                type="submit"
                variant="ai"
                size="lg"
                isLoading={isLoading}
                className="w-full !mt-4"
                icon={Mail}
              >
                Send Verification OTP
              </Button>
            </form>
          ) : (
            /* Step 2 Form: OTP Verification */
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-300">
                  Please check your inbox at <span className="text-indigo-300 font-bold">{email}</span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="register-otp"
                  className="block text-xs font-medium text-slate-300 mb-1 text-center"
                >
                  6-Digit OTP Code
                </label>
                <input
                  id="register-otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="------"
                  autoFocus
                  className="w-full text-center tracking-[12px] text-2xl font-mono py-3 px-4 rounded-xl bg-slate-950 border border-indigo-500/40 text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="ai"
                size="lg"
                isLoading={isLoading}
                className="w-full"
                icon={UserPlus}
              >
                Verify & Create Account
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </span>
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
