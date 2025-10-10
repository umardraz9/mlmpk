// JazzCash Payment Gateway Integration for Partnership Program
// Handles PKR 1,000 investment payments

import crypto from 'crypto';
import { env } from '../../../config/environment';

export interface JazzCashPaymentRequest {
  pp_Amount: string; // Amount in paisa (PKR 1000 = 100000 paisa)
  pp_BillReference: string; // Unique bill reference
  pp_Description: string; // Payment description
  pp_Language: string; // 'EN' or 'UR'
  pp_MerchantID: string; // JazzCash Merchant ID
  pp_Password: string; // JazzCash Password
  pp_ReturnURL: string; // Return URL after payment
  pp_TxnCurrency: string; // 'PKR'
  pp_TxnDateTime: string; // YYYYMMDDHHMMSS
  pp_TxnExpiryDateTime: string; // YYYYMMDDHHMMSS
  pp_TxnRefNo: string; // Unique transaction reference
  pp_TxnType: string; // 'MWALLET' for mobile wallet
  pp_Version: string; // '1.1'
  ppmpf_1?: string; // Optional field 1
  ppmpf_2?: string; // Optional field 2
  ppmpf_3?: string; // Optional field 3
  ppmpf_4?: string; // Optional field 4
  ppmpf_5?: string; // Optional field 5
  pp_SecureHash: string; // SHA256 hash
}

export interface JazzCashPaymentResponse {
  pp_Amount: string;
  pp_AuthCode: string;
  pp_BankID: string;
  pp_BillReference: string;
  pp_Language: string;
  pp_MerchantID: string;
  pp_ResponseCode: string;
  pp_ResponseMessage: string;
  pp_RetrievelReferenceNo: string;
  pp_SecureHash: string;
  pp_TxnCurrency: string;
  pp_TxnDateTime: string;
  pp_TxnRefNo: string;
  pp_Version: string;
}

class JazzCashPaymentService {
  private merchantId: string;
  private password: string;
  private integritySalt: string;
  private sandboxUrl: string;
  private productionUrl: string;
  private isProduction: boolean;

  constructor() {
    this.merchantId = env.jazzcash.merchantId;
    this.password = env.jazzcash.password;
    this.integritySalt = env.jazzcash.integritySalt;
    this.sandboxUrl = env.jazzcash.sandboxUrl;
    this.productionUrl = env.jazzcash.productionUrl;
    this.isProduction = env.app.nodeEnv === 'production';
  }

  // Generate secure hash for JazzCash API
  private generateSecureHash(data: Partial<JazzCashPaymentRequest>): string {
    // JazzCash requires specific order for hash generation
    const sortedKeys = [
      'pp_Amount',
      'pp_BillReference', 
      'pp_Description',
      'pp_Language',
      'pp_MerchantID',
      'pp_Password',
      'pp_ReturnURL',
      'pp_TxnCurrency',
      'pp_TxnDateTime',
      'pp_TxnExpiryDateTime',
      'pp_TxnRefNo',
      'pp_TxnType',
      'pp_Version',
      'ppmpf_1',
      'ppmpf_2', 
      'ppmpf_3',
      'ppmpf_4',
      'ppmpf_5'
    ];

    let hashString = this.integritySalt + '&';
    
    sortedKeys.forEach(key => {
      if (data[key as keyof JazzCashPaymentRequest]) {
        hashString += data[key as keyof JazzCashPaymentRequest] + '&';
      }
    });

    // Remove trailing &
    hashString = hashString.slice(0, -1);

    // Generate SHA256 hash
    return crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase();
  }

  // Generate transaction reference number
  private generateTxnRefNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MLM${timestamp}${random}`;
  }

  // Format date for JazzCash (YYYYMMDDHHMMSS)
  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Create payment request for PKR 1,000 investment
  public createInvestmentPayment(
    userId: string, 
    userEmail: string,
    returnUrl: string
  ): JazzCashPaymentRequest {
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes expiry
    
    const billReference = `INV_${userId}_${Date.now()}`;
    const txnRefNo = this.generateTxnRefNo();
    
    const paymentData: Partial<JazzCashPaymentRequest> = {
      pp_Amount: '100000', // PKR 1,000 in paisa (1000 * 100)
      pp_BillReference: billReference,
      pp_Description: 'Partnership Program Investment - PKR 1,000',
      pp_Language: 'EN',
      pp_MerchantID: this.merchantId,
      pp_Password: this.password,
      pp_ReturnURL: returnUrl,
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: this.formatDateTime(now),
      pp_TxnExpiryDateTime: this.formatDateTime(expiry),
      pp_TxnRefNo: txnRefNo,
      pp_TxnType: 'MWALLET', // Mobile wallet payment
      pp_Version: '1.1',
      ppmpf_1: userId, // User ID for reference
      ppmpf_2: userEmail, // User email for reference
      ppmpf_3: 'INVESTMENT', // Payment type
      ppmpf_4: '1000', // Investment amount in PKR
      ppmpf_5: 'MLM_PAK_PLATFORM' // Platform identifier
    };

    // Generate secure hash
    const secureHash = this.generateSecureHash(paymentData);
    
    return {
      ...paymentData,
      pp_SecureHash: secureHash
    } as JazzCashPaymentRequest;
  }

  // Verify payment response from JazzCash
  public verifyPaymentResponse(response: JazzCashPaymentResponse): boolean {
    const expectedHash = this.generateResponseHash(response);
    return response.pp_SecureHash === expectedHash;
  }

  // Generate hash for response verification
  private generateResponseHash(response: JazzCashPaymentResponse): string {
    const hashString = this.integritySalt + '&' +
      response.pp_AuthCode + '&' +
      response.pp_BankID + '&' +
      response.pp_BillReference + '&' +
      response.pp_Language + '&' +
      response.pp_MerchantID + '&' +
      response.pp_ResponseCode + '&' +
      response.pp_ResponseMessage + '&' +
      response.pp_RetrievelReferenceNo + '&' +
      response.pp_TxnCurrency + '&' +
      response.pp_TxnDateTime + '&' +
      response.pp_TxnRefNo + '&' +
      response.pp_Version;

    return crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase();
  }

  // Check if payment was successful
  public isPaymentSuccessful(response: JazzCashPaymentResponse): boolean {
    return response.pp_ResponseCode === '000'; // 000 = Success
  }

  // Get payment URL
  public getPaymentUrl(): string {
    return this.isProduction ? 
      `${this.productionUrl}/ApplicationAPI/API/2.0/Purchase/DoTransaction` :
      `${this.sandboxUrl}/ApplicationAPI/API/2.0/Purchase/DoTransaction`;
  }

  // Get payment form HTML for frontend
  public generatePaymentForm(paymentRequest: JazzCashPaymentRequest): string {
    const formFields = Object.entries(paymentRequest)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
      .join('\n    ');

    return `
      <form id="jazzcash-form" action="${this.getPaymentUrl()}" method="post">
        ${formFields}
        <input type="submit" value="Pay with JazzCash" />
      </form>
      <script>
        document.getElementById('jazzcash-form').submit();
      </script>
    `;
  }

  // Create payment session for API response
  public createPaymentSession(userId: string, returnUrl: string) {
    const paymentRequest = this.createInvestmentPayment(
      userId, 
      '', // Email will be fetched from user data
      returnUrl
    );

    return {
      paymentUrl: this.getPaymentUrl(),
      paymentData: paymentRequest,
      billReference: paymentRequest.pp_BillReference,
      txnRefNo: paymentRequest.pp_TxnRefNo,
      amount: 1000, // PKR amount
      currency: 'PKR',
      expiryTime: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };
  }
}

export const jazzCashService = new JazzCashPaymentService();
export default jazzCashService; 