"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QRScanner } from "./qr-scanner";
import { CheckOutButton } from "./check-out-button";
import { toast } from "sonner";
import {
  Users,
  LogIn,
  LogOut,
  Clock,
  Search,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  isActive: boolean;
  membershipPlan?: {
    name: string;
  };
}

interface CheckInLog {
  id: string;
  memberId: string;
  checkInTime: string;
  checkOutTime?: string;
  notes?: string;
  member?: Member;
}

interface AttendanceStats {
  totalToday: number;
  currentlyCheckedIn: number;
  totalThisWeek: number;
  totalThisMonth: number;
}

interface CurrentlyCheckedIn {
  id: string;
  memberId: string;
  checkInTime: string;
  member: Member;
}

interface AttendanceResponse {
  data: CheckInLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  currentlyCheckedIn: CurrentlyCheckedIn[];
}

export function AttendanceDashboard() {
  const [attendanceLogs, setAttendanceLogs] = useState<CheckInLog[]>([]);
  const [currentlyCheckedIn, setCurrentlyCheckedIn] = useState<CurrentlyCheckedIn[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalToday: 0,
    currentlyCheckedIn: 0,
    totalThisWeek: 0,
    totalThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        startDate: selectedDate,
        endDate: selectedDate,
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/attendance/logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch attendance data");

      const data: AttendanceResponse = await response.json();
      setAttendanceLogs(data.data);
      setCurrentlyCheckedIn(data.currentlyCheckedIn);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogs = data.data.filter(
        (log) => new Date(log.checkInTime) >= today
      );

      setStats({
        totalToday: todayLogs.length,
        currentlyCheckedIn: data.currentlyCheckedIn.length,
        totalThisWeek: calculateWeeklyCount(data.data),
        totalThisMonth: calculateMonthlyCount(data.data),
      });
    } catch (error) {
      toast.error("Failed to load attendance data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, searchTerm]);

  const calculateWeeklyCount = (logs: CheckInLog[]) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return logs.filter((log) => new Date(log.checkInTime) >= oneWeekAgo).length;
  };

  const calculateMonthlyCount = (logs: CheckInLog[]) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return logs.filter((log) => new Date(log.checkInTime) >= oneMonthAgo).length;
  };

  const handleCheckInSuccess = (result: any) => {
    fetchAttendanceData(); // Refresh data
  };

  const formatDuration = (checkInTime: string, checkOutTime?: string) => {
    const start = new Date(checkInTime);
    const end = checkOutTime ? new Date(checkOutTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Today</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
            <p className="text-xs text-muted-foreground">
              Check-ins for {formatDate(selectedDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently In</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentlyCheckedIn}</div>
            <p className="text-xs text-muted-foreground">
              Active check-ins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scanner">Check-in Scanner</TabsTrigger>
          <TabsTrigger value="currently">Currently Checked In</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-6">
          <QRScanner onCheckInSuccess={handleCheckInSuccess} />
        </TabsContent>

        <TabsContent value="currently" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Currently Checked In ({currentlyCheckedIn.length})</CardTitle>
              <CardDescription>
                Members currently in the gym
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : currentlyCheckedIn.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No members currently checked in
                </div>
              ) : (
                <div className="space-y-4">
                  {currentlyCheckedIn.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">
                            {checkIn.member.firstName} {checkIn.member.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Checked in at {formatTime(checkIn.checkInTime)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Duration: {formatDuration(checkIn.checkInTime)}
                          </p>
                        </div>
                        {checkIn.member.membershipPlan && (
                          <Badge variant="secondary">
                            {checkIn.member.membershipPlan.name}
                          </Badge>
                        )}
                      </div>
                      <CheckOutButton
                        checkInId={checkIn.id}
                        onSuccess={() => fetchAttendanceData()}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                View past check-ins and check-outs
              </CardDescription>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="date">Date:</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[300px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : attendanceLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No attendance records found for {formatDate(selectedDate)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead>Check-out Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.member
                            ? `${log.member.firstName} ${log.member.lastName}`
                            : "Unknown Member"}
                        </TableCell>
                        <TableCell>{formatTime(log.checkInTime)}</TableCell>
                        <TableCell>
                          {log.checkOutTime ? formatTime(log.checkOutTime) : "-"}
                        </TableCell>
                        <TableCell>{formatDuration(log.checkInTime, log.checkOutTime)}</TableCell>
                        <TableCell>
                          {log.member?.membershipPlan ? (
                            <Badge variant="secondary">
                              {log.member.membershipPlan.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No Plan</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!log.checkOutTime && (
                            <CheckOutButton
                              checkInId={log.id}
                              onSuccess={() => fetchAttendanceData()}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}