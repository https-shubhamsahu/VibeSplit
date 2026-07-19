# VibeSplit

Split group expenses fairly, without the spreadsheet math or the awkward "you owe me" texts.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-6-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Deployed on GitHub Pages](https://img.shields.io/badge/Deployed-GitHub_Pages-222?style=flat-square&logo=github)

## Overview

VibeSplit is a group-expense tracker built for the day-to-day reality of splitting bills with friends — canteen runs, weekend trips, shared projects. Create a trip, add members, log who paid for what, and VibeSplit computes a fair settlement automatically. Guests can join a trip via a shareable link without creating an account.

## Features

- **Trips** — create a named trip for any occasion (outing, fest, weekend getaway)
- **Shareable invites** — members join via a link, no account required (guest mode)
- **Expense logging** — record who paid and who it was for; supports itemized splits
- **Automatic settlement** — computes the minimal set of payments needed to balance everyone out
- **Trip history** — past trips and spending are retained per user
- **Light/dark theme** — theme preference persisted via React Context
- **Toast notifications & error boundaries** — user-facing feedback and crash isolation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6 |
| Backend / Data | Firebase (Auth + Firestore) |
| State | React Context (`ThemeContext`, `ToastContext`) |
| Testing | React Testing Library |
| Deployment | GitHub Pages (`gh-pages`) |

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (Firestore + Authentication enabled)

### Installation

```bash
git clone https://github.com/https-shubhamsahu/VibeSplit.git
cd VibeSplit
npm install
```

Create a Firebase config in `src/firebase.js` with your project's credentials (API key, project ID, etc.).

### Run locally

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000).

### Build & deploy

```bash
npm run build
npm run deploy   # publishes build/ to GitHub Pages
```

## Project Structure

```
src/
├── App.js                  # Router + top-level layout
├── Home.js                 # Landing page
├── Dashboard.js            # User's trip list
├── JoinTrip.js             # Join-by-link flow
├── About.js
├── components/
│   ├── ThemeToggle.js
│   ├── Toast.js
│   ├── ErrorBoundary.js
│   ├── LoadingSpinner.js
│   └── UserHistory.js
├── contexts/
│   ├── ThemeContext.js
│   └── ToastContext.js
├── services/
│   ├── authService.js
│   ├── analyticsService.js
│   ├── historyService.js
│   └── tripHistoryService.js
├── trip/
│   ├── TripForm.js         # Create a trip
│   ├── TripScreen.js       # Trip dashboard
│   ├── AddMember.js
│   ├── MemberList.js
│   ├── ExpenseForm.js
│   ├── ExpenseList.js
│   ├── BalanceSheet.js     # Settlement calculation + display
│   └── ShareTrip.js
└── firebase.js              # Firebase app initialization
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes and open a pull request

## Author

**Shubham Sahu** — Electronics & Computer Engineering, Thakur Shyamnarayan Engineering College
[GitHub](https://github.com/https-shubhamsahu) · [Socials](https://beacons.ai/shubhamsahu)
