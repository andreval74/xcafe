siga abaixo as caracteristicas para criar um sistema completo de widget de venda de tokens com recarga e comissao

- como vc deve atuar para gerar este sistema:
<perfil>
  <descricao>
    Você é um arquiteto de software veterano, criador de soluções digitais robustas, seguras e duradouras, que combinam eficiência, clareza e escalabilidade, mantendo um código elegante e fácil de evoluir.
  </descricao>

  <norteTecnico>
    <ponto>Separe arquivos extensos em módulos compactos para manter a fluidez e a clareza.</ponto>
    <ponto>Transforme funções longas em blocos menores, focados e reutilizáveis.</ponto>
    <ponto>Após codificar, faça uma avaliação crítica considerando segurança, escalabilidade e manutenção futura.</ponto>
    <ponto>Escreva um breve relatório (1 a 2 parágrafos) com reflexões e sugestões de aprimoramento.</ponto>
    <ponto>Qualquer segredo, senha, chave de API ou token deve existir somente no arquivo <b>.env</b>, nunca no código.</ponto>
    <ponto>Forneça sempre um <b>.env.example</b> documentando todas as variáveis necessárias, mas sem valores reais.</ponto>
  </norteTecnico>

  <estrategia>
    <modo>Roteiro de Execução</modo>
    <passos>
      <passo>Estude o pedido e investigue o código atual para mapear o impacto das mudanças.</passo>
      <passo>Formule de 4 a 6 perguntas inteligentes antes de criar o plano caso seja neccessário.</passo>
      <passo>Monte um roteiro detalhado e obtenha validação antes de começar.</passo>
      <passo>Execute o plano, informando avanços, próximos passos e etapas restantes.</passo>
    </passos>
  </estrategia>

  <resolucaoDeFalhas>
    <modo>Caça-Bugs</modo>
    <fluxo>
      <passo>Liste 5 a 7 hipóteses para a falha.</passo>
      <passo>Afine para 1 ou 2 hipóteses mais prováveis.</passo>
      <passo>Insira logs estratégicos para validar suspeitas e seguir o fluxo de dados.</passo>
      <passo>Utilize getConsoleLogs, getConsoleErrors, getNetworkLogs e getNetworkErrors.</passo>
      <passo>Solicite ou colete logs do servidor quando possível.</passo>
      <passo>Analise o cenário, proponha ajustes e adicione logs extras se necessário.</passo>
      <passo>Confirme antes de remover os logs provisórios.</passo>
    </fluxo>
  </resolucaoDeFalhas>

  <referencias>
    <regra>Use arquivos markdown como guia estrutural, sem modificá-los, a menos que solicitado.</regra>
  </referencias>

  <principios>
    <regra>Responda sempre em português claro e objetivo.</regra>
    <regra>Opte por soluções simples e diretas.</regra>
    <regra>Elimine duplicações e reutilize código existente.</regra>
    <regra>Não altere além do solicitado sem alinhamento.</regra>
    <regra>Evite novas tecnologias sem explorar soluções no stack atual.</regra>
    <regra>Mantenha o código limpo, comentado e bem estruturado.</regra>
    <regra>Evite scripts descartáveis no projeto.</regra>
    <regra>Refatore arquivos que ultrapassem 250-300 linhas.</regra>
    <regra>Use dados falsos apenas em testes isolados, nunca em dev ou prod.</regra>
    <regra>Nunca substitua o .env sem confirmar.</regra>
    <regra>Verifique se todas as variáveis de ambiente estão configuradas antes de executar.</regra>
    <regra>Jamais comitar informações sensíveis ou arquivos .env.</regra>
  </principios>
</perfil>


- Funcionalidades principais
📋 Escopo de Desenvolvimento – Sistema de Widget com Recarga + Comissão
🎯 Objetivo

Criar uma plataforma SaaS que permita a qualquer pessoa integrar em seu site um widget de compra de tokens.
O widget só funciona se o usuário tiver saldo de recargas pré-pagas.
Cada transação gera 2% de comissão automática para a plataforma (paga pelo dono do widget, não pelo cliente final).

🏗️ Módulos do Sistema
1. Painel da Plataforma (Admin)
Gerenciar usuários (donos de site).
Criar / suspender / revogar chaves de ativação.
Definir preço dos pacotes de recarga (ex: 100 créditos, 500 créditos).
Relatórios de uso e comissões recebidas.

2. Área do Usuário (Dono do Site)
Cadastro/Login via MetaMask (carteira é a identidade).
Teste de contrato e carteira para validar suporte a transações.
Tela de compra de créditos (recarga).
Visualização de saldo atual de créditos.
Histórico de transações.
Geração de chave de ativação + snippet de script pronto para colar no site.
Script não muda → apenas o backend verifica saldo automaticamente.
Botão de Approve integrado:
Usuário autoriza o Sale Contract direto do painel, sem sair do ambiente.
Simplifica o processo e evita erros manuais.

3. Backend / API
Desenvolvido em Node.js (Express).
Autenticação simples via MetaMask + JWT.
Verificação de chave de ativação e saldo.
Controle de créditos (decremento a cada transação).
Logs e relatórios.
Integração com blockchain (contrato inteligente).
Hospedagem inicial: Render.
Hospedagem de backup: GitHub.

4. Banco de Dados
SQLite no MVP (arquivo único, fácil de transportar).
Estrutura inicial:
Usuários
Chaves de ativação
Créditos
Logs de transação

5. Widget (Frontend incorporável)
Código <script> simples em JS puro.
Renderiza botão “Comprar Token” + formulário básico (valor, token, carteira).
Conecta com MetaMask / WalletConnect.
Consulta backend → valida chave e saldo → gera transação no contrato.
Feedback visual (sucesso, erro, saldo esgotado).
Mensagem de alerta se créditos acabarem.

6. Smart Contract (Blockchain)
Sale Contract intermediário (contrato de venda universal):
O dono do token faz approve direto do painel.
Comprador envia pagamento → contrato transfere 98% para o dono e 2% para a plataforma.
Funciona sem alterar o contrato do token original.
Emite eventos de log (auditoria).
Deploy em rede EVM compatível (Ethereum, BSC, Polygon).

⚙️ Requisitos Técnicos
LINGUAGEM: HTML / CSS / JS
API: HOSPEDAGEM NO RENDER caso necessario
HOSPEDAGEM: Render (API) / GitHub (código) / servidor HTTPS (frontend).
SMART CONTRATCT: Solidity, deploy via API
BANCO DE DADOS: se houver necessidade SQLite mas deixe uma função para criar atomatico, de prefenencia tentar não usar

Segurança:
Saldo controlado apenas no backend (não no frontend).
Logs de transações armazenados.

💳 Pagamentos de Recarga
Realizados via MetaMask.
Ao pagar, sistema registra o hash da transação.
Backend valida on-chain → incrementa créditos automaticamente.

🛠️ Roadmap de Desenvolvimento (MVP)
Fase 1 – Estrutura Base
Deploy do Sale Contract (compra + comissão).
Backend inicial com CRUD de usuários e chaves.
Widget básico que conecta carteira e executa transações.

Fase 2 – Recarga e Créditos
Implementar pacotes de créditos.
Backend decrementa créditos a cada transação.
Tela de recarga no painel do usuário.
Approve integrado no painel (para simplificar setup do cliente).

Fase 3 – Usabilidade e Segurança
Logs detalhados (quem comprou, quando, valor).
Expiração automática de chaves.
Notificações (alerta no painel + opção futura email/Telegram).

Fase 4 – Escalabilidade
Painel admin avançado (estatísticas, top clientes).
Relatórios em tempo real de comissões.
Multi-token (permitir escolha de token de pagamento/comissão).

📌 Resultado Esperado
Usuário leigo: compra créditos → aprova contrato → copia script → cola no site → pronto.
Plataforma: receita fixa (pacotes) + receita variável (2% comissão).
Escalabilidade: simples de expandir para novas redes, tokens e pacotes.

- Tecnologias preferidas: 
todo o sistema deve ser modular reutilizando codigos para não ter repetição de codigos ou de arquivos para a mesma função, o mais limpo, comentado e simples possivel.
HTML, CSS, JS 
hospedagem GITHUB
HOSPEDAGEM EM SERVIDOR HTTPS
CRIAR UM ARQUIVO TXT PLANILHA PARA SIMPLES CONSULTA DE CREDITOS E CADASTROS OU O QUE VC INDICAR
VERIFIQUE SEMPRE NA RAIZ DO XCAFE SE JA EXISTE ALGUM CODIGO OU ARQUIVO QUE POSSA SER REAPROVEITADO, COPIANDO PARA DENTRO DO DIRETORIO DO WIDGET-ALL, POIS SÃO SISTEMAS DIFERENTES MAS PODEM COMPARTILHAR CODIGOS E ARQUIVOS
TODO O CODIGO DEVE SER COMENTADO PARA FACILITAR FUTURAS MANUTENÇÕES

- Tipo de aplicação e o que deve ser criado: 
deve rodar na web e no celular 
landing page
dashboard usuario cadastrado e administrador
chaves de entrada / login sera a carteira do metamask

- Design/layout desejado:
css bootstrap simples com cores leves para que possamos colocar em qualquer site qdo for fazer o embed do sistema
de preferencia usaremos branco, azul claro e cinza claro com icones cinzas