# Didiclone

React Native CLI MVP for an academic Didi-style ride-hailing mobile app. The app includes Firebase authentication, profile management, Google Maps destination search, route estimates, fare calculation, simulated real-time driver tracking, Stripe demo payments, trip history, Redux state management, and Spanish/English UI text.

## Tech Stack

- React Native CLI with JavaScript
- Redux Toolkit
- React Navigation
- Firebase Auth, Cloud Firestore, and Storage
- Google Maps, Places Autocomplete, Directions, and Distance Matrix
- Stripe React Native SDK with a small Node/Express demo backend
- i18next / react-i18next

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Fill in:

- `GOOGLE_MAPS_API_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_API_BASE_URL`
- `STRIPE_SECRET_KEY`

4. Configure Firebase native files:

- Android: replace the demo `android/app/google-services.json` with the real file from Firebase Console.
- iOS: add `GoogleService-Info.plist` to the iOS project.

5. Enable Firebase products:

- Authentication with email/password.
- Cloud Firestore.
- Storage.

6. Enable Google Cloud APIs:

- Maps SDK for Android
- Maps SDK for iOS
- Places API
- Directions API
- Distance Matrix API

## Running the App

Start Metro:

```bash
npm start
```

Run Android:

```bash
npm run android
```

Run iOS:

```bash
npm run ios
```

Run the Stripe demo backend:

```bash
npm run stripe:dev
```

For Android emulator access to the local Stripe server, keep `STRIPE_API_BASE_URL=http://10.0.2.2:4242`.

## Firestore Model

`users`

- `id`
- `fullName`
- `phoneNumber`
- `gender`
- `email`
- `preferredLanguage`
- `photoUrl`
- `createdAt`
- `updatedAt`

`trips`

- `id`
- `userId`
- `origin`
- `destination`
- `distanceKm`
- `durationMinutes`
- `vehicleCategory`
- `estimatedFare`
- `finalFare`
- `status`
- `driverLocation`
- `paymentStatus`
- `paymentProvider`
- `currency`
- `createdAt`
- `completedAt`

## Git Workflow

- Create one branch per feature or team member.
- Use clear English commit messages.
- Open pull requests into `main`.
- Review code before merging.
- Keep secrets out of Git.

Recommended branches:

- `feature/project-setup`
- `feature/auth-profile`
- `feature/maps-ride-request`
- `feature/trip-tracking`
- `feature/stripe-payment`
- `feature/trip-history`

## Quality Checks

```bash
npm run lint
npm test
```

## E2E Testing (Detox)

This project includes Detox-based Android E2E tests (the equivalent of Cypress for React Native apps).

List available Android emulators:

```bash
npm run e2e:android:avds
```

Build the app for E2E:

```bash
npm run test:e2e:build:android
```

Run E2E tests:

```bash
npm run test:e2e:android
```

Note: the E2E helper script auto-detects Android SDK and injects emulator/platform-tools into PATH, so it works even if `emulator` is not globally available in your terminal.

## MVP Notes

- Driver tracking is simulated for the academic MVP.
- Stripe is implemented as a demo payment flow.
- MercadoPago is intentionally deferred as a future enhancement.
- Visible UI text supports Spanish and English.
- Code, identifiers, comments, and technical documentation are written in English.
