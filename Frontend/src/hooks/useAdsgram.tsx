import { useCallback, useEffect, useRef } from 'react';

// Props for our custom hook
interface UseAdsgramProps {
  blockId: string;
  onReward: () => void;
  onError?: (result: ShowPromiseResult) => void;
}

// Custom hook for AdsGram
export function useAdsgram({ blockId, onReward, onError }: UseAdsgramProps) {
  const AdControllerRef = useRef<AdControllerInstance | undefined>(undefined);

  useEffect(() => {
    AdControllerRef.current = window.Adsgram?.init({ blockId });
  }, [blockId]);

  return useCallback(async () => {
    if (AdControllerRef.current) {
      AdControllerRef.current
        .show()
        .then(() => {
          // User watched the ad till the end
          onReward();
        })
        .catch((result: ShowPromiseResult) => {
          // Error occurred or ad was skipped
         // onError?.(result);
         console.log(result)
        });
    } else {
     /* onError?.({
        error: true,
        done: false,
        state: 'load',
        description: 'Adsgram script not loaded',
      });*/
     console.log("Adsgram script not loades")
    }
  }, [onError, onReward]);
}
