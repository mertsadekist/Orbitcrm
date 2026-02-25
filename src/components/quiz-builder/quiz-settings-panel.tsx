"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { QuizConfig } from "@/types/quiz";

interface QuizSettingsPanelProps {
  config: QuizConfig;
  onChange: (config: QuizConfig) => void;
}

export function QuizSettingsPanel({
  config,
  onChange,
}: QuizSettingsPanelProps) {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="general" className="flex-1">
          General
        </TabsTrigger>
        <TabsTrigger value="welcome" className="flex-1">
          Welcome
        </TabsTrigger>
        <TabsTrigger value="tracking" className="flex-1">
          Tracking
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Thank You Message</Label>
          <Textarea
            value={config.settings.thankYouMessage}
            onChange={(e) =>
              onChange({
                ...config,
                settings: {
                  ...config.settings,
                  thankYouMessage: e.target.value,
                },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Redirect URL</Label>
          <Input
            value={config.settings.redirectUrl ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                settings: {
                  ...config.settings,
                  redirectUrl: e.target.value || null,
                },
              })
            }
            placeholder="https://example.com/thank-you"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="showProgressBar"
            checked={config.settings.showProgressBar}
            onCheckedChange={(checked) =>
              onChange({
                ...config,
                settings: {
                  ...config.settings,
                  showProgressBar: checked,
                },
              })
            }
          />
          <Label htmlFor="showProgressBar">Show Progress Bar</Label>
        </div>
      </TabsContent>

      <TabsContent value="welcome" className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <Switch
            id="welcomeEnabled"
            checked={config.welcomeScreen.enabled}
            onCheckedChange={(checked) =>
              onChange({
                ...config,
                welcomeScreen: {
                  ...config.welcomeScreen,
                  enabled: checked,
                },
              })
            }
          />
          <Label htmlFor="welcomeEnabled">Enable Welcome Screen</Label>
        </div>

        {config.welcomeScreen.enabled && (
          <>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={config.welcomeScreen.title ?? ""}
                onChange={(e) =>
                  onChange({
                    ...config,
                    welcomeScreen: {
                      ...config.welcomeScreen,
                      title: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={config.welcomeScreen.description ?? ""}
                onChange={(e) =>
                  onChange({
                    ...config,
                    welcomeScreen: {
                      ...config.welcomeScreen,
                      description: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={config.welcomeScreen.buttonText ?? ""}
                onChange={(e) =>
                  onChange({
                    ...config,
                    welcomeScreen: {
                      ...config.welcomeScreen,
                      buttonText: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="tracking" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Facebook Pixel ID</Label>
          <Input
            value={config.tracking.facebookPixelId ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                tracking: {
                  ...config.tracking,
                  facebookPixelId: e.target.value || undefined,
                },
              })
            }
            placeholder="Enter your Facebook Pixel ID"
          />
          <p className="text-xs text-muted-foreground">
            Used to track quiz completions with Facebook Ads
          </p>
        </div>

        <div className="space-y-2">
          <Label>TikTok Pixel ID</Label>
          <Input
            value={config.tracking.tiktokPixelId ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                tracking: {
                  ...config.tracking,
                  tiktokPixelId: e.target.value || undefined,
                },
              })
            }
            placeholder="Enter your TikTok Pixel ID"
          />
          <p className="text-xs text-muted-foreground">
            Used to track quiz completions with TikTok Ads
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
