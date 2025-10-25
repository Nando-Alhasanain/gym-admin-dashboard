"use client";

import { useState, useRef, useCallback } from "react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera, CameraOff, Keyboard, CheckCircle, XCircle, User } from "lucide-react";

interface CheckInResult {
  success: boolean;
  message: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    membershipPlan?: {
      name: string;
    };
  };
  checkIn?: {
    id: string;
    checkInTime: string;
  };
}

interface QRScannerProps {
  onCheckInSuccess?: (result: CheckInResult) => void;
}

export function QRScanner({ onCheckInSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualMemberId, setManualMemberId] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [scannerKey, setScannerKey] = useState(0);

  const handleScan = useCallback(async (result: string) => {
    if (!result || isProcessing) return;

    try {
      setIsProcessing(true);
      setLastResult(null);

      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCode: result,
        }),
      });

      const checkInResult: CheckInResult = await response.json();

      if (response.ok && checkInResult.success) {
        setLastResult(checkInResult);
        toast.success(`${checkInResult.member?.firstName} ${checkInResult.member?.lastName} checked in successfully!`);
        onCheckInSuccess?.(checkInResult);

        // Reset scanner after successful scan
        setTimeout(() => {
          setScannerKey(prev => prev + 1);
          setIsScanning(false);
        }, 2000);
      } else {
        setLastResult({
          success: false,
          message: checkInResult.error || "Check-in failed",
        });
        toast.error(checkInResult.error || "Check-in failed");
      }
    } catch (error) {
      console.error("Error processing check-in:", error);
      const errorMessage = "Network error - please try again";
      setLastResult({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onCheckInSuccess]);

  const handleManualCheckIn = async () => {
    if (!manualMemberId.trim()) {
      toast.error("Please enter a member ID");
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch("/api/attendance/manual-check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: manualMemberId.trim(),
          notes: manualNotes.trim() || undefined,
        }),
      });

      const checkInResult: CheckInResult = await response.json();

      if (response.ok && checkInResult.success) {
        setLastResult(checkInResult);
        toast.success(`${checkInResult.member?.firstName} ${checkInResult.member?.lastName} checked in successfully!`);
        onCheckInSuccess?.(checkInResult);
        setShowManualDialog(false);
        setManualMemberId("");
        setManualNotes("");
      } else {
        setLastResult({
          success: false,
          message: checkInResult.error || "Manual check-in failed",
        });
        toast.error(checkInResult.error || "Manual check-in failed");
      }
    } catch (error) {
      console.error("Error processing manual check-in:", error);
      toast.error("Network error - please try again");
    } finally {
      setIsProcessing(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setLastResult(null);
    setScannerKey(prev => prev + 1);
  };

  const stopScanning = () => {
    setIsScanning(false);
    setLastResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Check-in Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isScanning}
                onCheckedChange={(checked) => {
                  if (checked) {
                    startScanning();
                  } else {
                    stopScanning();
                  }
                }}
              />
              <Label>Camera Scanner</Label>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowManualDialog(true)}
              className="flex items-center gap-2"
            >
              <Keyboard className="h-4 w-4" />
              Manual Entry
            </Button>
          </div>

          {/* QR Scanner */}
          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <QrScanner
                  key={scannerKey}
                  onDecode={handleScan}
                  onError={(error) => {
                    console.error("Scanner error:", error);
                    toast.error("Camera error - please check permissions");
                  }}
                  containerStyle={{
                    width: "100%",
                    maxWidth: "400px",
                    margin: "0 auto",
                  }}
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Processing check-in...</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 text-center">
                Position the QR code in front of the camera
              </p>
            </div>
          )}

          {!isScanning && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Camera scanner is inactive</p>
              <Button onClick={startScanning}>
                <Camera className="mr-2 h-4 w-4" />
                Start Scanner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Check-in Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult.success && lastResult.member ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {lastResult.member.firstName} {lastResult.member.lastName}
                    </h3>
                    {lastResult.member.membershipPlan && (
                      <Badge variant="secondary">
                        {lastResult.member.membershipPlan.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully checked in at {new Date(lastResult.checkIn!.checkInTime).toLocaleTimeString()}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {lastResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Check-in Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manual Member Check-in</DialogTitle>
            <DialogDescription>
              Enter the member ID or use member search for manual check-in
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="memberId">Member ID</Label>
              <Input
                id="memberId"
                placeholder="Enter member UUID..."
                value={manualMemberId}
                onChange={(e) => setManualMemberId(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any check-in notes..."
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowManualDialog(false);
                  setManualMemberId("");
                  setManualNotes("");
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualCheckIn}
                disabled={isProcessing || !manualMemberId.trim()}
              >
                {isProcessing ? "Processing..." : "Check In"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}