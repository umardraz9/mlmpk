// EasyPaisa Payment Gateway Integration for Partnership Program
// Alternative payment method for PKR 1,000 investment

import crypto from 'crypto';
import { env } from '../../../config/environment';

export interface EasyPaisaPaymentRequest {
  amount: string; // Amount in PKR
  billReference: string; // Unique bill reference
  description: string; // Payment description
  language: string; // 'EN' or 'UR'
  storeId: string; // EasyPaisa Store ID
  postBackURL: string; // Callback URL
  orderRefNum: string; // Unique order reference
  expiryDate: string; // ISO date string
  autoRedirect: string; // '1' for auto redirect
  paymentMethod: string; // 'OTC' for Over The Counter
  emailAddr?: string; // Customer email
  mobileNum?: string; // Customer mobile
}

export interface EasyPaisaPaymentResponse {
  transactionId: string;
  orderRefNum: string;
  amount: string;
  paymentStatus: string; // 'Paid' | 'Pending' | 'Failed'
  paymentMethod: string;
  transactionDateTime: string;
  storeId: string;
  responseCode: string;
  responseDesc: string;
}

class EasyPaisaPaymentService {
  private storeId: string;
  private storePassword: string;
  private sandboxUrl: string;
  private productionUrl: string;
  private isProduction: boolean;

  constructor() {
    this.storeId = env.easypaisa.storeId;
    this.storePassword = env.easypaisa.storePassword;
    this.sandboxUrl = env.easypaisa.sandboxUrl;
    this.productionUrl = env.easypaisa.productionUrl;
    this.isProduction = env.app.nodeEnv === 'production';
  }

  // Generate order reference number
  private generateOrderRef(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EMLM${timestamp}${random}`;
  }

  // Format expiry date (1 hour from now)
  private getExpiryDate(): string {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    return expiry.toISOString();
  }

  // Create payment request for PKR 1,000 investment
  public createInvestmentPayment(
    userId: string,
    userEmail: string,
    userPhone: string,
    callbackUrl: string
  ): EasyPaisaPaymentRequest {
    const orderRef = this.generateOrderRef();
    
    return {
      amount: '1000.00', // PKR 1,000
      billReference: `INV_${userId}_${Date.now()}`,
      description: 'Partnership Program Investment Fee',
      language: 'EN',
      storeId: this.storeId,
      postBackURL: callbackUrl,
      orderRefNum: orderRef,
      expiryDate: this.getExpiryDate(),
      autoRedirect: '1',
      paymentMethod: 'OTC', // Over The Counter
      emailAddr: userEmail,
      mobileNum: userPhone.replace(/^\+92/, '0') // Remove +92 prefix
    };
  }

  // Get payment URL
  public getPaymentUrl(): string {
    return this.isProduction ?
      `${this.productionUrl}/easypay/Index.jsf` :
      `${this.sandboxUrl}/easypay/Index.jsf`;
  }

  // Generate payment form for frontend redirection
  public generatePaymentForm(paymentRequest: EasyPaisaPaymentRequest): string {
    const formFields = Object.entries(paymentRequest)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
      .join('\n    ');

    return `
      <form id="easypaisa-form" action="${this.getPaymentUrl()}" method="post">
        ${formFields}
        <input type="submit" value="Pay with EasyPaisa" />
      </form>
      <script>
        document.getElementById('easypaisa-form').submit();
      </script>
    `;
  }

  // Verify payment response
  public verifyPaymentResponse(response: EasyPaisaPaymentResponse): boolean {
    // EasyPaisa verification logic
    return response.responseCode === '0000' && response.paymentStatus === 'Paid';
  }

  // Check if payment was successful
  public isPaymentSuccessful(response: EasyPaisaPaymentResponse): boolean {
    return response.paymentStatus === 'Paid' && response.responseCode === '0000';
  }

  // Create payment session for API response
  public createPaymentSession(
    userId: string, 
    userEmail: string, 
    userPhone: string,
    callbackUrl: string
  ) {
    const paymentRequest = this.createInvestmentPayment(
      userId,
      userEmail,
      userPhone,
      callbackUrl
    );

    return {
      paymentUrl: this.getPaymentUrl(),
      paymentData: paymentRequest,
      orderRefNum: paymentRequest.orderRefNum,
      billReference: paymentRequest.billReference,
      amount: 1000,
      currency: 'PKR',
      expiryTime: new Date(paymentRequest.expiryDate)
    };
  }

  // Query payment status
  public async queryPaymentStatus(orderRefNum: string): Promise<EasyPaisaPaymentResponse | null> {
    try {
      const queryUrl = this.isProduction ?
        `${this.productionUrl}/easypay/api/query` :
        `${this.sandboxUrl}/easypay/api/query`;

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: this.storeId,
          orderRefNum,
          storePassword: this.storePassword
        })
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('EasyPaisa query error:', error);
      return null;
    }
  }
}

export const easyPaisaService = new EasyPaisaPaymentService();
export default easyPaisaService; 