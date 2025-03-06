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
    const response = await fetch('/api/create-payment-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    console.log('Payment link API response:', responseText);

    try {
      const result = JSON.parse(responseText);
      
      if (!response.ok || !result.success) {
        const errorMessage = result.error || result.details || 'Failed to create payment link';
        throw new Error(errorMessage);
      }
      
      return result;
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      throw new Error(`Invalid API response: ${responseText.substring(0, 100)}`);
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