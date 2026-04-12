#!/bin/bash

# Aborta o script se qualquer comando interno falhar
set -e

echo "========================================"
echo "***********DEPLOY AGROSANTOS************"
echo "========================================"

# Passo 1: Pull na raiz do projeto
echo -e "\n[1/6] Sincronizando repositório local..."
git pull

# Passo 2: Receber o local da planilha
echo -e "\n[2/6] Arraste a nova planilha para o terminal ou digite o caminho exato:"
read -p "> " caminho_planilha

# Limpeza de aspas que o terminal costuma adicionar ao arrastar arquivos
caminho_planilha=$(echo "$caminho_planilha" | sed -e "s/^'//" -e "s/'$//" -e 's/^"//' -e 's/"$//')

SKIP_PLANILHA=0
if [ -z "$caminho_planilha" ]; then
    echo "Nenhuma planilha informada. Pulando importação de planilha e geração de JSON."
    SKIP_PLANILHA=1
elif [ ! -f "$caminho_planilha" ]; then
    echo "ERRO CRÍTICO: O arquivo não foi encontrado no caminho especificado."
    exit 1
fi

# Passos 3 e 4: Renomear e colar na pasta py
DESTINO="./catalogo/py/planilha.xlsx"
JSON_ANTIGO="./catalogo/produtos.json"
echo -e "\n[3/6 e 4/6] Limpando arquivos antigos e movendo a nova planilha..."
if [ "$SKIP_PLANILHA" -eq 0 ]; then
    rm -f "$DESTINO" "$JSON_ANTIGO"
    cp "$caminho_planilha" "$DESTINO"
else
    echo "⏭️ Pulando a cópia da planilha e mantendo os arquivos existentes." 
fi

# Passo 5: Rodar o motor de conversão
echo -e "\n[5/6] Executando criarJSON.py..."
if [ "$SKIP_PLANILHA" -eq 0 ]; then
    # Entramos na pasta py para garantir que o Python execute no contexto correto
    cd ./catalogo/py
    python criarJSON.py
    # Voltamos para a raiz (agrosantos) para podermos usar o Git depois
    cd ../../
    echo " JSON gerado com sucesso com base na nova planilha."
else
    echo " Pulando execução do criarJSON.py." 
fi

DATA_ATUAL=$(date "+%d/%m/%Y %H:%M")

if [ "$SKIP_PLANILHA" -eq 0 ]; then
    # Passo 6: A Pausa Estratégica (Trabalho Manual)
    echo -e "\n========================================"
    echo "CONFIRA AS IMAGENS ADICIONADAS ANTES DE PROSSEGUIR"
    echo "========================================"

    while true; do
        read -p "Digite 'sim' para enviar ou 'nao' para abortar: " resposta
        
        # Converte a resposta para minúsculas para evitar erro de digitação (Sim, SIM, sim)
        resposta=$(echo "$resposta" | tr '[:upper:]' '[:lower:]')
        
        if [ "$resposta" = "sim" ]; then
            echo -e "\nIniciando commit para produção..."
            break
        elif [ "$resposta" = "nao" ]; then
            echo -e "\n❌ Deploy abortado pelo usuário. O JSON foi atualizado localmente, mas nada foi enviado ao GitHub."
            exit 0
        else
            echo "Entrada inválida. Responda estritamente com 'sim' ou 'nao'."
        fi
    done
else
    echo -e "\n⏭️ Pulando o passo 6 de pausa manual. Seguindo direto para commit e push."
fi

# O bloco de execução final do Git
git add .
git commit -m "$DATA_ATUAL: Atualização de estoque, catálogo e imagens"
git push

echo -e "\n🚀 DEPLOY CONCLUÍDO. O sistema está no ar."