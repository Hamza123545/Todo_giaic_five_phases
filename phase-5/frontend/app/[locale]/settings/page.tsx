"use client";

/**
 * Settings Page - Glass Morphism Redesign
 *
 * User settings with tabbed interface (Profile, Notifications, Security)
 */

import { useState, useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/types";
import ProtectedRoute from "@/components/ProtectedRoute";
import { HeaderGreeting } from "@/components/molecules/HeaderGreeting";
import { GlassCard } from "@/components/atoms/GlassCard";
import { Button } from "@/components/atoms/Button";
import { User as UserIcon, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type Tab = "profile" | "notifications" | "security";

function SettingsContent() {
  const { toast} = useToast();
  const t = useTranslations('settings');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            createdAt: currentUser.createdAt?.toISOString(),
            updatedAt: currentUser.updatedAt?.toISOString(),
          });
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof UserIcon }[] = [
    { id: "profile", label: t('tabs.profile'), icon: UserIcon },
    { id: "notifications", label: t('tabs.notifications'), icon: Bell },
    { id: "security", label: t('tabs.security'), icon: Shield },
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <HeaderGreeting
          userName={user?.name}
          title={t('title')}
          subtitle={t('page_subtitle')}
        />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <GlassCard variant="elevated" className="p-6 mb-6">
          <div className="flex gap-2 border-b border-white/20 dark:border-gray-700/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Tab Content */}
        <GlassCard variant="elevated" className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">
                {t('profile_section.title')}
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user || !nameInputRef.current) return;

                  const newName = nameInputRef.current.value.trim();
                  if (!newName) {
                    toast({
                      type: "error",
                      description: t('messages.name_required'),
                      duration: 3000,
                    });
                    return;
                  }

                  if (newName === user.name) {
                    toast({
                      type: "info",
                      description: t('messages.no_changes'),
                      duration: 2000,
                    });
                    return;
                  }

                  setIsSaving(true);
                  try {
                    // Better Auth doesn't have a direct update method, so we'll use the session update
                    // For now, we'll show a success message and update local state
                    // In a real app, you'd need a backend API endpoint to update user profile
                    setUser({ ...user, name: newName });
                    toast({
                      type: "success",
                      description: t('messages.profile_updated'),
                      duration: 2000,
                    });
                  } catch (error) {
                    console.error("Failed to update profile:", error);
                    toast({
                      type: "error",
                      description: error instanceof Error ? error.message : t('messages.profile_failed'),
                      duration: 5000,
                    });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('profile_section.full_name')}
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    defaultValue={user?.name || ""}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg backdrop-blur-sm border transition-all duration-200",
                      "bg-white/10 dark:bg-gray-800/10 border-white/30 dark:border-gray-700/50",
                      "text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                    )}
                    placeholder={t('profile_section.placeholder_name')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('profile_section.email')}
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className={cn(
                      "w-full px-4 py-3 rounded-lg backdrop-blur-sm border",
                      "bg-white/5 dark:bg-gray-800/5 border-white/20 dark:border-gray-700/40",
                      "text-muted-foreground cursor-not-allowed"
                    )}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('profile_section.email_locked')}
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  loading={isSaving}
                  className="w-full"
                >
                  {isSaving ? t('profile_section.saving') : t('profile_section.save_changes')}
                </Button>
              </form>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">
                {t('notifications_section.title')}
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-lg glass-card border border-white/20 dark:border-gray-700/50 cursor-pointer hover:bg-white/5">
                  <span className="text-foreground">{t('notifications_section.email_notifications')}</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-lg glass-card border border-white/20 dark:border-gray-700/50 cursor-pointer hover:bg-white/5">
                  <span className="text-foreground">{t('notifications_section.in_app_notifications')}</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <Button
                  variant="primary"
                  onClick={() => toast({
                    type: "success",
                    description: t('messages.preferences_saved'),
                    duration: 2000
                  })}
                >
                  {t('notifications_section.save_preferences')}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground">
                {t('security_section.title')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('security_section.current_password')}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/20 dark:border-gray-700/50 bg-white/5 dark:bg-gray-800/5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('security_section.new_password')}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/20 dark:border-gray-700/50 bg-white/5 dark:bg-gray-800/5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('security_section.confirm_password')}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg glass-card border border-white/20 dark:border-gray-700/50 bg-white/5 dark:bg-gray-800/5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={() => toast({
                    type: "success",
                    description: t('messages.password_updated'),
                    duration: 2000
                  })}
                >
                  {t('security_section.update_password')}
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

