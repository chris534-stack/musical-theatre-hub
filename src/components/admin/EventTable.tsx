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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, CheckCircle, XCircle, Edit, Clock, Trash2 } from 'lucide-react';
import type { Event, Venue, EventStatus } from '@/lib/types';
import { revalidateAdminPaths } from '@/lib/actions';
import { updateEvent, deleteEvent } from '@/lib/data-client';
import { useTransition, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { toTitleCase } from '@/lib/utils';
import { EventEditorModal } from './EventEditorModal';

type EventWithVenue = Event & { venue?: Venue };

function formatFirstOccurrence(event: Event): string {
    if (!event.occurrences || event.occurrences.length === 0) {
        return 'No performances';
    }
    const firstOccurrence = event.occurrences[0];
    const firstDate = new Date(`${firstOccurrence.date}T${firstOccurrence.time || '00:00:00'}`);
    
    const datePart = format(firstDate, 'MMM d, yyyy');
    const timePart = firstOccurrence.time ? ` at ${format(firstDate, 'h:mm a')}` : '';

    if (event.occurrences.length > 1) {
        return `Starts ${datePart} (${event.occurrences.length} total)`;
    }
    return `${datePart}${timePart}`;
}

export function EventTable({ events, venues }: { events: EventWithVenue[], venues: Venue[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const handleStatusUpdate = (eventId: string, status: 'approved' | 'denied') => {
    startTransition(async () => {
      try {
        await updateEvent(eventId, { status });
        await revalidateAdminPaths();
        toast({ title: 'Success', description: `Event status updated to ${status}.` });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update event status.' });
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedEventId) return;
    
    // Store id and close dialog before starting transition
    // to avoid race conditions with state updates.
    const eventIdToDelete = selectedEventId;
    setIsAlertOpen(false);
    setSelectedEventId(null);
    
    startTransition(async () => {
      try {
        await deleteEvent(eventIdToDelete);
        await revalidateAdminPaths();
        toast({ title: 'Success', description: 'Event has been deleted.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete event.' });
      }
    });
  }

  const handleDeleteClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsAlertOpen(true);
  }

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
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
    <>
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
                  <TableCell className="font-medium">{toTitleCase(event.title)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEditClick(event)} disabled={isPending}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(event.id)} disabled={isPending} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEventId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isPending}>
                {isPending ? 'Deleting...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EventEditorModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        eventToEdit={editingEvent}
        venues={venues}
      />
    </>
  );
}
