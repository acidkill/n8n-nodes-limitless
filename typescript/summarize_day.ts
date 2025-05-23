// Import dotenv/config at the very top
import 'dotenv/config';

import axios, { AxiosError } from 'axios';
import moment from 'moment-timezone';

/**
 * @interface DailyActivity
 * @description Defines the structure for a single daily activity.
 * @property {string} timestamp - ISO string representation of when the activity occurred.
 * @property {string} description - A description of the activity.
 */
interface DailyActivity {
  timestamp: string;
  description: string;
}

/**
 * @interface N8nLlmRequest
 * @description Defines the expected structure of the request to the n8n LLM.
 * @property {string} prompt - The prompt string to send to the LLM.
 */
interface N8nLlmRequest {
  prompt: string;
}

/**
 * @interface N8nLlmResponseData
 * @description Defines the expected structure of the data within the n8n LLM response.
 * @property {string} [summary] - The summary text directly in the response.
 * @property {Array<{text: string}>} [choices] - Alternative structure for summary, e.g. from OpenAI-like APIs.
 */
interface N8nLlmResponseData {
  summary?: string;
  choices?: { text: string }[];
}

/**
 * @function getDailyData
 * @description Simulates fetching or generating data for a specific day.
 * @param {Date} date - The date for which to generate activity data.
 * @returns {DailyActivity[]} An array of mock DailyActivity objects.
 */
function getDailyData(date: Date): DailyActivity[] {
  // Use moment to format the date and create timestamps relative to it
  const dayMoment = moment(date);
  return [
    { timestamp: dayMoment.subtract(3, 'hours').toISOString(), description: "Attended team strategy meeting and discussed Q4 goals." },
    { timestamp: dayMoment.subtract(1, 'hour').toISOString(), description: "Worked on feature X - implemented the new data validation module." },
    { timestamp: dayMoment.add(30, 'minutes').toISOString(), description: "Pushed code for feature X to the development branch." },
    { timestamp: dayMoment.add(1, 'hour').toISOString(), description: "Reviewed PR from a colleague regarding UI improvements." }
  ];
}

/**
 * @async
 * @function summarizeDataWithN8n
 * @description Sends daily activity data to an n8n workflow for summarization via an LLM.
 * @param {DailyActivity[]} activities - An array of daily activities.
 * @param {string} n8nUrl - The endpoint URL for the n8n LLM workflow.
 * @param {string} [n8nApiKey] - Optional API key for the n8n workflow.
 * @param {Date} date - The date for which the summary is being generated.
 * @returns {Promise<string | null>} The summary string from the LLM, or null if an error occurs.
 */
async function summarizeDataWithN8n(
  activities: DailyActivity[],
  n8nUrl: string,
  date: Date,
  n8nApiKey?: string,
): Promise<string | null> {
  if (activities.length === 0) {
    console.log("No activities to summarize.");
    return "No activities were recorded for this day.";
  }

  // Format the activities into a prompt string
  const formattedDate = moment(date).format("MMMM Do, YYYY");
  let prompt = `Please summarize the following activities for ${formattedDate}:\n`;
  activities.forEach(activity => {
    const activityTime = moment(activity.timestamp).format("h:mm A");
    prompt += `- At ${activityTime}: ${activity.description}\n`;
  });

  const requestPayload: N8nLlmRequest = { prompt };
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (n8nApiKey) {
    headers['Authorization'] = `Bearer ${n8nApiKey}`;
    // Or if using a custom header like X-API-Key:
    // headers['X-API-Key'] = n8nApiKey;
  }

  console.log(`Sending prompt to n8n workflow at ${n8nUrl}...`);
  // console.log(`Request payload: ${JSON.stringify(requestPayload, null, 2)}`); // For debugging

  try {
    const response = await axios.post<N8nLlmResponseData>(n8nUrl, requestPayload, { headers });
    
    // Try to extract summary from common response structures
    if (response.data) {
      if (response.data.summary) {
        return response.data.summary;
      }
      if (response.data.choices && response.data.choices.length > 0 && response.data.choices[0].text) {
        return response.data.choices[0].text;
      }
    }
    console.warn("Summary not found in the expected place in n8n response:", response.data);
    return "Could not extract summary from n8n response.";

  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      console.error(`Error calling n8n workflow: ${axiosError.response.status} ${axiosError.response.statusText}`);
      console.error("Response data:", axiosError.response.data);
    } else if (axiosError.request) {
      console.error("Error calling n8n workflow: No response received.");
      console.error("Request details:", axiosError.request);
    } else {
      console.error("Error setting up n8n request:", axiosError.message);
    }
    // throw new Error("Failed to get summary from n8n workflow."); // Or return null to allow graceful handling
    return null;
  }
}

/**
 * @async
 * @function main
 * @description Main function to orchestrate the daily data fetching and summarization.
 */
async function main() {
  console.log("Starting daily summarization script...\n");

  // Load configuration from environment variables
  const n8nLlmEndpointUrl = process.env.N8N_LLM_ENDPOINT_URL;
  const n8nLlmApiKey = process.env.N8N_LLM_API_KEY; // This might be undefined, and that's okay

  // Check if N8N_LLM_ENDPOINT_URL is set
  if (!n8nLlmEndpointUrl) {
    console.error("FATAL: N8N_LLM_ENDPOINT_URL is not defined in your .env file.");
    console.error("Please set it to your n8n workflow URL that handles summarization.");
    process.exit(1); // Exit if critical configuration is missing
  }

  if (!n8nLlmApiKey) {
    console.warn("Warning: N8N_LLM_API_KEY is not set. The n8n workflow might require it for authentication.");
  }

  try {
    // Get the current date (or any specific date you want to summarize for)
    // For testing, you might want to use a fixed date:
    // const currentDate = moment("2023-11-15T10:00:00.000Z").toDate(); 
    const currentDate = moment.tz(moment.tz.guess()).startOf('day').toDate(); // Today in system's timezone
    console.log(`Generating summary for date: ${moment(currentDate).format("YYYY-MM-DD")}`);


    // Fetch/generate daily data
    const dailyActivities = getDailyData(currentDate);

    if (dailyActivities.length === 0) {
      console.log("No activities found for today. Nothing to summarize.");
      return;
    }
    console.log(`\nFound ${dailyActivities.length} activities to summarize:`);
    dailyActivities.forEach(act => console.log(`- ${moment(act.timestamp).format("HH:mm")}: ${act.description}`));


    // Summarize data using n8n LLM
    console.log("\nAttempting to summarize activities via n8n LLM...");
    const summary = await summarizeDataWithN8n(dailyActivities, n8nLlmEndpointUrl, currentDate, n8nLlmApiKey);

    if (summary) {
      console.log("\n--- Daily Summary ---");
      console.log(summary);
      console.log("--- End of Summary ---\n");
    } else {
      console.log("\nNo summary was generated or an error occurred.\n");
    }

  } catch (error) {
    console.error("\nAn unexpected error occurred in the main function:", error);
  } finally {
    console.log("Daily summarization script finished.");
  }
}

// Run the main function
main();
