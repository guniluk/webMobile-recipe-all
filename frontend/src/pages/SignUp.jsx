import React from 'react';
import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

export default function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]" />
      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
          <p className="text-slate-400 text-sm mt-2">Join us to explore and cook delicious recipes</p>
        </div>
        <ClerkSignUp 
          signInUrl="/sign-in"
          appearance={{
            elements: {
              card: "bg-transparent shadow-none border-none p-0 w-full",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "bg-white/10 hover:bg-white/20 border-white/10 text-white font-medium",
              socialButtonsBlockButtonText: "text-white",
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors rounded-xl py-3",
              formFieldInput: "bg-white/5 border-white/10 text-white rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
              formFieldLabel: "text-slate-300 font-medium",
              footerActionText: "text-slate-400",
              footerActionLink: "text-indigo-400 hover:text-indigo-300 font-semibold",
              identityPreviewText: "text-white",
              identityPreviewEditButtonIcon: "text-white",
            }
          }}
        />
      </div>
    </div>
  );
}
