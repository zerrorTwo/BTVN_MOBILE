class ApiConfig {
  // Use 10.0.2.2 for Android Emulator, or your local network IP (e.g., 192.168.1.x) for physical device
  // Assuming the node backend runs on port 3000 by default (check BE_BTVN server.ts or .env)
  static const String baseUrl = 'http://10.0.2.2:3000/api';

  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  static Map<String, String> getAuthHeaders(String token) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }
}
