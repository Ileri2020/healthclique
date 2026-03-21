"use client"
import React, { useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import axios from 'axios'
import { useAppContext } from '@/hooks/useAppContext'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook } from 'react-icons/fa'
import { googleSignIn, facebookSignIn } from './googlesignin'
import Signup, { SignupForm } from './signup'

import { Loader2, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

export const LoginForm = ({ onSignupClick }: { onSignupClick?: () => void }) => {
  const { setUser } = useAppContext();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Email verification flow state
  const [verificationStep, setVerificationStep] = useState<'login' | 'verify' | 'setPassword'>('login');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await axios.post('/api/auth/login', formData);
      setUser(res.data);
      setSuccessMessage('Login successful!');
      resetForm();
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.response?.status === 403 && error.response?.data?.requiresEmailVerification) {
        setErrorMessage(error.response.data.message);
        setVerificationStep('verify');
      } else {
        setErrorMessage(error.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await axios.post('/api/auth/send-verification-code', { email: formData.email });
      setSuccessMessage('Verification code sent to your email!');
      setVerificationStep('setPassword');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndSetPassword = async (e: any) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post('/api/auth/verify-code-set-password', {
        email: formData.email,
        code: verificationCode,
        password: newPassword,
      });
      setSuccessMessage(res.data.message);

      setTimeout(() => {
        setVerificationStep('login');
        resetForm();
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to verify code and set password');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', password: '' });
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className='flex flex-col justify-center items-center py-5 w-full max-w-xl mx-auto'>
      <DrawerHeader>
        <DrawerTitle className='w-full text-center'>
          {verificationStep === 'login' && 'Login to '}
          {verificationStep === 'verify' && 'Verify Your Email — '}
          {verificationStep === 'setPassword' && 'Set Your Password — '}
          <span className='text-primary'>Health Clique</span>
        </DrawerTitle>
        <DrawerDescription>
          {verificationStep === 'verify' && 'We need to verify your email address'}
          {verificationStep === 'setPassword' && 'Check your email for the verification code'}
        </DrawerDescription>
      </DrawerHeader>

      {/* Error and Success Messages */}
      {errorMessage && (
        <Alert variant="destructive" className="max-w-xl mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="max-w-xl mb-4 border-green-500 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Normal Login */}
      {verificationStep === 'login' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 bg-secondary rounded-xl w-full">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <DrawerFooter className="flex flex-row w-full gap-2 mt-2 px-0">
            <Button type="submit" className="flex-1 w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login →'
              )}
            </Button>
          </DrawerFooter>
        </form>
      )}

      {/* Other steps omitted for brevity but should be here... [Wait, I should include them all] */}
      {/* Step 2: Email Verification Prompt */}
      {verificationStep === 'verify' && (
        <div className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl w-full">
          <div className="text-center space-y-3">
            <Mail className="h-16 w-16 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Your account was created using Google. To login with email and password, please verify your email first.
            </p>
            <p className="text-sm font-semibold">Email: {formData.email}</p>
          </div>

          <DrawerFooter className="flex flex-row w-full gap-2 mt-4 px-0">
            <Button
              onClick={() => { setVerificationStep('login'); resetForm(); }}
              className='flex-1'
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendVerificationCode}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
              ) : 'Send Verification Code'}
            </Button>
          </DrawerFooter>
        </div>
      )}

      {/* Step 3: Set Password */}
      {verificationStep === 'setPassword' && (
        <form onSubmit={handleVerifyAndSetPassword} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl w-full">
          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <DrawerFooter className="flex flex-row w-full gap-2 mt-2 px-0">
             <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Set Password'}
             </Button>
          </DrawerFooter>
        </form>
      )}

      {/* Social Login & Signup — Only show on login step */}
      {verificationStep === 'login' && (
        <div className="w-full my-4 flex flex-col gap-2">
          <form action={googleSignIn}>
            <Button
              className="border-2 border-primary relative w-full max-w-[300px] mx-auto flex items-center justify-center rounded-md h-10 font-medium gap-2 shadow-sm"
              type="submit"
              variant='outline'
            >
              <FcGoogle className="h-4 w-4" />
              <span className="text-sm">Continue with Google</span>
            </Button>
          </form>
          <form action={facebookSignIn}>
            <Button
              className="border-2 border-sky-600 relative w-full max-w-[300px] mx-auto flex items-center justify-center rounded-md h-10 font-medium gap-2 bg-sky-600 text-white hover:bg-sky-700 shadow-sm transition-colors mt-2"
              type="submit"
            >
              <FaFacebook className="h-4 w-4 scale-110" />
              <span className="text-sm">Continue with Facebook</span>
            </Button>
          </form>
          {onSignupClick ? (
            <div className="flex justify-center mt-2">
              <Button variant="link" onClick={onSignupClick} className="text-primary font-bold">
                Don&apos;t have an account? Sign up
              </Button>
            </div>
          ) : (
            <div className="max-w-[300px] mx-auto w-full my-2 rounded-md font-medium flex justify-center items-center">
              <Signup />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LoginProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const Login = ({ open: controlledOpen, onOpenChange: setControlledOpen, hideTrigger }: LoginProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  return (
    <div className='inline w-full'>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        {!hideTrigger && (
          <DrawerTrigger asChild>
            <Button variant="outline" className='w-full'>Login</Button>
          </DrawerTrigger>
        )}
        <DrawerContent className='overflow-y-auto max-h-[90vh] bg-background'>
           <div className='px-4 pb-8'>
             {mode === "login" ? (
               <LoginForm onSignupClick={() => setMode("signup")} />
             ) : (
               <SignupForm onLoginClick={() => setMode("login")} />
             )}
           </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}


export default Login
