'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';

interface GalleryViewerProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    startIndex?: number;
    userName?: string;
}

export function GalleryViewer({ isOpen, onClose, images, startIndex = 0, userName }: GalleryViewerProps) {
    if (!images || images.length === 0) {
        return null;
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-screen-xl w-full h-full max-h-screen p-0 m-0 bg-black/80 border-none flex items-center justify-center">
                <DialogHeader className="sr-only">
                    <DialogTitle>Image Gallery for {userName || 'User'}</DialogTitle>
                    <DialogDescription>
                        A carousel of images from the user's gallery. Use the left and right arrows to navigate.
                    </DialogDescription>
                </DialogHeader>
                <Carousel
                    opts={{
                        startIndex: startIndex,
                        loop: true,
                    }}
                    className="w-full max-w-5xl"
                >
                    <CarouselContent>
                        {images.map((url, index) => (
                            <CarouselItem key={index}>
                                <div className="relative w-full h-[80vh]">
                                    <Image
                                        src={url}
                                        alt={`Gallery image ${index + 1}`}
                                        fill
                                        className="object-contain"
                                        data-ai-hint="gallery photo"
                                        unoptimized
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80" />
                </Carousel>
            </DialogContent>
        </Dialog>
    );
}
