'use client';

import { useState, useTransition } from 'react';
import type { Venue } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { revalidateAdminPaths } from '@/lib/actions';
import { updateVenue, deleteVenue } from '@/lib/data';
import { Edit, Trash2 } from 'lucide-react';

export function VenueCard({ venue }: { venue: Venue }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: venue.name,
    address: venue.address || '',
    sourceUrl: venue.sourceUrl || '',
    color: venue.color || '#000000',
  });

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        await updateVenue(venue.id, formData);
        await revalidateAdminPaths();
        toast({ title: "Venue Updated", description: `${formData.name} has been updated successfully.` });
        setIsEditOpen(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: "Update Failed", description: error.message || 'An unknown error occurred.' });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteVenue(venue.id);
        await revalidateAdminPaths();
        toast({ title: 'Venue Deleted', description: `${venue.name} has been deleted.` });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message || 'An unknown error occurred.' });
      }
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span style={{ backgroundColor: venue.color }} className="h-4 w-4 rounded-full" />
          {venue.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
         <p className="text-sm text-muted-foreground break-all">
            {venue.sourceUrl ? <a href={venue.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{venue.sourceUrl}</a> : 'No source URL'}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {venue.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Venue Name</Label>
                <Input id="name" value={formData.name} onChange={handleFieldChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={handleFieldChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceUrl">Source URL (for scraping)</Label>
                <Input id="sourceUrl" type="url" value={formData.sourceUrl} onChange={handleFieldChange} placeholder="https://example.com/events"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Venue Color</Label>
                <div className="flex items-center gap-4">
                  <Input id="color" type="color" value={formData.color} onChange={handleFieldChange} className="p-1 h-10 w-16"/>
                  <div style={{ backgroundColor: formData.color }} className="h-10 w-full rounded-md border" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isPending}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the venue "{venue.name}". This will not delete associated events, but they will no longer be linked to this venue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                {isPending ? 'Deleting...' : 'Continue'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
