'use client';

import React, { useState } from 'react';
import { account } from '@/lib/appwrite';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ID, OAuthProvider } from 'appwrite';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { refreshUser } = useAuth();
    const { success, error: showError } = useToast();

    // Simple validation
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            return 'Email is required';
        }
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    const validatePassword = (password: string) => {
        if (!password) {
            return 'Password is required';
        }
        if (password.length < 8) {
            return 'Password must be at least 8 characters';
        }
        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate inputs
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);
        
        setEmailError(emailErr);
        setPasswordError(passwordErr);

        if (emailErr || passwordErr) {
            return;
        }

        if (isSignUp && !name.trim()) {
            showError('Please enter your name');
            return;
        }

        setLoading(true);

        try {
            try {
                await account.deleteSession('current');
            } catch {
                // No existing session, continue
            }

            if (isSignUp) {
                await account.create(ID.unique(), email, password, name);
                await account.createEmailPasswordSession(email, password);
                success('Account created successfully! Welcome to Kai! 🎉');
            } else {
                await account.createEmailPasswordSession(email, password);
                success('Welcome back! 👋');
            }
            await refreshUser();
            router.push('/');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to authenticate. Please try again.';
            setError(errorMessage);
            // Note: We use inline error display for auth errors instead of toast
            // as it's more visible and persistent in this context
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            account.createOAuth2Session(
                OAuthProvider.Google,
                `${window.location.origin}/`,
                `${window.location.origin}/login`
            );
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to authenticate with Google';
            setError(errorMessage);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md"
            >
                <Card className="p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border-gray-100/80 dark:border-gray-800/50">
                    <div className="mb-8 text-center">
                        <div className="mx-auto w-14 h-14 bg-[#111] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-2xl font-bold text-white">K</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            {isSignUp ? 'Create an account' : 'Welcome back'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            {isSignUp ? 'Enter your details to sign up' : 'Enter your credentials to access your account'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Name</label>
                                <Input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </motion.div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Email</label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError('');
                                }}
                                error={emailError}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (passwordError) setPasswordError('');
                                }}
                                error={passwordError}
                                required
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20"
                            >
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                            </motion.div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading} loading={loading}>
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200 dark:border-gray-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-4 text-muted-foreground font-medium tracking-wider">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="mt-6 w-full"
                            onClick={handleGoogleLogin}
                            type="button"
                        >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </Button>
                    </div>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-muted-foreground">
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                        </span>
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                                setEmailError('');
                                setPasswordError('');
                            }}
                            className="font-medium text-foreground hover:text-muted-foreground cursor-pointer min-h-[44px] px-2 underline underline-offset-4"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
