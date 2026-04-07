import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    """
    Extract text from a .docx file without external dependencies.
    """
    try:
        with zipfile.ZipFile(path, 'r') as zip_ref:
            xml_content = zip_ref.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Find all text elements
            texts = []
            for t in tree.findall('.//w:t', ns):
                if t.text:
                    texts.append(t.text)
            
            return "".join(texts)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    docx_path = r"C:\Users\payal\Downloads\Project_Diary_Cancer_Prediction.docx"
    text = get_docx_text(docx_path)
    keywords = ["dataset", "hugging", "kaggl", "medmnist", "organ", "scan", "brain", "lung", "breast", "train"]
    found = []
    for kw in keywords:
        if kw.lower() in text.lower():
            found.append(kw)
    
    print(f"Keywords found: {found}")
    # Print a snippet around keywords
    for kw in found:
        idx = text.lower().find(kw)
        start = max(0, idx - 50)
        end = min(len(text), idx + 100)
        print(f"\n--- Snippet for '{kw}' ---")
        print(text[start:end])
