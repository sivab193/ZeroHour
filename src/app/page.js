"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Grid } from "@/components/Grid";
import { CountdownCard } from "@/components/CountdownCard";
import { AnimatePresence, motion } from "framer-motion";
import { EventModal } from "@/components/EventModal";
import { ProfileModal } from "@/components/ProfileModal";
import { LoginModal } from "@/components/LoginModal";
import { useEvents } from "@/hooks/useEvents";
import { Plus, LogOut, User, ArrowUp } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Features } from "@/components/Features";
import { Stats } from "@/components/Stats";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Birthdays", "Movies", "Work", "Vacations", "Anniversaries", "Other"];

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [filterCategory, setFilterCategory] = useState("All");
  const [showLanding, setShowLanding] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth not initialized");
      setLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (currentUser) setIsAdmin(true);
      else setIsAdmin(false);
    });
    return () => unsubscribe();
  }, []);

  const { events, addEvent, deleteEvent, updateEvent, loading } = useEvents(user);

  // Dynamic: only show categories that actually exist in events
  const activeCategories = useMemo(() => ["All", ...CATEGORIES.filter(cat => cat !== "All" && events.some(e => (e.category || "Other") === cat))], [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => filterCategory === "All" || (e.category || "Other") === filterCategory);
  }, [events, filterCategory]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (eventData) => {
    if (editingEvent) updateEvent(eventData);
    else addEvent(eventData);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
  };

  if (loadingAuth) return null;

  const DashboardContent = (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        {user && (
          <button onClick={handleAddEvent} className="p-3 rounded-full bg-emerald-500 text-white hover:scale-110 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 shrink-0">
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {events.length > 0 && (
        <div className="flex overflow-x-auto pb-3 mb-4 gap-2 no-scrollbar">
          {activeCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn("px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border", filterCategory === cat ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/5")}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-500 text-lg font-medium">No events yet</p>
          <p className="text-zinc-600 text-sm mt-1">Events will appear here once they&apos;re added.</p>
        </div>
      ) : (
        <Grid>
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event) => (
                <CountdownCard key={event.id} event={event} onDelete={deleteEvent} onEdit={handleEditEvent} isAdmin={!!user} />
              ))}
          </AnimatePresence>
        </Grid>
      )}

      <div className="mt-12 text-center space-y-4 pb-8">
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-[8px] border border-amber-500/30">Past</span>
            <span className="text-zinc-400">Past Event</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[7px] border border-emerald-500/20">New</span>
            <span className="text-zinc-400">Upcoming Event</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80 max-w-md mx-auto pt-4 border-t border-border/50">
          Tip: Click "My Profile" to claim your unique link (e.g., /yourname) and share your public countdowns with the world!
        </p>
      </div>

    </>
  );

  const LandingContent = (
    <div className="flex flex-col h-full w-full pt-2 lg:pt-4 pb-[76px] sm:pb-8 gap-4 sm:gap-8 overflow-hidden">
      {/* Hero / Events Section */}
      <section className="flex flex-col relative w-full flex-1">
        {events.length > 0 && (
          <div className="flex overflow-x-auto pb-3 mb-4 sm:mb-8 gap-2 no-scrollbar shrink-0">
            {activeCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn("px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border", filterCategory === cat ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/5")}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col justify-start flex-1 min-h-0 w-full relative">
          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full md:pb-0 sm:overflow-visible">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event) => (
                  <div key={event.id} className="w-full md:w-auto shrink-0">
                    <CountdownCard event={event} onDelete={deleteEvent} onEdit={handleEditEvent} isAdmin={false} />
                  </div>
                ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Bottom Features & Stats Wrapper */}
      <div className="sm:mt-auto flex flex-col gap-4 w-full sm:pt-8">
        {/* Features Section */}
        <section className="w-full flex flex-col items-center justify-center relative">
          <Features />
        </section>

        {/* Stats Section */}
        <section className="w-full flex flex-col items-center justify-center relative pb-4">
          <Stats />
        </section>
      </div>
    </div>
  );

  const showDashboard = user && !showLanding;

  return (
    <div ref={scrollRef} className={cn(
      "font-[family-name:var(--font-geist-sans)] relative w-full overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-zinc-950 to-black",
      !showDashboard ? "min-h-[100dvh] flex flex-col" : "min-h-[100dvh] pb-24"
    )}>
      {/* Solid Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1
              onClick={() => { if (user) setShowLanding(s => !s); }}
              className="text-xl sm:text-2xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-emerald-500 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {siteConfig.title}
            </h1>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              {showLanding && (
                <button onClick={() => setShowLanding(false)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 transition-all text-sm font-bold shadow-lg shadow-emerald-500/20">
                  Dashboard
                </button>
              )}
              <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors font-medium border border-foreground/10 px-3 py-1.5 rounded-full hover:bg-foreground/5">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">My Profile</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 transition-all text-sm font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
            >
              <User className="w-4 h-4" />
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-8 pt-[64px] sm:pt-24",
        !showDashboard ? "flex flex-col flex-1 min-h-0" : "pb-12"
      )}>
        {showDashboard ? DashboardContent : LandingContent}
      </main>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <EventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} onSave={handleSaveEvent} onDelete={deleteEvent} event={editingEvent} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} />

      <Footer />
    </div>
  );
}
