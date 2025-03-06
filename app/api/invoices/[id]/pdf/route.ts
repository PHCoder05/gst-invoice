import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabase-server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

// Generate PDF invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get user from the session to apply RLS
    const { data: { session } } = await supabaseServer.auth.getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch the invoice with items
    const { data: invoice, error: fetchError } = await supabaseServer
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('id', id)
      .eq('user_id', user_id)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 size
    
    // Get fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Dimensions and positioning
    const { width, height } = page.getSize();
    const margin = 50;
    let currentY = height - margin;
    const lineHeight = 15;
    
    // Helper function to draw text
    const drawText = (text: string, x: number, y: number, font = helvetica, size = 10) => {
      page.drawText(text, { x, y, font, size });
    };
    
    // Draw header
    drawText('TAX INVOICE', margin, currentY, helveticaBold, 20);
    drawText('GST INVOICE SYSTEM', width - margin - 180, currentY, helveticaBold, 16);
    currentY -= 2 * lineHeight;
    
    // Invoice details
    drawText(`Invoice Number: ${invoice.invoice_number}`, margin, currentY, helveticaBold);
    currentY -= lineHeight;
    drawText(`Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, margin, currentY);
    currentY -= lineHeight;
    if (invoice.due_date) {
      drawText(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, margin, currentY);
      currentY -= lineHeight;
    }
    drawText(`Status: ${invoice.status.toUpperCase()}`, margin, currentY, helveticaBold);
    currentY -= 2 * lineHeight;
    
    // Customer details
    drawText('Bill To:', margin, currentY, helveticaBold);
    currentY -= lineHeight;
    drawText(invoice.customer_name, margin, currentY);
    currentY -= lineHeight;
    drawText(invoice.customer_email, margin, currentY);
    currentY -= lineHeight;
    if (invoice.customer_gstin) {
      drawText(`GSTIN: ${invoice.customer_gstin}`, margin, currentY);
      currentY -= lineHeight;
    }
    if (invoice.customer_address) {
      drawText(invoice.customer_address, margin, currentY);
      currentY -= lineHeight;
    }
    currentY -= lineHeight;
    
    // Items table header
    currentY -= lineHeight;
    page.drawLine({
      start: { x: margin, y: currentY + 5 },
      end: { x: width - margin, y: currentY + 5 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    currentY -= lineHeight;
    
    drawText('Item', margin, currentY, helveticaBold);
    drawText('HSN/SAC', margin + 200, currentY, helveticaBold);
    drawText('Qty', margin + 270, currentY, helveticaBold);
    drawText('Price', margin + 300, currentY, helveticaBold);
    drawText('GST %', margin + 350, currentY, helveticaBold);
    drawText('Amount', margin + 400, currentY, helveticaBold);
    currentY -= lineHeight;
    
    page.drawLine({
      start: { x: margin, y: currentY + 5 },
      end: { x: width - margin, y: currentY + 5 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    currentY -= lineHeight;
    
    // Draw items
    if (invoice.items && Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        // Check if we need a new page
        if (currentY < margin + 100) {
          currentY = height - margin;
          page = pdfDoc.addPage([595, 842]);
        }
        
        let nameY = currentY;
        
        // Item name and description
        drawText(item.name, margin, nameY);
        nameY -= lineHeight;
        if (item.description) {
          drawText(item.description, margin, nameY, helvetica, 8);
          nameY -= lineHeight;
          currentY = nameY; // Adjust current Y after description
        }
        
        // Item details
        drawText(item.hsn_code, margin + 200, currentY);
        drawText(item.quantity.toString(), margin + 270, currentY);
        drawText(formatCurrency(item.price), margin + 300, currentY);
        drawText(`${item.gst_rate}%`, margin + 350, currentY);
        drawText(formatCurrency(item.amount), margin + 400, currentY);
        
        currentY -= lineHeight;
      }
    }
    
    // Draw totals
    page.drawLine({
      start: { x: margin, y: currentY + 5 },
      end: { x: width - margin, y: currentY + 5 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    currentY -= lineHeight;
    
    drawText('Subtotal', margin + 300, currentY, helveticaBold);
    drawText(formatCurrency(invoice.subtotal), margin + 400, currentY);
    currentY -= lineHeight;
    
    drawText('GST', margin + 300, currentY, helveticaBold);
    drawText(formatCurrency(invoice.tax), margin + 400, currentY);
    currentY -= lineHeight;
    
    if (invoice.discount && invoice.discount > 0) {
      drawText('Discount', margin + 300, currentY, helveticaBold);
      drawText(formatCurrency(invoice.discount), margin + 400, currentY);
      currentY -= lineHeight;
    }
    
    page.drawLine({
      start: { x: margin + 300, y: currentY + 5 },
      end: { x: width - margin, y: currentY + 5 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    currentY -= lineHeight;
    
    drawText('Total', margin + 300, currentY, helveticaBold, 12);
    drawText(formatCurrency(invoice.total), margin + 400, currentY, helveticaBold, 12);
    currentY -= 2 * lineHeight;
    
    // Notes
    if (invoice.notes) {
      drawText('Notes:', margin, currentY, helveticaBold);
      currentY -= lineHeight;
      drawText(invoice.notes, margin, currentY);
      currentY -= lineHeight;
    }
    
    // Footer
    const footerY = margin + 30;
    page.drawLine({
      start: { x: margin, y: footerY },
      end: { x: width - margin, y: footerY },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    drawText('Thank you for your business!', margin, footerY - 15, helvetica, 10);
    drawText(`Generated on ${new Date().toLocaleString('en-IN')}`, width - margin - 200, footerY - 15, helvetica, 8);
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Return the PDF
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`
      }
    });
  } catch (error) {
    console.error(`Exception in GET /api/invoices/${params.id}/pdf:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 