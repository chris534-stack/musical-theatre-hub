'use client';

import { useState, useTransition } from 'react';
import type { Venue } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateVenueAction } from '@/lib/actions';
import { Edit } from 'lucide-react';

export function VenueCard({ venue }: { venue: Venue }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: venue.name,
    address: venue.address || '',
    sourceUrl: venue.sourceUrl || '',
    color: venue.color || '#000000',
  });

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      const result = await updateVenueAction(venue.id, formData);
      
      if (result.success) {
        toast({ title: "Venue Updated", description: `${formData.name} has been updated successfully.` });
        setIsOpen(false);
      } else {
        toast({ variant: 'destructive', title: "Update Failed", description: result.message || 'An unknown error occurred.' });
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
      <CardFooter>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Edit Venue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {venue.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
      </CardFooter>
    </Card>
  );
}
