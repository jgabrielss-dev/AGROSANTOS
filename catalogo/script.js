let produtosGlobais = [];
let produtosFiltrados = [];
let carrinho = JSON.parse(localStorage.getItem('carrinhoAgrosantos')) || [];
let indexRenderizacao = 0;
const TAMANHO_LOTE = 50; 

// --- NOVAS VARIÁVEIS DE ESTADO DO CATÁLOGO ---
const idsMaisVendidos = [
    "302", "304", "305", "2507", "3337", "2089", "1904", "1903", "2153", "2163",
    "985", "1158", "2154", "980", "981", "510", "303", "2244", "2205"
];
let abaAtual = "maisVendidos"; 
let categoriaSelecionada = ""; 
let categoriasUnicas = [];

// Função para salvar o scroll antes de fechar/recarregar a página
window.addEventListener('beforeunload', () => {
    localStorage.setItem('scrollPosicaoAgrosantos', window.scrollY);
});

// Função para restaurar o scroll (deve ser chamada após carregar os produtos)
async function restaurarScroll() {
    const posicaoSalva = localStorage.getItem('scrollPosicaoAgrosantos');
    if (posicaoSalva) {
        const scrollAlvo = parseInt(posicaoSalva);
        
        // Loop para carregar lotes até que a altura da página alcance a posição salva
        // Isso evita que o scroll tente ir para um lugar que ainda não existe no HTML
        while (document.body.offsetHeight < (scrollAlvo + window.innerHeight) && indexRenderizacao < produtosFiltrados.length) {
            renderizarLote();
        }

        // Move a tela para a posição
        window.scrollTo({
            top: scrollAlvo,
            behavior: 'instant' // 'instant' evita bugs visualmente confusos no carregamento
        });
        
        // Opcional: limpa o cache após usar para não travar o usuário lá pra sempre
        localStorage.removeItem('scrollPosicaoAgrosantos');
    }
}

// Função principal de inicialização
async function carregarProdutos() {
    try {
        const resposta = await fetch('produtos.json?v=10');
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
        
        produtosGlobais = await resposta.json();
        produtosGlobais.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
       
        categoriasUnicas = [...new Set(produtosGlobais.map(p => p.categoria))].filter(Boolean).sort();
        popularDropdown();
        configurarEventosGuias();
        
        aplicarFiltroAba(); 
        restaurarScroll();
    } catch (erro) {
        console.error("Erro ao carregar o catálogo:", erro);
    }
}

function popularDropdown() {
    const dropdown = document.getElementById('dropdownCategorias');
    categoriasUnicas.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        dropdown.appendChild(option);
    });

    dropdown.addEventListener('change', (e) => {
        categoriaSelecionada = e.target.value;
        document.getElementById('barraDePesquisa').value = ''; 
        aplicarFiltroAba();
    });
}

function configurarEventosGuias() {
    const abas = {
        'maisVendidos': document.getElementById('tabMaisVendidos'),
        'todos': document.getElementById('tabTodos'),
        'categorias': document.getElementById('tabCategorias')
    };
    const containerSeletor = document.getElementById('containerSeletor');

    const trocarAba = (novaAba) => {
        abaAtual = novaAba;
        document.getElementById('barraDePesquisa').value = ''; 
        
        Object.values(abas).forEach(btn => btn.classList.remove('ativa'));
        abas[novaAba].classList.add('ativa');

        if (novaAba === 'categorias') {
            containerSeletor.classList.remove('seletor-escondido');
            containerSeletor.classList.add('seletor-visivel');
        } else {
            containerSeletor.classList.remove('seletor-visivel');
            containerSeletor.classList.add('seletor-escondido');
        }
        aplicarFiltroAba();
    };

    abas['maisVendidos'].onclick = () => trocarAba('maisVendidos');
    abas['todos'].onclick = () => trocarAba('todos');
    abas['categorias'].onclick = () => trocarAba('categorias');
}

function aplicarFiltroAba() {
    const grid = document.getElementById('gridCatalogo');

    if (abaAtual === 'maisVendidos') {
        produtosFiltrados = produtosGlobais.filter(p => idsMaisVendidos.includes(p.id));
    } else if (abaAtual === 'todos') {
        produtosFiltrados = [...produtosGlobais];
    } else if (abaAtual === 'categorias') {
        if (categoriaSelecionada === "") {
            produtosFiltrados = [];
            grid.innerHTML = '<p style="text-align:center; width:100%; color:#055e10; font-weight:bold; margin-top:20px; margin-bottom:20px; font-family: arial, sans-serif; position:absolute; top: 50%; left:50%; transform: translate(-50%, -50%);">Selecione uma categoria acima para visualizar os produtos.</p>';
            return; // Interrompe para não renderizar o lote vazio e apagar a mensagem
        } else {
            produtosFiltrados = produtosGlobais.filter(p => p.categoria === categoriaSelecionada);
        }
    }
    
    // Reseta o grid e chama o renderizador original que você já tinha no arquivo
    grid.innerHTML = '';
    indexRenderizacao = 0;
    renderizarLote();
}


function iniciarRenderizacao() {
    const grid = document.getElementById('gridCatalogo');
    grid.innerHTML = '';
    indexRenderizacao = 0;
    renderizarLote();
}


function renderizarLote() {
    const grid = document.getElementById('gridCatalogo');
    const fragmento = document.createDocumentFragment();
    
    const limite = Math.min(indexRenderizacao + TAMANHO_LOTE, produtosFiltrados.length);

    for (let i = indexRenderizacao; i < limite; i++) {
        const produto = produtosFiltrados[i];
        const card = document.createElement('div');
        card.classList.add('card-produto');

        // Nota de Engenharia: Você ignorou a arquitetura "gaiola-imagem" que discutimos 
        // no dia 20 e manteve o estilo inline amador aqui. O código abaixo mantém o seu estilo, 
        // mas saiba que essa dívida técnica vai estourar quando subirem uma foto vertical.
        card.innerHTML = `
            <div class="caixaProduto">
                <img src="${produto.img}?v=10" alt="${produto.nome}" loading="lazy" 
                     onerror="this.onerror=null; this.src='indisponivel.png?v=10';"
                     style="min-width: 75%; min-height: 75%; max-width:75%; max-height:75%; object-fit: contain;">
                <h3 class="nomeProduto">${produto.nome}</h3>
                <p class="preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
            </div>
        `;
        
        card.addEventListener('click', () => abrirModal(produto));
        fragmento.appendChild(card);
    }
    
    grid.appendChild(fragmento);
    indexRenderizacao = limite; 

    // --- MOTOR DO BOTÃO "VER TODOS" ---
    // Verifica se estamos na aba certa E se todos os produtos daquela aba já foram desenhados na tela
    if (abaAtual === 'maisVendidos' && indexRenderizacao >= produtosFiltrados.length) {
        
        // Impede que o botão seja criado duas vezes caso o usuário role a tela freneticamente
        if (!document.getElementById('btn-ver-todos-dinamico')) {
            const divBotao = document.createElement('div');
            
            // Força o botão a ignorar as colunas do grid e ocupar a linha inteira de ponta a ponta
            divBotao.style.gridColumn = "1 / -1"; 
            divBotao.style.display = "flex";
            divBotao.style.justifyContent = "center";
            divBotao.style.marginTop = "40px";
            divBotao.style.marginBottom = "40px";

            const btn = document.createElement('button');
            btn.id = 'btn-ver-todos-dinamico';
            btn.innerText = "Ver Todos os Produtos";
            
            // Estilização agressiva direto no JS para não sujar o seu arquivo CSS
            btn.style.backgroundColor = "#055e10";
            btn.style.color = "white";
            btn.style.padding = "15px 40px";
            btn.style.border = "none";
            btn.style.borderRadius = "8px";
            btn.style.fontSize = "18px";
            btn.style.fontWeight = "bold";
            btn.style.cursor = "pointer";
            btn.style.transition = "background-color 0.3s";
            
            btn.onmouseover = () => btn.style.backgroundColor = "#033c0a";
            btn.onmouseout = () => btn.style.backgroundColor = "#055e10";

            btn.onclick = () => {
                // Hack de Estado: Em vez de reescrever a lógica, disparamos um clique falso 
                // na guia de "Todos", forçando o sistema a fazer a troca perfeita de estado.
                document.getElementById('tabTodos').click();
                
                // Joga a visão do usuário de volta para o topo do catálogo
                window.scrollTo({ top: document.getElementById('catalogo').offsetTop - 20, behavior: 'smooth' });
            };

            divBotao.appendChild(btn);
            grid.appendChild(divBotao);
        }
    }
}


document.getElementById('barraDePesquisa').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    
    let baseFiltro = [];
    if (abaAtual === 'maisVendidos') {
        baseFiltro = produtosGlobais.filter(p => idsMaisVendidos.includes(p.id));
    } else if (abaAtual === 'todos') {
        baseFiltro = produtosGlobais;
    } else if (abaAtual === 'categorias' && categoriaSelecionada !== "") {
        baseFiltro = produtosGlobais.filter(p => p.categoria === categoriaSelecionada);
    }

    produtosFiltrados = baseFiltro.filter(p => 
        p.nome.toLowerCase().includes(termo)
    );
    
    const grid = document.getElementById('gridCatalogo');
    grid.innerHTML = '';
    indexRenderizacao = 0;
    renderizarLote();
});

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        if (indexRenderizacao < produtosFiltrados.length) {
            renderizarLote();
        }
    }
});

function abrirModal(produto) {
    document.getElementById('gaveta-carrinho').classList.remove('aberta');
    const modal = document.getElementById('modal-produto');
    const conteudo = document.querySelector('.modalconteudo');
    const modalImg = document.getElementById('modal-img');

    modalImg.src = produto.img;

    modalImg.onerror = function() {
        this.onerror = null;
        this.src = 'indisponivel.png';
    };

    document.getElementById('modal-nome').innerText = produto.nome;
    document.getElementById('modal-preco').innerText = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
    document.getElementById('inputQuantidade').value = 1;

    document.body.style.overflow = 'hidden'; 
    const botao = document.getElementById('botaoCarrinho');
    botao.onclick = () => adicionarAoCarrinho(produto);
    modal.style.display = "block"; 

    
    conteudo.style.position = "fixed";
    conteudo.style.left = "50%";
    conteudo.style.top = "50%";
    conteudo.style.transform = "translate(-50%, -50%)";
    conteudo.style.zIndex = "10000"; 
}

function fecharModal() {
    document.getElementById('modal-produto').style.display = "none";
    document.body.style.overflow = 'auto'; 
}

window.onclick = function(event) {
    const modal = document.getElementById('modal-produto');
    if (event.target == modal) {
        fecharModal();
    }
}

function adicionarAoCarrinho(produto) {
    const inputQtd = document.getElementById('inputQuantidade');
    const qtdDesejada = sanitizarQuantidade(inputQtd.value);

    const itemExistente = carrinho.find(item => item.id === produto.id);

    if (itemExistente) {
        itemExistente.quantidade += qtdDesejada;
    } else {
        carrinho.push({ ...produto, quantidade: qtdDesejada });
    }

    localStorage.setItem('carrinhoAgrosantos', JSON.stringify(carrinho));
    atualizarContadorCart();
    fecharModal();
}

carregarProdutos();

const inputQtd = document.getElementById('inputQuantidade');

function sanitizarQuantidade(valorBruto) {
    let valor = parseInt(valorBruto);
    if (isNaN(valor) || valor < 1) return 1;
    return Math.floor(valor); 
}

// Botões de Ação
document.getElementById('btn-menos').addEventListener('click', () => {
    let valorAtual = sanitizarQuantidade(inputQtd.value);
    if (valorAtual > 1) {
        inputQtd.value = valorAtual - 1;
    }
});

document.getElementById('btn-mais').addEventListener('click', () => {
    let valorAtual = sanitizarQuantidade(inputQtd.value);
    inputQtd.value = valorAtual + 1;
});

// Escudo da Digitação Manual
inputQtd.addEventListener('change', function() {
    this.value = sanitizarQuantidade(this.value);
});

// --- INTERFACE DA GAVETA DO CARRINHO ---
const gaveta = document.getElementById('gaveta-carrinho');
const btnAbrirCarrinho = document.getElementById('btn-abrir-carrinho');
const btnFecharGaveta = document.getElementById('fechar-gaveta');

// Abre e fecha a gaveta
btnAbrirCarrinho.addEventListener('click', () => {
    fecharModal();
    gaveta.classList.add('aberta');
    renderizarCarrinho();
});

btnFecharGaveta.addEventListener('click', () => {
    gaveta.classList.remove('aberta');
});

// Atualiza a bolinha vermelha no ícone do carrinho
function atualizarContadorCart() {
    const contador = document.getElementById('contador-carrinho');
    // Faz a conta total da matemática: 2 sacos + 3 remédios = 5 itens no ícone
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    contador.innerText = totalItens;
}

// O motor gráfico que constrói a lista na tela
function renderizarCarrinho() {
    const containerItens = document.getElementById('itens-carrinho');
    const containerTotal = document.getElementById('valor-total-carrinho');
    containerItens.innerHTML = ''; // Limpa a gaveta velha
    
    let valorTotal = 0;

    if (carrinho.length === 0) {
        containerItens.innerHTML = '<p style="text-align:center; color:#666; margin-top:20px;">Seu carrinho está vazio.</p>';
    } else {
        carrinho.forEach((item, index) => {
            const subtotal = item.preco * item.quantidade;
            valorTotal += subtotal;

            const divItem = document.createElement('div');
            divItem.classList.add('item-gaveta');
            divItem.innerHTML = `
                <div class="item-gaveta-info">
                    <p>${item.quantidade}x ${item.nome}</p>
                    <p>R$ ${subtotal.toFixed(2).replace('.', ',')}</p>
                </div>
                <button class="btn-remover-item" onclick="removerDoCarrinho(${index})">X</button>
            `;
            containerItens.appendChild(divItem);
        });
    }

    // Injeta o dinheiro somado na tela
    containerTotal.innerText = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    atualizarContadorCart();
}

// O botão de "X" vermelho na gaveta para deletar itens
function removerDoCarrinho(index) {
    carrinho.splice(index, 1); 
    localStorage.setItem('carrinhoAgrosantos', JSON.stringify(carrinho));
    renderizarCarrinho(); 
}

// --- MOTOR DE CHECKOUT VIA WHATSAPP ---
document.getElementById('btn-finalizar-whatsapp').addEventListener('click', () => {
    // Trava contra pedidos fantasmas
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio. Adicione produtos antes de enviar.");
        return;
    }

    // A Construção do Relatório de Venda
    let mensagem = "Olá! Gostaria de fazer o seguinte pedido na Agrosantos:\n\n";
    let valorTotal = 0;

    carrinho.forEach(item => {
        mensagem += ` ${item.quantidade}x ${item.nome}\n`;
        valorTotal += (item.preco * item.quantidade);
    });

    // O fechamento com o dado financeiro mastigado para o caixa
    mensagem += `\n*Valor Total Aproximado: R$ ${valorTotal.toFixed(2).replace('.', ',')}*`;
    mensagem += "\n\nAguardo o retorno para alinhar o pagamento e a entrega.";

    // O Roteamento de API
    const numeroLoja = "558282030404"; 
    const urlFormatada = `https://wa.me/${numeroLoja}?text=${encodeURIComponent(mensagem)}`;

    // Dispara a nova aba/aplicativo
    window.open(urlFormatada, '_blank');
});

atualizarContadorCart();
