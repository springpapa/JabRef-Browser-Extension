import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  // Place source files in the `src` directory
  // https://wxt.dev/guide/essentials/project-structure.html#adding-a-src-directory
  srcDir: "src",
  targetBrowsers: ["chrome", "firefox", "opera", "edge"],
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    browser_specific_settings: {
      gecko: {
        id: "@jabfox",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
    commands: {
      _execute_page_action: {
        suggested_key: {
          default: "Alt+Shift+J",
        },
      },
    },
    description:
      "The JabRef browser extension imports new bibliographic information directly from the browser into JabRef.",
    developer: {
      name: "JabRef",
      url: "http://www.jabref.org/",
    },
    homepage_url: "http://www.jabref.org/",
    host_permissions: ["<all_urls>"],
    icons: {
      "16": "/JabRef-icon-16.png",
      "48": "/JabRef-icon-48.png",
      "96": "/JabRef-icon-96.png",
      "128": "/JabRef-icon-128.png",
    },
    ...(browser !== "firefox"
      ? {
        }
      : {}),
    name: "Paperbox Collector",
    permissions: [
      "scripting",
      "activeTab",
      "tabs",
      "storage",


      "webRequest",
      "declarativeNetRequest",
      ...(browser !== "firefox" ? ["offscreen"] : []),
    ],
    web_accessible_resources: [
      {
        matches: ["<all_urls>"],
        resources: ["sandbox.js", "translators/*.js"],
      },
    ],
  }),
  webExt: {
    openDevtools: true,
    startUrls: [
      "https://ieeexplore.ieee.org/abstract/document/893874",
      "https://arxiv.org/a/diez_t_1.html",
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
