import Head from 'next/head';
import React from 'react';

const About: React.FC = () => {
  return (
    <>
      <Head>
        <title>About Us | Eugene Musical Theatre Hub</title>
      </Head>
      <main>
        <h1>About Us</h1>
        <p>The Eugene Musical Theatre Community Hub brings together performers, directors, crew, educators, and fans to celebrate and support musical theatre in Eugene, Oregon.</p>
        <h2>Our Mission</h2>
        <p>To foster a vibrant, inclusive, and collaborative musical theatre community by providing a centralized platform for events, opportunities, and resources.</p>
        <h2>Our Vision</h2>
        <p>A thriving, connected community where everyone can participate in and enjoy the performing arts.</p>
        <h2>Participating Organizations</h2>
        <ul>
          <li>Hult Center for the Performing Arts</li>
          <li>Actors Cabaret of Eugene</li>
          <li>Oregon Contemporary Theatre (OCT)</li>
          <li>Very Little Theatre (VLT)</li>
          <li>...and more!</li>
        </ul>
      </main>
    </>
  );
};

export default About;

