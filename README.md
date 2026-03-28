# GasFlow Delivery - Monorepo

This repository contains the full logistics management system for gas cylinder delivery.



## Project Structure

- `mobile/`: Driver App (React Native/Expo). Used by delivery personnel to manage routes and collect payments.

- `backend/`: Node.js/Express API & MySQL database configuration (Coming Soon).

- `web/`: Admin Manager Panel (React/Tailwind CSS). Used by managers for staff allocation and inventory tracking (Coming Soon).


## Getting Started



### Driver App (Mobile)
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npx expo start -c
   ```




## PRD Features (Driver App)
- [x] Delivery Task List
- [x] Real-time Status Updates
- [x] Payment Collection (Cash/UPI)
- [x] Daily Summary Dashboard
- [x] Profile Management
- [x] Notification System
