"""
Script para popular a tabela de alimentos com dados iniciais.
Execute uma vez: python seed_alimentos.py
"""

import os
import sys

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal
from models import Alimento

def seed_alimentos():
    """Popula a tabela de alimentos com dados básicos."""
    db = SessionLocal()
    
    alimentos_iniciais = [
        # Carnes e Proteínas
        {"nome": "Frango grelhado", "proteina": 31.0, "carbo": 0.0, "gordura": 3.6},
        {"nome": "Peito de frango cru", "proteina": 23.0, "carbo": 0.0, "gordura": 1.5},
        {"nome": "Carne bovina grelhada", "proteina": 26.0, "carbo": 0.0, "gordura": 15.0},
        {"nome": "Carne moída", "proteina": 26.0, "carbo": 0.0, "gordura": 17.0},
        {"nome": "Picanha", "proteina": 25.0, "carbo": 0.0, "gordura": 20.0},
        {"nome": "Linguiça", "proteina": 18.0, "carbo": 2.0, "gordura": 25.0},
        {"nome": "Ovo cozido", "proteina": 13.0, "carbo": 0.6, "gordura": 9.0},
        {"nome": "Ovo frito", "proteina": 13.0, "carbo": 1.0, "gordura": 11.0},
        {"nome": "Clara de ovo", "proteina": 11.0, "carbo": 0.7, "gordura": 0.2},
        {"nome": "Salmão grelhado", "proteina": 25.0, "carbo": 0.0, "gordura": 13.0},
        {"nome": "Atum enlatado", "proteina": 29.0, "carbo": 0.0, "gordura": 1.0},
        {"nome": "Tilápia grelhada", "proteina": 26.0, "carbo": 0.0, "gordura": 2.0},
        {"nome": "Sardinha", "proteina": 25.0, "carbo": 0.0, "gordura": 11.0},

        # Carboidratos
        {"nome": "Arroz branco cozido", "proteina": 2.5, "carbo": 28.0, "gordura": 0.2},
        {"nome": "Arroz integral cozido", "proteina": 2.6, "carbo": 23.0, "gordura": 1.0},
        {"nome": "Arroz parboilizado", "proteina": 2.7, "carbo": 28.0, "gordura": 0.3},
        {"nome": "Macarrão cozido", "proteina": 5.0, "carbo": 31.0, "gordura": 0.9},
        {"nome": "Macarrão integral", "proteina": 6.0, "carbo": 30.0, "gordura": 1.5},
        {"nome": "Batata doce cozida", "proteina": 1.6, "carbo": 20.0, "gordura": 0.1},
        {"nome": "Batata inglesa cozida", "proteina": 2.0, "carbo": 17.0, "gordura": 0.1},
        {"nome": "Batata frita", "proteina": 3.0, "carbo": 35.0, "gordura": 15.0},
        {"nome": "Pão francês", "proteina": 8.0, "carbo": 50.0, "gordura": 3.0},
        {"nome": "Pão integral", "proteina": 9.0, "carbo": 43.0, "gordura": 2.5},
        {"nome": "Pão de forma", "proteina": 7.0, "carbo": 49.0, "gordura": 4.0},
        {"nome": "Tapioca", "proteina": 0.2, "carbo": 86.0, "gordura": 0.0},
        {"nome": "Cuscuz", "proteina": 3.8, "carbo": 25.0, "gordura": 0.5},
        {"nome": "Aveia", "proteina": 17.0, "carbo": 66.0, "gordura": 7.0},

        # Frutas
        {"nome": "Banana", "proteina": 1.3, "carbo": 22.0, "gordura": 0.3},
        {"nome": "Maçã", "proteina": 0.3, "carbo": 14.0, "gordura": 0.2},
        {"nome": "Laranja", "proteina": 1.0, "carbo": 12.0, "gordura": 0.1},
        {"nome": "Morango", "proteina": 0.7, "carbo": 7.7, "gordura": 0.3},
        {"nome": "Abacate", "proteina": 2.0, "carbo": 8.5, "gordura": 15.0},
        {"nome": "Manga", "proteina": 0.8, "carbo": 15.0, "gordura": 0.4},
        {"nome": "Uva", "proteina": 0.6, "carbo": 18.0, "gordura": 0.2},
        {"nome": "Pera", "proteina": 0.4, "carbo": 15.0, "gordura": 0.1},
        {"nome": "Abacaxi", "proteina": 0.5, "carbo": 13.0, "gordura": 0.1},
        {"nome": "Melancia", "proteina": 0.6, "carbo": 8.0, "gordura": 0.2},

        # Legumes e Verduras
        {"nome": "Brócolis cozido", "proteina": 2.4, "carbo": 7.2, "gordura": 0.4},
        {"nome": "Cenoura crua", "proteina": 1.0, "carbo": 10.0, "gordura": 0.2},
        {"nome": "Tomate", "proteina": 0.9, "carbo": 3.9, "gordura": 0.2},
        {"nome": "Alface", "proteina": 1.3, "carbo": 1.8, "gordura": 0.3},
        {"nome": "Pepino", "proteina": 0.7, "carbo": 3.6, "gordura": 0.1},
        {"nome": "Abobrinha", "proteina": 1.2, "carbo": 3.1, "gordura": 0.3},
        {"nome": "Berinjela", "proteina": 1.0, "carbo": 6.0, "gordura": 0.2},

        # Laticínios
        {"nome": "Leite integral", "proteina": 3.3, "carbo": 4.7, "gordura": 3.0},
        {"nome": "Leite desnatado", "proteina": 3.4, "carbo": 5.0, "gordura": 0.2},
        {"nome": "Iogurte natural", "proteina": 3.5, "carbo": 5.2, "gordura": 3.0},
        {"nome": "Iogurte grego", "proteina": 10.0, "carbo": 4.0, "gordura": 5.0},
        {"nome": "Queijo mussarela", "proteina": 22.0, "carbo": 2.2, "gordura": 22.0},
        {"nome": "Queijo prato", "proteina": 20.0, "carbo": 1.5, "gordura": 23.0},
        {"nome": "Queijo branco", "proteina": 18.0, "carbo": 3.0, "gordura": 10.0},

        # Leguminosas
        {"nome": "Feijão carioca cozido", "proteina": 4.8, "carbo": 13.6, "gordura": 0.5},
        {"nome": "Feijão preto", "proteina": 4.5, "carbo": 14.0, "gordura": 0.5},
        {"nome": "Lentilha cozida", "proteina": 9.0, "carbo": 20.0, "gordura": 0.4},
        {"nome": "Grão de bico cozido", "proteina": 8.9, "carbo": 27.0, "gordura": 2.6},
        {"nome": "Ervilha", "proteina": 5.0, "carbo": 14.0, "gordura": 0.4},

        # Gorduras e Óleos
        {"nome": "Azeite de oliva", "proteina": 0.0, "carbo": 0.0, "gordura": 100.0},
        {"nome": "Manteiga", "proteina": 0.5, "carbo": 0.1, "gordura": 81.0},
        {"nome": "Margarina", "proteina": 0.2, "carbo": 0.5, "gordura": 80.0},
        {"nome": "Óleo de soja", "proteina": 0.0, "carbo": 0.0, "gordura": 100.0},

        # Industrializados
        {"nome": "Hambúrguer", "proteina": 17.0, "carbo": 20.0, "gordura": 15.0},
        {"nome": "Pizza", "proteina": 11.0, "carbo": 33.0, "gordura": 10.0},
        {"nome": "Lasanha", "proteina": 12.0, "carbo": 20.0, "gordura": 8.0},
        {"nome": "Salgadinho", "proteina": 6.0, "carbo": 60.0, "gordura": 25.0},
        {"nome": "Biscoito recheado", "proteina": 5.0, "carbo": 70.0, "gordura": 20.0},
        {"nome": "Chocolate ao leite", "proteina": 7.0, "carbo": 60.0, "gordura": 30.0},

        # Bebidas
        {"nome": "Refrigerante", "proteina": 0.0, "carbo": 11.0, "gordura": 0.0},
        {"nome": "Suco de laranja", "proteina": 0.7, "carbo": 10.0, "gordura": 0.2},
        {"nome": "Suco de uva", "proteina": 0.5, "carbo": 14.0, "gordura": 0.1},
        {"nome": "Café", "proteina": 0.1, "carbo": 0.0, "gordura": 0.0},
        {"nome": "Cerveja", "proteina": 0.5, "carbo": 3.6, "gordura": 0.0},
    ]
    
    adicionados = 0
    pulados = 0
    
    try:
        for alimento_data in alimentos_iniciais:
            # Verificar se já existe
            existente = db.query(Alimento).filter(
                Alimento.nome == alimento_data["nome"]
            ).first()
            
            if existente:
                print(f"⚠️  {alimento_data['nome']} já existe - pulando...")
                pulados += 1
                continue
            
            # Calcular calorias
            calorias = (
                alimento_data["proteina"] * 4 + 
                alimento_data["carbo"] * 4 + 
                alimento_data["gordura"] * 9
            )
            
            alimento = Alimento(
                nome=alimento_data["nome"],
                proteina_por_100g=alimento_data["proteina"],
                carbo_por_100g=alimento_data["carbo"],
                gordura_por_100g=alimento_data["gordura"],
                calorias_por_100g=round(calorias, 1)
            )
            db.add(alimento)
            print(f"✅ {alimento_data['nome']} adicionado")
            adicionados += 1
        
        db.commit()
        print(f"\n🎉 Seed concluído!")
        print(f"   ✅ {adicionados} alimentos adicionados")
        print(f"   ⚠️  {pulados} alimentos já existiam")
        
    except Exception as e:
        print(f"❌ Erro durante o seed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Iniciando seed de alimentos...")
    seed_alimentos()