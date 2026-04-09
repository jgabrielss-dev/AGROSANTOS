import json
import os
import time
import glob
import shutil
from icrawler.builtin import GoogleImageCrawler, BingImageCrawler # Importamos ambos

# --- CONFIGURAÇÃO DE INFRAESTRUTURA ---
# Seus caminhos absolutos precisam estar corretos
pasta_imagens = r"C:\Users\CAIXA\Desktop\VSCode\AGROSANTOS\catalogo\img"
caminho_json = r"C:\Users\CAIXA\Desktop\VSCode\AGROSANTOS\catalogo\produtos.json"

# Motor de Busca: Se o Bing bloqueou, vamos tentar o Google com um intervalo maior
# ou vice-versa. Vamos começar alternando para o Google.
motor_de_busca = "google" 

def reparar_imagens_faltantes():
    # 1. Carregar o JSON existente (o que você editou manualmente)
    if not os.path.exists(caminho_json):
        print(f"ERRO CRÍTICO: Arquivo JSON não encontrado em {caminho_json}")
        return

    with open(caminho_json, "r", encoding="utf-8") as f:
        lista_produtos = json.load(f)

    print(f"Lendo banco de dados. Total de produtos: {len(lista_produtos)}")
    
    # 2. Identificar os produtos sem imagem física no HD
    produtos_sem_imagem = []
    for produto in lista_produtos:
        id_prod = str(produto.get("id")) # Garante que o ID venha como string
        # O caminho físico onde a imagem deveria estar
        caminho_final_absoluto = os.path.join(pasta_imagens, f"{id_prod}.jpg")
        
        if not os.path.exists(caminho_final_absoluto):
            produtos_sem_imagem.append(produto)

    total_faltante = len(produtos_sem_imagem)
    print(f"Análise concluída. Produtos sem imagem no HD: {total_faltante}")

    if total_faltante == 0:
        print("Todas as imagens estão presentes. Nada a fazer.")
        return

    # 3. Rodar o Crawler apenas para os faltantes (Incremental)
    os.makedirs(pasta_imagens, exist_ok=True)
    
    print(f"Iniciando reparo via {motor_de_busca.upper()} para {total_faltante} itens...")
    
    contador = 0
    for produto in produtos_sem_imagem:
        contador += 1
        id_prod = str(produto.get("id"))
        nome_prod = produto.get("nome")
        
        caminho_final_absoluto = os.path.join(pasta_imagens, f"{id_prod}.jpg")
        
        # Blindagem: Se o arquivo apareceu magicamente no meio do processo, pula
        if os.path.exists(caminho_final_absoluto):
            continue

        print(f"[{contador}/{total_faltante}] Baixando para ID {id_prod}: {nome_prod}")
        
        # Pasta temporária isolada por ID para evitar conflito
        pasta_temp = os.path.join(pasta_imagens, f"temp_reparo_{id_prod}")
        os.makedirs(pasta_temp, exist_ok=True)
        
        try:
            # Configuração do Crawler dinâmico
            if motor_de_busca == "google":
                crawler = GoogleImageCrawler(storage={'root_dir': pasta_temp})
            else:
                crawler = BingImageCrawler(storage={'root_dir': pasta_temp})
            
            # Busca agressiva: limitamos a 1, mas se você quiser tentar mais precisão, mude.
            crawler.crawl(keyword=nome_prod, max_num=1, file_idx_offset='auto')
            
            # Pega o primeiro arquivo baixado na pasta temp
            arquivos_baixados = glob.glob(os.path.join(pasta_temp, "*"))
            if arquivos_baixados:
                arquivo_original = arquivos_baixados[0]
                # Move e renomeia para ID.jpg
                shutil.move(arquivo_original, caminho_final_absoluto)
            else:
                print(f"  AVISO: Nenhuma imagem encontrada para '{nome_prod}'")
        
        except Exception as e:
            print(f"  ERRO ao processar '{nome_prod}': {e}")
            # Se o motor bloquear, você pode adicionar uma lógica de switch aqui no futuro
        
        finally:
            # Limpeza obrigatória
            if os.path.exists(pasta_temp):
                shutil.rmtree(pasta_temp)
        
        # INTERVALO DE SEGURANÇA ANTIBLOCK: Aumentei para 5 segundos.
        # Se você tiver pressa e for bloqueado de novo, o problema é seu.
        time.sleep(5) 

    print("\nProcesso de reparo concluído.")

if __name__ == "__main__":
    reparar_imagens_faltantes()