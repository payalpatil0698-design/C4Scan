from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
import os

def generate_patient_pdf(case_data, output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title_style = styles['Title']
    elements.append(Paragraph("Clinical Diagnosis Report", title_style))
    elements.append(Spacer(1, 12))

    # Patient/Case Info Table
    data = [
        ["Field", "Value"],
        ["Case ID", str(case_data['id'])],
        ["Patient Name", case_data['username']],
        ["Diagnosis", case_data['prediction']],
        ["Severity", case_data.get('severity', 'Low')],
        ["Confidence", f"{case_data['confidence'] * 100:.2f}%"],
        ["Date", case_data['created_at']]
    ]
    
    t = Table(data, colWidths=[150, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ff4d4d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    elements.append(t)
    elements.append(Spacer(1, 24))

    # Notes section
    elements.append(Paragraph("Clinical Analysis & Expert Recommendation:", styles['Heading3']))
    elements.append(Spacer(1, 6))
    
    recommendation = case_data.get('recommendation', "Clinical correlation required.")
    severity_val = case_data.get('severity', 'Standard')
    elements.append(Paragraph(f"<b>Urgency Level:</b> {severity_val}", styles['Normal']))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"<b>Recommendation:</b> {recommendation}", styles['Normal']))
    
    # Text from OCR if any
    if case_data.get('ocr_text'):
        elements.append(Spacer(1, 24))
        elements.append(Paragraph("Radiology Report Context:", styles['Heading3']))
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(case_data['ocr_text'], styles['Normal']))

    # Footer
    elements.append(Spacer(1, 48))
    elements.append(Paragraph("Digitally Authenticated by C4Scan Clinical Decision Support System", styles['Italic']))

    doc.build(elements)
    return output_path
