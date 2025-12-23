// 1. Sua chave de configuração do Firebase, que você forneceu.
const firebaseConfig = {
  apiKey: "AIzaSyCTLSurHwYlWVS1XZlCi6b0UCdWXYB73hU",
  authDomain: "identificador-havaianas.firebaseapp.com",
  projectId: "identificador-havaianas",
  storageBucket: "identificador-havaianas.appspot.com", // Corrigido de .firebasestorage.app
  messagingSenderId: "18134290302",
  appId: "1:18134290302:web:58a9b6e0e9020ab33fed2f"
};

// Inicializa a conexão com o Firebase usando as bibliotecas 'compat'
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. CORREÇÃO CRÍTICA: Corrigido o endereço do modelo para carregar localmente e evitar o erro de CORS.
// Lembre-se que você precisa ter os arquivos model.json, metadata.json e weights.bin no seu GitHub!
const URL = './';

let model;
// 3. O catálogo agora começa VAZIO. Ele será preenchido pelo Firebase.
let catalogo = {};

// Pega os elementos da página HTML para podermos interagir com eles (sem alterações aqui)
const uploadInput = document.getElementById('upload-camera');
const modeloIdentificadoEl = document.getElementById('modelo-identificado');
const codigosContainerEl = document.getElementById('codigos-container');


// 4. NOVA FUNÇÃO: Busca os dados na coleção 'modelos' do Firebase
async function carregarCatalogoDoFirebase() {
    modeloIdentificadoEl.innerText = 'Carregando catálogo de produtos...';
    console.log("Buscando catálogo no Firebase...");
    
    try {
        const snapshot = await db.collection('modelos').get();
        
        if (snapshot.empty) {
            console.log('Nenhum modelo encontrado no Firebase.');
            modeloIdentificadoEl.innerText = 'Erro: Nenhum modelo encontrado no banco de dados.';
            return;
        }

        // Preenche o nosso objeto 'catalogo' com os dados do banco
        snapshot.forEach(doc => {
            const modelo = doc.data();
            // A chave (ex: "Havaianas Top Max Cinza Escuro") DEVE ser igual ao nome da classe do Teachable Machine
            catalogo[modelo.nomeModelo] = {
                numeracoes: modelo.numeracoes
            };
        });
        
        console.log("Catálogo carregado com sucesso!", catalogo);
        console.log("CHAVES DO CATÁLOGO:", Object.keys(catalogo)); 
        modeloIdentificadoEl.innerText = ''; // Limpa a mensagem de "carregando"
    } catch (error) {
        console.error("Erro ao buscar catálogo do Firebase: ", error);
        modeloIdentificadoEl.innerText = 'Erro ao conectar com o banco de dados.';
    }
}

// 5. FUNÇÃO 'INICIAR' ATUALIZADA: Agora ela primeiro carrega o catálogo e depois o modelo de IA.
async function iniciar() {
    await carregarCatalogoDoFirebase(); // Espera o catálogo carregar primeiro

    if (Object.keys(catalogo).length > 0) {
        const modelURL = URL + 'model.json';
        const metadataURL = URL + 'metadata.json';
        model = await tmImage.load(modelURL, metadataURL);
        console.log("Modelo do Teachable Machine carregado!");
    } else {
        console.log("O carregamento do modelo de IA foi cancelado pois o catálogo não foi carregado.");
    }
}

// O restante do código, que lida com a foto e a exibição, permanece o mesmo.
// Nenhuma alteração é necessária daqui para baixo.

uploadInput.addEventListener('change', async (event) => {
    if (!model) {
        alert("O modelo de IA ainda não foi carregado. Aguarde um instante ou recarregue a página.");
        return;
    }

    modeloIdentificadoEl.innerText = 'Analisando...';
    codigosContainerEl.innerHTML = '';

    const file = event.target.files[0];
    if (file) {
        const imagem = document.createElement('img');
        imagem.src = URL.createObjectURL(file);
        imagem.onload = async () => {
            const prediction = await model.predict(imagem);
            prediction.sort((a, b) => b.probability - a.probability);

            const modeloEncontrado = prediction[0].className;
            const confianca = (prediction[0].probability * 100).toFixed(0);

            modeloIdentificadoEl.innerText = `${modeloEncontrado} (${confianca}% de certeza)`;

            exibirCodigos(modeloEncontrado);
            URL.revokeObjectURL(imagem.src);
        }
    }
});

function exibirCodigos(nomeDoModelo) {
    const produto = catalogo[nomeDoModelo];

    if (produto) {
        for (const numeracao in produto.numeracoes) {
            const codigoDeBarras = produto.numeracoes[numeracao];
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('codigo-item');
            const numeracaoP = document.createElement('p');
            numeracaoP.innerText = `Numeração: ${numeracao}`;
            const barcodeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            barcodeSvg.id = `barcode-${codigoDeBarras}`;
            itemDiv.appendChild(numeracaoP);
            itemDiv.appendChild(barcodeSvg);
            codigosContainerEl.appendChild(itemDiv);
            JsBarcode(`#${barcodeSvg.id}`, codigoDeBarras, {
                format: "EAN13",
                displayValue: true,
                fontSize: 14
            });
        }
    } else {
        codigosContainerEl.innerText = 'Modelo não encontrado no nosso catálogo.';
    }
}

// Inicia tudo!
iniciar();