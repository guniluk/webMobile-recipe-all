import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import { ui } from "@clerk/ui";

import Header from "./components/Header";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import RecipeDetail from "./pages/RecipeDetail";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in .env",
  );
}

function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <SignedIn>
        <Header />
        <div className="grow">{children}</div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} ui={ui}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />

          {/* Protected Main Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Home />
              </ProtectedLayout>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedLayout>
                <Search />
              </ProtectedLayout>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedLayout>
                <Favorites />
              </ProtectedLayout>
            }
          />
          <Route
            path="/recipe/:id"
            element={
              <ProtectedLayout>
                <RecipeDetail />
              </ProtectedLayout>
            }
          />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
