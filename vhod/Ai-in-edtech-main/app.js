class PresentationApp {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = 12;
        this.isTransitioning = false;
        
        // Touch handling
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50;
        
        this.init();
    }
    
    init() {
        this.updateCounter();
        this.updateProgress();
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.setupTouchNavigation();
        this.setupArrowNavigation();
        
        // Hide navigation hint after 5 seconds
        setTimeout(() => {
            const hint = document.querySelector('.navigation-hint');
            if (hint) {
                hint.style.opacity = '0';
                setTimeout(() => hint.style.display = 'none', 300);
            }
        }, 5000);
    }
    
    setupEventListeners() {
        // Prevent default scrolling and gestures
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.isTransitioning) return;
            
            switch(e.key) {
                case 'ArrowRight':
                case ' ':
                case 'PageDown':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToSlide(1);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.totalSlides);
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.goToSlide(1);
                    break;
            }
        });
    }
    
    setupTouchNavigation() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (this.isTransitioning) return;
            
            this.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe();
        }, { passive: true });
    }
    
    setupArrowNavigation() {
        const prevArrow = document.getElementById('prev-arrow');
        const nextArrow = document.getElementById('next-arrow');
        
        if (prevArrow) {
            prevArrow.addEventListener('click', () => {
                if (!this.isTransitioning) {
                    this.prevSlide();
                }
            });
            
            // Add keyboard support for accessibility
            prevArrow.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!this.isTransitioning) {
                        this.prevSlide();
                    }
                }
            });
        }
        
        if (nextArrow) {
            nextArrow.addEventListener('click', () => {
                if (!this.isTransitioning) {
                    this.nextSlide();
                }
            });
            
            // Add keyboard support for accessibility
            nextArrow.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!this.isTransitioning) {
                        this.nextSlide();
                    }
                }
            });
        }
        
        // Update arrow visibility based on current slide
        this.updateArrowVisibility();
    }
    
    handleSwipe() {
        const swipeDistance = this.touchStartX - this.touchEndX;
        
        if (Math.abs(swipeDistance) < this.minSwipeDistance) {
            return;
        }
        
        if (swipeDistance > 0) {
            // Swipe left - next slide
            this.nextSlide();
        } else {
            // Swipe right - previous slide
            this.prevSlide();
        }
    }
    
    nextSlide() {
        if (this.currentSlide < this.totalSlides && !this.isTransitioning) {
            this.goToSlide(this.currentSlide + 1);
        }
    }
    
    prevSlide() {
        if (this.currentSlide > 1 && !this.isTransitioning) {
            this.goToSlide(this.currentSlide - 1);
        }
    }
    
    goToSlide(slideNumber) {
        if (slideNumber === this.currentSlide || this.isTransitioning) {
            return;
        }
        
        if (slideNumber < 1 || slideNumber > this.totalSlides) {
            return;
        }
        
        this.isTransitioning = true;
        
        const currentSlideElement = document.querySelector(`[data-slide="${this.currentSlide}"]`);
        const nextSlideElement = document.querySelector(`[data-slide="${slideNumber}"]`);
        
        if (currentSlideElement && nextSlideElement) {
            // Determine slide direction
            const isForward = slideNumber > this.currentSlide;
            
            // Add transitioning classes
            currentSlideElement.classList.add(isForward ? 'prev' : 'next');
            currentSlideElement.classList.remove('active');
            
            // Set initial position for incoming slide
            nextSlideElement.style.transform = isForward ? 'translateX(100px)' : 'translateX(-100px)';
            nextSlideElement.style.opacity = '0';
            
            // Trigger reflow
            nextSlideElement.offsetHeight;
            
            // Animate to final position
            nextSlideElement.classList.add('active');
            nextSlideElement.style.transform = 'translateX(0)';
            nextSlideElement.style.opacity = '1';
            
            // Clean up after transition
            setTimeout(() => {
                currentSlideElement.classList.remove('prev', 'next');
                currentSlideElement.style.transform = '';
                currentSlideElement.style.opacity = '';
                nextSlideElement.style.transform = '';
                nextSlideElement.style.opacity = '';
                
                this.currentSlide = slideNumber;
                this.updateCounter();
                this.updateProgress();
                this.updateArrowVisibility();
                this.isTransitioning = false;
                
                // Trigger confetti on last slide
                if (slideNumber === this.totalSlides) {
                    this.triggerConfetti();
                }
            }, 600);
        }
    }
    
    updateCounter() {
        const currentElement = document.getElementById('current-slide');
        const totalElement = document.getElementById('total-slides');
        
        if (currentElement) {
            currentElement.textContent = this.currentSlide;
        }
        
        if (totalElement) {
            totalElement.textContent = this.totalSlides;
        }
    }
    
    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            const progress = (this.currentSlide / this.totalSlides) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }
    
    updateArrowVisibility() {
        const prevArrow = document.getElementById('prev-arrow');
        const nextArrow = document.getElementById('next-arrow');
        
        if (prevArrow) {
            if (this.currentSlide === 1) {
                prevArrow.style.opacity = '0.3';
                prevArrow.style.pointerEvents = 'none';
            } else {
                prevArrow.style.opacity = '0.7';
                prevArrow.style.pointerEvents = 'auto';
            }
        }
        
        if (nextArrow) {
            if (this.currentSlide === this.totalSlides) {
                nextArrow.style.opacity = '0.3';
                nextArrow.style.pointerEvents = 'none';
            } else {
                nextArrow.style.opacity = '0.7';
                nextArrow.style.pointerEvents = 'auto';
            }
        }
    }
    
    triggerConfetti() {
        // Simple confetti effect for the final slide
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                this.createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
            }, i * 100);
        }
    }
    
    createConfettiPiece(color) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.top = '-10px';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = color;
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        document.body.appendChild(confetti);
        
        // Animate the confetti falling
        const animation = confetti.animate([
            {
                transform: `translateY(-10px) rotate(0deg)`,
                opacity: 1
            },
            {
                transform: `translateY(${window.innerHeight + 50}px) rotate(720deg)`,
                opacity: 0
            }
        ], {
            duration: 3000 + Math.random() * 2000,
            easing: 'ease-out'
        });
        
        animation.addEventListener('finish', () => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        });
    }
    
    // Method to programmatically jump to a specific slide (for potential future use)
    jumpToSlide(slideNumber) {
        if (slideNumber >= 1 && slideNumber <= this.totalSlides) {
            this.goToSlide(slideNumber);
        }
    }
    
    // Method to get current slide info
    getCurrentSlideInfo() {
        return {
            current: this.currentSlide,
            total: this.totalSlides,
            progress: (this.currentSlide / this.totalSlides) * 100
        };
    }
}

// Initialize the presentation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all resources are loaded
    setTimeout(() => {
        window.presentationApp = new PresentationApp();
    }, 100);
});

// Prevent zoom on mobile devices
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Prevent text selection during navigation
document.addEventListener('selectstart', (e) => {
    e.preventDefault();
});

// Add visual feedback for keyboard navigation
document.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown'].includes(e.key)) {
        document.body.classList.add('navigating');
        setTimeout(() => {
            document.body.classList.remove('navigating');
        }, 200);
    }
});