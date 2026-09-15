"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import Galaxy from "@/components/Galaxy";

export default function SignupPage() {
    const { signIn } = useAuthActions();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        void signIn("password", { name, email, password, flow: "signUp", redirectTo: "/dashboard/Profile" });
    };

    return (
        <div className="relative min-h-dvh w-full flex items-center justify-center px-3 py-4 sm:p-8 bg-black overflow-x-hidden overflow-y-auto">
            {/* Galaxy Background */}
            <div className="absolute inset-0 pointer-events-auto">
                <Galaxy transparent={false} />
            </div>

            {/* Main Content Card */}
            <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl sm:rounded-3xl lg:min-h-[600px] lg:max-w-5xl lg:flex-row">
                {/* Banner Side */}
                <div className="relative h-28 w-full flex-shrink-0 bg-black sm:h-48 lg:h-auto lg:w-5/12">
                    <Image
                        src="/Banner2.png"
                        alt="HackkyHub Banner"
                        fill
                        className="object-cover hidden lg:block"
                        priority
                    />
                    <Image
                        src="/banner.png"
                        alt="HackkyHub Banner Mobile"
                        fill
                        className="object-contain lg:hidden"
                        priority
                    />
                </div>

                {/* Form Side */}
                <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-16">
                    <div className="mx-auto w-full max-w-md">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-2">
                            Create an Account
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
                            Tell us about yourself to get started
                        </p>

                        <form className="space-y-4 sm:space-y-5" onSubmit={handleSignUp}>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-900">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    required
                                    className="bg-gray-50"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-900">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    required
                                    className="bg-gray-50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-900">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        required
                                        className="bg-gray-50 pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">
                                Sign Up
                            </Button>
                        </form>

                        <div className="mt-6 sm:mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-xs sm:text-sm">
                                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                                <Button
                                    variant="outline"
                                    className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm"
                                    onClick={() => void signIn("google", { redirectTo: "/dashboard/Profile" })}
                                    type="button"
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                                        <path
                                            d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                                            fill="#EA4335"
                                        />
                                        <path
                                            d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                                            fill="#34A853"
                                        />
                                    </svg>
                                    Google
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm"
                                    onClick={() => void signIn("github", { redirectTo: "/dashboard/Profile" })}
                                    type="button"
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5 fill-current" aria-hidden="true">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </Button>
                            </div>
                        </div>

                        <p className="mt-6 text-center text-sm text-gray-600 sm:mt-8">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-black hover:underline" prefetch={false}>
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
