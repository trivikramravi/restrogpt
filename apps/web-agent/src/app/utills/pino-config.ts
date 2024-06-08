import * as fs from 'fs';
import * as path from 'path';

// Define the log file path
const logFilePath = path.join(__dirname, 'logs', 'app.log');

// Ensure the log directory exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create a writable stream to the log file
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

export const pinoConfig = {
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: { destination: logStream },
      },
    ],
  },
};
