
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Upload, Lock, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    general: {
      companyName: "InsureDocs Inc.",
      supportEmail: "support@insuredocs.example.com",
      maxFileSize: "10",
      allowedFileTypes: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
      enablePublicRegistration: true,
    },
    security: {
      requireEmailVerification: true,
      passwordMinLength: "8",
      passwordRequiresSpecialChar: true,
      passwordRequiresNumber: true,
      sessionTimeout: "60",
      enableTwoFactor: false,
    },
    documents: {
      requireApproval: true,
      allowMultipleVersions: true,
      automaticBackups: true,
      backupFrequency: "daily",
      retentionPeriod: "90",
      automaticOCR: true,
    },
    notifications: {
      adminEmailNotifications: true,
      userUploadNotifications: true,
      documentExpirationAlerts: true,
      systemMaintenanceAlerts: true,
    },
  });

  // Restrict access to admins only
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  const handleSaveSettings = (tab: keyof typeof settings) => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success(`${tab.charAt(0).toUpperCase() + tab.slice(1)} settings saved successfully`);
      setSaving(false);
    }, 1000);
  };

  const handleToggleSetting = (tab: keyof typeof settings, setting: string) => {
    setSettings({
      ...settings,
      [tab]: {
        ...settings[tab],
        [setting]: !settings[tab][setting as keyof typeof settings[typeof tab]],
      },
    });
  };

  const handleInputChange = (tab: keyof typeof settings, setting: string, value: string) => {
    setSettings({
      ...settings,
      [tab]: {
        ...settings[tab],
        [setting]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure the insurance document portal settings</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="general" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic portal settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings("general"); }} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={settings.general.companyName}
                        onChange={(e) => handleInputChange("general", "companyName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) => handleInputChange("general", "supportEmail", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        value={settings.general.maxFileSize}
                        onChange={(e) => handleInputChange("general", "maxFileSize", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                      <Input
                        id="allowedFileTypes"
                        value={settings.general.allowedFileTypes}
                        onChange={(e) => handleInputChange("general", "allowedFileTypes", e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Comma-separated file extensions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enablePublicRegistration" className="text-base">Public Registration</Label>
                      <p className="text-sm text-gray-500">Allow users to register accounts</p>
                    </div>
                    <Switch
                      id="enablePublicRegistration"
                      checked={settings.general.enablePublicRegistration}
                      onCheckedChange={() => handleToggleSetting("general", "enablePublicRegistration")}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-insurance-600 hover:bg-insurance-700"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save General Settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings("security"); }} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireEmailVerification" className="text-base">Email Verification</Label>
                      <p className="text-sm text-gray-500">Require users to verify their email address</p>
                    </div>
                    <Switch
                      id="requireEmailVerification"
                      checked={settings.security.requireEmailVerification}
                      onCheckedChange={() => handleToggleSetting("security", "requireEmailVerification")}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        min="6"
                        max="16"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => handleInputChange("security", "passwordMinLength", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleInputChange("security", "sessionTimeout", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="passwordRequiresSpecialChar" className="text-base">Require Special Character</Label>
                      <p className="text-sm text-gray-500">Passwords must contain special characters</p>
                    </div>
                    <Switch
                      id="passwordRequiresSpecialChar"
                      checked={settings.security.passwordRequiresSpecialChar}
                      onCheckedChange={() => handleToggleSetting("security", "passwordRequiresSpecialChar")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="passwordRequiresNumber" className="text-base">Require Number</Label>
                      <p className="text-sm text-gray-500">Passwords must contain at least one number</p>
                    </div>
                    <Switch
                      id="passwordRequiresNumber"
                      checked={settings.security.passwordRequiresNumber}
                      onCheckedChange={() => handleToggleSetting("security", "passwordRequiresNumber")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableTwoFactor" className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Enable two-factor authentication for accounts</p>
                    </div>
                    <Switch
                      id="enableTwoFactor"
                      checked={settings.security.enableTwoFactor}
                      onCheckedChange={() => handleToggleSetting("security", "enableTwoFactor")}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-insurance-600 hover:bg-insurance-700"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Security Settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Document Settings */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Settings</CardTitle>
              <CardDescription>Configure document processing and storage settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings("documents"); }} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireApproval" className="text-base">Document Approval</Label>
                      <p className="text-sm text-gray-500">Require admin approval for uploaded documents</p>
                    </div>
                    <Switch
                      id="requireApproval"
                      checked={settings.documents.requireApproval}
                      onCheckedChange={() => handleToggleSetting("documents", "requireApproval")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowMultipleVersions" className="text-base">Document Versioning</Label>
                      <p className="text-sm text-gray-500">Allow multiple versions of the same document</p>
                    </div>
                    <Switch
                      id="allowMultipleVersions"
                      checked={settings.documents.allowMultipleVersions}
                      onCheckedChange={() => handleToggleSetting("documents", "allowMultipleVersions")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="automaticBackups" className="text-base">Automatic Backups</Label>
                      <p className="text-sm text-gray-500">Automatically backup documents</p>
                    </div>
                    <Switch
                      id="automaticBackups"
                      checked={settings.documents.automaticBackups}
                      onCheckedChange={() => handleToggleSetting("documents", "automaticBackups")}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <Input
                        id="backupFrequency"
                        value={settings.documents.backupFrequency}
                        onChange={(e) => handleInputChange("documents", "backupFrequency", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
                      <Input
                        id="retentionPeriod"
                        type="number"
                        value={settings.documents.retentionPeriod}
                        onChange={(e) => handleInputChange("documents", "retentionPeriod", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="automaticOCR" className="text-base">Automatic OCR</Label>
                      <p className="text-sm text-gray-500">Process documents with OCR for text extraction</p>
                    </div>
                    <Switch
                      id="automaticOCR"
                      checked={settings.documents.automaticOCR}
                      onCheckedChange={() => handleToggleSetting("documents", "automaticOCR")}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-insurance-600 hover:bg-insurance-700"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Document Settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system and user notification settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings("notifications"); }} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="adminEmailNotifications" className="text-base">Admin Email Notifications</Label>
                      <p className="text-sm text-gray-500">Send email notifications to administrators</p>
                    </div>
                    <Switch
                      id="adminEmailNotifications"
                      checked={settings.notifications.adminEmailNotifications}
                      onCheckedChange={() => handleToggleSetting("notifications", "adminEmailNotifications")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="userUploadNotifications" className="text-base">Document Upload Notifications</Label>
                      <p className="text-sm text-gray-500">Notify admins when users upload documents</p>
                    </div>
                    <Switch
                      id="userUploadNotifications"
                      checked={settings.notifications.userUploadNotifications}
                      onCheckedChange={() => handleToggleSetting("notifications", "userUploadNotifications")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="documentExpirationAlerts" className="text-base">Document Expiration Alerts</Label>
                      <p className="text-sm text-gray-500">Alert users when documents are about to expire</p>
                    </div>
                    <Switch
                      id="documentExpirationAlerts"
                      checked={settings.notifications.documentExpirationAlerts}
                      onCheckedChange={() => handleToggleSetting("notifications", "documentExpirationAlerts")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="systemMaintenanceAlerts" className="text-base">System Maintenance Alerts</Label>
                      <p className="text-sm text-gray-500">Notify users about scheduled maintenance</p>
                    </div>
                    <Switch
                      id="systemMaintenanceAlerts"
                      checked={settings.notifications.systemMaintenanceAlerts}
                      onCheckedChange={() => handleToggleSetting("notifications", "systemMaintenanceAlerts")}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-insurance-600 hover:bg-insurance-700"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Notification Settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;