"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { auth } from "@/lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
} from "firebase/auth";
import { Check, X, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar.readonly");

function getPasswordCriteria(password) {
    return [
        { id: "length", label: "At least 6 characters", met: password.length >= 6 },
        { id: "upper", label: "One uppercase letter", met: /[A-Z]/.test(password) },
        { id: "lower", label: "One lowercase letter", met: /[a-z]/.test(password) },
        { id: "number", label: "One number", met: /\d/.test(password) },
        { id: "special", label: "One special character (#@$!%*?&)", met: /[#@$!%*?&]/.test(password) },
    ];
}

export function LoginModal({ isOpen, onClose }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{6,}$/;

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isSignUp) {
                if (password !== confirmPassword) throw new Error("Passwords do not match.");
                if (!STRONG_PASSWORD_REGEX.test(password)) throw new Error("Please meet all password requirements.");
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message.replace("Firebase: ", ""));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError("");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential) {
                localStorage.setItem("googleCalendarAccessToken", credential.accessToken);
            }
            onClose();
        } catch (err) {
            console.error(err);
            if (err.code !== "auth/popup-closed-by-user") {
                setError(err.message.replace("Firebase: ", ""));
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMessage("");
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage("Password reset email sent! Please check your inbox.");
        } catch (err) {
            console.error(err);
            setError(err.message.replace("Firebase: ", ""));
        } finally {
            setLoading(false);
        }
    };

    const resetModalState = () => {
        setIsSignUp(false);
        setIsResettingPassword(false);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccessMessage("");
        onClose();
    };

    const criteria = getPasswordCriteria(password);
    const passwordsMatch = password && confirmPassword && password === confirmPassword;

    if (!isOpen) return null;

    const inputStyles = "w-full p-2.5 rounded-xl bg-zinc-100 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/30 transition-all";

    return (
        <Modal
            isOpen={isOpen}
            onClose={resetModalState}
            title={isResettingPassword ? "Reset Password" : (isSignUp ? "Create Account" : "Welcome Back")}
        >
            <div className="space-y-5">
                {isResettingPassword ? (
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                            Enter the email address associated with your account, and we'll send you a secure link to reset your password.
                        </p>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-foreground">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputStyles}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                                {error}
                            </p>
                        )}
                        {successMessage && (
                            <div className="text-sm text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                                <Info className="w-4 h-4 shrink-0" />
                                <p>{successMessage}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || successMessage}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-full font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                        </button>

                        <div className="text-center text-sm mt-4">
                            <button
                                type="button"
                                onClick={() => { setIsResettingPassword(false); setError(""); setSuccessMessage(""); }}
                                className="text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        {/* Google Sign-In Button */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl font-medium text-sm transition-all
                        bg-[#2A2A2A] text-white
                        border border-zinc-600
                        hover:bg-[#333] active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-zinc-200 bg-white/10" />
                            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">or</span>
                            <div className="flex-1 h-px bg-zinc-200 bg-white/10" />
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-foreground">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputStyles}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-medium text-foreground">Password</label>
                                    {!isSignUp && (
                                        <button
                                            type="button"
                                            onClick={() => { setIsResettingPassword(true); setError(""); }}
                                            className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputStyles}
                                    placeholder="••••••••"
                                    required
                                />
                                {isSignUp && (
                                    <div className="mt-2.5 text-xs space-y-1">
                                        {criteria.map((item) => (
                                            <div key={item.id} className="flex items-center gap-2">
                                                {item.met ? (
                                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                                ) : (
                                                    <X className="w-3.5 h-3.5 text-zinc-400 text-zinc-600" />
                                                )}
                                                <span className={item.met ? "text-green-500 font-medium" : "text-zinc-400 text-zinc-500"}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <AnimatePresence initial={false}>
                                {isSignUp && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <label className="block text-sm font-medium mb-1.5 mt-1 text-foreground">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={inputStyles}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <div className="mt-2 text-xs flex items-center gap-2">
                                            {passwordsMatch ? (
                                                <Check className="w-3.5 h-3.5 text-green-500" />
                                            ) : (
                                                <X className="w-3.5 h-3.5 text-zinc-400 text-zinc-600" />
                                            )}
                                            <span className={passwordsMatch ? "text-green-500 font-medium" : "text-zinc-400 text-zinc-500"}>
                                                Passwords match
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-full font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-red-500/20 flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
                            </button>
                        </form>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">
                                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                            </span>
                            <button
                                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                                className="text-red-500 hover:text-red-600 hover:underline font-semibold transition-colors"
                            >
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
