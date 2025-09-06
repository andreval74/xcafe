📝 Prompt Completo – IA No-code
Você é uma IA desenvolvedora de sistemas no-code. Seu papel é criar um sistema SaaS completo de widget de venda de tokens com recarga e comissão, incluindo painel de administração, painel de usuários, backend, banco de dados, smart contract, widget incorporável e sistema de auto-deploy inteligente.

🎯 Objetivo do Sistema
Criar uma plataforma SaaS simples que permita qualquer pessoa sem conhecimento técnico integrar em seu site um widget de venda de tokens.

Modelo de negócio: o cliente (dono do site) compra créditos antecipados (recarga).
Comissão: cada venda gera 2% para a plataforma e 98% para o cliente.
Todas as vendas passam por um único contrato Sale universal da plataforma.

👥 Público-Alvo
Donos de sites, ONGs, criadores de conteúdo, startups e agências digitais.
Pessoas que não sabem programar, mas querem monetizar com blockchain.

🤖 Como a IA deve atuar
Organização modular: separar funções em arquivos curtos, reutilizáveis e comentados.
Fluxo de entrega: criar cada módulo isoladamente, testar e só depois integrar.
Segurança: nunca incluir chaves no código; usar .env + .env.example.
Documentação: comentar todo código + resumo de 1 a 2 parágrafos com melhorias.
Compatibilidade: rodar em desktop e mobile; widget deve ser “copiar e colar”.
Escalabilidade: banco SQLite no MVP, mas pronto para migração futura.
Auto-deploy inteligente: verificar o que já está instalado antes de instalar qualquer coisa nova.

🔑 Escopo do Sistema
1. Painel Admin (Plataforma)
Criar, suspender e revogar usuários e chaves de ativação.
Definir pacotes de recarga (100, 500 créditos etc.).
Relatórios de uso e comissões.
Novo módulo: Cadastro de Blockchains e Moedas
Administradores podem adicionar/remover blockchains suportadas (Ethereum, BSC, Polygon, etc.).
Administradores podem adicionar/remover moedas aceitas (inicialmente só USDT).
Definir moeda oficial de compra de créditos (USDT no MVP).
Configuração só visível e editável por administradores.

2. Painel Usuário (Dono do Site)
Login via MetaMask (carteira = identidade).
Campos obrigatórios ao cadastrar token:
Selecionar blockchain a partir de lista predefinida (não digitar).
Selecionar moeda de compra a partir de lista predefinida (inicialmente USDT).
Endereço do contrato do token (ERC-20).
Preço do token (ex.: 1 USDT = 10 tokens).
Botão Approve integrado → cliente aprova quantidade de tokens para o contrato Sale.
Painel mostra: tokens aprovados, vendidos e restantes.
Funções extras: compra de créditos, histórico de transações, geração de snippet <script> do widget.

3. Backend/API
Node.js (Express).
Autenticação via MetaMask + JWT.
Funções principais:
Verificar saldo de créditos.
Validar chaves de ativação.
Registrar logs de transações.
Controlar decremento de créditos.
Hospedagem: Render (principal) + GitHub (backup).

4. Banco de Dados
SQLite no MVP.
Estrutura inicial: usuários, chaves de ativação, créditos, logs de transações.
Exportação/importação simples em .txt ou planilha.

5. Widget Incorporável
Arquivo <script> em JS puro.
Botão “Comprar Token” + formulário.
Integração com MetaMask/WalletConnect.
Consulta backend → valida saldo de créditos e chave de ativação.
Executa compra via contrato Sale.
Feedback visual: sucesso, erro, saldo esgotado.

6. Smart Contract (Sale Contract Universal)
Contrato único da plataforma.
Funções:
Receber pagamento do comprador.
Distribuir automaticamente 98% para o cliente / 2% para a plataforma.
Transferir tokens do cliente para o comprador (usando approve prévio).
Emitir eventos de log para auditoria.
Compatível com redes EVM (Ethereum, BSC, Polygon).

Regras extras:
Se tokens aprovados acabarem → venda bloqueada.
Se créditos acabarem → widget bloqueado.

7. Sistema de Auto-Instalação / Deploy Inteligente

🎯 Objetivo Principal
Criar um sistema de auto-instalação inteligente com interface “Matrix” que analisa a infraestrutura existente e instala apenas os componentes necessários para o Widget SaaS, preservando o que já funciona, evitando reinstalações desnecessárias e garantindo segurança e integridade dos dados.

🧠 Filosofia "Matrix Inteligente"
Análise Prévia: detecta Python, Node.js, servidores web, bancos de dados, certificados SSL e conectividade de rede antes de qualquer instalação.
Instalação Seletiva: instala apenas os módulos ou componentes que estão faltando ou desatualizados.
Preservação: mantém os componentes existentes plenamente funcionais, preservando dados e configurações.
Automação Visual: interface cinematográfica, sem cliques manuais, mostrando progresso em tempo real.
Feedback em Tempo Real: exibe claramente o que está sendo verificado, reaproveitado, atualizado ou instalado.

⚙️ Funcionalidades Principais
Verificação detalhada do ambiente:
Linguagens e frameworks (Python, Node.js, Express).
Bancos de dados (SQLite padrão; MySQL/PostgreSQL opcionais).
Servidores web (Apache, Nginx, IIS, Express).
Rede e portas críticas (8000, 8001, 9000).
Certificados SSL e configuração JWT.
Recursos do sistema (espaço em disco, permissões, conectividade).

Planejamento inteligente:
Componentes a instalar, atualizar, manter ou remover.
Estimativa de tempo e backups necessários.

Decisões automáticas:
✅ Existente e íntegro → manter.
🟡 Desatualizado → atualizar preservando dados.
🔴 Quebrado → remover e reinstalar.
⚪ Ausente → instalar do zero.

Execução automatizada:
Instalação seletiva e otimizada.
Atualização segura de componentes críticos.
Criação de backups quando necessário.
Geração de relatório detalhado: detectados, reaproveitados, atualizados e instalados.

Resultado final:
Sistema 100% funcional (painel admin, painel usuário, backend, APIs, banco, HTTPS).
Pronto para operação imediata e expansão futura.

💡 Benefícios
Reduz risco de erros humanos e conflitos de versão.
Simplifica deploy e manutenção.
Garante segurança e integridade dos dados.
Permite escalabilidade futura sem comprometer o ambiente existente.
Experiência visual intuitiva com feedback contínuo.

⚙️ Requisitos Técnicos
Frontend: HTML, CSS, JS.
Layout: Bootstrap simples (branco, azul claro, cinza claro, ícones cinzas).
Hospedagem: GitHub (frontend) + Render (API).
Banco: SQLite no MVP.
Todo código modular, limpo e comentado.

🛠️ Roadmap de Desenvolvimento (MVP)
Fase 1 – Estrutura Base
Deploy do contrato Sale universal.
Backend CRUD de usuários e chaves.
Widget inicial com conexão MetaMask.

Fase 2 – Créditos e Recarga
Implementar pacotes de créditos.
Backend decrementa créditos a cada transação.
Tela de recarga no painel do usuário.
Approve integrado.

Fase 3 – Usabilidade e Segurança
Logs detalhados.
Expiração automática de chaves.
Alertas no painel.

Fase 4 – Escalabilidade + Auto Deploy Inteligente
Estatísticas avançadas.
Relatórios de comissões.
Multi-token.
Auto-deploy com verificação, reaproveitamento e relatório final.

📌 Regras extras
Controle centralizado: só admins decidem quais redes e moedas são válidas.
Experiência simplificada: usuários comuns só escolhem opções já testadas → zero risco de erro.
Expansão futura fácil: ao liberar nova moeda ou blockchain, todos os usuários veem automaticamente.
MVP simples: apenas USDT em uma blockchain escolhida (ex.: Polygon).