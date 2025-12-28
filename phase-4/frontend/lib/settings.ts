export interface ProfileFormData {
  fullName: string;
  email: string;
  jobTitle: string;
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  inAppNotifications: boolean;
}

export interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

