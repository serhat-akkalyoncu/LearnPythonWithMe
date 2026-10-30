let editor;

// Monaco Editor'ü başlat
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: "# Kodunuzu buraya yazın\n",
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false }
    });
    
    // Uygulama açılır açılmaz konuları klasörden yükle
    loadAllTopics();
});

// JSON klasöründeki TÜM dosyaları sırasıyla getiren fonksiyon
function loadAllTopics() {
    fetch('/api/topics')
        .then(response => response.json())
        .then(topics => {
            const topicList = document.getElementById('topic-list');
            topicList.innerHTML = '';
            
            topics.forEach(t => {
                let li = document.createElement('li');
                li.innerText = t.topic_name;
                li.onclick = () => {
                    // Konu seçilince rengini değiştir (diğerlerini sıfırla)
                    document.querySelectorAll('#topic-list li').forEach(el => el.style.backgroundColor = '');
                    li.style.backgroundColor = '#e74c3c'; // Kırmızı aktif rengi
                    
                    loadTopic(t.filename);
                };
                topicList.appendChild(li);
            });

            // Başarıyla yüklendiğinde otomatik olarak ilk sıradaki konuya (Intro) tıkla
            if (topics.length > 0) {
                topicList.firstChild.click();
            }
        })
        .catch(err => console.error("Konular çekilirken hata:", err));
}

// Seçilen konunun içindeki "Örnekleri" ve başlıkları yükleyen fonksiyon
function loadTopic(topicFilename) {
    fetch(`/api/get_topic/${topicFilename}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("Konu yüklenemedi: " + data.error);
                return;
            }
            
            document.getElementById('topic-title').innerText = data.topic;
            document.getElementById('topic-description').innerText = data.description;
            
            const list = document.getElementById('example-list');
            list.innerHTML = ''; 
            
            data.examples.forEach(example => {
                let li = document.createElement('li');
                li.innerText = example.title;
                li.onclick = () => {
                    // Örnek seçilince rengini değiştir
                    document.querySelectorAll('#example-list li').forEach(el => el.style.backgroundColor = '');
                    li.style.backgroundColor = '#2980b9'; // Mavi aktif rengi
                    
                    loadExample(example);
                };
                list.appendChild(li);
            });
            
            if (data.examples.length > 0) {
                list.firstChild.click();
            }
        })
        .catch(err => console.error("Konu çekilirken hata oluştu:", err));
}

// Seçilen örneğin kodunu ve açıklamasını editöre aktaran fonksiyon
function loadExample(example) {
    document.getElementById('example-explanation').innerText = example.explanation;
    if (editor) {
        editor.setValue(example.default_code);
    }
    const outputContainer = document.getElementById('output-container');
    outputContainer.innerHTML = "Hazır...";
    outputContainer.classList.remove('error-text');
}

// Editördeki kodu Backend'e (Flask) gönderip çalıştıran fonksiyon
function runCode() {
    const code = editor.getValue();
    const outputContainer = document.getElementById('output-container');
    
    outputContainer.innerHTML = "Çalıştırılıyor...";
    outputContainer.classList.remove('error-text');
    
    fetch('/api/run', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: code })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            outputContainer.innerText = data.error;
            outputContainer.classList.add('error-text');
        } else {
            outputContainer.innerText = data.output;
        }
    })
    .catch(err => {
        outputContainer.innerText = "Sunucu ile iletişim kurulamadı.";
        outputContainer.classList.add('error-text');
    });
}