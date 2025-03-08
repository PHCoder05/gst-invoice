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
  customerPhone?: string;
  invoiceId: string;
  description?: string;
}) {
  try {
    // Validate input data
    if (typeof data.amount !== 'number' || isNaN(data.amount) || data.amount <= 0) {
      throw new Error('Invalid amount: Must be a valid number greater than 0');
    }
    
    if (!data.customerName || typeof data.customerName !== 'string' || data.customerName.trim() === '') {
      throw new Error('Invalid customer name: Cannot be empty');
    }
    
    if (!data.invoiceId || typeof data.invoiceId !== 'string' || data.invoiceId.trim() === '') {
      throw new Error('Invalid invoice ID: Cannot be empty');
    }
    
    // Get the correct API URL from environment or fallback to relative path
    let apiUrl = '/api/payment-link';
    if (typeof window !== 'undefined') {
      // When running in browser
      const origin = window.location.origin;
      apiUrl = `${origin}/api/payment-link`;
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
      // When running in server-side environment
      apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-link`;
    }
    
    console.log('Creating payment link with data:', {
      amount: data.amount,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      invoiceId: data.invoiceId,
      description: data.description,
      apiUrl
    });
    
    // Prepare the request body
    const requestBody = {
      transactionId: data.invoiceId,
      amount: data.amount,
      customerName: data.customerName,
      customerEmail: data.customerEmail || '',
      customerPhone: data.customerPhone || '',
      description: data.description || ''
    };
    
    console.log('Request body:', JSON.stringify(requestBody));
    
    try {
      console.log('Sending fetch request to:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Payment link API response status:', response.status);
      
      const responseText = await response.text();
      console.log('Payment link API raw response:', responseText);
      
      try {
        const result = JSON.parse(responseText);
        console.log('Payment link API parsed response:', result);
        
        if (!response.ok || !result.success) {
          const errorMessage = result.error || result.details || 'Failed to create payment link';
          const errorDetails = result.details || '';
          console.error('Payment link creation failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            details: errorDetails,
            result
          });
          throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
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