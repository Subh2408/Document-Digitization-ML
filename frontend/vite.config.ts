import path from "path";        // Node.js path module
import { fileURLToPath } from "url";  // Node.js url module

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
// Remove lovable-tagger import if you didn't copy/install that package
// import { componentTagger } from "lovable-tagger"; 

// --- Calculate __dirname for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// -----------------------------------------

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::", // Or specific host
    port: 8080, // Or your desired port
  },
  plugins: [
    react(),
    // Conditionally include other plugins like componentTagger if needed and installed
    // mode === 'development' && componentTagger(), 
  ].filter(Boolean), // Ensure array only contains valid plugins
  resolve: {
    alias: {
      // Use the calculated __dirname
      "@": path.resolve(__dirname, "./src"), 
    },
  },
}));