from flask import Flask, render_template, request, jsonify
import json
import sys
import io
import os

app = Flask(__name__)

BLACKLIST = ["import os", "import subprocess", "import sys", "open("]

@app.route('/')
def index():
    return render_template('index.html')

# YENİ EKLENEN BÖLÜM: Tüm dosyaları tarayıp konuları sıralı listeleyen API
@app.route('/api/topics')
def get_topics():
    topics = []
    data_dir = "data"
    if os.path.exists(data_dir):
        for filename in os.listdir(data_dir):
            if filename.endswith(".json"):
                filepath = os.path.join(data_dir, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = json.load(f)
                        topics.append({
                            "filename": filename.replace(".json", ""),
                            "topic_name": content.get("topic", filename),
                            "order": content.get("order", 999)
                        })
                except Exception as e:
                    print(f"Hata okunurken: {filename} - {e}")
                    
    # 'order' (sıra) değerine göre küçükten büyüğe sırala
    topics.sort(key=lambda x: x["order"])
    return jsonify(topics)

@app.route('/api/get_topic/<topic_name>')
def get_topic(topic_name):
    filepath = os.path.join("data", f"{topic_name}.json")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    return jsonify({"error": "Konu bulunamadı"}), 404

@app.route('/api/run', methods=['POST'])
def run_code():
    code = request.json.get('code', '')
    
    for word in BLACKLIST:
        if word in code:
            return jsonify({"error": "Güvenlik uyarısı: Bu komutu kullanmaya izniniz yok."})

    old_stdout = sys.stdout
    redirected_output = sys.stdout = io.StringIO()
    
    try:
        exec(code, {})
        output = redirected_output.getvalue()
        return jsonify({"output": output})
    except Exception as e:
        return jsonify({"error": str(e)})
    finally:
        sys.stdout = old_stdout

if __name__ == '__main__':
    app.run(debug=True)