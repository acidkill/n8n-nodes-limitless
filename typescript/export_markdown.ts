// Import dotenv/config to load environment variables
import 'dotenv/config';

/**
 * @interface MarkdownConvertible
 * @description Defines the structure for objects that can be converted to Markdown sections.
 * @property {string} title - The title of the section, used as a heading.
 * @property {string} content - The main content of the section.
 * @property {string} [author] - Optional author of the content.
 * @property {string} [date] - Optional date of the content.
 */
interface MarkdownConvertible {
  title: string;
  content: string;
  author?: string;
  date?: string;
}

/**
 * @function arrayToMarkdownTable
 * @description Converts an array of objects into a Markdown table string.
 * @param {Record<string, any>[]} data - An array of objects to convert. Each object should have string key-value pairs.
 * @returns {string} A Markdown formatted table, or a message if the array is empty.
 */
function arrayToMarkdownTable(data: Record<string, any>[]): string {
  if (!data || data.length === 0) {
    return "No data provided to create a table.";
  }

  const headers = Object.keys(data[0]);
  const headerRow = `| ${headers.join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;

  const bodyRows = data.map(row => {
    const values = headers.map(header => row[header] !== undefined ? String(row[header]) : "");
    return `| ${values.join(" | ")} |`;
  });

  return [headerRow, separatorRow, ...bodyRows].join("\n");
}

/**
 * @function objectsToMarkdownSections
 * @description Converts an array of MarkdownConvertible objects into a Markdown string with each object as a section.
 * @param {MarkdownConvertible[]} items - An array of objects conforming to the MarkdownConvertible interface.
 * @returns {string} A Markdown formatted string with sections for each item.
 */
function objectsToMarkdownSections(items: MarkdownConvertible[]): string {
  if (!items || items.length === 0) {
    return "No items provided to create Markdown sections.";
  }

  return items.map(item => {
    let section = `## ${item.title}\n\n`;
    if (item.author) {
      section += `_Author: ${item.author}_\n`;
    }
    if (item.date) {
      section += `_Date: ${item.date}_\n`;
    }
    if (item.author || item.date) {
        section += '\n'; // Add a newline if there was author or date
    }
    section += `${item.content}\n\n---\n`;
    return section;
  }).join("\n");
}

/**
 * @async
 * @function main
 * @description Main function to demonstrate the usage of Markdown conversion functions.
 */
async function main() {
  console.log("Demonstrating Markdown conversion utilities:\n");

  try {
    // Demonstrate arrayToMarkdownTable
    console.log("--- arrayToMarkdownTable Example ---");
    const tableData = [
      { id: "1", name: "Alice Wonderland", email: "alice@example.com" },
      { id: "2", name: "Bob The Builder", email: "bob@example.com", status: "Active" },
      { id: "3", name: "Charlie Chaplin", email: "charlie@example.com" },
    ];
    const markdownTable = arrayToMarkdownTable(tableData);
    console.log(markdownTable);
    console.log("\n");

    const emptyTableData: Record<string, any>[] = [];
    const emptyMarkdownTable = arrayToMarkdownTable(emptyTableData);
    console.log(emptyMarkdownTable);
    console.log("\n");


    // Demonstrate objectsToMarkdownSections
    console.log("--- objectsToMarkdownSections Example ---");
    const sectionData: MarkdownConvertible[] = [
      {
        title: "My First Blog Post",
        content: "This is the exciting content of my very first blog post. I hope you enjoy reading it!",
        author: "Jules Verne",
        date: "2023-10-26",
      },
      {
        title: "A Day in the Life",
        content: "Today was a busy day, full of coding and problem-solving. The weather was also nice.",
        author: "Ada Lovelace",
      },
      {
        title: "Thoughts on TypeScript",
        content: "TypeScript provides strong typing for JavaScript, which can help catch errors early.",
        date: "2023-10-25",
      },
      {
        title: "Final Musings",
        content: "This is the last section for this demonstration.",
      }
    ];
    const markdownSections = objectsToMarkdownSections(sectionData);
    console.log(markdownSections);

    const emptySectionData: MarkdownConvertible[] = [];
    const emptyMarkdownSections = objectsToMarkdownSections(emptySectionData);
    console.log(emptyMarkdownSections);


  } catch (error) {
    console.error("An error occurred in the main function:", error);
  }
}

// Run the main function
main();
