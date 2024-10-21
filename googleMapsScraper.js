import * as cheerio from "cheerio";
import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteer from 'puppeteer-core';
import fs from 'fs/promises';

const regions = [
  "London",
  "Birmingham",
  "Manchester",
  "Glasgow",
  "Liverpool",
  "Newcastle",
  "Sheffield",
  "Bristol",
  "Leeds",
  "Edinburgh",
  "Cardiff",
  "Belfast",
  "Nottingham",
  "Leicester",
  "Coventry",
  "Bradford",
  "Stoke-on-Trent",
  "Wolverhampton",
  "Derby",
  "Swansea",
  "Southampton",
  "Portsmouth",
  "Brighton",
  "Plymouth",
  "Aberdeen",
  "Dundee",
  "Inverness",
  "Luton",
  "Reading",
  "Slough",
  "Milton Keynes",
  "Bournemouth",
  "Southend-on-Sea",
  "York",
  "Blackpool",
  "Middlesbrough",
  "Huddersfield",
  "Sunderland",
  "Wolverhampton",
  "Wakefield",
  "Bristol",
  "Cambridge",
  "Oxford",
  "Norwich",
  "Exeter",
  "Cheltenham",
  "Gloucester",
  "Swindon",
  "Basingstoke",
  "Woking",
  "Eastbourne",
  "Dover",
  "Lichfield",
  "St Albans",
  "Belfast",
  "Derry",
  "Lisburn",
  "Newry",
  "Armagh",
  "Antrim",
  "Bangor",
  "Coleraine",
  "Craigavon",
  "Drogheda",
  "Dunfermline",
  "Falkirk",
  "Kilmarnock",
  "Livingston",
  "Perth",
  "Stirling",
  "Wokingham",
  "Basingstoke",
  "Bracknell",
  "Bromley",
  "Croydon",
  "Dartford",
  "Enfield",
  "Harrow",
  "Hounslow",
  "Islington",
  "Kingston upon Thames",
  "Lambeth",
  "Merton",
  "Redbridge",
  "Richmond upon Thames",
  "Southwark",
  "Tower Hamlets",
  "Waltham Forest",
  "Westminster",
];

const keywords = [
  "property management",
  "estate management",
  "letting agents",
  "property maintenance"
];

async function searchGoogleMaps() {
  let browser;
  let allBusinesses = [];
  const uniqueBusinesses = new Set();
  let duplicateCount = 0;

  try {
    const start = Date.now();
    puppeteerExtra.use(stealthPlugin());

    console.log("Launching browser...");
    browser = await puppeteerExtra.launch({
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=en-GB,en'],
    });

    console.log("Browser launched successfully");
    const page = await browser.newPage();

    for (const region of regions) {
      for (const keyword of keywords) {
        try {
          const query = `${keyword} ${region}`;
          console.log(`Searching for: ${query}`);

          const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@54.5,-4,6z/data=!3m1!4b1?entry=ttu&hl=en&gl=uk`;
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

          console.log("Waiting for results to load...");
          await page.waitForSelector('div[role="feed"]', { timeout: 60000 });
          console.log("Results loaded");

          await scrollToBottom(page);
          console.log("Scrolling completed");

          const businesses = await extractBusinessData(page, region);
          
          businesses.forEach(business => {
            const key = `${business.name}-${business.region}`;
            if (uniqueBusinesses.has(key)) {
              duplicateCount++;
            } else {
              uniqueBusinesses.add(key);
              allBusinesses.push(business);
            }
          });

          console.log(`Found ${businesses.length} businesses for "${query}"`);
        } catch (error) {
          console.error(`Error processing ${keyword} in ${region}:`, error.message);
        }
        
        // Wait a bit between searches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log("All searches completed");
    console.log(`Total unique businesses found: ${allBusinesses.length}`);
    console.log(`Total duplicates found: ${duplicateCount}`);

    const end = Date.now();
    console.log(`Total time in seconds: ${Math.floor((end - start) / 1000)}`);

  } catch (error) {
    console.error("Error at googleMaps:", error.message);
    console.error("Error stack:", error.stack);
  } finally {
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
      console.log("Browser closed");
    }
  }

  return allBusinesses;
}

async function scrollToBottom(page) {
  console.log("Starting to scroll to bottom...");
  let lastResultsCount = 0;
  let currentResultsCount = 0;
  let scrollAttempts = 0;
  let stuckCounter = 0;
  const maxScrollAttempts = 50; // Adjust this value if needed

  while (scrollAttempts < maxScrollAttempts) {
    currentResultsCount = await page.evaluate(() => document.querySelectorAll('div.Nv2PK').length);
    
    if (currentResultsCount > lastResultsCount) {
      console.log(`Scrolled to ${currentResultsCount} results`);
      lastResultsCount = currentResultsCount;
      scrollAttempts = 0;
      stuckCounter = 0;
    } else {
      scrollAttempts++;
      stuckCounter++;
    }

    await page.evaluate(() => {
      const feed = document.querySelector('div[role="feed"]');
      if (feed) {
        feed.scrollTop = feed.scrollHeight;
      }
    });

    await page.keyboard.press('PageDown');
    
    // Wait for potential loading indicator to appear and disappear
    try {
      await page.waitForSelector('.wo1ice-loading', { timeout: 2000 });
      await page.waitForSelector('.wo1ice-loading', { hidden: true, timeout: 10000 });
    } catch (e) {
      // If no loading indicator found, or it doesn't disappear, continue
    }

    // Check if "You've reached the end of the list." message is present
    const endOfListMessage = await page.evaluate(() => {
      const endMessage = document.querySelector('.PbZDve');
      return endMessage ? endMessage.textContent : null;
    });

    if (endOfListMessage && endOfListMessage.includes("You've reached the end of the list")) {
      console.log("Reached end of list message");
      break;
    }

    // If stuck, try to nudge the page
    if (stuckCounter > 5) {
      console.log("Seems stuck, trying to nudge...");
      await page.evaluate(() => {
        window.scrollBy(0, -100);
        setTimeout(() => window.scrollBy(0, 100), 100);
      });
      await page.keyboard.press('ArrowDown');
      stuckCounter = 0;
    }

    // Add a small delay between scroll attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("Reached bottom of page or max scroll attempts");
}

async function extractBusinessData(page, region) {
  return page.evaluate((region) => {
    const results = [];
    const items = document.querySelectorAll('div.Nv2PK');
    
    items.forEach((item) => {
      const nameElement = item.querySelector('div.qBF1Pd');
      // const ratingElement = item.querySelector('span.MW4etd');
      // const reviewsElement = item.querySelector('span.UY7F9');
      // const addressElement = item.querySelector('div.W4Efsd:nth-child(2)');
      
      // Try multiple selectors for website
      const websiteSelectors = [
        'a.lcr4fd[data-value="Website"]',
        'a[data-item-id="authority"]',
        'a[data-tooltip="Open website"]',
        'a[href^="http"]:not([href^="https://www.google.com"])'
      ];
      
      let websiteElement = null;
      for (const selector of websiteSelectors) {
        websiteElement = item.querySelector(selector);
        if (websiteElement) break;
      }
      
      const phoneElement = item.querySelector('span.UsdlK');
      
      if (nameElement) {
        const result = {
          name: nameElement.textContent.trim(),
          website: websiteElement ? websiteElement.href : null,
          phone: phoneElement ? phoneElement.textContent.trim() : null,
          region: region  // Add the region to the result
        };
        
        results.push(result);
      }
    });

    return results;
  }, region);  // Pass the region to the evaluate function
}

// Call the function
searchGoogleMaps().then(async (businesses) => {
  console.log("Businesses found:");
  businesses.forEach((business, index) => {
    console.log(`\n--- Business ${index + 1} ---`);
    console.log(`Name: ${business.name}`);
    console.log(`Website: ${business.website || 'N/A'}`);
    console.log(`Phone: ${business.phone || 'N/A'}`);
    console.log(`Region: ${business.region}`);
  });
  console.log(`\nTotal unique businesses found: ${businesses.length}`);
  console.log(`Businesses with websites: ${businesses.filter(b => b.website).length}`);
  console.log(`Businesses without websites: ${businesses.filter(b => !b.website).length}`);

  // Create CSV content
  let csvContent = "Name,Website,Phone,Region\n";
  businesses.forEach((business) => {
    const name = business.name.replace(/,/g, ""); // Remove commas from names to avoid CSV issues
    const website = business.website || "";
    const phone = business.phone || "";
    const region = business.region;
    csvContent += `"${name}","${website}","${phone}","${region}"\n`;
  });

  // Write CSV file
  const fileName = `property_management_companies_${new Date().toISOString().split('T')[0]}.csv`;
  try {
    await fs.writeFile(fileName, csvContent);
    console.log(`\nCSV file '${fileName}' has been created successfully.`);
  } catch (err) {
    console.error("Error writing CSV file:", err);
  }
}).catch(error => {
  console.error('Error:', error);
});
