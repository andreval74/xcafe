// Main JavaScript for Widget SaaS Platform

// Global variables
let currentUser = null;
let userCredits = 0;
let isWalletConnected = false;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkWalletConnection();
});

// Initialize Application
function initializeApp() {
    console.log('Widget SaaS Platform initialized');
    
    // Add smooth scrolling to navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add animation on scroll
    setupScrollAnimations();
    
    // Initialize tooltips if Bootstrap is loaded
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Contact form submission
    const contactForm = document.querySelector('#contact form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Navbar scroll effect
    window.addEventListener('scroll', handleNavbarScroll);
    
    // Wallet connection button
    const walletButtons = document.querySelectorAll('[onclick="connectWallet()"]');
    walletButtons.forEach(button => {
        button.removeAttribute('onclick');
        button.addEventListener('click', connectWallet);
    });
    
    // Credit purchase buttons
    const creditButtons = document.querySelectorAll('[onclick^="buyCredits"]');
    creditButtons.forEach(button => {
        const credits = button.getAttribute('onclick').match(/\d+/)[0];
        button.removeAttribute('onclick');
        button.addEventListener('click', () => buyCredits(parseInt(credits)));
    });
}

// Handle Contact Form Submission
function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get('name') || e.target.querySelector('input[type="text"]').value,
        email: formData.get('email') || e.target.querySelector('input[type="email"]').value,
        subject: formData.get('subject') || e.target.querySelectorAll('input[type="text"]')[1].value,
        message: formData.get('message') || e.target.querySelector('textarea').value
    };
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="spinner me-2"></span>Sending...';
    submitButton.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Message sent successfully! We will contact you soon.', 'success');
        e.target.reset();
        
        // Restore button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }, 2000);
}

// Handle Navbar Scroll Effect
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// Setup Scroll Animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    const animatedElements = document.querySelectorAll('.card, .feature-icon, .price');
    animatedElements.forEach(el => observer.observe(el));
}

// Connect Wallet Function
function connectWallet() {
    if (!window.ethereum) {
        showNotification('MetaMask not found. Please install the MetaMask extension.', 'error');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }
    
    // Show wallet modal
    const walletModal = new bootstrap.Modal(document.getElementById('walletModal'));
    walletModal.show();
}

// Buy Credits Function
function buyCredits(amount) {
    if (!isWalletConnected) {
        showNotification('Please connect your wallet first.', 'warning');
        connectWallet();
        return;
    }
    
    // Calculate price (example: 1 credit = 0.001 ETH)
    const pricePerCredit = 0.001;
    const totalPrice = amount * pricePerCredit;
    
    const confirmation = confirm(
        `You are about to buy ${amount} credits for ${totalPrice} ETH.\n\nDo you want to continue?`
    );
    
    if (confirmation) {
        processCreditPurchase(amount, totalPrice);
    }
}

// Process Credit Purchase
function processCreditPurchase(amount, price) {
    showNotification('Processing credit purchase...', 'info');
    
    // Simulate blockchain transaction
    setTimeout(() => {
        userCredits += amount;
        showNotification(`Purchase completed successfully! You now have ${userCredits} credits.`, 'success');
        updateCreditDisplay();
    }, 3000);
}

// Update Credit Display
function updateCreditDisplay() {
    const creditDisplays = document.querySelectorAll('.credit-balance');
    creditDisplays.forEach(display => {
        display.textContent = userCredits;
    });
}

// Show Notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} notification-toast position-fixed`;
    notification.style.cssText = `
        top: 100px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: var(--shadow-lg);
        border-radius: 10px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${getNotificationIcon(type)} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Get Notification Icon
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Check Wallet Connection Status
function checkWalletConnection() {
    if (window.ethereum && window.ethereum.selectedAddress) {
        isWalletConnected = true;
        currentUser = window.ethereum.selectedAddress;
        updateWalletUI(true);
    }
}

// Update Wallet UI
function updateWalletUI(connected) {
    const walletButtons = document.querySelectorAll('button[onclick="connectWallet()"], .btn[onclick="connectWallet()"]');
    
    walletButtons.forEach(button => {
        if (connected) {
            button.innerHTML = `
                <i class="fas fa-check-circle me-1"></i>
                Wallet Connected
            `;
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-success');
        } else {
            button.innerHTML = `
                <i class="fab fa-ethereum me-1"></i>
                Connect Wallet
            `;
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-primary');
        }
    });
}

// Utility Functions
function formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(num) {
    return new Intl.NumberFormat('pt-BR').format(num);
}

function formatCurrency(amount, currency = 'ETH') {
    return `${amount.toFixed(4)} ${currency}`;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .navbar.scrolled {
        background-color: rgba(248, 249, 250, 0.98) !important;
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.connectWallet = connectWallet;
window.buyCredits = buyCredits;
window.showNotification = showNotification;