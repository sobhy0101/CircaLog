# To-Do List Review - Gemini

This is an exceptionally well-thought-out development plan. As an app tailored for Non-24 Hour Sleep-Wake Disorder (Non-24) patients, the inclusion of **cycle numbers alongside calendar dates**, **drift calculations**, and a **linear-regression-based free-running period estimate** shows an excellent understanding of circadian rhythm tracking needs.  
Looking closely at your task dependencies and ordering, the logic is highly solid, but there are a few architectural, UX, and sequencing adjustments you should consider ensuring a smoother build.

Here is a breakdown of the items that should be reordered or adjusted to prevent bottlenecking your development loop.

## **🛠️ Critical Reordering & Task Adjustments**

### **1\. Actogram Tooltip & Navigation (Move up to Blockers)**

* **Current State:** \[ 🔴 \] Build actogram component is a blocker, but \[ 🟢 \] Tooltip on hover/tap and \[ 🟢 \] Pinch-to-zoom/swipe are marked independent.  
* **The Issue:** On mobile touchscreens, an actogram chart is highly dense. Without a tooltip and horizontal swiping built right into the initial component phase, the chart will be unreadable and untestable.  
* **Fix:** Move the tooltip and basic touch navigation items from 🟢 to 🟡 or combine them directly with the core Actogram build task.

### **2\. Move "Edit/Delete Sleep Entries" Up**

* **Current State:** Marked as 🟢 independent tasks.  
* **The Issue:** When you are testing your IndexedDB CRUD operations and your Recharts actogram rendering, you *will* log bad or accidental test data. If you don't build the delete/edit capability right away, you'll constantly have to manually clear your browser storage to reset your chart views.  
* **Fix:** Move Edit and Delete sleep entries up to 🔴 or 🟡 right alongside the initial time entry forms.

### **3\. PWA Assets vs. In-App Changelog**

* **Current State:** \[ 🔴 \] In-app changelog modal is a blocker, while asset generation (\[ 🟢 \] App icons, \[ 🟢 \] Splash screen) is independent.  
* **The Issue:** A changelog modal can be a secondary enhancement before V1 wrap-up; it won't block core app functionality. However, a PWA *cannot* be cleanly installed on Android or look correct without its icons and splash definitions configured in the manifest.  
* **Fix:** Change the Changelog modal to 🟢 or 🟡, and elevate App Icons/Splash Screen to 🔴 or 🟡 before finalizing the Vite PWA plugin tasks.

## **🎨 Design System & App Shell Notes**

* **FOUC & Theme Toggle:** Excellent foresight on using a vanilla script to prevent Flash of Unstyled Content (FOUC). Since you noted that THEME\_KEY will be exported by useTheme.ts, just ensure your inline index.html script safely checks local storage using a hardcoded string or match *before* the Bundled React JS chunks load, as the HTML script won't be able to import from your TypeScript files.  
* **App Shell Padding:** Good catch on adding bottom padding for iOS/Android home indicator bars. This is frequently missed in web apps.

## **🔬 Deep Dive: The Non-24 Logic Core**

Because Non-24 data behaves completely differently from standard sleep tracking apps (where sleep is bounded strictly by a 24-hour day), pay special attention to this section:

### **🔄 The "Auto-Detect Session Type & Cycle" Bottleneck**

You have marked \[ 🔴 \] Build "Start Sleep" and \[ 🔴 \] Build manual time entry as blockers, but the logic determining *what* that data means (\[ 🟡 \] Auto-detect session type and \[ 🟡 \] Assign cycle number) is a dependency.

* **Recommendation:** When writing your IndexedDB service, the function that writes a new sleep block **must** know its cycle number at the moment of creation.  
* **The Rule:** A "Cycle" in Non-24 typically advances when a main sleep block occurs after a prolonged period of wakefulness. If a user takes a 1-hour nap, it belongs to the *current* cycle. If they sleep for 8 hours, it initiates the *next* cycle.  
* **Order of Operations:** Ensure your mathematical logic for Assign cycle number is written as a pure utility function *before* or *simultaneously* with your IndexedDB service, otherwise you will have to rewrite your DB schema and migration logic later.

## **📋 Suggested Sequential Workflow for V1 Core**

To build this cleanly without breaking things, try tackling the remaining V1 tasks in this exact order:

1. **Data Schema & Core Logic:** Define the IndexedDB schema and write the utility logic for cycle calculation and session detection.  
2. **State Layer & CRUD:** Build the IndexedDB service handling Create, Read, Update, and Delete (CRUD).  
3. **Basic Input UI:** Build the manual entry forms and simple timer screens (so you can get data into the DB).  
4. **Navigation Infrastructure:** Build the App Shell and Bottom Tab bar so you have a place to put your views.  
5. **Data Visualization:** Build the Recharts Actogram with interactive tooltips built-in from day one.  
6. **History & Insights:** Build the list views and the rolling averages/linear regression calculations.  
7. **PWA Polish:** Finalize icons, splash screens, and asset caching.

The roadmap is incredibly solid, highly structured, and shows you've set up a stellar foundation with Vite, Tailwind, and Vercel.
