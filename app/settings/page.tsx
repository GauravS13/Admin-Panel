'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { httpClient } from '@/src/lib/services/httpClient';
import {
    Bell,
    CheckCircle,
    Database,
    FileText,
    Globe,
    Palette,
    Save,
    Server,
    Shield
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    inquiryAlerts: boolean;
    projectUpdates: boolean;
    systemAlerts: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    ipWhitelist: string[];
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    logo: string;
    favicon: string;
  };
  integrations: {
    googleAnalytics: string;
    facebookPixel: string;
    mailchimpApiKey: string;
    slackWebhook: string;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    backupRetention: number;
    lastBackup: string;
  };
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const defaultSettings: SystemSettings = {
    general: {
      siteName: 'Four Eyed Gems',
      siteDescription: 'Comprehensive admin panel for Four Eyed Gems management',
      siteUrl: 'https://admin.example.com',
      adminEmail: 'admin@example.com',
      timezone: 'UTC',
      language: 'en'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      inquiryAlerts: true,
      projectUpdates: true,
      systemAlerts: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: false
      },
      ipWhitelist: []
    },
    appearance: {
      theme: 'system',
      primaryColor: '#4B49AC',
      logo: '',
      favicon: ''
    },
    integrations: {
      googleAnalytics: '',
      facebookPixel: '',
      mailchimpApiKey: '',
      slackWebhook: ''
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      lastBackup: '2024-01-15T10:30:00Z'
    }
  };

  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSettings();
    }
  }, [isAuthenticated, user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('/api/settings');

      if (response.success) {
        // Merge API response with default settings to ensure all properties exist
        const mergedSettings = {
          ...defaultSettings,
          ...response.data,
          general: { ...defaultSettings.general, ...response.data.general },
          notifications: { ...defaultSettings.notifications, ...response.data.notifications },
          security: {
            ...defaultSettings.security,
            ...response.data.security,
            passwordPolicy: {
              ...defaultSettings.security.passwordPolicy,
              ...response.data.security?.passwordPolicy
            }
          },
          appearance: { ...defaultSettings.appearance, ...response.data.appearance },
          integrations: { ...defaultSettings.integrations, ...response.data.integrations },
          backup: { ...defaultSettings.backup, ...response.data.backup }
        };
        setSettings(mergedSettings);
      } else {
        console.error('Failed to fetch settings:', response.error, 'Status:', response.status);
        toast.error(`Failed to load settings: ${response.error || 'Unknown error'}`);
        // Fall back to default settings if API fails
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings. Using default settings.');
      // Fall back to default settings if there's a network error
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (section: keyof SystemSettings) => {
    try {
      setSaving(true);
      const response = await httpClient.put('/api/settings', {
        section,
        data: settings[section]
      });

      if (response.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedSettingChange = (section: keyof SystemSettings, parentField: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentField]: {
          ...(prev[section] as any)[parentField],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#4B49AC]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your system configuration and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            Last updated: {settings.backup?.lastBackup ? new Date(settings.backup.lastBackup).toLocaleString() : 'Never'}
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic system information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.general.siteUrl}
                    onChange={(e) => handleSettingChange('general', 'siteUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.general.adminEmail}
                    onChange={(e) => handleSettingChange('general', 'adminEmail', e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.general.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B49AC] focus:border-transparent"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                    placeholder="Enter site description"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => saveSettings('general')}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'smsNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Receive browser push notifications</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'pushNotifications', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Types</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="inquiryAlerts">Inquiry Alerts</Label>
                    <p className="text-sm text-gray-600">Get notified about new inquiries</p>
                  </div>
                  <Switch
                    id="inquiryAlerts"
                    checked={settings.notifications.inquiryAlerts}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'inquiryAlerts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="projectUpdates">Project Updates</Label>
                    <p className="text-sm text-gray-600">Get notified about project changes</p>
                  </div>
                  <Switch
                    id="projectUpdates"
                    checked={settings.notifications.projectUpdates}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'projectUpdates', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemAlerts">System Alerts</Label>
                    <p className="text-sm text-gray-600">Get notified about system issues</p>
                  </div>
                  <Switch
                    id="systemAlerts"
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'systemAlerts', checked)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => saveSettings('notifications')}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Require 2FA for all users</p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="480"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Password Policy</h3>
                <div className="space-y-2">
                  <Label htmlFor="minLength">Minimum Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={settings.security.passwordPolicy.minLength}
                    onChange={(e) => handleNestedSettingChange('security', 'passwordPolicy', 'minLength', parseInt(e.target.value))}
                    min="6"
                    max="32"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireUppercase">Require Uppercase Letters</Label>
                    <p className="text-sm text-gray-600">Passwords must contain uppercase letters</p>
                  </div>
                  <Switch
                    id="requireUppercase"
                    checked={settings.security.passwordPolicy.requireUppercase}
                    onCheckedChange={(checked) => handleNestedSettingChange('security', 'passwordPolicy', 'requireUppercase', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireNumbers">Require Numbers</Label>
                    <p className="text-sm text-gray-600">Passwords must contain numbers</p>
                  </div>
                  <Switch
                    id="requireNumbers"
                    checked={settings.security.passwordPolicy.requireNumbers}
                    onCheckedChange={(checked) => handleNestedSettingChange('security', 'passwordPolicy', 'requireNumbers', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireSymbols">Require Symbols</Label>
                    <p className="text-sm text-gray-600">Passwords must contain special characters</p>
                  </div>
                  <Switch
                    id="requireSymbols"
                    checked={settings.security.passwordPolicy.requireSymbols}
                    onCheckedChange={(checked) => handleNestedSettingChange('security', 'passwordPolicy', 'requireSymbols', checked)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => saveSettings('security')}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your Four Eyed Gems panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={settings.appearance.theme}
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B49AC] focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      placeholder="#4B49AC"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    value={settings.appearance.logo}
                    onChange={(e) => handleSettingChange('appearance', 'logo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon URL</Label>
                  <Input
                    id="favicon"
                    value={settings.appearance.favicon}
                    onChange={(e) => handleSettingChange('appearance', 'favicon', e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => saveSettings('appearance')}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Appearance Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Integration Settings
              </CardTitle>
              <CardDescription>
                Configure third-party integrations and API keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                  <Input
                    id="googleAnalytics"
                    value={settings.integrations.googleAnalytics}
                    onChange={(e) => handleSettingChange('integrations', 'googleAnalytics', e.target.value)}
                    placeholder="GA-XXXXXXXXX-X"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                  <Input
                    id="facebookPixel"
                    value={settings.integrations.facebookPixel}
                    onChange={(e) => handleSettingChange('integrations', 'facebookPixel', e.target.value)}
                    placeholder="123456789012345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mailchimpApiKey">Mailchimp API Key</Label>
                  <Input
                    id="mailchimpApiKey"
                    type="password"
                    value={settings.integrations.mailchimpApiKey}
                    onChange={(e) => handleSettingChange('integrations', 'mailchimpApiKey', e.target.value)}
                    placeholder="Enter Mailchimp API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                  <Input
                    id="slackWebhook"
                    value={settings.integrations.slackWebhook}
                    onChange={(e) => handleSettingChange('integrations', 'slackWebhook', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => saveSettings('integrations')}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Integration Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Backup Settings
              </CardTitle>
              <CardDescription>
                Configure automatic backups and data retention policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoBackup">Automatic Backups</Label>
                    <p className="text-sm text-gray-600">Enable automatic database backups</p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={settings.backup?.autoBackup || false}
                    onCheckedChange={(checked) => handleSettingChange('backup', 'autoBackup', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <select
                    id="backupFrequency"
                    value={settings.backup?.backupFrequency || 'daily'}
                    onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B49AC] focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={settings.backup?.backupRetention || 30}
                    onChange={(e) => handleSettingChange('backup', 'backupRetention', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Backup Status</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Last Backup</p>
                      <p className="text-sm text-gray-600">
                        {settings.backup?.lastBackup ? new Date(settings.backup.lastBackup).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Create Backup Now
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    View Backup History
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => saveSettings('backup')}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Backup Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
