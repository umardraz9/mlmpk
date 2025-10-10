import React from 'react';
import Link from 'next/link';
import BackToDashboard from '@/components/BackToDashboard';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Back to Dashboard Button */}
        <BackToDashboard />
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">MLM-Pak Investment Guide</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Learn how to maximize your earnings with our comprehensive MLM platform. 
            Start with just PKR 1,000 and build a profitable network.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">🎯 How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Register</h3>
              <p className="text-gray-700">Create your free account and get your unique referral code</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invest</h3>
              <p className="text-gray-700">Pay PKR 1,000 to activate your account</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Refer</h3>
              <p className="text-gray-700">Share your code and invite friends to join</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Earn</h3>
              <p className="text-gray-700">Earn up to PKR 3,000 through referrals</p>
            </div>
          </div>
        </div>

        {/* Commission Structure */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">📊 5-Level Commission Structure</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-4 px-6 font-semibold text-gray-900 text-lg">Level</th>
                  <th className="py-4 px-6 font-semibold text-gray-900 text-lg">Commission Rate</th>
                  <th className="py-4 px-6 font-semibold text-gray-900 text-lg">Earning (PKR)</th>
                  <th className="py-4 px-6 font-semibold text-gray-900 text-lg">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 bg-green-50">
                  <td className="py-4 px-6 font-bold text-green-800">Level 1</td>
                  <td className="py-4 px-6 font-bold text-green-800">20%</td>
                  <td className="py-4 px-6 font-bold text-green-800">200</td>
                  <td className="py-4 px-6 text-gray-700">Direct referrals (people you invite)</td>
                </tr>
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className="py-4 px-6 font-bold text-blue-800">Level 2</td>
                  <td className="py-4 px-6 font-bold text-blue-800">15%</td>
                  <td className="py-4 px-6 font-bold text-blue-800">150</td>
                  <td className="py-4 px-6 text-gray-700">People referred by your Level 1</td>
                </tr>
                <tr className="border-b border-gray-200 bg-purple-50">
                  <td className="py-4 px-6 font-bold text-purple-800">Level 3</td>
                  <td className="py-4 px-6 font-bold text-purple-800">10%</td>
                  <td className="py-4 px-6 font-bold text-purple-800">100</td>
                  <td className="py-4 px-6 text-gray-700">Third level referrals</td>
                </tr>
                <tr className="border-b border-gray-200 bg-orange-50">
                  <td className="py-4 px-6 font-bold text-orange-800">Level 4</td>
                  <td className="py-4 px-6 font-bold text-orange-800">8%</td>
                  <td className="py-4 px-6 font-bold text-orange-800">80</td>
                  <td className="py-4 px-6 text-gray-700">Fourth level referrals</td>
                </tr>
                <tr className="border-b border-gray-200 bg-red-50">
                  <td className="py-4 px-6 font-bold text-red-800">Level 5</td>
                  <td className="py-4 px-6 font-bold text-red-800">7%</td>
                  <td className="py-4 px-6 font-bold text-red-800">70</td>
                  <td className="py-4 px-6 text-gray-700">Fifth level referrals</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">💰 Maximum Earning Potential</h3>
            <p className="text-lg text-gray-800 mb-2">
              <strong className="text-green-700">Total possible earnings: PKR 3,000</strong> per complete network
            </p>
            <p className="text-gray-700">
              This is achieved when you have active referrals across all 5 levels. The more people you refer, 
              the higher your earnings potential!
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">🎁 What You Get</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Cashback</h3>
              <p className="text-gray-700">Get PKR 500 product voucher immediately after investment</p>
            </div>
            
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Network Building</h3>
              <p className="text-gray-700">Build your network and earn from 5 levels of referrals</p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Growth Tracking</h3>
              <p className="text-gray-700">Real-time dashboard to track your earnings and network</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-xl mb-6 text-green-100">
            Join thousands of successful MLM-Pak members today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth/register" 
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
            >
              Register Now - It's Free!
            </a>
            <a 
              href="/auth/login" 
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              Login to Dashboard
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">❓ Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is this a legitimate business?</h3>
              <p className="text-gray-700">
                Yes! MLM-Pak is a registered platform that operates transparently. All earnings are tracked 
                and payments are processed securely.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How quickly can I earn back my investment?</h3>
              <p className="text-gray-700">
                With just one direct referral (Level 1), you earn PKR 200. With 5 direct referrals, 
                you've already earned PKR 1,000 - your investment back!
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I can't find referrals?</h3>
              <p className="text-gray-700">
                Even without referrals, you get PKR 500 in product vouchers immediately. 
                We also provide marketing materials and training to help you succeed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 