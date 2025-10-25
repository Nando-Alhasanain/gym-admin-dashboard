"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateMemberInput, UpdateMemberInput } from "@/lib/validations/member";
import { Loader2, Save, X } from "lucide-react";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  membershipPlanId?: string;
  isActive: boolean;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: string;
  durationDays: number;
}

interface MemberFormProps {
  member?: Member;
  onSuccess: (member: any) => void;
  onCancel: () => void;
}

const memberFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  membershipPlanId: z.string().uuid("Invalid membership plan ID").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export function MemberForm({ member, onSuccess, onCancel }: MemberFormProps) {
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const form = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName: member?.firstName || "",
      lastName: member?.lastName || "",
      email: member?.email || "",
      phone: member?.phone || "",
      membershipPlanId: member?.membershipPlanId || "",
      isActive: member?.isActive ?? true,
    },
  });

  useEffect(() => {
    const fetchMembershipPlans = async () => {
      try {
        const response = await fetch("/api/membership-plans?isActive=true");
        if (!response.ok) throw new Error("Failed to fetch membership plans");

        const data = await response.json();
        setMembershipPlans(data.data || []);
      } catch (error) {
        console.error("Error fetching membership plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchMembershipPlans();
  }, []);

  const onSubmit = async (values: z.infer<typeof memberFormSchema>) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        email: values.email || null,
        phone: values.phone || null,
        membershipPlanId: values.membershipPlanId || null,
      };

      const url = member ? `/api/members/${member.id}` : "/api/members";
      const method = member ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save member");
      }

      const savedMember = await response.json();
      onSuccess(savedMember);
    } catch (error) {
      console.error("Error saving member:", error);
      // You can add toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{member ? "Edit Member" : "Create New Member"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="membershipPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership Plan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingPlans}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a membership plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingPlans ? (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          Loading plans...
                        </div>
                      ) : membershipPlans.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No active plans available
                        </div>
                      ) : (
                        membershipPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ${plan.price}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a membership plan for this member. Plans can be changed later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {member && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive members cannot check in to the gym.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {member ? "Update Member" : "Create Member"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}