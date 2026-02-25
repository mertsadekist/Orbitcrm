"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useFullLead } from "@/hooks/use-leads";
import { LeadDetailsHeader } from "@/components/leads/lead-details-header";
import { LeadDetailsContact } from "@/components/leads/lead-details-contact";
import { LeadDetailsActions } from "@/components/leads/lead-details-actions";
import { LeadTabDetails } from "@/components/leads/lead-tab-details";
import { LeadTabQuiz } from "@/components/leads/lead-tab-quiz";
import { LeadTabTimeline } from "@/components/leads/lead-tab-timeline";
import { LeadTabDeals } from "@/components/leads/lead-tab-deals";
import { LeadTabNotes } from "@/components/leads/lead-tab-notes";
import { CloseDealModal } from "@/components/deals/close-deal-modal";
import type { CompanyUser } from "@/types/lead";

type LeadDetailsModalProps = {
  leadId: string | null;
  onClose: () => void;
  companyUsers: CompanyUser[];
  userRole: string;
};

function LoadingSkeleton() {
  return (
    <div className="flex-1 px-6 pb-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <Skeleton className="h-px w-full" />

      {/* Contact skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-40" />
      </div>

      <Skeleton className="h-px w-full" />

      {/* Actions skeleton */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[160px]" />
        </div>
      </div>

      <Skeleton className="h-px w-full" />

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export function LeadDetailsModal({
  leadId,
  onClose,
  companyUsers,
  userRole,
}: LeadDetailsModalProps) {
  const { data: lead, isLoading } = useFullLead(leadId);
  const [showCloseDeal, setShowCloseDeal] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Sheet open={!!leadId} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:w-[45vw] sm:min-w-[540px] sm:max-w-[900px] overflow-y-auto p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>Lead Details</SheetTitle>
          </SheetHeader>

          {isLoading || !lead ? (
            <LoadingSkeleton />
          ) : (
            <div className="flex-1 px-6 pb-6 space-y-4">
              <LeadDetailsHeader lead={lead} />

              <Separator />

              <LeadDetailsContact lead={lead} />

              <Separator />

              <LeadDetailsActions lead={lead} companyUsers={companyUsers} />

              <Separator />

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="deals">Deals</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <LeadTabDetails lead={lead} />
                </TabsContent>

                <TabsContent value="quiz" className="mt-4">
                  <LeadTabQuiz quizResponses={lead.quizResponses} />
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <LeadTabTimeline leadId={lead.id} />
                </TabsContent>

                <TabsContent value="deals" className="mt-4">
                  <LeadTabDeals
                    deals={lead.deals}
                    onCreateDeal={() => setShowCloseDeal(true)}
                  />
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <LeadTabNotes lead={lead} userRole={userRole} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </SheetContent>

      {lead && (
        <CloseDealModal
          lead={lead}
          open={showCloseDeal}
          onClose={() => setShowCloseDeal(false)}
          companyUsers={companyUsers}
        />
      )}
    </Sheet>
  );
}
