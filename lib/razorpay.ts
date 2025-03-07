/**
 * Utility functions for working with Razorpay
 */

/**
 * Creates a payment link using the API
 */
export async function createPaymentLink(data: {
  amount: number;
  customerName: string;
  customerEmail?: string;
  invoiceId: string;
  description?: string;
}) {
  try {
    // Use the environment variable for the API URL
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-link`;
    console.log('Creating payment link with data:', {
      amount: data.amount,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      invoiceId: data.invoiceId,
      description: data.description
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId: data.invoiceId,
      }),
    });

    const responseText = await response.text();
    
    try {
      const result = JSON.parse(responseText);
      console.log('Payment link API response:', result);
      
      if (!response.ok || !result.success) {
        const errorMessage = result.error || result.details || 'Failed to create payment link';
        console.error('Payment link creation failed:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        throw new Error(errorMessage);
      }
      
      if (!result.paymentLink) {
        console.error('Payment link missing in response:', result);
        throw new Error('Invalid response: Payment link URL not found');
      }
      
      return result;
    } catch (parseError) {
      console.error('Failed to parse API response:', {
        error: parseError,
        responseText
      });
      throw new Error('Invalid API response: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
    }
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

/**
 * Loads the Razorpay checkout script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    
    // If Razorpay is already loaded, resolve immediately
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    
    // Load the Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    
    document.body.appendChild(script);
  });
} 