"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeal } from "@/hooks/use-deals";
import { DealTabDetails } from "./deal-tab-details";
import { DealTabCommissions } from "./deal-tab-commissions";
import { DealTabTimeline } from "./deal-tab-timeline";
type DealDetailsSheetProps = {
  dealId: string | null;
  onClose: () => void;
  currentUserRole: string;
};
const ROLE_LEVELS: Record<string, number> = {
  EMPLOYEE: 1,
  MANAGER: 2,
  OWNER: 3,
  SUPER_ADMIN: 4,
};
export function DealDetailsSheet({
  dealId,
  onClose,
  currentUserRole,
}: DealDetailsSheetProps) {
  const { data: deal, isLoading } = useDeal(dealId);
  const isManager = (ROLE_LEVELS[currentUserRole] ?? 0) >= ROLE_LEVELS.MANAGER;
  const isOwner = (ROLE_LEVELS[currentUserRole] ?? 0) >= ROLE_LEVELS.OWNER;
  return (
    <Sheet open={!!dealId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading || !deal ? (
          <>
            <SheetHeader>
              <SheetTitle><Skeleton className="h-6 w-48" /></SheetTitle>
              <SheetDescription><Skeleton className="h-4 w-32" /></SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <Skeleton className="h-40 w-full" />
            </div>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{deal.title}</SheetTitle>
              <SheetDescription>
                {deal.assignedTo.firstName} {deal.assignedTo.lastName}
              </SheetDescription>
            </SheetHeader>
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="commissions" className="flex-1">Commissions</TabsTrigger>
                <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <DealTabDetails deal={deal} canEdit={isManager} />
              </TabsContent>
              <TabsContent value="commissions" className="mt-4">
                <DealTabCommissions deal={deal} isOwner={isOwner} />
              </TabsContent>
              <TabsContent value="timeline" className="mt-4">
                <DealTabTimeline dealId={deal.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}