import { promises as fs } from "fs";
import path from "path";

// Helper function to resolve the absolute path to bearer.txt
// Function to get the bearer token

// Helper to get the current directory from the file URL
const getCurrentDir = () => {
    const fileUrl = new URL(import.meta.url);
    let pathname = fileUrl.pathname;

    // If pathname starts with a leading slash, remove it for Windows compatibility
    if (pathname.startsWith('/')) {
        pathname = pathname.substring(1);
    }

    return path.dirname(pathname);
};

export async function getBearer(page) {

    let bearer 
    const currentDir = getCurrentDir();
    const filePath = path.resolve(currentDir, '..', 'resources', 'bearer.txt'); // Resolves to the correct path
     bearer = await fs.readFile(filePath, 'utf8'); // Using fs.readFile instead of fetch

    if (!bearer) {
        try {
            // Fetch authentication data from the server
            const missionaryObj = await page.evaluate(async () => {
                const response = await fetch("https://referralmanager.churchofjesuschrist.org/services/auth");
                return await response.json(); // Ensure it's parsed as JSON
            });

            if (!missionaryObj.token) {
                throw new Error("No token found in response");
            }

            // Save the token to bearer.txt
            await fs.writeFile(filePath, missionaryObj.token, "utf-8");

            bearer = missionaryObj.token;
        } catch (error) {
            console.error("Error fetching bearer token:", error.message);
            return null; // Return null to indicate failure
        }
    }

    return bearer;
}
