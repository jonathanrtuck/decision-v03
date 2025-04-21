const fs = require("fs");
const readline = require("readline");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Define the path to the .env file
const envFilePath = path.join(__dirname, ".env");

// Read existing content (if any)
let existingContent = "";
try {
  existingContent = fs.readFileSync(envFilePath, "utf8");
} catch (error) {
  // File doesn't exist yet, that's fine
  console.log("Creating new .env file...");
}

console.log("===== OpenAI API Key Setup =====");
console.log(
  "This script will help you set up your .env file with your OpenAI API key."
);
console.log(
  "Your API key will be stored in the .env file and will not be shared or committed to Git."
);
console.log("\nPlease enter your OpenAI API key (starts with 'sk-'):");

rl.question("> ", (apiKey) => {
  if (!apiKey.trim()) {
    console.log("No API key provided. Exiting without changes.");
    rl.close();
    return;
  }

  // Check if the key is already in the file
  const openAIKeyRegex = /^OPENAI_API_KEY=.+/m;

  let newContent;
  if (openAIKeyRegex.test(existingContent)) {
    // Replace existing key
    newContent = existingContent.replace(
      openAIKeyRegex,
      `OPENAI_API_KEY=${apiKey.trim()}`
    );
    console.log("Updated existing OpenAI API key in .env file.");
  } else {
    // Add new key
    newContent =
      existingContent.trim() +
      (existingContent.length > 0 && !existingContent.endsWith("\n")
        ? "\n"
        : "") +
      `OPENAI_API_KEY=${apiKey.trim()}\n`;
    console.log("Added OpenAI API key to .env file.");
  }

  // Write to file
  fs.writeFileSync(envFilePath, newContent);

  console.log("\nSuccess! Your .env file has been updated.");
  console.log("Restart your Expo server for the changes to take effect.");
  rl.close();
});
