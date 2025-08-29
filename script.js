class SpaceDefenders {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        
        // Game variables
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.keys = {};
        this.lastShot = 0;
        this.shootCooldown = 200;
        
        // Game objects
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerUps = [];
        
        // Animation
        this.animationId = null;
        this.lastTime = 0;
        
        // Stars background
        this.stars = [];
        this.initStars();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createPlayer();
        this.createEnemies();
        this.gameLoop();
    }
    
    initStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 1,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.shoot();
                }
            }
            
            if (e.code === 'KeyP' && this.gameState === 'playing') {
                this.pauseGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Button events
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('pauseMenuBtn').addEventListener('click', () => this.showMenu());
    }
    
    createPlayer() {
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 80,
            width: 50,
            height: 40,
            speed: 5,
            color: '#00ffff'
        };
    }
    
    createEnemies() {
        this.enemies = [];
        const rows = 4 + Math.floor(this.level / 3);
        const cols = 8 + Math.floor(this.level / 2);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.enemies.push({
                    x: col * 70 + 50,
                    y: row * 50 + 50,
                    width: 40,
                    height: 30,
                    speed: 1 + this.level * 0.2,
                    direction: 1,
                    color: this.getEnemyColor(row),
                    points: (4 - row) * 10,
                    lastShot: 0,
                    shootChance: 0.001 + this.level * 0.0005
                });
            }
        }
    }
    
    getEnemyColor(row) {
        const colors = ['#ff4444', '#ff8844', '#ffff44', '#44ff44'];
        return colors[row % colors.length];
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideAllOverlays();
        this.resetGame();
    }
    
    restartGame() {
        this.resetGame();
        this.gameState = 'playing';
        this.hideAllOverlays();
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerUps = [];
        this.createPlayer();
        this.createEnemies();
        this.updateHUD();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseOverlay').classList.remove('hidden');
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseOverlay').classList.add('hidden');
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.hideAllOverlays();
        document.getElementById('menuOverlay').classList.remove('hidden');
    }
    
    hideAllOverlays() {
        document.getElementById('menuOverlay').classList.add('hidden');
        document.getElementById('gameOverOverlay').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateEnemyBullets();
        this.updateParticles();
        this.updatePowerUps();
        this.updateStars();
        this.checkCollisions();
        this.checkLevelComplete();
    }
    
    updatePlayer() {
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });
    }
    
    updateEnemies() {
        let moveDown = false;
        
        for (let enemy of this.enemies) {
            enemy.x += enemy.speed * enemy.direction;
            
            if (enemy.x <= 0 || enemy.x >= this.canvas.width - enemy.width) {
                moveDown = true;
            }
            
            // Enemy shooting
            if (Math.random() < enemy.shootChance) {
                this.enemyShoot(enemy);
            }
        }
        
        if (moveDown) {
            for (let enemy of this.enemies) {
                enemy.direction *= -1;
                enemy.y += 30;
            }
        }
    }
    
    updateEnemyBullets() {
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.speed;
            return bullet.y < this.canvas.height;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.opacity = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }
    
    updatePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.y += powerUp.speed;
            powerUp.rotation += 0.1;
            return powerUp.y < this.canvas.height;
        });
    }
    
    updateStars() {
        for (let star of this.stars) {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        }
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.shootCooldown) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: 8,
                color: '#ffff00'
            });
            this.lastShot = now;
            this.playSound('shoot');
        }
    }
    
    enemyShoot(enemy) {
        this.enemyBullets.push({
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 10,
            speed: 3,
            color: '#ff4444'
        });
    }
    
    checkCollisions() {
        // Bullets vs Enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.isColliding(this.bullets[i], this.enemies[j])) {
                    this.createExplosion(this.enemies[j].x + this.enemies[j].width / 2, 
                                       this.enemies[j].y + this.enemies[j].height / 2);
                    this.score += this.enemies[j].points;
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    this.updateHUD();
                    this.playSound('explosion');
                    
                    // Chance for power-up
                    if (Math.random() < 0.1) {
                        this.createPowerUp(this.enemies[j]?.x || 0, this.enemies[j]?.y || 0);
                    }
                    break;
                }
            }
        }
        
        // Enemy bullets vs Player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            if (this.isColliding(this.enemyBullets[i], this.player)) {
                this.enemyBullets.splice(i, 1);
                this.lives--;
                this.createExplosion(this.player.x + this.player.width / 2, 
                                   this.player.y + this.player.height / 2);
                this.updateHUD();
                this.playSound('hit');
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // Power-ups vs Player
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            if (this.isColliding(this.powerUps[i], this.player)) {
                this.applyPowerUp(this.powerUps[i]);
                this.powerUps.splice(i, 1);
                this.playSound('powerup');
            }
        }
        
        // Enemies vs Player (collision)
        for (let enemy of this.enemies) {
            if (enemy.y + enemy.height >= this.player.y) {
                this.gameOver();
                break;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                maxLife: 30,
                color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`,
                size: Math.random() * 4 + 2,
                opacity: 1
            });
        }
    }
    
    createPowerUp(x, y) {
        const types = ['speed', 'multishot', 'shield'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.powerUps.push({
            x: x,
            y: y,
            width: 20,
            height: 20,
            speed: 2,
            type: type,
            rotation: 0,
            color: type === 'speed' ? '#00ff00' : type === 'multishot' ? '#ffff00' : '#ff00ff'
        });
    }
    
    applyPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'speed':
                this.player.speed = Math.min(this.player.speed + 1, 10);
                break;
            case 'multishot':
                this.shootCooldown = Math.max(this.shootCooldown - 50, 50);
                break;
            case 'shield':
                this.lives = Math.min(this.lives + 1, 5);
                this.updateHUD();
                break;
        }
    }
    
    checkLevelComplete() {
        if (this.enemies.length === 0) {
            this.level++;
            this.createEnemies();
            this.updateHUD();
            this.playSound('levelup');
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverOverlay').classList.remove('hidden');
        this.playSound('gameover');
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        const livesContainer = document.getElementById('lives');
        livesContainer.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart';
            heart.textContent = '❤️';
            livesContainer.appendChild(heart);
        }
    }
    
    playSound(type) {
        // Create audio context for sound effects
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch (type) {
                case 'shoot':
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
                    break;
                case 'explosion':
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
                    break;
                case 'hit':
                    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                    break;
                case 'powerup':
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
                    break;
                case 'levelup':
                    oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
                    break;
                case 'gameover':
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 1);
                    break;
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Fallback if audio context fails
            console.log('Sound effect:', type);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 4, 40, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.drawStars();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.drawPlayer();
            this.drawBullets();
            this.drawEnemies();
            this.drawEnemyBullets();
            this.drawParticles();
            this.drawPowerUps();
        }
    }
    
    drawStars() {
        for (let star of this.stars) {
            this.ctx.save();
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.fillStyle = this.player.color;
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 20;
        
        // Draw player ship
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width / 4, this.player.y + this.player.height * 0.8);
        this.ctx.lineTo(this.player.x + this.player.width * 0.75, this.player.y + this.player.height * 0.8);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawBullets() {
        for (let bullet of this.bullets) {
            this.ctx.save();
            this.ctx.fillStyle = bullet.color;
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            this.ctx.restore();
        }
    }
    
    drawEnemies() {
        for (let enemy of this.enemies) {
            this.ctx.save();
            this.ctx.fillStyle = enemy.color;
            this.ctx.shadowColor = enemy.color;
            this.ctx.shadowBlur = 15;
            
            // Draw enemy
            this.ctx.beginPath();
            this.ctx.roundRect(enemy.x, enemy.y, enemy.width, enemy.height, 5);
            this.ctx.fill();
            
            // Draw eyes
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(enemy.x + 10, enemy.y + 10, 3, 0, Math.PI * 2);
            this.ctx.arc(enemy.x + 30, enemy.y + 10, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    drawEnemyBullets() {
        for (let bullet of this.enemyBullets) {
            this.ctx.save();
            this.ctx.fillStyle = bullet.color;
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 8;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            this.ctx.restore();
        }
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawPowerUps() {
        for (let powerUp of this.powerUps) {
            this.ctx.save();
            this.ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
            this.ctx.rotate(powerUp.rotation);
            this.ctx.fillStyle = powerUp.color;
            this.ctx.shadowColor = powerUp.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillRect(-powerUp.width / 2, -powerUp.height / 2, powerUp.width, powerUp.height);
            this.ctx.restore();
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new SpaceDefenders();
});