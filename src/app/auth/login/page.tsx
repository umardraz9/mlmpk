import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side - Login Form */}
      <div className="flex-1 lg:flex-[0.6] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-6 xl:px-8 py-8 lg:py-12">
        <LoginForm />
      </div>

      {/* Right Side - Features Section */}
      <div className="flex-1 lg:flex-[0.4] bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-4 xl:px-6 py-8 lg:py-12">
        <div className="w-full max-w-md lg:max-w-md xl:max-w-lg">
          <div className="text-center mb-5 lg:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 leading-tight">
              Grow your earnings fast with MCNmart.
            </h2>
          </div>

          <div className="space-y-4 lg:space-y-5">
            <div className="flex items-start space-x-3 lg:space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-11 lg:h-11 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl lg:text-2xl">💰</span>
                </div>
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                  Proven Partnership Program
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                  Earn from a PKR 1,000 enrollment through our transparent 5-level partnership structure.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 lg:space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-11 lg:h-11 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl lg:text-2xl">📈</span>
                </div>
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                  Weekly Earnings Reports
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                  Track your progress with detailed weekly reports on your earnings and team performance.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 lg:space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-11 lg:h-11 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl lg:text-2xl">🎯</span>
                </div>
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                  Team Management Tools
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                  Build and manage your network with powerful tools to track referrals and optimize your earnings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 