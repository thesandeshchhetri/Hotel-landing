import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { verifyBookingOtp } from '../lib/api';

function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      const data = JSON.parse(pendingBooking);
      setBookingId(data.id);
      setEmail(data.email);
    } else if (location.state) {
      setBookingId(location.state.bookingId);
      setEmail(location.state.email);
    } else {
      navigate('/');
    }
  }, [location, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name=otp-${index + 1}]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[name=otp-${index - 1}]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleVerify = async (otpCode: string) => {
    if (!bookingId || otpCode.length !== 6) return;

    setVerifying(true);
    setError('');

    try {
      const result = await verifyBookingOtp(bookingId, otpCode);

      if (result.success && result.booking) {
        sessionStorage.setItem('confirmedBooking', JSON.stringify(result.booking));
        setSuccess(true);
        sessionStorage.removeItem('pendingBooking');
        setTimeout(() => {
          navigate('/booking-confirmation', {
            state: {
              bookingId,
              email,
            },
          });
        }, 2000);
      } else {
        setError('Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        const firstInput = document.querySelector(`input[name=otp-0]`) as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setVerifying(false);
    }
  };

  if (!email) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {success ? 'OTP Verified!' : 'Verify Your Email'}
            </h1>
            <p className="text-gray-600">
              {success
                ? 'Redirecting to confirmation page...'
                : `We've sent a 6-digit code to ${email}`}
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle size={64} className="text-green-500 mb-4" />
              <p className="text-green-600 font-medium">Booking confirmed successfully!</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center space-x-3 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    name={`otp-${index}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    maxLength={1}
                    disabled={verifying}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 transition-all"
                    style={{
                      borderColor: error ? '#ef4444' : digit ? '#f59e0b' : '#d1d5db',
                    }}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center justify-center space-x-2 text-red-500 mb-6">
                  <XCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {verifying && (
                <div className="flex items-center justify-center space-x-2 text-amber-600 mb-6">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Verifying...</span>
                </div>
              )}

              <div className="text-center text-sm text-gray-500">
                <p>Didn't receive the code?</p>
                <button
                  onClick={() => setOtp(['', '', '', '', '', ''])}
                  className="text-amber-600 hover:text-amber-700 font-medium mt-1"
                >
                  Clear and try again
                </button>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/rooms"
              className="flex items-center justify-center text-gray-600 hover:text-amber-600 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Rooms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
