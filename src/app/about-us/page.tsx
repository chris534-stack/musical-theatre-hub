
import { getAllVenues } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListingRequestForm } from '@/components/about/ListingRequestForm';

export default async function AboutUsPage() {
  const venues = await getAllVenues();
  const sortedVenues = [...venues].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary text-center mb-12">
          About Our Stage, Eugene
        </h1>

        <Card className="mb-8 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-accent">Who We Are</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              Our Stage, Eugene is a community-driven platform connecting performers, directors, crew, educators, and fans to celebrate and support musical theatre in Eugene, Oregon. We believe in lowering barriers, amplifying local voices, and making the arts accessible for all.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Our mission is actively evolving as our community grows. We aim to foster a vibrant, inclusive, and collaborative theatre scene by providing a centralized platform for events, opportunities, and resources. (Check back for updates as we grow together!)
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary">Our Vision</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Our vision is a thriving, connected community where everyone can participate in and enjoy the performing arts. We're always listening and adapting to community needs.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mb-12">
            <h2 className="text-3xl font-bold font-headline text-primary text-center mb-8">Participating Venues</h2>
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        {sortedVenues.map(venue => (
                            <li key={venue.id} className="flex items-center">
                                <span className="h-3 w-3 rounded-full mr-3 shrink-0" style={{ backgroundColor: venue.color }}></span>
                                <span className="text-muted-foreground">{venue.name}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </section>


        <section>
          <h2 className="text-3xl font-bold font-headline text-primary text-center mb-8">Want to be listed?</h2>
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Request to be Added</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">If you are a theatre company or venue in the Eugene area and would like to be included on our platform, please fill out the form below. We'll get in touch with you soon!</p>
                <ListingRequestForm />
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
