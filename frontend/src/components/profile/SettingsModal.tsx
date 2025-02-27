import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { api } from '@/utils/axiosConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmailPreference: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentEmailPreference }) => {
  const queryClient = useQueryClient();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  const updateEmailPreferencesMutation = useMutation({
    mutationFn: async (acceptsEmails: boolean) => {
      // Update to use api instance and proper route
      const { data } = await api.patch('/api/auth/update-email-preferences', { acceptsEmails });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (passwords: PasswordForm) => {
      try {
        const { data } = await api.patch('/api/auth/change-password', passwords);
        return data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Handle specific error cases
          if (error.response?.status === 400 && error.response.data?.message) {
            throw new Error(error.response.data.message);
          }
          if (error.response?.status === 401) {
            throw new Error('Current password is incorrect');
          }
        }
        throw new Error('Failed to update password. Please try again.');
      }
    },
    onSuccess: () => {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  });

  // Add password strength requirements
  const getPasswordStrengthText = (): { text: string; color: string } => {
    switch (passwordStrength) {
      case 0:
        return { text: 'Very Weak', color: 'text-red-500' };
      case 1:
        return { text: 'Weak', color: 'text-orange-500' };
      case 2:
        return { text: 'Medium', color: 'text-yellow-500' };
      case 3:
        return { text: 'Strong', color: 'text-lime-500' };
      case 4:
        return { text: 'Very Strong', color: 'text-green-500' };
      default:
        return { text: 'Very Weak', color: 'text-red-500' };
    }
  };

  const validatePasswordRequirements = (password: string): boolean => {
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return false;
    }
    
    if (!/[A-Z]/.test(password)) {
      setValidationError('Password must include at least one uppercase letter');
      return false;
    }
    
    if (!/[0-9]/.test(password)) {
      setValidationError('Password must include at least one number');
      return false;
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      setValidationError('Password must include at least one special character');
      return false;
    }
    
    return true;
  };

// Updated validation function
const validatePasswordForm = (): boolean => {
  // Existing validation checks
  if (!passwordForm.currentPassword.trim()) {
    setValidationError('Current password is required');
    return false;
  }
  if (!passwordForm.newPassword.trim()) {
    setValidationError('New password is required');
    return false;
  }
  if (!passwordForm.confirmPassword.trim()) {
    setValidationError('Please confirm your new password');
    return false;
  }

  // Check passwords match
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    setValidationError('New passwords do not match');
    return false;
  }

  // Check new password isn't same as current
  if (passwordForm.newPassword === passwordForm.currentPassword) {
    setValidationError('New password must be different from current password');
    return false;
  }

  // Check password strength requirements
  if (!validatePasswordRequirements(passwordForm.newPassword)) {
    return false;
  }

  setValidationError(null);
  return true;
};

const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setPasswordForm(prev => ({
    ...prev,
    [name]: value
  }));
  
  if (name === 'newPassword') {
    let score = 0;
    if (value.length >= 8) score++;
    if (value.match(/[A-Z]/)) score++;
    if (value.match(/[0-9]/)) score++;
    if (value.match(/[^A-Za-z0-9]/)) score++;
    setPasswordStrength(score);
  }
};

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    changePasswordMutation.mutate(passwordForm);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Preferences Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Email Preferences</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailPreferences"
                checked={currentEmailPreference}
                onCheckedChange={(checked: boolean) => {
                  updateEmailPreferencesMutation.mutate(checked);
                }}
              />
              <label
                htmlFor="emailPreferences"
                className="text-sm text-gray-600 leading-none"
              >
                I would like to receive emails for notifications, personalized recommendations, and special offers
              </label>
            </div>

            {updateEmailPreferencesMutation.isSuccess && (
              <Alert className="bg-green-50 text-green-800">
                <AlertDescription>Email preferences updated successfully</AlertDescription>
              </Alert>
            )}

            {updateEmailPreferencesMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to update email preferences. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Password Change Section */}
          <Collapsible
            open={isPasswordOpen}
            onOpenChange={setIsPasswordOpen}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Change Password</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    isPasswordOpen ? "transform rotate-180" : ""
                  }`}/>
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-4">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="space-y-2">
  <Label htmlFor="newPassword">New Password</Label>
  <Input
    id="newPassword"
    name="newPassword"
    type="password"
    value={passwordForm.newPassword}
    onChange={handlePasswordChange}
    required
  />
  {passwordForm.newPassword && (
  <>
    <div className="flex gap-1 mt-1">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`h-1 w-full rounded ${
            i < passwordStrength
              ? 'bg-green-500'
              : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
    <div className="flex justify-between text-xs">
      <p className="text-gray-500">
        Password strength:
        <span className={`ml-1 font-medium ${getPasswordStrengthText().color}`}>
          {getPasswordStrengthText().text}
        </span>
      </p>
    </div>
  </>
)}
</div>

                <div className="space-y-2">
  <Label htmlFor="confirmPassword">Confirm New Password</Label>
  <Input
    id="confirmPassword"
    name="confirmPassword"
    type="password"
    value={passwordForm.confirmPassword}
    onChange={handlePasswordChange}
    required
  />
</div>

{validationError && (
  <Alert variant="destructive">
    <AlertDescription>
      {validationError}
    </AlertDescription>
  </Alert>
)}

<p className="text-xs text-gray-500">
  Password must be at least 8 characters and include uppercase, numbers, and special characters
</p>

{changePasswordMutation.isError && (
  <Alert variant="destructive">
    <AlertDescription>
      {changePasswordMutation.error instanceof Error 
        ? changePasswordMutation.error.message 
        : 'Failed to update password'}
    </AlertDescription>
  </Alert>
)}

                {changePasswordMutation.isSuccess && (
                  <Alert className="bg-green-50 text-green-800">
                    <AlertDescription>Password updated successfully</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={changePasswordMutation.isPending}
                >
                  Change Password
                </Button>
              </form>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;