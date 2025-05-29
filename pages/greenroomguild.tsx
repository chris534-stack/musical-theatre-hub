import Head from 'next/head';
import React from 'react';
import Link from 'next/link';

export default function GreenRoomGuild() {
  // Note: The green styling for the header and navigation is now handled directly
  // in the Header.tsx and MobileNavBar.tsx components based on the current route
  
  return (
    <>
      <Head>
        <title>Green Room Guild | Our Stage, Eugene</title>
        <style jsx global>{`
          /* GRG Page Variables and Base Styling */
          .green-room-page {
            --grg-dark-green: #2e7d32;
            --grg-light-green: #f0f7f0;
            --grg-darker-green: #1b5e20;
            --grg-light-accent: #8bc34a;
          }
          .green-room-page strong {
            color: #2e7d32;
          }
          
          /* Define animations */
          @keyframes greenTransition {
            0% { 
              background: linear-gradient(90deg, #2e3a59 60%, #4b5d8c 100%);
            }
            100% { 
              background: linear-gradient(90deg, #2e7d32 60%, #4caf50 100%);
            }
          }
          
          @keyframes textColorTransition {
            0% { color: #fff; }
            100% { color: #fff; }
          }
          
          @keyframes hoverColorTransition {
            0% { background: #ffd700; color: #2e3a59; }
            100% { background: #8bc34a; color: #1b5e20; }
          }
          
          /* Header styling */
          body.grg-theme .Header_header__KwdYD {
            background: linear-gradient(90deg, #2e7d32 60%, #4caf50 100%);
            box-shadow: 0 4px 12px rgba(46, 125, 50, 0.08);
            animation: greenTransition 0.5s ease-in-out;
          }
          
          body.grg-theme .Header_navLink__Rvw2c {
            color: white;
            animation: textColorTransition 0.5s ease-in-out;
          }
          
          body.grg-theme .Header_navLink__Rvw2c:hover,
          body.grg-theme .Header_navLink__Rvw2c:focus {
            background: #8bc34a;
            color: #1b5e20;
            animation: hoverColorTransition 0.5s ease-in-out;
          }
          
          body.grg-theme .Header_logo____uDV {
            color: white;
            animation: textColorTransition 0.5s ease-in-out;
          }
          
          body.grg-theme .Header_logo____uDV:hover {
            color: #8bc34a;
          }
          
          /* Mobile Navigation */
          body.grg-theme .MobileNavBar_mobileNavBar__PQi_q {
            background: linear-gradient(90deg, #2e7d32 60%, #4caf50 100%);
            box-shadow: 0 -2px 10px rgba(46, 125, 50, 0.1);
            animation: greenTransition 0.5s ease-in-out;
          }
          
          body.grg-theme .MobileNavBar_mobileNavBar__PQi_q a {
            color: white;
            animation: textColorTransition 0.5s ease-in-out;
          }
          
          body.grg-theme .MobileNavBar_mobileNavBar__PQi_q a.MobileNavBar_active__XHHs0,
          body.grg-theme .MobileNavBar_mobileNavBar__PQi_q a:focus {
            color: #8bc34a;
          }
        `}</style>
        <meta name="description" content="Green Room Guild - A mutual aid collective for the local theatre community" />
      </Head>
      <main className="green-room-page" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header Section */}
        <section style={{ marginBottom: 48, textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 16, color: '#2e7d32' }}>Green Room Guild</h1>
          <div style={{ maxWidth: 700, margin: '0 auto', color: '#555' }}>
            <p>A mutual aid collective for the Eugene theatre community</p>
          </div>
        </section>

        {/* About GRG Section */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: '#2e7d32' }}>About Green Room Guild</h2>
          <div style={{ background: '#f0f7f0', borderRadius: 10, padding: '1.5rem', marginBottom: 20, border: '1px solid #e0e9e0' }}>
            <p>The Green Room Guild is a mutual aid collective focused on sharing resources, skills, and support to put the community in community theatre.</p>
            <p>Our mission is to foster collaboration, provide assistance, and strengthen the bonds between theatre artists and the community.</p>
          </div>
        </section>

        {/* Get Involved / The GRG Survey Section */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: '#2e7d32' }}>Get Involved</h2>
          <div style={{ background: '#f0f7f0', borderRadius: 10, padding: '1.5rem', marginBottom: 20, border: '1px solid #e0e9e0' }}>
            <p>We're building a community-driven network of resources and support. Your participation makes this possible!</p>
            <p style={{ marginTop: 16 }}>
              <a href="#" style={{ 
                display: 'inline-block',
                background: '#2e7d32', 
                color: 'white', 
                padding: '0.7rem 1.2rem', 
                borderRadius: 6, 
                textDecoration: 'none',
                fontWeight: 500
              }}>Take the GRG Survey</a>
              <span style={{ color: '#666', marginLeft: 10, fontSize: '0.9rem' }}>(Coming soon)</span>
            </p>
          </div>
        </section>

        {/* Resource Hub Section */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: '#2e7d32' }}>Resource Hub</h2>
          <div style={{ background: '#f0f7f0', borderRadius: 10, padding: '1.5rem', marginBottom: 20, border: '1px solid #e0e9e0' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8, color: '#2e7d32' }}>Food Resources</h3>
              <p>Information about community meals and food support for community members coming soon.</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8, color: '#2e7d32' }}>Repairs & Fix-It Network</h3>
              <p>Connect with skilled volunteers who can help with repairs and maintenance tasks.</p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8, color: '#2e7d32' }}>Special Skills</h3>
              <p>A directory of community members willing to share their expertise and specialized skills.</p>
            </div>
          </div>
        </section>

        {/* GRG Events Section */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: '#2e7d32' }}>GRG Events</h2>
          <div style={{ background: '#f0f7f0', borderRadius: 10, padding: '1.5rem', marginBottom: 20, border: '1px solid #e0e9e0' }}>
            <p>Stay tuned for upcoming Green Room Guild events, workshops, and gatherings.</p>
            <p>Events will be posted here and added to the Our Stage, Eugene calendar.</p>
          </div>
        </section>

        {/* Contact/Connect Section */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: '#2e7d32' }}>Connect With Us</h2>
          <div style={{ background: '#f0f7f0', borderRadius: 10, padding: '1.5rem', border: '1px solid #e0e9e0' }}>
            <p>Follow us on social media and get in touch:</p>
            <div style={{ marginTop: 16 }}>
              <a href="#" style={{ color: '#2e7d32', textDecoration: 'none', marginRight: 16 }}>Email</a>
              <a href="#" style={{ color: '#2e7d32', textDecoration: 'none', marginRight: 16 }}>Instagram</a>
              <a href="#" style={{ color: '#2e7d32', textDecoration: 'none' }}>Facebook</a>
              <a href="#" style={{ color: '#2e7d32', textDecoration: 'none' }}>Bluesky</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
