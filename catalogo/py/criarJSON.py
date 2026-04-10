import pandas as pd
import json
import os
import time
import glob
import shutil
from icrawler.builtin import BingImageCrawler

# Removida a string vazia que quebrava o filtro
IDS_BLOQUEADOS = ['2435', '749', '942', '2613', '2803', '2899', '2900', '2902', '3005', '3037', '309', '5', '588', '6', '702', '2901', '2635', '2709', '2760', '2537', '2542', '2546', '2584', '2497', '1895', '1963', '2202', '2225', '2303', '1916', '1965', '1935', '1951', '1956', '1658', '1771', '1695', '1660', '1451', '1523', '1059', '1294', '1032', '2592', '1958', '1959', '2809', '2812', '2813', '2073', '2419', '2466', '2763', '2769', '2778', '2801', '2496', '2572', '2690', '2147', '2159', '2160', '2151', '2231', '2260', '2278', '1960', '1962', '1966', '1974', '1984', '1985', '1986', '1988', '2021', '2022', '2023', '1731', '2370', '2864', '2079', '2344', '2919', '2428', '2429', '2734', '2264', '2263', '1659', '927', '3292', '1486', '1487', '1485', '2991', '1489', '1488', '1493', '1492', '1798', '1500', '1503', '1501', '1484']

CATEGORIAS_BLOQUEADAS = ['INSUMO', 'SELARIA']

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

caminho_planilha = os.path.join(BASE_DIR, "planilha.xlsx")
planilha = pd.read_excel(caminho_planilha, skiprows=1)

# Removida string vazia e garantido que todos os termos estão em maiúsculo para o join
TERMOS_BLOQUEADOS = [t for t in ['PADRON', 'VASSOURA', 'FACHOLI', 'PURUCA', 'VASSOURAO', 'INSUMO', 'COLEIRA', 'MULTISHOW', 'GLYPHOTAL', 'ROUNDUP', 'ATRAZINA', 'GLIFOSATO', 'SIMPARIC', 'TECH MASTER', 'CRIADORES', 'CANTONINHO', 'ALCON CLUB', 'DIMY', 'GRANEL', 'SAAD', 'FINOTRATO', 'CHURU', 'cocho', 'COCHO', 'UNICOCHO', 'EXCELL'] if t]

# Limpeza inicial
planilha.dropna(subset=[planilha.columns[0], planilha.columns[1]], inplace=True)

# 1. Filtro de IDs (Tratando como string e removendo decimais de Excel)
planilha[planilha.columns[0]] = planilha[planilha.columns[0]].astype(str).str.replace(r'\.0$', '', regex=True).str.strip()
planilha = planilha[~planilha[planilha.columns[0]].isin(IDS_BLOQUEADOS)]

# 2. Filtro de Categorias
planilha = planilha[~planilha[planilha.columns[2]].astype(str).str.strip().str.upper().isin(CATEGORIAS_BLOQUEADAS)]

# 3. Filtro de Termos (Corrigido para não ser ganancioso)
padrao_termos = '|'.join(TERMOS_BLOQUEADOS)
planilha = planilha[~planilha[planilha.columns[1]].astype(str).str.upper().str.contains(padrao_termos, na=False, regex=True)]

pasta_imagens = os.path.join(BASE_DIR, "..", "img")
os.makedirs(pasta_imagens, exist_ok=True)
lista_produtos = []

for idx, (index, row) in enumerate(planilha.iterrows()):
    
    # Tratamento seguro de ID e Preço
    try:
        id_prod = str(row.iloc[0]).strip()
        nome_prod = str(row.iloc[1]).strip()
        categoria_prod = str(row.iloc[2]).strip()
        preco_prod = float(row.iloc[3])
    except:
        continue

    caminho_para_json = f"img/{id_prod}.jpg"
    caminho_final_absoluto = os.path.join(pasta_imagens, f"{id_prod}.jpg")

    if not os.path.exists(caminho_final_absoluto):
        print(f"[{idx+1}/{len(planilha)}] Baixando: {nome_prod}")
        pasta_temp = os.path.join(pasta_imagens, f"temp_{id_prod}")
        os.makedirs(pasta_temp, exist_ok=True)
        
        try:
            # log_level alto evita poluição no terminal
            crawler = BingImageCrawler(storage={'root_dir': pasta_temp}, log_level=50)
            crawler.crawl(keyword=nome_prod, max_num=1)
            
            arquivos_baixados = glob.glob(f"{pasta_temp}/*")
            if arquivos_baixados:
                # Pega o primeiro arquivo e renomeia para .jpg
                shutil.move(arquivos_baixados[0], caminho_final_absoluto)
            else:
                print(f"   ! Não encontrado.")
        except Exception as e:
            print(f"   ! Erro: {e}")
        finally:
            if os.path.exists(pasta_temp):
                shutil.rmtree(pasta_temp)
        
        time.sleep(1) # Delay para evitar bloqueio

    lista_produtos.append({
        "id": id_prod,
        "nome": nome_prod,
        "preco": preco_prod,
        "categoria": categoria_prod,
        "img": caminho_para_json
    })

# Salvar JSON
caminho_json = os.path.join(BASE_DIR, "..", "produtos.json")
with open(caminho_json, "w", encoding="utf-8") as f:
    json.dump(lista_produtos, f, indent=4, ensure_ascii=False)

print(f"\nConcluído! {len(lista_produtos)} produtos processados.")