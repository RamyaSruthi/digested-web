"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Archive, BookOpen } from "lucide-react";

interface DigestedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeep: () => void;
  onArchive: () => void;
}

export function DigestedDialog({ open, onOpenChange, onKeep, onArchive }: DigestedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-teal-light mx-auto mb-2">
            <CheckCircle className="w-6 h-6 text-brand-teal" />
          </div>
          <DialogTitle className="text-center">Great, you've digested this!</DialogTitle>
          <DialogDescription className="text-center">
            Would you like to see this link again in the future?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            className="w-full bg-brand-purple hover:bg-brand-purple-dark gap-2"
            onClick={() => { onKeep(); onOpenChange(false); }}
          >
            <BookOpen className="w-4 h-4" />
            Yes, keep it for later
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 text-text-muted hover:text-text-primary"
            onClick={() => { onArchive(); onOpenChange(false); }}
          >
            <Archive className="w-4 h-4" />
            No, archive it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
