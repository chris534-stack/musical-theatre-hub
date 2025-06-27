'use server';

import puppeteer from 'puppeteer';

/**
 * Takes a screenshot of a given URL and returns it as a base64-encoded data URI.
 * @param url The URL to take a screenshot of.
 * @returns A promise that resolves to the data URI of the screenshot.
 */
export async function takeScreenshot(url: string): Promise<string> {
  console.log(`Taking screenshot of: ${url}`);
  let browser;
  try {
    // Launch puppeteer. The 'new' headless mode is more modern.
    // --no-sandbox is often required in containerized environments like the one used by Firebase Studio.
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set a reasonable viewport size to get a desktop-like screenshot.
    await page.setViewport({ width: 1280, height: 800 });
    
    // Go to the URL. `waitUntil: 'networkidle2'` waits for the page to be mostly loaded.
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Take the screenshot and get the buffer.
    const screenshotBuffer = await page.screenshot({ encoding: 'base64' });

    console.log('Screenshot taken successfully.');
    
    // Format as a data URI.
    return `data:image/png;base64,${screenshotBuffer}`;
  } catch (error) {
    console.error('Error taking screenshot:', error);
    throw new Error(`Failed to take screenshot of ${url}`);
  } finally {
    // Ensure the browser is always closed.
    if (browser) {
      await browser.close();
    }
  }
}
