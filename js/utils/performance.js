// js/utils/performance.js
export class PerformanceOptimizer {
    constructor() {
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        this.imageCache = new Map();
    }

    // Debounce function calls
    debounce(func, delay, key) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);

        this.debounceTimers.set(key, timer);
    }

    // Throttle function calls
    throttle(func, delay, key) {
        if (this.throttleTimers.has(key)) {
            return;
        }

        func();
        const timer = setTimeout(() => {
            this.throttleTimers.delete(key);
        }, delay);

        this.throttleTimers.set(key, timer);
    }

    // Lazy load images
    setupLazyLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        this.loadImage(src)
                            .then(loadedImg => {
                                img.src = loadedImg.src;
                                img.classList.remove('lazy');
                                img.classList.add('loaded');
                            })
                            .catch(() => {
                                img.classList.add('error');
                            });
                        
                        observer.unobserve(img);
                    }
                }
            });
        });

        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });

        return imageObserver;
    }

    // Image loading with caching
    loadImage(src) {
        if (this.imageCache.has(src)) {
            return Promise.resolve(this.imageCache.get(src));
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(src, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    // Optimize map rendering
    optimizeMapRendering(map, markers) {
        // Use requestAnimationFrame for smooth updates
        let pendingUpdate = false;
        
        return () => {
            if (pendingUpdate) return;
            
            pendingUpdate = true;
            requestAnimationFrame(() => {
                this.updateVisibleMarkers(map, markers);
                pendingUpdate = false;
            });
        };
    }

    updateVisibleMarkers(map, markers) {
        const bounds = map.getBounds();
        if (!bounds) return;

        markers.forEach((marker, id) => {
            const position = marker.getPosition();
            const isVisible = bounds.contains(position);
            
            // Show/hide markers based on viewport
            marker.setVisible(isVisible);
        });
    }

    // Virtual scrolling for large lists
    setupVirtualScrolling(container, items, renderItem, itemHeight = 100) {
        const containerHeight = container.clientHeight;
        const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
        let startIndex = 0;

        const virtualList = document.createElement('div');
        virtualList.style.cssText = `
            height: ${items.length * itemHeight}px;
            position: relative;
        `;
        
        const viewport = document.createElement('div');
        viewport.style.cssText = `
            height: 100%;
            overflow-y: auto;
        `;

        const renderVisible = () => {
            const endIndex = Math.min(startIndex + visibleCount, items.length);
            virtualList.innerHTML = '';

            for (let i = startIndex; i < endIndex; i++) {
                const item = renderItem(items[i], i);
                item.style.cssText = `
                    position: absolute;
                    top: ${i * itemHeight}px;
                    width: 100%;
                    height: ${itemHeight}px;
                `;
                virtualList.appendChild(item);
            }
        };

        viewport.addEventListener('scroll', this.throttle(() => {
            startIndex = Math.floor(viewport.scrollTop / itemHeight);
            renderVisible();
        }, 16, 'virtual-scroll')); // 60fps

        viewport.appendChild(virtualList);
        container.appendChild(viewport);
        renderVisible();

        return { viewport, virtualList, update: renderVisible };
    }

    // Memory management
    cleanup() {
        // Clear all timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.throttleTimers.forEach(timer => clearTimeout(timer));
        
        this.debounceTimers.clear();
        this.throttleTimers.clear();
        this.imageCache.clear();
    }
}
