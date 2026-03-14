import PQueue from 'p-queue';

/**
 * Real-Debrid API request queue
 * Limits concurrent RD API calls to prevent rate limiting
 * Max 2 simultaneous RD API operations (unrestrict or magnet)
 */
export const rdQueue = new PQueue({ concurrency: 2 }); 
