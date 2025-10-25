"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LogOut, Clock } from "lucide-react";
import { toast } from "sonner";

interface CheckOutButtonProps {
  checkInId: string;
  onSuccess: () => void;
}

export function CheckOutButton({ checkInId, onSuccess }: CheckOutButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState("");

  const handleCheckOut = async () => {
    try {
      setIsProcessing(true);

      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkInId,
          notes: notes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Member checked out successfully");
        setIsDialogOpen(false);
        setNotes("");
        onSuccess();
      } else {
        toast.error(result.error || "Check-out failed");
      }
    } catch (error) {
      console.error("Error checking out member:", error);
      toast.error("Network error - please try again");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Check Out
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Member Check-out
          </DialogTitle>
          <DialogDescription>
            Confirm the member is leaving the gym and add any notes if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="checkout-notes">Notes (Optional)</Label>
            <Textarea
              id="checkout-notes"
              placeholder="Add any check-out notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isProcessing}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNotes("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Check Out
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}