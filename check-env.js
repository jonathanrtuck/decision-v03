// Simple script to check if environment variables are properly loaded
require("dotenv").config();

console.log("=== Environment Variables Check ===");
console.log("OpenAI API Key present:", !!process.env.OPENAI_API_KEY);
console.log(
  "OpenAI API Key length:",
  process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
);
console.log("EAS_PROJECT_ID present:", !!process.env.EAS_PROJECT_ID);
console.log("");
console.log(
  "First 5 chars of the key:",
  process.env.OPENAI_API_KEY
    ? process.env.OPENAI_API_KEY.substring(0, 5) + "..."
    : "N/A"
);
