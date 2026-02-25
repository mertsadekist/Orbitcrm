"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dynamically import EmojiPicker to avoid SSR issues
const Picker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  { ssr: false }
);

interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
}

// Predefined icons for common use cases
const REAL_ESTATE_ICONS = [
  "🏠", "🏡", "🏢", "🏬", "🏘️", "🏗️", "🏛️", "🏚️",
  "🏙️", "🌆", "🏞️", "🏖️", "🏕️", "🏔️", "⛰️", "🗻",
  "🏰", "🏯", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍",
  "⛩️", "🏛️", "🏟️", "🏗️", "🧱", "🪵", "🪨", "🏘️",
  "🏚️", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦",
  "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰",
  "💒", "🗾", "🗿", "🗺️", "📍", "📌", "🚪", "🔑",
  "🛏️", "🛋️", "🪑", "🚿", "🛁", "🚽", "🪠", "🧻",
];

const MEDICAL_ICONS = [
  "🏥", "⚕️", "🩺", "💊", "💉", "🩹", "🩼", "🦷",
  "🧬", "🔬", "🧪", "🧫", "🧴", "👨‍⚕️", "👩‍⚕️", "🧑‍⚕️",
  "👨‍🔬", "👩‍🔬", "🧑‍🔬", "🏨", "🚑", "🆘", "❤️", "🫀",
  "🫁", "🧠", "🦴", "👁️", "👂", "👃", "👄", "🦾",
  "🦿", "🩸", "🌡️", "💙", "💚", "💛", "🧡", "💜",
  "🤍", "🖤", "🤎", "❤️‍🩹", "💔", "💗", "💓", "💞",
];

const BUSINESS_ICONS = [
  "💼", "📊", "📈", "📉", "💰", "💵", "💴", "💶",
  "💷", "💸", "💳", "🏦", "🏢", "🏪", "🏬", "🏭",
  "📞", "📱", "📧", "📨", "📬", "📭", "📮", "📪",
  "📫", "✉️", "📝", "📄", "📃", "📑", "📊", "📈",
  "📉", "🗂️", "📂", "📁", "🗃️", "🗄️", "📋", "📌",
  "📍", "📎", "🖇️", "📏", "📐", "✂️", "🗑️", "🔒",
];

const GENERAL_ICONS = [
  "⭐", "✨", "⚡", "🔥", "💫", "🌟", "✅", "❌",
  "⚠️", "🚫", "❓", "❔", "❗", "❕", "💯", "🔴",
  "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪",
  "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫", "⬛",
  "⬜", "◼️", "◻️", "▪️", "▫️", "🔶", "🔷", "🔸",
  "🔹", "🔺", "🔻", "🔲", "🔳", "🔘", "👍", "👎",
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const handleIconSelect = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-16 text-xl p-0"
          type="button"
        >
          {value || <Smile className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="quick">Quick Select</TabsTrigger>
            <TabsTrigger value="all">All Emojis</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="p-3 space-y-3 max-h-[420px] overflow-y-auto">
            <div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                Real Estate 🏠
              </h4>
              <div className="grid grid-cols-8 gap-1">
                {REAL_ESTATE_ICONS.map((icon, idx) => (
                  <button
                    key={`real-${idx}`}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className="h-9 w-9 text-xl hover:bg-accent rounded-md transition-colors flex items-center justify-center"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                Medical & Healthcare ⚕️
              </h4>
              <div className="grid grid-cols-8 gap-1">
                {MEDICAL_ICONS.map((icon, idx) => (
                  <button
                    key={`medical-${idx}`}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className="h-9 w-9 text-xl hover:bg-accent rounded-md transition-colors flex items-center justify-center"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                Business & Office 💼
              </h4>
              <div className="grid grid-cols-8 gap-1">
                {BUSINESS_ICONS.map((icon, idx) => (
                  <button
                    key={`business-${idx}`}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className="h-9 w-9 text-xl hover:bg-accent rounded-md transition-colors flex items-center justify-center"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                General & Symbols ⭐
              </h4>
              <div className="grid grid-cols-8 gap-1">
                {GENERAL_ICONS.map((icon, idx) => (
                  <button
                    key={`general-${idx}`}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className="h-9 w-9 text-xl hover:bg-accent rounded-md transition-colors flex items-center justify-center"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="all" className="p-0">
            <Picker
              onEmojiClick={(emojiData) => handleIconSelect(emojiData.emoji)}
              width={360}
              height={400}
              searchPlaceHolder="Search emoji..."
              previewConfig={{ showPreview: false }}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
