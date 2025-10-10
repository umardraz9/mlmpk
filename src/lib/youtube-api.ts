/**
 * YouTube API Loader Utility
 * 
 * This utility handles loading the YouTube IFrame API and provides
 * a promise-based interface to ensure the API is fully loaded before use.
 */

// Track the loading state of the YouTube API
let youtubeAPIPromise: Promise<typeof window.YT> | null = null;

/**
 * Load the YouTube IFrame API and return a promise that resolves when it's ready
 */
export function loadYouTubeAPI(): Promise<typeof window.YT> {
  // If we already have a promise, return it (prevents multiple script loads)
  if (youtubeAPIPromise) {
    return youtubeAPIPromise;
  }

  // Create a new promise for loading the API
  youtubeAPIPromise = new Promise((resolve, reject) => {
    // Skip if not in browser
    if (typeof window === 'undefined') {
      reject(new Error('YouTube API can only be loaded in browser environment'));
      return;
    }

    // If the API is already loaded, resolve immediately
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    // Store the original onYouTubeIframeAPIReady callback if it exists
    const originalCallback = window.onYouTubeIframeAPIReady;

    // Set up our callback to resolve the promise
    window.onYouTubeIframeAPIReady = () => {
      // Call the original callback if it exists
      if (originalCallback && typeof originalCallback === 'function') {
        originalCallback();
      }
      
      // Resolve our promise with the YT object
      if (window.YT) {
        console.log('YouTube API loaded successfully');
        resolve(window.YT);
      } else {
        reject(new Error('YouTube API failed to load correctly'));
      }
    };

    // Create and insert the script tag
    try {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => reject(new Error('Failed to load YouTube API script'));
      
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    } catch (error) {
      reject(error);
    }
  });

  return youtubeAPIPromise;
}

/**
 * Create a YouTube player safely after ensuring the API is loaded
 */
export async function createYouTubePlayer(
  elementId: string, 
  videoId: string, 
  options: Record<string, unknown> = {}
): Promise<unknown> {
  try {
    // Ensure the API is loaded
    const YT = await loadYouTubeAPI();
    
    // Create the player with merged options
    const playerOptions: Record<string, unknown> = {
      videoId,
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        mute: 1,
        ...(options.playerVars as Record<string, unknown> || {})
      },
      ...options
    };
    
    // Create and return the player
    return new YT.Player(elementId, playerOptions);
  } catch (error) {
    console.error('Error creating YouTube player:', error);
    throw error;
  }
}

// Add TypeScript declarations for the YouTube API
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: Record<string, unknown>) => unknown;
      ready: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}
