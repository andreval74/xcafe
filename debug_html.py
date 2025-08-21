#!/usr/bin/env python3
"""
Script para detectar problemas estruturais em HTML
"""
import re
from collections import deque

def check_html_structure(file_path):
    """Verifica a estrutura HTML e encontra tags não fechadas"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrões para encontrar tags
    tag_pattern = r'<(/?)(\w+)(?:\s[^>]*)?>(?!.*<!--)'
    
    stack = deque()
    issues = []
    line_num = 1
    
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        # Pular comentários
        if '<!--' in line:
            continue
            
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
                    issues.append(f"Linha {i}: Tag de fechamento '{tag_name}' sem abertura correspondente")
                else:
                    last_tag, last_line = stack.pop()
                    if last_tag != tag_name:
                        issues.append(f"Linha {i}: Esperado fechamento de '{last_tag}' (linha {last_line}), mas encontrado '{tag_name}'")
                        # Recolocar na pilha para continuar verificação
                        stack.append((last_tag, last_line))
            else:
                # Tag de abertura
                stack.append((tag_name, i))
    
    # Tags que ficaram abertas
    while stack:
        tag_name, line_num = stack.pop()
        issues.append(f"Linha {line_num}: Tag '{tag_name}' não foi fechada")
    
    return issues

if __name__ == "__main__":
    file_path = r"c:\Users\User\Desktop\cafe\xcafe-1\index2.html"
    issues = check_html_structure(file_path)
    
    print("=== ANÁLISE DE ESTRUTURA HTML ===\n")
    
    if not issues:
        print("✅ Nenhum problema estrutural encontrado!")
    else:
        print(f"❌ Encontrados {len(issues)} problemas:\n")
        for issue in issues:
            print(f"• {issue}")
    
    print("\n" + "="*50)
