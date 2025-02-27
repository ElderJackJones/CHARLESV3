import { promises as fs } from 'fs';
import path from 'path';

// Helper to get the current directory from the file URL
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

// Returns true if cookies exist and are applied, false if login is needed
export async function cookieHandler(page) {
    try {
        const currentDir = getCurrentDir();
        const filePath = path.resolve(currentDir, '..', 'resources', 'cookies.json'); // Properly resolve relative path
        const cookies = await fs.readFile(filePath, 'utf8').then(JSON.parse); // Using fs.readFile instead of fetch
        
        await page.setCookie(...cookies);
        return true;
    } catch (error) {
        console.error('Failed to load cookies:', error.message);
        return false;
    }
}

// Saves cookies to file
export async function saveCookies(cookie) {
    try {
        const currentDir = getCurrentDir();

        const filePath = path.resolve(currentDir, '..', 'resources', 'cookies.json'); // Properly resolve relative path
        await fs.writeFile(filePath, JSON.stringify(cookie, null, 2));
    } catch (error) {
        console.error('Writing cookies failed:', error.message);
    }
}
