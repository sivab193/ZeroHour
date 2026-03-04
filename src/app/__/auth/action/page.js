// src/app/__/auth/action/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function AuthActionPage({ searchParams }) {
    const router = useRouter();
    const [mode, setMode] = useState(null);
    const [actionCode, setActionCode] = useState(null);
    const [apiKey, setApiKey] = useState(null);
    const [error, setError] = useState(null);

    // Reset password state
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isVerifying, setIsVerifying] = useState(true);
    const [isResetting, setIsResetting] = useState(false);
    const [resetEmail, setResetEmail] = useState(null);
    const [resetSuccess, setResetSuccess] = useState(false);

    useEffect(() => {
        // Extract parameters from URL
        const queryParams = new URLSearchParams(window.location.search);
        const queryMode = queryParams.get("mode");
        const queryActionCode = queryParams.get("oobCode");
        const queryApiKey = queryParams.get("apiKey");

        if (!queryMode || !queryActionCode || !queryApiKey) {
            setError("Invalid link. Missing required parameters.");
            setIsVerifying(false);
            return;
        }

        setMode(queryMode);
        setActionCode(queryActionCode);
        setApiKey(queryApiKey);

        if (queryMode === "resetPassword") {
            // Verify the code
            verifyPasswordResetCode(auth, queryActionCode)
                .then((email) => {
                    setResetEmail(email);
                    setIsVerifying(false);
                })
                .catch((err) => {
                    console.error("Error verifying reset code:", err);
                    setError(err.message || "The password reset link is invalid or has expired.");
                    setIsVerifying(false);
                });
        } else {
            setError(`Unsupported mode: ${queryMode}`);
            setIsVerifying(false);
        }
    }, []);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password should be at least 6 characters.");
            return;
        }

        setIsResetting(true);
        try {
            await confirmPasswordReset(auth, actionCode, newPassword);
            setResetSuccess(true);
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } catch (err) {
            console.error("Error resetting password:", err);
            setError(err.message || "Failed to reset password. The link might be expired.");
        } finally {
            setIsResetting(false);
        }
    };


    if (isVerifying) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-white">Verifying link...</p>
                </div>
            </div>
        );
    }

    if (error && !resetSuccess) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-white mb-2">Link Invalid</h2>
                    <p className="text-zinc-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    if (mode === "resetPassword") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                    <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                    {resetEmail && (
                        <p className="text-zinc-400 text-sm mb-6">
                            Resetting password for <span className="text-emerald-400 font-medium">{resetEmail}</span>
                        </p>
                    )}

                    {resetSuccess ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
                            <p className="text-zinc-400 mb-6">Your password has been changed successfully. Redirecting you home...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isResetting}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save New Password"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
