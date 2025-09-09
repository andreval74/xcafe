// Script para encontrar e remover elemento flutuante de wallet
console.log('🔍 Procurando elementos flutuantes de wallet...');

function removeFloatingWalletElements() {
    const floatingElements = [];
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed') {
            const content = el.textContent.toLowerCase();
            const innerHTML = el.innerHTML.toLowerCase();
            const className = el.className.toLowerCase();
            const id = el.id.toLowerCase();
            
            // Verificar se é relacionado a wallet/conexão
            const isWalletRelated = 
                content.includes('wallet') ||
                content.includes('connect') ||
                content.includes('metamask') ||
                innerHTML.includes('fa-wallet') ||
                innerHTML.includes('wallet') ||
                className.includes('wallet') ||
                id.includes('wallet') ||
                className.includes('connect') ||
                id.includes('connect');
                
            if (isWalletRelated) {
                floatingElements.push({
                    element: el,
                    tag: el.tagName,
                    id: el.id,
                    class: el.className,
                    content: content.substring(0, 100),
                    html: innerHTML.substring(0, 200)
                });
            }
        }
    });
    
    console.log(`Encontrados ${floatingElements.length} elementos flutuantes relacionados a wallet:`);
    
    floatingElements.forEach((item, index) => {
        console.log(`${index + 1}. ${item.tag}#${item.id}.${item.class}`);
        console.log(`   Conteúdo: ${item.content}`);
        console.log(`   HTML: ${item.html}`);
        
        // Perguntar se deve remover
        const shouldRemove = confirm(`Remover elemento flutuante ${item.tag}#${item.id}?\n\nConteúdo: ${item.content}`);
        if (shouldRemove) {
            item.element.remove();
            console.log(`✅ Elemento removido: ${item.tag}#${item.id}`);
        }
    });
    
    if (floatingElements.length === 0) {
        console.log('✅ Nenhum elemento flutuante de wallet encontrado');
    }
}

// Executar a busca
removeFloatingWalletElements();

// Executar novamente após 2 segundos caso elementos sejam criados dinamicamente
setTimeout(removeFloatingWalletElements, 2000);
