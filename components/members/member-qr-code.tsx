"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, QrCode, User, Calendar, CreditCard } from "lucide-react";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  qrCode: string;
  isActive: boolean;
  joinedAt: string;
  membershipPlan?: {
    id: string;
    name: string;
    price: string;
    durationDays: number;
  };
}

interface MemberQRCodeProps {
  member: Member;
  onClose?: () => void;
}

export function MemberQRCode({ member, onClose }: MemberQRCodeProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true);
        const qrDataUrl = await QRCode.toDataURL(member.qrCode, {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrCodeImage(qrDataUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setLoading(false);
      }
    };

    generateQRCode();
  }, [member.qrCode]);

  const downloadQRCode = () => {
    const link = document.createElement("a");
    link.download = `${member.firstName}-${member.lastName}-qr-code.png`;
    link.href = qrCodeImage;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Member Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Member Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-lg font-semibold">
                {member.firstName} {member.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant={member.isActive ? "default" : "secondary"}>
                {member.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {member.email && (
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p>{member.email}</p>
            </div>
          )}

          {member.phone && (
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p>{member.phone}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p>{formatDate(member.joinedAt)}</p>
              </div>
            </div>

            {member.membershipPlan && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Plan</p>
                  <p>{member.membershipPlan.name}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Check-In QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {loading ? (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Generating QR code...</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <img
                    src={qrCodeImage}
                    alt="Member QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center max-w-xs">
                  Scan this QR code at the gym entrance for quick check-in
                </p>
                <Button onClick={downloadQRCode} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download QR Code
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-900">How to use this QR code:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Save this QR code to your phone for easy access</li>
              <li>• Show the QR code to staff when checking into the gym</li>
              <li>• This QR code is unique to you and should not be shared</li>
              <li>• Contact gym staff if you lose access to your QR code</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}