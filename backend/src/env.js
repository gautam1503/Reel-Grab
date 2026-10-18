import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Imported first by server.js so modules that read env at load time see backend/.env,
// regardless of which directory the server is started from.
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
