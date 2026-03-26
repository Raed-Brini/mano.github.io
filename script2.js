// 1. Force scroll restoration to manual immediately
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

if (window.location.hash) {
    window.location.hash = '';
}

window.scrollTo(0, 0);

window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

// Initialize Lenis for smooth scrolling
const lenis = new Lenis();
lenis.stop(); 
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

document.addEventListener("DOMContentLoaded", () => {
    if (window.ScrollTrigger) {
        ScrollTrigger.clearScrollMemory();
    }
    console.log(`%c
                                 ▀▀▀▀  
        ██▄  ▄██ ▄████▄ ███  ██ ▄████▄ 
        ██ ▀▀ ██ ██▄▄██ ██ ▀▄██ ██  ██ 
        ██    ██ ██  ██ ██   ██ ▀████▀ 
                                `, 
                               "color: #ffd476; font-weight: bold;");
                               
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    CustomEase.create("hop", "0.85, 0, 0.15, 1");

    const frameCount = 150;
    const images =[];
    const mango = { frame: 15 };
    
    // DECIDE FOLDER ON LOAD based on exact folder names
    const isMobile = window.innerWidth <= 768;
    const currentFrame = (i) =>
        `phone_frames/results/frames_${i.toString().padStart(4, '0')}.webp`;

    const canvas = document.getElementById("hero-canvas");
    const context = canvas.getContext("2d");

    const preloader = document.getElementById('preloader');
    const loaderBar = document.getElementById('progress-bar');
    const loaderPct = document.getElementById('progress-text');

    let loadedImages = 0;
    let heroScrollTl; // To safely manage timeline regeneration

    // =============================================
    //  CANVAS RENDERING
    // =============================================
    function resizeCanvas() {
        const dpr = window.innerWidth <= 768 ? Math.min(window.devicePixelRatio || 1, 1.5) : (window.devicePixelRatio || 1);
        const rect = canvas.parentNode.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        context.scale(dpr, dpr);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }

    function renderFrame() {
        const img = images[mango.frame];
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const cw = canvas.clientWidth;
        const ch = canvas.clientHeight;
        context.clearRect(0, 0, cw, ch);

        // Scale by 1.02 to ensure absolutely zero black space edge-bleeding on phones
        const scale = Math.max(cw / img.width, ch / img.height) * 1.02;
        const x = (cw - img.width * scale) / 2;
        const y = (ch - img.height * scale) / 2;
        context.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    // =============================================
    //  ANIMATIONS
    // =============================================
    function buildScrollAnimation() {
        if (heroScrollTl) {
            heroScrollTl.kill(); // Prevents duplicates and massive phone lag
        }

        resizeCanvas();
        renderFrame();

        const mask = document.getElementById('hero-mask');
        const cols = window.innerWidth <= 768 ? 6 : window.innerWidth <= 1024 ? 10 : 14;
        const aspect = window.innerHeight / window.innerWidth;
        const rows = Math.max(1, Math.round(cols * aspect));
        
        const cellW = 1 / cols;
        const cellH = 1 / rows;
        const cells =[];
        
        mask.innerHTML = ''; 
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', String(x * cellW));
                rect.setAttribute('y', String(y * cellH));
                rect.setAttribute('width', String(cellW + 0.015)); 
                rect.setAttribute('height', String(cellH + 0.015));
                rect.setAttribute('fill', 'white');
                rect.setAttribute('opacity', '1'); 
                rect.setAttribute('shape-rendering', 'crispEdges'); 
                mask.appendChild(rect);
                cells.push(rect);
            }
        }

        const ordered =[];
        for (let x = 0; x < cols; x++) {
            const column =[];
            for (let y = 0; y < rows; y++) {
                column.push(cells[y * cols + x]);
            }
            const shuffledColumn = gsap.utils.shuffle(column);
            ordered.push(...shuffledColumn);
        }

        heroScrollTl = gsap.timeline({
            scrollTrigger: {
                trigger: "#hero-quote-wrapper",
                start: "top top",
                end: "+=700%", // 700vh total scrub depth giving plenty of reading room
                scrub: 0.5,
                pin: true,
                pinSpacing: false // Uses manual 600vh DOM spacer
            }
        });

        // 0 to 4.5s (0-450vh scroll)
        heroScrollTl.to(mango, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            onUpdate: renderFrame,
            duration: 4.5
        }, 0);

        // 3.5s to 5s (350vh-500vh scroll) - Fade canvas masks
        heroScrollTl.to(ordered, {
            opacity: 0,
            duration: 1.5,
            stagger: { each: 0.05 },
            ease: "power3.out"
        }, 3.5);

        // 3.8s to 5s (380vh-500vh scroll) - Reveal quote fully
        heroScrollTl.to('.quote-inner', {
            clipPath: 'inset(-50% -50% -50% -50%)', 
            y: 0,
            duration: 1.2,
            ease: "expo.out"
        }, 3.8);

        heroScrollTl.set(".hero-section", { pointerEvents: "none" }, 5.0);

        // 5s to 6s (500vh-600vh): IDLE HOLD. Quote is fully visible & stays in place comfortably!

        // 6s to 7s (600vh-700vh scroll): Shrinks and rotates EXACTLY while #features slides natively over!
        heroScrollTl.to("#hero-quote-wrapper", {
            scale: 0.85,
            rotation: 2, // Rotates matching the other slides linearly
            "--after-opacity": 0.8,
            duration: 1,
            ease: "none"
        }, 9);
    }

    function buildRevealAnimations() {
        const sections = gsap.utils.toArray("section");

        const stripeHeaders = document.querySelectorAll('section:not(.hero-section) h1, section:not(.hero-section) h2, section:not(.hero-section) h4, section:not(.hero-section) h5, section:not(.hero-section) .section-title, section:not(.hero-section) .purchase-title, section:not(.hero-section) .quote-text, section:not(.hero-section) .section-eyebrow, .features-section h3');
        
        stripeHeaders.forEach(header => {
            if (header.closest('.hero-section') || header.closest('footer')) return;
            if (header.closest('.quote-section')) return;

            initStripeReveal(header, {
                onScroll: true,
                stagger: 0.1,
                delay: 0,
                blockColor: 'var(--clr-yellow)'
            });
        });

        const allRevealSections = gsap.utils.toArray("section, footer");
        allRevealSections.forEach(section => {
            const items = section.querySelectorAll(".reveal-item");
            if (items.length === 0) return;
            if (section.classList.contains('quote-section')) return;

            gsap.to(items, {
                scrollTrigger: {
                    trigger: section,
                    start: "top 85%",
                    toggleActions: "play none none reverse",
                },
                opacity: 1,
                y: 0,
                duration: 2,
                stagger: 0.1,
                ease: "power2.out",
                overwrite: "auto"
            });
        });
    }

    function buildFooterAnimation() {
        gsap.from(".footer-logo-letter", {
            scrollTrigger: {
                trigger: ".footer_logo-rapper",
                start: "top bottom",
                toggleActions: "play none none reverse",
            },
            xPercent: -100,
            scale: 0.9,
            opacity: 0,
            duration: 1.2,
            stagger: 0.3,
            ease: "power2.out"
        });
    }

    // UPDATED: Natural scroll until bottom is reached, then drop back cleanly
    function buildStackSectionsAnimation() {
        const stackSections = document.querySelectorAll(".stack-section:not(#hero-quote-wrapper)");
        const total = stackSections.length;
        if (total === 0) return;

        stackSections.forEach((section, index) => {
            if (index < total - 1) {
                const nextSection = stackSections[index + 1];

                // Pin the section when its absolute bottom hits the screen bottom
                ScrollTrigger.create({
                    trigger: section,
                    start: "bottom bottom", 
                    endTrigger: nextSection,
                    end: "top top",
                    pin: true,
                    pinSpacing: false,
                });

                // Animate scaling as the next section slides over
                ScrollTrigger.create({
                    trigger: nextSection,
                    start: "top bottom",
                    end: "top top",
                    scrub: true,
                    onUpdate: (self) => {
                        const progress = self.progress;
                        const scale = 1 - progress * 0.15; // smooth shrink
                        const afterOpacity = progress * 0.8; 
                        const rotation = (index % 2 === 0 ? 2 : -2) * progress;

                        gsap.set(section, {
                            scale: scale,
                            rotation: rotation,
                            "--after-opacity": afterOpacity,
                        });
                    }
                });
            }
        });
    }

    // =============================================
    //  STRIPE REVEAL ANIMATIONS 
    // =============================================
    function initStripeReveal(element, options = {}) {
        if (!element || element.classList.contains('initialized')) return null;

        const tagName = element.tagName;
        const classes = element.className;
        const originalHTML = element.innerHTML;
        const width = element.offsetWidth;

        const temp = document.createElement(tagName);
        temp.className = classes;
        temp.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: ${width}px;
            left: -9999px;
            pointer-events: none;
        `;
        
        const styles = window.getComputedStyle(element);
        temp.style.fontSize = styles.fontSize;
        temp.style.fontFamily = styles.fontFamily;
        temp.style.fontWeight = styles.fontWeight;
        temp.style.letterSpacing = styles.letterSpacing;
        temp.style.lineHeight = styles.lineHeight;
        temp.style.textTransform = styles.textTransform;
        
        temp.innerHTML = originalHTML;
        document.body.appendChild(temp);

        function wrapRecursive(node) {
            if (node.nodeType === 3) {
                const words = node.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();
                words.forEach(w => {
                    if (w.trim()) {
                        const s = document.createElement('span');
                        s.className = 'w-t-s';
                        s.textContent = w;
                        frag.appendChild(s);
                    } else if (w === ' ') {
                        frag.appendChild(document.createTextNode(' '));
                    }
                });
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === 1) {
                if (node.tagName === 'BR') {
                    const s = document.createElement('span');
                    s.className = 'br-t-s';
                    s.style.display = 'block';
                    node.parentNode.replaceChild(s, node);
                } else {
                    Array.from(node.childNodes).forEach(wrapRecursive);
                }
            }
        }
        wrapRecursive(temp);

        const spans = temp.querySelectorAll('.w-t-s, .br-t-s');
        const linesData =[];
        let currentLine =[];
        let lastTop = -1;

        spans.forEach(s => {
            const isBR = s.classList.contains('br-t-s');
            const top = s.offsetTop;
            
            if (isBR || (lastTop !== -1 && top > lastTop + 5)) {
                if (currentLine.length > 0) linesData.push(currentLine);
                currentLine =[];
                if (isBR) {
                    lastTop = -1;
                    return;
                }
            }
            if (!isBR) {
                currentLine.push(s);
                lastTop = top;
            }
        });
        if (currentLine.length > 0) linesData.push(currentLine);

        const resultLines = linesData.map(lineSpans => {
            let lineHTML = "";
            let inEm = false;
            lineSpans.forEach((span, i) => {
                const isItalic = !!span.closest('em');
                if (isItalic && !inEm) { lineHTML += "<em>"; inEm = true; }
                else if (!isItalic && inEm) { lineHTML += "</em>"; inEm = false; }
                lineHTML += span.textContent.trim() + (i < lineSpans.length - 1 ? " " : "");
            });
            if (inEm) lineHTML += "</em>";
            return lineHTML;
        });

        document.body.removeChild(temp);

        const container = document.createElement(tagName);
        container.className = classes.replace('reveal-item', '').trim() + " reveal-text initialized";
        
        Array.from(element.attributes).forEach(attr => {
            if (attr.name !== 'class') container.setAttribute(attr.name, attr.value);
        });
        
        const blocks = [];
        const contents =[];

        resultLines.forEach(lineHTML => {
            const mask = document.createElement("div");
            mask.className = "line-mask";
            const content = document.createElement("span");
            content.className = "line-wrapper";
            content.innerHTML = lineHTML;
            const block = document.createElement("div");
            block.className = "reveal-block";
            block.style.backgroundColor = options.blockColor || "var(--clr-yellow)";
            
            mask.appendChild(content);
            mask.appendChild(block);
            container.appendChild(mask);
            blocks.push(block);
            contents.push(content);
        });

        element.parentNode.replaceChild(container, element);

        if (options.onScroll) {
            const mainTl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: options.start || "top 85%",
                    toggleActions: "play none none reverse",
                }
            });

            blocks.forEach((block, i) => {
                const content = contents[i];
                const delay = (i * (options.stagger || 0.1)) + (options.delay || 0);

                mainTl.to(block, {
                    scaleX: 1,
                    duration: 0.5,
                    ease: "expo.inOut",
                    transformOrigin: "left"
                }, delay)
                .set(content, { opacity: 1 }, delay + 0.5)
                .to(block, {
                    scaleX: 0,
                    duration: 0.5,
                    ease: "expo.inOut",
                    transformOrigin: "right"
                }, delay + 0.5);
            });
        }

        return { blocks, contents };
    }

    // =============================================
    //  ENTRANCE ANIMATION
    // =============================================
    function buildHeroEntrance() {
        const tl = gsap.timeline({
            defaults: {
                ease: "power4.out"
            }
        });

        gsap.set([".hero-badge", ".hero-descriptor", ".hero-stats", ".hero-actions", ".hero-info-card"], {
            opacity: 0,
            y: 50
        });
        gsap.set(".word", { y: "110%" });

        tl.to(".word", {
            y: "0%",
            duration: 2.2,
            stagger: 0.05,
            ease: "expo.out"
        }, 0.2)
        .to([".hero-badge", ".hero-info-card", ".hero-descriptor", ".hero-stats", ".hero-actions"], {
            opacity: 1,
            y: 0,
            duration: 2.5,
            stagger: 0.1,
            ease: "power3.out"
        }, 0.4);

        return tl;
    }

    // =============================================
    //  PRELOADING
    // =============================================
    let virtualProgress = 0;
    function startVirtualPreloader() {
        const duration = 1500; 
        const startTime = Date.now();

        const update = () => {
            const elapsed = Date.now() - startTime;
            let progress = Math.min(elapsed / duration, 1);

            if (progress > 0.48 && progress < 0.52) {
                progress = 0.48 + (progress - 0.48) * 0.1;
            } else if (progress > 0.72 && progress < 0.76) {
                progress = 0.72 + (progress - 0.72) * 0.1;
            }

            const displayPct = Math.round(progress * 100);
            loaderPct.innerText = `${displayPct}%`;
            loaderBar.style.width = `${displayPct}%`;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                finishLoading();
            }
        };

        requestAnimationFrame(update);
    }

    function finishLoading() {
        gsap.set(".transitionContainer", { zIndex: 10000 });
        gsap.set(".block", { visibility: "visible", scaleY: 0 });

        animateTransition().then(() => {
            preloader.style.visibility = 'hidden';
            preloader.style.opacity = 0;

            window.scrollTo(0, 0);
            ScrollTrigger.refresh();

            const audio = document.getElementById('ambient-audio');
            const audioBtn = document.getElementById('audio-toggle');

            audio.volume = 0.15;
            audio.muted = false; 
            audio.loop = true;

            const updateButtonState = () => {
                if (audio.paused) {
                    audioBtn.classList.add('is-muted');
                } else {
                    audioBtn.classList.remove('is-muted');
                }
            };

            const toggleAudio = () => {
                if (audio.paused) {
                    audio.play().catch(e => console.error("Playback failed:", e));
                } else {
                    audio.pause();
                }
                updateButtonState();
            };

            const playAttempt = () => {
                if (!audio.paused) {
                    updateButtonState();
                    return;
                }

                audio.play().then(() => {
                    updateButtonState();['click', 'keydown', 'touchstart', 'wheel', 'mousedown', 'mousemove', 'pointerdown', 'mouseenter'].forEach(evt => {
                        window.removeEventListener(evt, playAttempt);
                    });
                }).catch(err => {
                    updateButtonState();
                });
            };

            audioBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleAudio();
            });

            audio.onplay = updateButtonState;
            audio.onpause = updateButtonState;

            playAttempt();['click', 'keydown', 'touchstart', 'wheel', 'mousedown', 'mousemove', 'pointerdown', 'mouseenter'].forEach(evt => {
                window.addEventListener(evt, playAttempt, { once: true });
            });

            window.addEventListener('pageshow', playAttempt);
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') playAttempt();
            });

            buildScrollAnimation();
            buildRevealAnimations();
            buildStackSectionsAnimation();
            buildFooterAnimation();
            buildInfiniteScroll();

            setTimeout(() => {
                revealTransition().then(() => {
                    gsap.set(".block", { visibility: "hidden" });
                    lenis.start(); 
                });
                
                buildHeroEntrance();
            }, 25);
        });
    }

    function updateProgress(current, total) {
        // Start virtual preloader only after a safe buffer to prevent initial canvas stutter on mobile
        if (current === Math.min(45, total)) {
            startVirtualPreloader();
        }
    }

    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();

        const onLoaded = () => {
            if (img.dataset.loaded) return;
            img.dataset.loaded = "true";
            loadedImages++;
            updateProgress(loadedImages, frameCount);
        };

        img.onload = onLoaded;
        img.onerror = () => {
            console.warn(`Frame missing: ${img.src}`);
            onLoaded();
        };

        img.src = currentFrame(i);
        images.push(img);

        if (img.complete) {
            onLoaded();
        }
    }

    // =============================================
    //  TRANSITION ANIMATIONS (BLOCKS)
    // =============================================
    function revealTransition() {
        return new Promise((resolve) => {
            gsap.to(".block", {
                scaleY: 0,
                duration: 1.2, 
                stagger: {
                    each: 0.1, 
                    from: "start",
                    grid:[2, 5],
                    axis: "x"
                },
                ease: "power4.inOut",
                onComplete: resolve
            });
        });
    }

    function animateTransition() {
        return new Promise((resolve) => {
            gsap.set(".block", {
                visibility: "visible",
                scaleY: 0
            });

            gsap.to(".block", {
                scaleY: 1,
                duration: 1.2, 
                stagger: {
                    each: 0.1, 
                    from: "start",
                    grid: [2, 5],
                    axis: "x"
                },
                ease: "power4.inOut",
                onComplete: resolve
            });
        });
    }

    let resizeTimer;
    let windowWidth = window.innerWidth;

    window.addEventListener('resize', () => {
        // Only rebuild timeline if the device width actually changed (rotates)
        // Ignoring vertical resizes prevents massive lag on phones when scroll bars hide
        if (window.innerWidth !== windowWidth) {
            windowWidth = window.innerWidth;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                buildScrollAnimation(); 
                ScrollTrigger.refresh();
            }, 250);
        } else {
            resizeCanvas();
            renderFrame();
        }
    });

    // =============================================
    //  FULLSCREEN MENU ANIMATION SETUP
    // =============================================
    const leftTargets = document.querySelectorAll(".menu-col-left .footer-logo, .menu-col-left .brand-subtext");
    leftTargets.forEach(el => {
        const content = el.innerHTML;
        el.innerHTML = `<span style="display: block; overflow: hidden;"><span class="menu-line-down">${content}</span></span>`;
    });

    const rightTargets = document.querySelectorAll(".menu-col-right h5, .menu-col-right li a");
    rightTargets.forEach(el => {
        const content = el.innerHTML;
        el.innerHTML = `<span style="display: block; overflow: hidden;"><span class="menu-line">${content}</span></span>`;
    });

    const heroLines = document.querySelectorAll(".hero-hover-wrap");
    heroLines.forEach((wrap) => {
        const spans = Array.from(wrap.children);
        if(spans.length < 2) return; 
        
        spans.forEach((span, spanIndex) => {
            const text = span.textContent.trim();
            span.innerHTML = ""; 
            
            const splitChars =[];
            text.split("").forEach((c) => {
                const charSpan = document.createElement("span");
                charSpan.classList.add("char");
                charSpan.innerHTML = c === " " ? "&nbsp;" : c;
                span.appendChild(charSpan);
                splitChars.push(charSpan);
            });

            if (spanIndex === 1) {
                gsap.set(splitChars, { y: "110%" });
            }
        });

        const triggerArea = wrap.closest('.hero-title-line, .footer-logo'); 
        
        if (triggerArea) {
            triggerArea.addEventListener("mouseenter", () => {
                const visibleChars = spans[0].querySelectorAll(".char");
                const animatedChars = spans[1].querySelectorAll(".char");

                gsap.to(visibleChars, {
                    y: "-110%",
                    stagger: 0.05,
                    duration: 0.7,
                    ease: "expo.inOut",
                    overwrite: true
                });

                gsap.to(animatedChars, {
                    y: "0%",
                    stagger: 0.05,
                    duration: 0.7,
                    ease: "expo.inOut",
                    overwrite: true
                });
            });

            triggerArea.addEventListener("mouseleave", () => {
                const visibleChars = spans[0].querySelectorAll(".char");
                const animatedChars = spans[1].querySelectorAll(".char");

                gsap.to(animatedChars, {
                    y: "110%",
                    stagger: 0.02,
                    duration: 0.5,
                    ease: "expo.inOut",
                    overwrite: true
                });

                gsap.to(visibleChars, {
                    y: "0%",
                    stagger: 0.02,
                    duration: 0.5,
                    ease: "expo.inOut",
                    overwrite: true
                });
            });
        }
    });

    const menu = document.querySelector(".menu");
    const menuToggle = document.getElementById("menu-toggle");
    let isMenuOpen = false;
    const menuTl = gsap.timeline({ paused: true });

    menuTl.to(".menu-bg-left-inner", { rotate: 0, scale: 2, autoAlpha: 1, duration: 0.9, ease: "hop" }, 0)
          .to(".menu-bg-right-inner", { rotate: 0, scale: 2, autoAlpha: 1, duration: 0.9, ease: "hop" }, 0);

    menuTl.to(".bar-1", { y: 7.5, rotation: 45, transformOrigin: "50% 50%", duration: 0.6, ease: "hop" }, 0)
          .to(".bar-2", { opacity: 0, duration: 0.6, ease: "hop" }, 0)
          .to(".bar-3", { y: -7.5, rotation: -45, transformOrigin: "50% 50%", duration: 0.6, ease: "hop" }, 0);

    menuTl.to(".menu-line, .menu-line-down", {
        y: 0,
        duration: 0.9,
        stagger: 0.03,
        ease: "power4.out",
    }, 0.5);

    if (menuToggle && menu) {
        menuToggle.addEventListener("click", () => {
            if (!isMenuOpen) {
                menu.classList.add("active");
                menuTl.play();
                lenis.stop(); 
            } else {
                menuTl.reverse().then(() => {
                    menu.classList.remove("active");
                    lenis.start(); 
                });
            }
            isMenuOpen = !isMenuOpen;
        });
    }

    function buildInfiniteScroll() {
        let isTeleporting = false;
        
        lenis.on('scroll', (e) => {
            if (e.progress >= 0.995 && !isTeleporting) {
                isTeleporting = true;
                lenis.stop();
                gsap.to("#teleport-overlay", {
                    autoAlpha: 1, 
                    duration: 0.4,
                    ease: "power2.inOut",
                    onComplete: () => {
                        window.scrollTo(0, 0);
                        lenis.scrollTo(0, { immediate: true });
                        ScrollTrigger.refresh();
                        setTimeout(() => {
                            gsap.to("#teleport-overlay", {
                                autoAlpha: 0,
                                duration: 0.8,
                                ease: "power2.inOut",
                                onComplete: () => {
                                    lenis.start();
                                    setTimeout(() => { isTeleporting = false; }, 200);
                                }
                            });
                        }, 50);
                    }
                });
            }
        });

        gsap.to(".footer-connection-glow", {
            scrollTrigger: {
                trigger: ".footer-connection",
                start: "top bottom",
                end: "bottom bottom",
                scrub: true
            },
            y: -150,
            scale: 1.1,
            opacity: 0.9
        });
    }

});

console.group("%c MANŌ TECHNICAL MANIFESTO ", "color: #000; background: #ffd476; font-weight: bold;");
console.log("Status: Optimized for Cross-Device Support");
console.log("Engine: GSAP / Canvas");
console.log("Performance: Antigravity Level");
console.groupEnd();