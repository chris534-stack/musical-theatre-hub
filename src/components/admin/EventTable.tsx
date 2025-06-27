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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle, Edit, Clock } from 'lucide-react';
import type { Event, Venue, EventStatus } from '@/lib/types';
import { updateEventStatusAction } from '@/lib/actions';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type EventWithVenue = Event & { venue?: Venue };

function formatFirstOccurrence(event: Event): string {
    if (!event.occurrences || event.occurrences.length === 0) {
        return 'No performances';
    }
    const firstDate = new Date(event.occurrences[0].date);
    const datePart = format(firstDate, 'MMM d, yyyy');
    if (event.occurrences.length > 1) {
        return `Starts ${datePart} (${event.occurrences.length} total)`;
    }
    return `${datePart} at ${event.occurrences[0].time}`;
}

export function EventTable({ events, venues }: { events: EventWithVenue[], venues: Venue[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const handleStatusUpdate = (eventId: string, status: 'approved' | 'denied') => {
    startTransition(async () => {
      const result = await updateEventStatusAction(eventId, status);
      if (result.success) {
        toast({ title: 'Success', description: `Event status updated to ${status}.` });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const getStatusBadge = (status: EventStatus) => {
    switch(status) {
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
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Performances</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length > 0 ? events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>{event.venue?.name || 'N/A'}</TableCell>
                <TableCell>{formatFirstOccurrence(event)}</TableCell>
                <TableCell>{getStatusBadge(event.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Event Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator/>
                      {event.status !== 'approved' && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(event.id, 'approved')} disabled={isPending}>
                          <CheckCircle className="mr-2 h-4 w-4" /> Approve
                        </DropdownMenuItem>
                      )}
                      {event.status !== 'denied' && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(event.id, 'denied')} disabled={isPending} className="text-destructive focus:text-destructive">
                          <XCircle className="mr-2 h-4 w-4" /> Deny
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem disabled>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No events found in this category.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
