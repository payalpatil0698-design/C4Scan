import zipfile
import xml.etree.ElementTree as ET

def read_docx(file_path):
    try:
        with zipfile.ZipFile(file_path, 'r') as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Simple way to get all text
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = tree.findall('.//w:p', ns)
            text = []
            for p in paragraphs:
                texts = p.findall('.//w:t', ns)
                if texts:
                    text.append(''.join([t.text for t in texts]))
            
            return '\n'.join(text)
    except Exception as e:
        return f"Error: {e}"

path = r"C:\Users\payal\Downloads\Project_Diary_Cancer_Prediction.docx"
print(read_docx(path))
