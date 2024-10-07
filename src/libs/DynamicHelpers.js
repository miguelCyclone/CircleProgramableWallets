const fs = require('fs').promises;  // Use fs promises API for better async handling
const path = require('path');

const PRINT_YELLOW = "\x1b[33m%s\x1b[0m"
const PRINT_BLUE = "\x1b[36m%s\x1b[0m"

async function generateFilename(basePath, baseName, extension) {
    let counter = 0;
    let filename;
    do {
        counter++;
        filename = `${baseName}_${counter}${extension}`;
        const fullPath = path.join(basePath, filename);
        try {
            await fs.access(fullPath);
        } catch (error) {
            if (error.code === 'ENOENT') { // File does not exist, filename is suitable
                return filename;
            }
            throw error; // Rethrow other errors
        }
    } while (true);
}

async function ensureDirectoryExists(directory) {
    await fs.mkdir(directory, { recursive: true });
}

async function writeJsonToFile(basePath, baseName, jsonObject) {
    await ensureDirectoryExists(basePath);
    const extension = '.json';
    const filename = await generateFilename(basePath, baseName, extension);
    const filePath = path.join(basePath, filename);

    await fs.writeFile(filePath, JSON.stringify(jsonObject, null, 4));
    console.log(PRINT_YELLOW, 'JSON has been written successfully to', filePath);
}

async function storeFile(_deposit, _FILE_NAME) {
    const directoryPath = path.join(__dirname, './../../src/res/wallets');  // Go Back to Root, from this script path
    await writeJsonToFile(directoryPath, _FILE_NAME, _deposit);
}

async function storeDeposit(_deposit, _FILE_NAME) {
    const directoryPath = path.join(__dirname, './../../src/res/deposits');  // Go Back to Root, from this script path
    await writeJsonToFile(directoryPath, _FILE_NAME, _deposit);
}

async function readJsonFileByName(directoryPath, targetFileName) {
    try {
        const files = await fs.readdir(directoryPath);
        const foundFile = files.find(file => file === targetFileName);

        if (foundFile) {
            const filePath = path.join(directoryPath, foundFile);
            const fileContents = await fs.readFile(filePath, 'utf8');
            return JSON.parse(fileContents);  // Parse and return the JSON object
        } else {
            return null;  // No file found
        }
    } catch (error) {
        console.error("Error accessing or reading the file:", error);
        return null;
    }
}

async function getFile(_FILE_NAME){
    const directoryPath = path.join(__dirname, './../../src/res/wallets');  // Go Back to Root, from this script path
    const WalletsFile = await readJsonFileByName(directoryPath, _FILE_NAME)
    return WalletsFile
}

async function processWithTimedMessage(duration) {
    console.log(PRINT_BLUE, "Waiting for blokchain probabilistic finality");

    // Start loading animation for a specific duration
    await timedLoadingAnimation("...", duration); // 5000 = Run for 5 seconds

    console.log(PRINT_BLUE, "Let's go!");
}

function timedLoadingAnimation(message, duration) {
    const P = ["\\", "|", "/", "-"];
    let x = 0;
    let secondsRemaining = duration / 1000;  // Convert milliseconds to seconds

    const timer = setInterval(() => {
        const symbol = P[x++];
        x %= P.length;  // Ensure x wraps around the P array properly
        process.stdout.write(`\r${message} ${symbol} (${secondsRemaining}s remaining)`);
    }, 250);

    const countdownTimer = setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining < 0) {
            clearInterval(countdownTimer);
            clearInterval(timer);
            process.stdout.write("\r" + ' '.repeat(message.length + 20) + "\r"); // Clear the line completely
        }
    }, 1000);

    return new Promise(resolve => {
        setTimeout(() => {
            clearInterval(timer);
            clearInterval(countdownTimer);
            process.stdout.write("\r" + ' '.repeat(message.length + 20) + "\r"); // Ensure the line is cleared once done
            resolve();
        }, duration);
    });
}

module.exports = {
    storeDeposit,
    storeFile,
    getFile,
    processWithTimedMessage
}