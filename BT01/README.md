# BT01 - React Native Authentication App

A React Native Expo application with complete authentication features including Register, Login, Forget Password, and Reset Password.

## 🚀 Features

- ✅ **Intro Screen** - 10-second splash screen with logo
- ✅ **User Registration** - Create new account
- ✅ **User Login** - Login with email and password
- ✅ **Forget Password** - Request password reset token
- ✅ **Reset Password** - Reset password with token
- ✅ **Protected Home Screen** - View user profile
- ✅ **Logout** - Clear session and return to login
- ✅ **Token Persistence** - Stay logged in after app restart

## 🛠️ Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Native Paper** for Material Design UI
- **React Navigation** for screen navigation
- **Redux Toolkit** with **RTK Query** for state management and API calls
- **AsyncStorage** for token persistence

## 📋 Prerequisites

- Node.js >= 14.x
- Expo CLI
- Android Emulator or iOS Simulator (or Expo Go app on physical device)
- **BE_BTVN backend** running on `http://localhost:5000`

## 🔧 Installation

### 1. Install dependencies

```bash
cd BT01
npm install
```

### 2. Start the backend server

Make sure the BE_BTVN backend is running:

```bash
cd ../BE_BTVN
npm run dev
```

The backend should be running on `http://localhost:5000`

### 3. Start the Expo development server

```bash
cd ../BT01
npm start
```

### 4. Run on device/emulator

- **Android Emulator**: Press `a`
- **iOS Simulator**: Press `i`
- **Physical Device**: Scan QR code with Expo Go app

## 📱 App Flow

```
App Start
  ↓
Intro Screen (10 seconds)
  ↓
Login Screen
  ├─→ Register Screen → Login
  ├─→ Forget Password → Reset Password → Login
  └─→ (After login) → Home Screen
                        └─→ Logout → Login
```

## 🎨 Screens

### 1. Intro Screen

- Displays app logo for 10 seconds
- Automatically navigates to Login or Home (if already logged in)

### 2. Login Screen

- Email and password inputs
- Form validation
- Navigate to Register or Forget Password
- On success: Navigate to Home

### 3. Register Screen

- Name, email, password, and confirm password inputs
- Form validation
- On success: Navigate to Login

### 4. Forget Password Screen

- Email input
- Generates reset token
- Displays token (in production, sent via email)
- Navigate to Reset Password with token

### 5. Reset Password Screen

- Token input (pre-filled from Forget Password)
- New password and confirm password inputs
- On success: Navigate to Login

### 6. Home Screen

- Displays user information (name, email, ID)
- Logout button
- Protected route (requires authentication)

## 🔌 API Integration

The app connects to the BE_BTVN backend API:

| Screen          | Method | Endpoint                    | Description      |
| --------------- | ------ | --------------------------- | ---------------- |
| Register        | POST   | `/api/auth/register`        | Create new user  |
| Login           | POST   | `/api/auth/login`           | Login user       |
| Forget Password | POST   | `/api/auth/forget-password` | Get reset token  |
| Reset Password  | POST   | `/api/auth/reset-password`  | Reset password   |
| Home            | GET    | `/api/auth/me`              | Get current user |

### API Base URL Configuration

The API base URL is configured in `src/store/api/authApi.ts`:

- **Android Emulator**: `http://10.0.2.2:5000/api`
- **iOS Simulator**: `http://localhost:5000/api`
- **Physical Device**: `http://YOUR_IP_ADDRESS:5000/api`

> **Note**: For physical devices, you need to update the API_BASE_URL to your computer's IP address.

## 📁 Project Structure

```
BT01/
├── src/
│   ├── store/
│   │   ├── index.ts              # Redux store configuration
│   │   ├── authSlice.ts          # Auth state management
│   │   └── api/
│   │       └── authApi.ts        # RTK Query API endpoints
│   ├── screens/
│   │   ├── IntroScreen.tsx       # Splash screen
│   │   ├── LoginScreen.tsx       # Login screen
│   │   ├── RegisterScreen.tsx    # Registration screen
│   │   ├── ForgetPasswordScreen.tsx  # Forget password
│   │   ├── ResetPasswordScreen.tsx   # Reset password
│   │   └── HomeScreen.tsx        # Home/Profile screen
│   ├── navigation/
│   │   └── AppNavigator.tsx      # Navigation configuration
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── utils/
│       └── validation.ts         # Form validation functions
├── App.tsx                       # App entry point
└── package.json
```

## 🧪 Testing

### Manual Testing Steps

1. **Intro Flow**
   - Open app → See intro screen for 10 seconds → Navigate to Login

2. **Registration**
   - Click "Register"
   - Fill in name, email, password, confirm password
   - Submit → Success message → Navigate to Login

3. **Login**
   - Enter registered email and password
   - Submit → Navigate to Home
   - See user information displayed

4. **Logout**
   - Click "Logout" on Home screen
   - Navigate back to Login
   - Token cleared from storage

5. **Forget Password**
   - Click "Forgot Password?" on Login
   - Enter email
   - Get reset token
   - Click "Reset Password"

6. **Reset Password**
   - Token pre-filled
   - Enter new password and confirm
   - Submit → Navigate to Login
   - Login with new password

7. **Token Persistence**
   - Login to app
   - Close app completely
   - Reopen app → Should go directly to Home (still logged in)

## 🔒 Security Features

- Password hashing on backend (bcrypt)
- JWT token authentication
- Token stored securely in AsyncStorage
- Protected routes (Home screen requires authentication)
- Form validation on all inputs
- Password minimum length (6 characters)
- Email format validation

## 🐛 Troubleshooting

### Cannot connect to backend

**Error**: Network request failed

**Solution**:

1. Make sure BE_BTVN backend is running on port 5000
2. For Android emulator, use `http://10.0.2.2:5000/api`
3. For physical device, update API_BASE_URL to your computer's IP address

### App crashes on startup

**Solution**:

1. Clear cache: `npm start -- --clear`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Reset Expo: `expo start -c`

### Login not working

**Solution**:

1. Check backend is running
2. Verify user is registered in database
3. Check network connection
4. View console logs for error messages

## 📝 Development Notes

- **Redux DevTools**: Enable in Redux store for debugging
- **RTK Query**: Automatic caching and refetching
- **AsyncStorage**: Token persists across app restarts
- **React Native Paper**: Material Design components
- **Form Validation**: Client-side validation before API calls

## 🎓 Learning Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- [React Native Paper](https://reactnativepaper.com/)

## 📄 License

This project is for educational purposes (BTVN - Bài Tập Về Nhà).

## 👨‍💻 Author

BT01 Project - React Native Authentication App
