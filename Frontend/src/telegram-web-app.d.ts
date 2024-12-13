// // telegram-web-app.d.ts
// export {};

// declare global {
//   interface Window {
//     Telegram: {
//       WebApp: {
//         initDataUnsafe: {
//           user: {
//             id: number;
//             first_name: string;
//             last_name: string;
//             username: string;
//             language_code: string;
//             is_premium: boolean;
//           };
//         };
//       }
//     };
//   }
// }


// telegram-web-app.d.ts

export {};

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initDataUnsafe: {
          user: {
            id: number;
            first_name: string;
            last_name: string;
            username: string;
            language_code: string;
            is_premium: boolean;
          };
        };
      };
    };
    Adsgram: {
      init: (config: { blockId: string }) => AdControllerInstance;
    };
  }

  interface AdControllerInstance {
    show: () => Promise<ShowPromiseResult>;
  }

  interface ShowPromiseResult {
    done: boolean;
    description: string;
    state: 'load' | 'render' | 'playing' | 'destroy';
    error: boolean;
  }
}
