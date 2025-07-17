
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { ReviewerRequest } from '@/lib/types';
import { updateReviewerRequestStatusAction } from '@/lib/actions';
import { useTransition, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

type RequestStatus = ReviewerRequest['status'];

export function ReviewerRequestManager({ initialRequests }: { initialRequests: ReviewerRequest[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleStatusUpdate = (requestId: string, userId: string, status: 'approved' | 'denied') => {
    startTransition(async () => {
      const result = await updateReviewerRequestStatusAction(requestId, userId, status);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="border-green-600/40 bg-green-500/10 text-green-700">
          <CheckCircle className="mr-1 h-3 w-3" />Approved
        </Badge>;
      case 'pending':
        return <Badge variant="secondary" className="border-yellow-600/40 bg-yellow-500/10 text-yellow-700">
          <Clock className="mr-1 h-3 w-3" />Pending
        </Badge>;
      case 'denied':
        return <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />Denied
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Requested On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialRequests.length > 0 ? initialRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.userName}</TableCell>
                <TableCell>{request.userEmail}</TableCell>
                <TableCell>{format(parseISO(request.createdAt), 'MMM d, yyyy')}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isPending}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Request Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {request.status !== 'approved' && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, request.userId, 'approved')} disabled={isPending}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                </DropdownMenuItem>
                            )}
                            {request.status !== 'denied' && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, request.userId, 'denied')} disabled={isPending}>
                                    <XCircle className="mr-2 h-4 w-4" /> Deny
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No reviewer requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
