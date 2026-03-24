import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:btflutter/services/auth_service.dart';
import 'package:btflutter/widgets/custom_text_field.dart';
import 'package:btflutter/widgets/primary_button.dart';
import 'reset_password_screen.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String email;
  final String purpose;

  const OtpVerificationScreen({
    super.key,
    required this.email,
    required this.purpose,
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _otpController = TextEditingController();
  final AuthService _authService = AuthService();
  bool _isLoading = false;
  bool _isResending = false;

  void _verifyOTP() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 6-digit OTP')),
      );
      return;
    }

    setState(() { _isLoading = true; });

    final result = await _authService.verifyOTP(widget.email, otp, widget.purpose);

    if (!mounted) return;

    setState(() { _isLoading = false; });

    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP Verified Successfully!')),
      );

      if (widget.purpose == 'REGISTER') {
        // Return to first screen (Login) or show success dialog
        Navigator.popUntil(context, (route) => route.isFirst);
      } else {
        // purpose == 'RESET_PASSWORD'
        final resetToken = result['resetToken'];
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ResetPasswordScreen(resetToken: resetToken),
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'OTP verification failed')),
      );
    }
  }

  void _resendOTP() async {
    setState(() { _isResending = true; });
    final result = await _authService.resendOTP(widget.email, widget.purpose);

    if (!mounted) return;

    setState(() { _isResending = false; });

    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('A new OTP has been sent to your email.')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to resend OTP')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blue.shade50,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.blueAccent),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.mark_email_read_outlined, size: 80, color: Colors.blueAccent),
              const SizedBox(height: 20),
              Text(
                'Verify Your Email',
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.blueGrey.shade800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'We sent a 6-digit code to\n\${widget.email}',
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  color: Colors.blueGrey.shade500,
                ),
              ),
              const SizedBox(height: 40),
              CustomTextField(
                label: 'OTP Code',
                hint: '000000',
                prefixIcon: Icons.password,
                controller: _otpController,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 40),
              PrimaryButton(
                text: 'Verify',
                onPressed: _verifyOTP,
                isLoading: _isLoading,
              ),
              const SizedBox(height: 30),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text("Didn't receive the code?", style: GoogleFonts.poppins()),
                  _isResending
                      ? const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16.0),
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : TextButton(
                          onPressed: _resendOTP,
                          child: Text(
                            'Resend',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.bold,
                              color: Colors.blueAccent,
                            ),
                          ),
                        ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
