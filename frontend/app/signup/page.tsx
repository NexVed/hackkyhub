import AuthFlow from "@/components/auth/AuthFlow";

export default function SignupPage() {
  return <AuthFlow mode="signup" redirectTo="/dashboard" />;
}
