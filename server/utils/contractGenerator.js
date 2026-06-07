const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const contractsDir = path.join(__dirname, '..', 'contracts');
if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir, { recursive: true });

const generateContractPDF = (data) => {
  return new Promise((resolve, reject) => {
    const fileName = `contract_${data.contractNumber}.pdf`;
    const filePath = path.join(contractsDir, fileName);
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const primary = '#4c6ef5';
    const dark = '#1a1d29';
    const gray = '#6b7280';
    const pageW = doc.page.width - 100;
    const total = Number(data.totalCost);
    const advance = Math.round(total * 0.5);
    const remaining = total - advance;

    
    doc.rect(0, 0, doc.page.width, 100).fill(primary);
    doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
      .text('SERVICE AGREEMENT CONTRACT', 50, 30, { align: 'center' });
    doc.fontSize(10).fillColor('#dbeafe').font('Helvetica')
      .text(`EventPro  •  Contract ${data.contractNumber}`, 50, 60, { align: 'center' });
    doc.fontSize(8)
      .text(`Date: ${new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, 78, { align: 'center' });

    let y = 115;

    
    const heading = (title) => {
      doc.fontSize(12).fillColor(primary).font('Helvetica-Bold').text(title, 50, y);
      y += 18;
    };

    
    const row = (label, value, altBg) => {
      if (altBg) { doc.rect(50, y - 2, pageW, 18).fill('#f3f4f6'); }
      doc.fontSize(9).fillColor(gray).font('Helvetica-Bold').text(label, 55, y);
      doc.fillColor(dark).font('Helvetica').text(String(value || 'N/A'), 220, y, { width: pageW - 180 });
      y += 18;
    };

    
    heading('PARTIES');
    row('Client', data.clientName, true);
    row('Client Email', data.clientEmail || 'N/A');
    row('Vendor', data.businessName, true);
    row('Vendor Contact', `${data.vendorName}${data.vendorPhone ? '  •  ' + data.vendorPhone : ''}`);
    y += 8;

    
    heading('EVENT DETAILS');
    row('Event Name', data.eventName, true);
    row('Event Date', new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
    row('Location', data.eventLocation || 'TBD', true);
    row('Guests', data.guestCount ? `${data.guestCount} guests` : 'N/A');
    y += 8;

    
    heading('SERVICE DETAILS');
    row('Category', data.serviceCategory || 'General', true);
    row('Package', data.serviceName);
    row('Tier', (data.packageTier || 'Standard').charAt(0).toUpperCase() + (data.packageTier || 'standard').slice(1), true);
    if (data.serviceDescription) {
      row('Description', data.serviceDescription.substring(0, 120));
    }
    y += 8;

    
    heading('FINANCIAL TERMS');
    doc.rect(50, y, pageW, 55).lineWidth(1).strokeColor('#e5e7eb').stroke();
    doc.fontSize(10).fillColor(dark).font('Helvetica-Bold').text('Total Service Cost', 60, y + 8);
    doc.fontSize(16).fillColor(primary).text(`₹${total.toLocaleString('en-IN')}`, 60, y + 22);
    doc.fontSize(8).fillColor(gray).font('Helvetica')
      .text(`Advance (50%): ₹${advance.toLocaleString('en-IN')} — due upon confirmation`, 60, y + 42);
    doc.text(`Remaining (50%): ₹${remaining.toLocaleString('en-IN')} — due after event`, 310, y + 42);
    y += 65;

    
    heading('TERMS & CONDITIONS');
    const terms = [
      'This agreement is binding upon confirmation by both parties.',
      '50% advance payment is required to secure the booking.',
      'Cancellation before 7 days: full refund of advance.',
      'Cancellation within 7 days: advance is non-refundable.',
      'Vendor agrees to deliver services as described above.',
      'Additional services to be agreed upon separately in writing.',
      'Remaining payment due within 3 days after event completion.',
      'Disputes shall be resolved through mutual discussion.',
    ];
    terms.forEach((t, i) => {
      doc.fontSize(8).fillColor(gray).font('Helvetica').text(`${i + 1}. ${t}`, 55, y, { width: pageW - 10 });
      y += 13;
    });
    y += 10;

    
    doc.rect(50, y, pageW, 30).lineWidth(1).strokeColor(primary).stroke();
    doc.fontSize(9).fillColor(gray).font('Helvetica').text('Booking ID', 60, y + 5);
    doc.fontSize(11).fillColor(dark).font('Helvetica-Bold').text(`BK-${String(data.bookingId).padStart(5, '0')}`, 60, y + 17);
    doc.fontSize(9).fillColor(gray).font('Helvetica').text(`Booking Date: ${new Date(data.bookingDate).toLocaleDateString('en-IN')}`, 300, y + 10);

    
    doc.fontSize(7).fillColor('#9ca3af').font('Helvetica')
      .text('This is a system-generated contract by EventPro. It serves as a digital service agreement between both parties.', 50, 770, { align: 'center', width: pageW });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

module.exports = { generateContractPDF };
