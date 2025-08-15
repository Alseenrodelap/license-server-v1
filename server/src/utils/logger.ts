import fs from 'fs';
import path from 'path';

const logsDirectory = path.join(process.cwd(), 'logs');
const serverLogPath = path.join(logsDirectory, 'server.log');

function ensureLogFile(): void {
	try {
		if (!fs.existsSync(logsDirectory)) {
			fs.mkdirSync(logsDirectory, { recursive: true });
		}
		if (!fs.existsSync(serverLogPath)) {
			fs.writeFileSync(serverLogPath, '');
		}
	} catch {
		// ignore
	}
}

ensureLogFile();

function write(line: string): void {
	const timestamp = new Date().toISOString();
	const entry = `[${timestamp}] ${line}\n`;
	try {
		fs.appendFile(serverLogPath, entry, () => {});
	} catch {
		// ignore
	}
	// Also echo to stdout so it shows up in the terminal when running attached
	// and still gets captured when output is redirected
	// eslint-disable-next-line no-console
	console.log(line);
}

export const logger = {
	info: (message: string) => write(`INFO  ${message}`),
	warn: (message: string) => write(`WARN  ${message}`),
	error: (message: string) => write(`ERROR ${message}`),
};

export default logger;


