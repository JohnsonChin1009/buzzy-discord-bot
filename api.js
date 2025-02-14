import { config } from "dotenv";

config();
const scraperServerURL = process.env.WEBSCRAPER_SERVER_URL;
const hiveServerURL = process.env.HIVE_SERVER_URL;

async function fetchData(url) {
  try {
    const response = await fetch(`${scraperServerURL}/api/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("API Response: ", data);
    return data;
  } catch (error) {
    console.error(
      "Error fetching data: ",
      error instanceof Error ? error.message : JSON.stringify(error),
    );
    return null;
  }
}

async function submitData(eventDetails) {
  console.log("Event Details received: ", eventDetails);
  try {
    const response = await fetch(`${hiveServerURL}/api/addEvents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventDetails }),
    });

    const result = await response.json();

    if (!response.ok) {
      // If result is an object, ensure it gets converted to a string for logging
      throw new Error(
        result.error ? JSON.stringify(result.error) : "Failed to submit data",
      );
    }

    return result;
  } catch (error) {
    console.error(
      "Error submitting data:",
      error instanceof Error ? error.message : JSON.stringify(error),
    );
    return {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    };
  }
}

export { fetchData, submitData };
