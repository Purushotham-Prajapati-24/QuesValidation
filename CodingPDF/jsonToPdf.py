import json
import sys
import os
from fpdf import FPDF
from datetime import datetime

class QuestionPDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            self.set_font('helvetica', 'B', 20)
            self.cell(0, 20, 'Problem Statements Report', align='C', new_x="LMARGIN", new_y="NEXT")
            self.set_font('helvetica', '', 10)
            self.cell(0, 10, f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M")}', align='C', new_x="LMARGIN", new_y="NEXT")
            self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

    def chapter_title(self, title):
        self.set_font('helvetica', 'B', 18)
        self.set_fill_color(230, 230, 250)
        self.multi_cell(0, 12, title, fill=True, align='L', new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def draw_tag(self, text, color=(100, 100, 100)):
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(255, 255, 255)
        self.set_fill_color(*color)
        width = self.get_string_width(text) + 6
        self.cell(width, 6, text.upper(), fill=True, align='C', new_x="RIGHT", new_y="TOP")
        self.set_text_color(0, 0, 0)

    def draw_code_block(self, code_text):
        """Draw code block with single outer border, light background, and auto line-wrapping."""
        self.set_font('courier', '', 8.5)
        line_height = 4.5
        padding_x = 4
        padding_y = 3
        page_width = self.w - self.l_margin - self.r_margin
        inner_w = page_width - padding_x * 2

        # Courier 8.5pt on A4 inner width (~162mm) ≈ 95 chars max per line - hardcoded for safety
        max_chars = 95

        # Expand tabs and wrap long lines with continuation indent
        raw_lines = code_text.split('\n')
        lines = []
        for raw in raw_lines:
            raw = raw.replace('\t', '    ')
            while len(raw) > max_chars:
                lines.append(raw[:max_chars])
                raw = '    ' + raw[max_chars:]
            lines.append(raw)

        block_h = len(lines) * line_height + padding_y * 2

        if self.get_y() + block_h > self.h - self.b_margin - 10:
            self.add_page()

        x_start = self.l_margin
        y_start = self.get_y()

        self.set_fill_color(245, 245, 245)
        self.set_draw_color(180, 180, 180)
        self.rect(x_start, y_start, page_width, block_h, 'DF')

        self.set_y(y_start + padding_y)
        for line in lines:
            self.set_x(x_start + padding_x)
            self.set_font('courier', '', 8.5)
            self.set_text_color(30, 30, 30)
            self.cell(inner_w, line_height, line, new_x="LMARGIN", new_y="NEXT")

        self.set_y(y_start + block_h)
        self.set_text_color(0, 0, 0)
        self.set_draw_color(0, 0, 0)

    def draw_test_case(self, idx, input_text, output_text):
        """Draw a single test case panel. Labels are on their own row, values are indented below."""
        padding_x = 5
        indent = 8       # indent for value lines below label
        line_height = 4.8
        label_h = 5
        gap = 2          # gap between input block and output block
        page_width = self.w - self.l_margin - self.r_margin

        in_lines = input_text.split('\n')
        out_lines = output_text.split('\n')

        # Total height = header(7) + pad(2)
        #              + label_input(label_h) + in_lines
        #              + gap
        #              + label_output(label_h) + out_lines
        #              + bottom_pad(4)
        panel_h = (7 + 2
                   + label_h + len(in_lines) * line_height
                   + gap
                   + label_h + len(out_lines) * line_height
                   + 4)

        if self.get_y() + panel_h > self.h - self.b_margin:
            self.add_page()

        x_start = self.l_margin
        y_start = self.get_y()

        # Outer panel
        self.set_fill_color(250, 250, 250)
        self.set_draw_color(200, 200, 200)
        self.rect(x_start, y_start, page_width, panel_h, 'DF')

        # Header bar
        self.set_fill_color(220, 220, 235)
        self.rect(x_start, y_start, page_width, 7, 'F')
        self.set_font('helvetica', 'B', 9)
        self.set_xy(x_start + padding_x, y_start + 1.2)
        self.set_text_color(40, 40, 80)
        self.cell(0, 5, f'Sample Test Case #{idx}', new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)

        cur_y = y_start + 9

        # ── Input label (own row) ──
        self.set_xy(x_start + padding_x, cur_y)
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(0, 80, 160)
        self.cell(0, label_h, 'Input:', new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        cur_y += label_h

        # Input value lines (indented)
        for line in in_lines:
            self.set_font('courier', '', 9)
            self.set_xy(x_start + padding_x + indent, cur_y)
            self.cell(page_width - padding_x - indent, line_height, line, new_x="LMARGIN", new_y="NEXT")
            cur_y += line_height

        cur_y += gap

        # ── Expected Output label (own row) ──
        self.set_xy(x_start + padding_x, cur_y)
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(0, 120, 60)
        self.cell(0, label_h, 'Expected Output:', new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        cur_y += label_h

        # Output value lines (indented)
        for line in out_lines:
            self.set_font('courier', '', 9)
            self.set_xy(x_start + padding_x + indent, cur_y)
            self.cell(page_width - padding_x - indent, line_height, line, new_x="LMARGIN", new_y="NEXT")
            cur_y += line_height

        self.set_y(y_start + panel_h + 2)
        self.set_draw_color(0, 0, 0)


def sanitize_data(data):
    if isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, str):
        return (data
            .replace('\u2014', '-').replace('\u2013', '-')
            .replace('\u2018', "'").replace('\u2019', "'")
            .replace('\u201c', '"').replace('\u201d', '"')
            .replace('\u00a0', ' ').replace('\u2026', '...')
            .replace('\u00b4', "'").replace('\u200b', '')
            .replace('\u2022', '*').replace('\u2192', '->')
            .replace('\u2264', '<=').replace('\u2265', '>=')
            .replace('\u00d7', 'x').replace('\u03c0', 'pi'))
    return data

def safe_text(text):
    """Strip any character outside Latin-1 (ord > 255) so fpdf2 never crashes on missing glyphs."""
    if not isinstance(text, str):
        text = str(text)
    return ''.join(c if ord(c) < 256 else '?' for c in text)


def generate_pdf(json_files, output_filename):
    pdf = QuestionPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=15)

    for json_file in json_files:
        if not os.path.exists(json_file):
            print(f"Warning: File {json_file} does not exist. Skipping.")
            continue

        print(f"Processing {json_file}...")
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                data = sanitize_data(data)
        except Exception as e:
            print(f"Error reading {json_file}: {e}")
            continue

        # Normalize: flat list or structured list
        if isinstance(data, list) and len(data) > 0 and 'question_text' in data[0]:
            data = [{'name': os.path.basename(json_file), 'questions': data}]

        for item in data:
            section_name = item.get('name', 'General Questions')
            questions = item.get('questions', [])

            if not questions:
                continue

            pdf.add_page()
            pdf.chapter_title(section_name)

            for i, q in enumerate(questions, 1):
                # Force page break if less than 50mm left
                if pdf.get_y() > pdf.h - pdf.b_margin - 50:
                    pdf.add_page()

                # ── Question Title ──
                pdf.set_font('helvetica', 'B', 14)
                pdf.set_text_color(0, 51, 102)
                pdf.multi_cell(0, 9, safe_text(f"Q{i}. {q.get('question_text', 'Untitled Question')}"), new_x="LMARGIN", new_y="NEXT")
                pdf.ln(1)

                # ── Tags ──
                raw_diff = q.get('difficulty', 'UNKNOWN').upper()
                diff_map = {"LOW": "EASY", "MEDIUM": "MEDIUM", "HIGH": "HARD"}
                diff = diff_map.get(raw_diff, raw_diff)
                diff_colors = {"EASY": (40, 167, 69), "MEDIUM": (200, 140, 0), "HARD": (220, 53, 69)}
                pdf.draw_tag(diff, diff_colors.get(diff, (100, 100, 100)))
                pdf.draw_tag(q.get('question_type', 'CODING'), (108, 117, 125))
                pdf.ln(9)

                # ── Description ──
                pdf.set_font('helvetica', '', 11)
                pdf.set_text_color(0, 0, 0)
                pdf.multi_cell(0, 6, safe_text(q.get('question_description', '')), new_x="LMARGIN", new_y="NEXT")
                pdf.ln(4)

                # ── Input / Output Format ──
                for label, key in [("Input Format:", 'input_format'), ("Output Format:", 'output_format')]:
                    val = safe_text(q.get(key, 'N/A'))
                    pdf.set_font('helvetica', 'B', 10)
                    pdf.cell(38, 5.5, label, new_x="RIGHT", new_y="TOP")
                    pdf.set_font('helvetica', '', 10)
                    pdf.multi_cell(0, 5.5, val, new_x="LMARGIN", new_y="NEXT")
                pdf.ln(1)

                # ── Constraints ──
                if q.get('constraints'):
                    pdf.set_font('helvetica', 'B', 10)
                    pdf.cell(38, 5.5, "Constraints:", new_x="RIGHT", new_y="TOP")
                    pdf.set_font('helvetica', 'I', 10)
                    pdf.multi_cell(0, 5.5, safe_text(q.get('constraints')), new_x="LMARGIN", new_y="NEXT")
                    pdf.ln(1)

                # ── Hints ──
                if q.get('hints'):
                    pdf.set_font('helvetica', 'B', 10)
                    pdf.cell(38, 5.5, "Hints:", new_x="RIGHT", new_y="TOP")
                    pdf.set_font('helvetica', 'I', 10)
                    pdf.set_text_color(80, 80, 80)
                    pdf.multi_cell(0, 5.5, safe_text(q.get('hints')), new_x="LMARGIN", new_y="NEXT")
                    pdf.set_text_color(0, 0, 0)
                pdf.ln(4)

                # ── Test Cases ──
                test_cases = q.get('test_cases', [])
                if isinstance(test_cases, str):
                    try:
                        test_cases = json.loads(test_cases)
                    except:
                        test_cases = []

                if test_cases:
                    pdf.set_font('helvetica', 'B', 11)
                    pdf.set_text_color(0, 0, 0)
                    pdf.cell(0, 7, "Test Cases:", new_x="LMARGIN", new_y="NEXT")
                    pdf.ln(1)
                    for idx, tc in enumerate(test_cases[:3], 1):
                        input_text = safe_text(str(tc.get('input', '')))
                        output_text = safe_text(str(tc.get('expectedOutput') or tc.get('expected_output', '')))
                        pdf.draw_test_case(idx, input_text, output_text)
                    pdf.ln(2)

                # ── Solution Strategy ──
                explanation = q.get('solution_explanation') or q.get('explanation')
                if explanation:
                    pdf.set_font('helvetica', 'B', 10)
                    pdf.cell(0, 7, "Solution Strategy:", new_x="LMARGIN", new_y="NEXT")
                    pdf.set_font('helvetica', '', 10)
                    pdf.multi_cell(0, 5.5, safe_text(explanation), new_x="LMARGIN", new_y="NEXT")
                    pdf.ln(2)

                # ── Reference Solution ──
                answer = q.get('answer')
                if answer:
                    pdf.set_font('helvetica', 'B', 10)
                    pdf.cell(0, 7, "Reference Solution:", new_x="LMARGIN", new_y="NEXT")
                    pdf.draw_code_block(safe_text(answer))

                # ── Separator ──
                pdf.ln(6)
                pdf.set_draw_color(180, 180, 180)
                pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
                pdf.ln(8)

    pdf.output(output_filename)
    print(f"\nSuccess! Generated: {output_filename}")


if __name__ == "__main__":
    import argparse
    import glob
    import re

    parser = argparse.ArgumentParser(description="Generate PDF from coding question JSONs")
    parser.add_argument('-o', '--output', default='problem_statements_detailed.pdf', help='Output PDF filename')
    parser.add_argument('files', nargs='+', help='Input JSON files')

    args = parser.parse_args()

    input_files = []
    for f in args.files:
        expanded = glob.glob(f)
        if expanded:
            input_files.extend(expanded)
        else:
            input_files.append(f)

    def extract_week(filepath):
        basename = os.path.basename(filepath)
        match = re.search(r'week-(\d+)', basename)
        if match:
            return int(match.group(1))
        return 999

    input_files.sort(key=extract_week)

    generate_pdf(input_files, args.output)