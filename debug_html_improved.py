#!/usr/bin/env python3
"""
Script melhorado para detectar problemas estruturais em HTML
"""
import re
from collections import deque

def check_html_structure_improved(file_path):
    """Verifica a estrutura HTML e encontra tags não fechadas - versão melhorada"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remover comentários HTML
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    # Padrão melhorado para tags HTML
    tag_pattern = r'<(/?)(\w+)(?:\s[^>]*)?>'
    
    stack = deque()
    issues = []
    
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        matches = re.finditer(tag_pattern, line)
        
        for match in matches:
            is_closing = bool(match.group(1))
            tag_name = match.group(2).lower()
            
            # Tags auto-fechadas (não precisam de fechamento)
            self_closing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']
            
            if tag_name in self_closing:
                continue
                
            if is_closing:
                # Tag de fechamento
                if not stack:
                    issues.append(f"Linha {i}: Tag de fechamento '</{tag_name}>' sem abertura correspondente")
                else:
                    last_tag, last_line = stack.pop()
                    if last_tag != tag_name:
                        issues.append(f"Linha {i}: Esperado fechamento de '<{last_tag}>' (linha {last_line}), mas encontrado '</{tag_name}>'")
                        # Verificar se a tag atual existe mais abaixo na pilha
                        temp_stack = []
                        found = False
                        while stack:
                            temp_tag, temp_line = stack.pop()
                            temp_stack.append((temp_tag, temp_line))
                            if temp_tag == tag_name:
                                found = True
                                break
                        
                        if found:
                            # Restaurar pilha sem a tag encontrada
                            while temp_stack:
                                stack.append(temp_stack.pop())
                        else:
                            # Recolocar a tag original na pilha
                            stack.append((last_tag, last_line))
                            while temp_stack:
                                stack.append(temp_stack.pop())
            else:
                # Tag de abertura
                stack.append((tag_name, i))
    
    # Tags que ficaram abertas
    while stack:
        tag_name, line_num = stack.pop()
        issues.append(f"Linha {line_num}: Tag '<{tag_name}>' não foi fechada")
    
    return issues

def analyze_section(file_path, start_line, end_line):
    """Analisa uma seção específica do arquivo"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    section = lines[start_line-1:end_line]
    
    print(f"\n=== ANÁLISE DA SEÇÃO (linhas {start_line}-{end_line}) ===")
    
    divs_opened = 0
    divs_closed = 0
    sections_opened = 0
    sections_closed = 0
    
    for i, line in enumerate(section, start_line):
        if '<div' in line:
            divs_opened += 1
            print(f"Linha {i}: DIV ABERTA - {line.strip()}")
        if '</div>' in line:
            divs_closed += 1
            print(f"Linha {i}: DIV FECHADA - {line.strip()}")
        if '<section' in line:
            sections_opened += 1
            print(f"Linha {i}: SECTION ABERTA - {line.strip()}")
        if '</section>' in line:
            sections_closed += 1
            print(f"Linha {i}: SECTION FECHADA - {line.strip()}")
    
    print(f"\nRESUMO DA SEÇÃO:")
    print(f"DIVs abertas: {divs_opened}")
    print(f"DIVs fechadas: {divs_closed}")
    print(f"SECTIONs abertas: {sections_opened}")
    print(f"SECTIONs fechadas: {sections_closed}")
    
    if divs_opened != divs_closed:
        print(f"❌ PROBLEMA: {divs_opened - divs_closed} DIVs não fechadas!")
    else:
        print("✅ DIVs balanceadas")
    
    if sections_opened != sections_closed:
        print(f"❌ PROBLEMA: {sections_opened - sections_closed} SECTIONs não fechadas!")
    else:
        print("✅ SECTIONs balanceadas")

if __name__ == "__main__":
    file_path = r"c:\Users\User\Desktop\cafe\xcafe-1\index2.html"
    
    print("=== ANÁLISE GERAL ===")
    issues = check_html_structure_improved(file_path)
    
    if not issues:
        print("✅ Nenhum problema estrutural encontrado!")
    else:
        print(f"❌ Encontrados {len(issues)} problemas:\n")
        for issue in issues:
            print(f"• {issue}")
    
    # Analisar a seção hero especificamente
    analyze_section(file_path, 47, 176)
    
    print("\n" + "="*50)
