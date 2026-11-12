from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
from backend.app.config import settings

class ReportService:
    """
    Generates clinical screening PDF reports for Diabetic Retinopathy screening cases.
    Complies with medical documentation standards and statutory disclaimers.
    """

    def generate_pdf_report(
        self,
        screening_case: Any,
        output_filename: str
    ) -> Path:
        reports_dir = settings.STORAGE_DIR / "reports"
        pdf_path = reports_dir / output_filename

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1E3A8A'),
            spaceBefore=8,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyTextCustom',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#334155')
        )
        disclaimer_style = ParagraphStyle(
            'DisclaimerText',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#B91C1C')
        )

        elements = []

        # 1. Header
        header_table_data = [
            [
                Paragraph("<b>RETINAGUARD AI</b><br/><font size=8 color='#64748B'>AI-Powered Diabetic Retinopathy Decision Support</font>", title_style),
                Paragraph(f"<b>CONFIDENTIAL MEDICAL SCREENING REPORT</b><br/><font size=8 color='#64748B'>Report Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}<br/>Case ID: {screening_case.id[:12]}...</font>", subtitle_style)
            ]
        ]
        header_table = Table(header_table_data, colWidths=[280, 260])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        elements.append(header_table)
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceBefore=4, spaceAfter=10))

        # 2. Case & Patient Information Table
        patient_ref = screening_case.patient_ref or "De-identified / Screening Subject"
        age = str(screening_case.patient_age) if screening_case.patient_age else "Not recorded"
        gender = screening_case.patient_gender or "Not recorded"
        eye = screening_case.eye_laterality or "OD"
        eye_label = "Right Eye (OD)" if eye == "OD" else ("Left Eye (OS)" if eye == "OS" else eye)
        
        meta_data = [
            [
                Paragraph(f"<b>Patient Reference:</b> {patient_ref}", body_style),
                Paragraph(f"<b>Eye Evaluated:</b> {eye_label}", body_style),
            ],
            [
                Paragraph(f"<b>Age / Gender:</b> {age} / {gender}", body_style),
                Paragraph(f"<b>Screening Mode:</b> {screening_case.screening_mode.capitalize()}", body_style),
            ],
            [
                Paragraph(f"<b>Screening Date:</b> {screening_case.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if screening_case.created_at else 'N/A'}", body_style),
                Paragraph(f"<b>Model Architecture:</b> {screening_case.model_version or 'EfficientNet-B0'}", body_style),
            ]
        ]
        meta_table = Table(meta_data, colWidths=[270, 270])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 10))

        # 3. Image Quality Assessment
        elements.append(Paragraph("Image Quality Assessment", section_heading))
        q_status = screening_case.quality_status or "UNKNOWN"
        q_color = colors.HexColor('#16A34A') if q_status == "GOOD" else (colors.HexColor('#D97706') if q_status == "BORDERLINE" else colors.HexColor('#DC2626'))
        
        q_feedback_text = "; ".join(screening_case.quality_feedback) if screening_case.quality_feedback else "Image clear."
        
        quality_data = [
            [
                Paragraph(f"<b>Quality Status:</b> <font color='{q_color.hexval()}'><b>{q_status}</b></font> (Score: {screening_case.quality_score or 0.0:.2f}/1.00)", body_style),
                Paragraph(f"<b>Assessment:</b> {q_feedback_text}", body_style)
            ]
        ]
        q_table = Table(quality_data, colWidths=[200, 340])
        q_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(q_table)
        elements.append(Spacer(1, 10))

        # 4. Screening Findings & Prediction
        elements.append(Paragraph("Diabetic Retinopathy Screening Evaluation", section_heading))
        
        grade = screening_case.predicted_grade if screening_case.predicted_grade is not None else -1
        grade_name = screening_case.grade_name or "Pending Review"
        conf = (screening_case.confidence or 0.0) * 100.0
        referable = screening_case.referable_dr

        grade_bg = colors.HexColor('#EFF6FF')
        grade_text_color = colors.HexColor('#1D4ED8')
        if referable:
            grade_bg = colors.HexColor('#FEF2F2')
            grade_text_color = colors.HexColor('#B91C1C')

        pred_data = [
            [
                Paragraph(f"<font size=11><b>Predicted Grade: Level {grade} — {grade_name}</b></font><br/>"
                          f"Model Confidence: <b>{conf:.1f}%</b> (calibrated score)<br/>"
                          f"Referable DR Status: <b>{'YES (Clinical Referral Recommended)' if referable else 'NO (Routine Screening Follow-up)'}</b>", body_style)
            ]
        ]
        pred_table = Table(pred_data, colWidths=[540])
        pred_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), grade_bg),
            ('BOX', (0, 0), (-1, -1), 1, grade_text_color),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(pred_table)
        elements.append(Spacer(1, 8))

        # 5. Class Probabilities breakdown
        if screening_case.class_scores:
            scores = screening_case.class_scores
            class_labels = [
                ("Level 0: No DR", scores.get("0", 0.0)),
                ("Level 1: Mild NPDR", scores.get("1", 0.0)),
                ("Level 2: Moderate NPDR", scores.get("2", 0.0)),
                ("Level 3: Severe NPDR", scores.get("3", 0.0)),
                ("Level 4: Proliferative DR", scores.get("4", 0.0)),
            ]
            prob_rows = [[Paragraph("<b>Severity Class</b>", body_style), Paragraph("<b>Probability Score</b>", body_style)]]
            for label, prob in class_labels:
                prob_rows.append([
                    Paragraph(label, body_style),
                    Paragraph(f"<b>{prob * 100:.1f}%</b>", body_style)
                ])
            prob_table = Table(prob_rows, colWidths=[340, 200])
            prob_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E2E8F0')),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(prob_table)
            elements.append(Spacer(1, 10))

        # 6. Visual Evidence & Grad-CAM Heatmap
        elements.append(Paragraph("Visual Evidence & Explainability (Grad-CAM Attention)", section_heading))
        
        orig_full_path = (settings.STORAGE_DIR / "original" / Path(screening_case.original_image_path).name) if screening_case.original_image_path else None
        grad_full_path = (settings.STORAGE_DIR / "gradcam" / Path(screening_case.gradcam_image_path).name) if screening_case.gradcam_image_path else None

        img_cells = []
        if orig_full_path and orig_full_path.exists():
            img_cells.append(RLImage(str(orig_full_path), width=240, height=180))
        else:
            img_cells.append(Paragraph("Original Fundus Image Unavailable", body_style))

        if grad_full_path and grad_full_path.exists():
            img_cells.append(RLImage(str(grad_full_path), width=240, height=180))
        else:
            img_cells.append(Paragraph("Grad-CAM Overlay Processing / Unavailable", body_style))

        vis_table = Table([[img_cells[0], img_cells[1]]], colWidths=[270, 270])
        vis_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(vis_table)
        elements.append(Paragraph("<font size=7 color='#64748B'>Left: Original Retinal Fundus Photograph. Right: Grad-CAM Saliency Overlay highlighting convolutional attention regions (warm colors indicate high model salience).</font>", body_style))
        elements.append(Spacer(1, 10))

        # 7. Recommendations
        elements.append(Paragraph("Clinical Recommendations & Next Steps", section_heading))
        rec_text = screening_case.clinical_recommendation or (
            "Referral to an ophthalmologist recommended within 2-4 weeks for comprehensive dilated fundus examination."
            if referable else "No immediate referral indicated. Schedule routine annual diabetic eye screening."
        )
        elements.append(Paragraph(f"• <b>Action:</b> {rec_text}", body_style))
        if screening_case.plain_language_summary:
            elements.append(Paragraph(f"• <b>Summary:</b> {screening_case.plain_language_summary}", body_style))
        elements.append(Spacer(1, 14))

        # 8. Statutory Medical Disclaimer
        elements.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#DC2626'), spaceBefore=6, spaceAfter=6))
        elements.append(Paragraph(
            "<b>STATUTORY MEDICAL DISCLAIMER & LIMITATIONS:</b><br/>"
            "RetinaGuard AI is an automated screening and decision-support platform designed for rural triage and resource-limited healthcare facilities. "
            "It does NOT provide a definitive medical diagnosis, nor does it replace a clinical examination by a licensed ophthalmologist or retina specialist. "
            "Negative screening does not rule out other ocular pathologies such as glaucoma, cataract, or macular edema. "
            "Final clinical management decisions must always be made by authorized healthcare professionals.",
            disclaimer_style
        ))

        doc.build(elements)
        return pdf_path

report_service = ReportService()
