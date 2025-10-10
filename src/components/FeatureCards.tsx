'use client';

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {/* High Returns */}
      <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center hover:scale-105 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
        <span className="inline-block w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-4">💰</span>
        <h3 className="text-xl font-semibold mb-2 mt-2">High Returns</h3>
        <p className="text-gray-600 text-center">Earn up to PKR 3,000 from your PKR 1,000 investment with our proven 5-level commission structure.</p>
      </div>
      {/* Team Building */}
      <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center hover:scale-105 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
        <span className="inline-block w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-3xl mb-4">🧑‍🤝‍🧑</span>
        <h3 className="text-xl font-semibold mb-2 mt-2">Team Building</h3>
        <p className="text-gray-600 text-center">Build your network and earn from 5 levels of referrals. Help others succeed while growing your income.</p>
      </div>
      {/* Instant Vouchers */}
      <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center hover:scale-105 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
        <span className="inline-block w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-3xl mb-4">🎁</span>
        <h3 className="text-xl font-semibold mb-2 mt-2">Instant Vouchers</h3>
        <p className="text-gray-600 text-center">Get PKR 500 in product vouchers immediately after investment. Start shopping right away!</p>
      </div>
      {/* Legal & Secure */}
      <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center hover:scale-105 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
        <span className="inline-block w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-3xl mb-4">🛡️</span>
        <h3 className="text-xl font-semibold mb-2 mt-2">Legal & Secure</h3>
        <p className="text-gray-600 text-center">SECP registered and FBR compliant. Your investment and earnings are protected by Pakistani law.</p>
      </div>
      {/* Social & Community */}
      <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center hover:scale-105 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
        <span className="inline-block w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center text-3xl mb-4">🌐</span>
        <h3 className="text-xl font-semibold mb-2 mt-2">Social & Community</h3>
        <p className="text-gray-600 text-center">Connect with like-minded entrepreneurs, share your journey, and grow your network in a vibrant community.</p>
      </div>
      {/* Complete Guide */}
      <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center hover:scale-105 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
        <span className="inline-block w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center text-3xl mb-4">📘</span>
        <h3 className="text-xl font-semibold mb-2 mt-2">Complete Guide</h3>
        <p className="text-gray-600 text-center">Step-by-step guides and resources to help you succeed, whether you're a beginner or a pro.</p>
      </div>
    </div>
  );
} 