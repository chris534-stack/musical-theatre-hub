import React from 'react';
import { NextPage } from 'next';
import { ErrorProps } from 'next/error';
import Head from 'next/head';

const Error: NextPage<ErrorProps> = ({ statusCode, title }) => {
  return (
    <div className="error-container">
      <Head>
        <title>{statusCode ? `${statusCode}: ${title || 'Error'}` : 'Application Error'}</title>
      </Head>
      <div className="error-content">
        <h1>{statusCode ? `${statusCode}: ${title || 'Error'}` : 'An error occurred'}</h1>
        <p>We're sorry, something went wrong. Please try again later.</p>
        <a href="/">Return to home page</a>
      </div>
      <style jsx>{`
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          text-align: center;
        }
        .error-content {
          max-width: 600px;
          padding: 40px;
          border-radius: 8px;
          background-color: #f8f9fa;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #dc3545;
          margin-bottom: 20px;
        }
        a {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.3s;
        }
        a:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default Error;
