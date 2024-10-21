# Google Maps Business Data Scraper

This project is a robust and scalable web scraping tool designed to extract business information from **Google Maps** across multiple regions and keywords. The scraper automates the process of searching for businesses like **property management companies, estate agents, and maintenance services** in various cities across the UK.

Leveraging **Puppeteer Extra** with stealth plugins and **Cheerio** for parsing, the scraper circumvents bot detection and efficiently gathers detailed business data such as **name, website, and phone number**. It processes searches for each keyword across different cities, extracts the business details, and outputs the data into a well-structured format, such as a CSV file.

## Key Features:
- **Automated Search**: The scraper performs automated searches on Google Maps for specified business types (keywords) across a list of major UK cities (regions).
- **Stealth Mode**: Utilizes **puppeteer-extra-plugin-stealth** to bypass detection and prevent blocking while interacting with Google Maps.
- **Scrolling and Data Extraction**: Implements custom scrolling to load all results on Google Maps, ensuring complete data retrieval.
- **Duplicate Removal**: The tool detects and removes duplicate entries by comparing the business name and region to ensure clean data.
- **CSV Export**: All gathered business data is neatly organized and exported to a **CSV file**, making it easy to analyze or import into other systems.
- **Dynamic and Configurable**: Keywords and regions can be easily adjusted to scrape business data from different areas or industries.

## Workflow:
1. **Initialization**: The tool launches a browser instance using Puppeteer with stealth mode to avoid detection.
2. **Search and Navigation**: For each region and keyword, the scraper constructs Google Maps search queries and navigates to the results page.
3. **Scroll to Load Data**: The scraper scrolls through the search results on the Google Maps interface until all entries are loaded.
4. **Business Data Extraction**: For each business listing, it extracts the **name, website, phone number**, and **region**, ensuring duplicate businesses are filtered out.
5. **CSV Output**: The results are exported into a **CSV file** with the fields: business name, website, phone, and region.

## Technologies Used:
- **Puppeteer Extra**: A headless browser automation library, used with the stealth plugin to interact with Google Maps as a regular user.
- **Cheerio**: A lightweight HTML parser that mimics jQuery, used to extract business details from the scraped content.
- **Node.js**: The runtime environment used to build the scraper, allowing for asynchronous and scalable operations.
- **fs (File System Module)**: Used to write the scraped data into a CSV file.

## Example Output:
The tool outputs business data in the following format:

```csv
Name,Website,Phone,Region
"Company A","https://company-a.com","123-456-7890","London"
"Company B","https://company-b.com","098-765-4321","Manchester"


## Use Cases:
Market Research: Easily collect data on businesses across different industries and regions for analysis.
Lead Generation: Gather contact information for businesses in specific sectors for outreach and marketing purposes.
Business Intelligence: Discover key players and competitors within targeted industries and regions.
This scraper is ideal for individuals or organizations looking to automate the collection of local business information from Google Maps with minimal manual effort.

