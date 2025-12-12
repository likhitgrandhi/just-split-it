import React, { useState, useEffect } from 'react';
import { X, Mail, ArrowRight, Loader2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createOrUpdateUser } from '../services/userService';

interface SignInModalProps {
    onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ onClose }) => {
    const { signInWithEmail, verifyOTP, user } = useAuth();
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-close if user becomes authenticated (e.g. from magic link in another tab)
    useEffect(() => {
        if (user) {
            // Check if we need to sync user to DB (in case it happened in another tab but we want to be sure)
            // Ideally the other tab did it, but doing it again is safe (upsert).
            createOrUpdateUser(user.id, user.email!).catch(console.error);
            onClose();
        }
    }, [user, onClose]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const { error } = await signInWithEmail(email);
            if (error) throw error;
            setStep('otp');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await verifyOTP(email, otp);
            if (error) throw error;

            if (data.user) {
                // Update user in our database
                await createOrUpdateUser(data.user.id, data.user.email!);
                onClose();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-soft border border-white/50 relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8 pt-4">
                    <div className="w-20 h-20 bg-cloud-light rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner-soft">
                        <Mail className="h-8 w-8 text-cloud-primary" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-cloud-text mb-2">
                        {step === 'email' ? 'Sign In' : 'Check your email'}
                    </h2>
                    <p className="text-cloud-subtext">
                        {step === 'email'
                            ? 'Enter your email to get started'
                            : `We sent a code to ${email}`}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-500 text-sm font-bold">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {step === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-gray-50 text-cloud-text px-6 py-5 rounded-2xl border-2 border-transparent focus:border-cloud-primary focus:outline-none transition-all text-lg text-center placeholder-gray-300 font-medium"
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!email.trim() || isLoading}
                            className="w-full bg-black text-white font-bold py-5 rounded-2xl transition-all duration-200 text-lg shadow-lg active:scale-[0.98] transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    Send Code <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="otp" className="sr-only">OTP Code</label>
                            <input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="000000"
                                className="w-full bg-gray-50 text-cloud-text px-6 py-5 rounded-2xl border-2 border-transparent focus:border-cloud-primary focus:outline-none transition-all text-4xl text-center placeholder-gray-200 font-black tracking-widest"
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={otp.length !== 6 || isLoading}
                            className="w-full bg-black text-white font-bold py-5 rounded-2xl transition-all duration-200 text-lg shadow-lg active:scale-[0.98] transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify & Sign In <Check size={20} />
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('email')}
                            className="w-full text-cloud-subtext font-bold text-sm py-2 hover:text-cloud-text transition-colors"
                        >
                            Wrong email? Go back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
