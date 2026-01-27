// API URL Configuration
import getApiBase from '@utils/apiBase';

// Use centralized API base helper which returns the correct backend URL
// depending on DEV/PROD and respects the Vite proxy in development.
export const API_URL = getApiBase();

// Other configuration variables can be added here
export const CONFIG = {
    APP_NAME: 'Zixx Admin',
    API_TIMEOUT: 30000,
    DATE_FORMAT: 'YYYY-MM-DD',
    ITEMS_PER_PAGE: 10,
};