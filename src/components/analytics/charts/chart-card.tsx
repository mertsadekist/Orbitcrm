"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
