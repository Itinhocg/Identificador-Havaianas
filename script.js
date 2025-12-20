// O endereço do nosso modelo treinado no Teachable Machine
const URL = 'https://teachablemachine.withgoogle.com/models/6J13sxuP9/'; // &lt;-- COLE SEU LINK AQUI!

let model;

// Nosso "catálogo" de produtos. A chave (ex: "Havaianas Top Branca")
// DEVE ser EXATAMENTE igual ao nome da classe que você criou no Teachable Machine.
const catalogo = {
    "Havaianas Top Max Cinza Escuro": {
        numeracoes: {
            "37/38": "7909843593003",
            "39/40": "7909843593010",
            "41/42": "7909843593028",
            "43/44": "7909843593034",
        }
    },
    "Havaianas Logomania Branca/Preta": {
        numeracoes: {
            "37/38": "7909989155493",
            "39/40": "7909989155509",
            "41/42": "7909989155516",
            "43/42": "7909989159743",
        }
    }
    // Adicione aqui os outros modelos que você treinou
};

// Pega os elementos da página HTML para podermos interagir com eles
const uploadInput = document.getElementById('upload-camera');
const modeloIdentificadoEl = document.getElementById('modelo-identificado');
const codigosContainerEl = document.getElementById('codigos-container');

// Esta função é chamada assim que a página carrega
async function iniciar() {
    // Carrega o modelo de reconhecimento de imagem
    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';
    model = await tmImage.load(modelURL, metadataURL);
    console.log("Modelo carregado!");
}

// Quando o usuário tira uma foto, esta função é chamada
uploadInput.addEventListener('change', async (event) => {
    // Limpa os resultados anteriores
    modeloIdentificadoEl.innerText = 'Analisando...';
    codigosContainerEl.innerHTML = '';

    const file = event.target.files[0];
    if (file) {
        const imagem = document.createElement('img');
        imagem.src = URL.createObjectURL(file);
        imagem.onload = async () => {
            // Pede ao modelo para "prever" qual é a sandália na imagem
            const prediction = await model.predict(imagem);

            // Ordena as previsões da mais provável para a menos provável
            prediction.sort((a, b) => b.probability - a.probability);

            // Pega o nome do modelo mais provável
            const modeloEncontrado = prediction[0].className;
            const confianca = (prediction[0].probability * 100).toFixed(0);

            // Mostra o nome do modelo na tela
            modeloIdentificadoEl.innerText = `${modeloEncontrado} (${confianca}% de certeza)`;

            // Procura o modelo no nosso catálogo e mostra os códigos
            exibirCodigos(modeloEncontrado);
        }
    }
});

// Função para mostrar as numerações e códigos de barras
function exibirCodigos(nomeDoModelo) {
    const produto = catalogo[nomeDoModelo];

    if (produto) {
        // Passa por cada numeração do produto
        for (const numeracao in produto.numeracoes) {
            const codigoDeBarras = produto.numeracoes[numeracao];

            // Cria os elementos HTML para mostrar as informações
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('codigo-item');

            const numeracaoP = document.createElement('p');
            numeracaoP.innerText = `Numeração: ${numeracao}`;

            // O elemento SVG onde o código de barras será desenhado
            const barcodeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            barcodeSvg.id = `barcode-${codigoDeBarras}`;

            itemDiv.appendChild(numeracaoP);
            itemDiv.appendChild(barcodeSvg);
            codigosContainerEl.appendChild(itemDiv);

            // Usa a biblioteca JsBarcode para desenhar o código de barras
            JsBarcode(`#${barcodeSvg.id}`, codigoDeBarras, {
                format: "EAN13", // Formato comum de código de barras
                displayValue: true, // Mostra o número abaixo do código
                fontSize: 14
            });
        }
    } else {
        codigosContainerEl.innerText = 'Modelo não encontrado no nosso catálogo.';
    }
}

// Inicia tudo!
iniciar();