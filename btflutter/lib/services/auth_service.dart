import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_config.dart';

class AuthService {
  static const String tokenKey = 'auth_token';

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, token);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  Future<void> clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('\${ApiConfig.baseUrl}/auth/login'),
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        if (data['token'] != null) {
          await saveToken(data['token']);
        }
      }
      return data;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('\${ApiConfig.baseUrl}/auth/register'),
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> verifyOTP(String email, String otp, String purpose) async {
    try {
      final response = await http.post(
        Uri.parse('\${ApiConfig.baseUrl}/auth/verify-otp'),
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({
          'email': email,
          'otp': otp,
          'purpose': purpose, // "REGISTER" or "RESET_PASSWORD"
        }),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        if (purpose == 'REGISTER' && data['token'] != null) {
          await saveToken(data['token']);
        }
      }
      return data;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> resendOTP(String email, String purpose) async {
    try {
      final response = await http.post(
        Uri.parse('\${ApiConfig.baseUrl}/auth/resend-otp'),
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({
          'email': email,
          'purpose': purpose,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> forgetPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('\${ApiConfig.baseUrl}/auth/forget-password'),
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({
          'email': email,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> resetPassword(String resetToken, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('\${ApiConfig.baseUrl}/auth/reset-password'),
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({
          'resetToken': resetToken,
          'newPassword': newPassword,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
