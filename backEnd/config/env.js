const requiredInProduction = ['JWT_SECRET', 'MONGO_URI', 'GEMINI_API_KEY'];

export function validateEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    const missing = requiredInProduction.filter((key) => !process.env[key]);
    if (missing.length) {
      console.warn(`[Environment] Warning: The following recommended production environment variables are missing: ${missing.join(', ')}`);
      console.warn('[Environment] Please configure these in your hosting environment (e.g., Render Dashboard -> Environment Variables).');
    }
  }
}
