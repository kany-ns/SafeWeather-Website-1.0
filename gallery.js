class ProjectGallery {
    constructor() {
        this.projects = [];
        this.currentView = 'grid';
        this.filters = {
            category: 'all',
            date: 'all',
            school: 'all',
            search: ''
        };
        this.currentLightboxIndex = 0;
        this.lightboxImages = [];
        this.init();
    }

    init() {
        this.loadProjects();
        this.setupEventListeners();
        this.setupSearch();
        this.renderGallery();
    }

    loadProjects() {
        // Sample project data
        this.projects = [
            {
                id: 1,
                title: "Weather Station Installation",
                description: "Installation of automated weather monitoring stations at SK Batu Pahat for real-time data collection.",
                category: "weather",
                school: "skbp",
                date: "2026-12",
                images: 8,
                imageUrl: "https://images.unsplash.com/photo-1592210454359-9043f067919b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
            },
            {
                id: 2,
                title: "Flood Zone Identification",
                description: "Mapping of flood-prone areas around SMK Tunku Ismail to establish safe evacuation routes.",
                category: "hazard",
                school: "smkti",
                date: "2026-11",
                images: 12,
                imageUrl: "https://images.unsplash.com/photo-1560032779-0a8809186efd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
            },
            {
                id: 3,
                title: "Driver Safety Training",
                description: "Comprehensive weather safety training for school bus drivers across multiple schools.",
                category: "training",
                school: "all",
                date: "2026-10",
                images: 24,
                imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
            },
            {
                id: 4,
                title: "Emergency Response Drill",
                description: "Successful evacuation drill during simulated flood emergency at SK Batu Pahat.",
                category: "success",
                school: "skbp",
                date: "2026-09",
                images: 16,
                imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
            },
            {
                id: 5,
                title: "Safety Equipment Distribution",
                description: "Distribution of emergency weather kits and safety equipment to SMK Dato' Bentara.",
                category: "school",
                school: "smkdb",
                date: "2026-08",
                images: 10,
                imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
            },
            {
                id: 6,
                title: "Weather Data Workshop",
                description: "Workshop for teachers on interpreting weather data and making safety decisions.",
                category: "weather",
                school: "all",
                date: "2026-07",
                images: 18,
                imageUrl: "https://images.unsplash.com/photo-1593069567131-53a0614dde1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
            },
            // Additional projects would be loaded dynamically
        ];

        this.lightboxImages = [...this.projects];
    }

    setupEventListeners() {
        // Filter change events
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.renderGallery();
        });

        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.renderGallery();
        });

        document.getElementById('schoolFilter').addEventListener('change', (e) => {
            this.filters.school = e.target.value;
            this.renderGallery();
        });

        // Keyboard navigation for lightbox
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('lightboxModal').classList.contains('active')) {
                switch(e.key) {
                    case 'Escape':
                        this.closeLightbox();
                        break;
                    case 'ArrowLeft':
                        this.prevImage();
                        break;
                    case 'ArrowRight':
                        this.nextImage();
                        break;
                }
            }
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('gallerySearch');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value.toLowerCase();
                this.renderGallery();
            }, 300);
        });

        // Search button
        document.querySelector('.search-btn').addEventListener('click', () => {
            this.filters.search = searchInput.value.toLowerCase();
            this.renderGallery();
        });
    }

    renderGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        if (!galleryGrid) return;

        // Apply filters
        let filteredProjects = this.projects.filter(project => {
            // Category filter
            if (this.filters.category !== 'all' && project.category !== this.filters.category) {
                return false;
            }

            // Date filter
            if (this.filters.date !== 'all') {
                const projectDate = new Date(project.date + '-01');
                const now = new Date();
                let isValid = false;

                switch(this.filters.date) {
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        isValid = projectDate >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        isValid = projectDate >= monthAgo;
                        break;
                    case 'quarter':
                        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                        isValid = projectDate >= quarterAgo;
                        break;
                    case 'year':
                        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                        isValid = projectDate >= yearAgo;
                        break;
                }

                if (!isValid) return false;
            }

            // School filter
            if (this.filters.school !== 'all' && project.school !== this.filters.school) {
                return false;
            }

            // Search filter
            if (this.filters.search) {
                const searchText = this.filters.search.toLowerCase();
                const searchableText = [
                    project.title,
                    project.description,
                    this.getSchoolName(project.school),
                    this.getCategoryName(project.category)
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchText)) {
                    return false;
                }
            }

            return true;
        });

        // Update showing text
        const showingText = document.querySelector('.showing-text');
        if (showingText) {
            showingText.textContent = `Showing ${filteredProjects.length} of ${this.projects.length} projects`;
        }

        // Clear existing content
        galleryGrid.innerHTML = '';

        // Set grid class based on current view
        galleryGrid.className = `gallery-grid ${this.currentView}-view`;

        // Render filtered projects
        filteredProjects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            galleryGrid.appendChild(projectElement);
        });

        // Update lightbox images
        this.lightboxImages = filteredProjects;
    }

    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.dataset.category = project.category;
        div.dataset.school = project.school;
        div.dataset.date = project.date;

        const badgeClass = this.getBadgeClass(project.category);
        const badgeText = this.getCategoryName(project.category);
        const schoolName = this.getSchoolName(project.school);
        const dateText = this.formatDate(project.date);

        div.innerHTML = `
            <div class="item-image">
                <img src="${project.imageUrl}" alt="${project.title}" loading="lazy">
                <div class="image-overlay">
                    <button class="view-btn" onclick="gallery.openLightbox(${project.id})">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="download-btn" onclick="gallery.downloadImage(${project.id})">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
                <span class="item-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="item-content">
                <h3>${project.title}</h3>
                <p class="item-description">${project.description}</p>
                <div class="item-meta">
                    <span class="meta-item">
                        <i class="fas fa-calendar"></i> ${dateText}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-school"></i> ${schoolName}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-images"></i> ${project.images} photos
                    </span>
                </div>
                <div class="item-actions">
                    <button class="action-btn" onclick="gallery.viewProject(${project.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="action-btn" onclick="gallery.shareProject(${project.id})">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
        `;

        return div;
    }

    getBadgeClass(category) {
        const classes = {
            weather: 'weather',
            hazard: 'hazard',
            training: 'training',
            success: 'success',
            school: 'school'
        };
        return classes[category] || 'weather';
    }

    getCategoryName(category) {
        const names = {
            weather: 'Weather',
            hazard: 'Hazard Zone',
            training: 'Training',
            success: 'Success Story',
            school: 'School Project'
        };
        return names[category] || 'Project';
    }

    getSchoolName(schoolCode) {
        const schools = {
            skbp: 'SK Batu Pahat',
            smkti: 'SMK Tunku Ismail',
            smkdb: 'SMK Dato\' Bentara',
            all: 'Multiple Schools'
        };
        return schools[schoolCode] || 'Unknown School';
    }

    formatDate(dateString) {
        const [year, month] = dateString.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    changeView(viewType) {
        this.currentView = viewType;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.view-btn[data-view="${viewType}"]`).classList.add('active');
        
        this.renderGallery();
    }

    openLightbox(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        // Find index in filtered images
        this.currentLightboxIndex = this.lightboxImages.findIndex(p => p.id === projectId);
        if (this.currentLightboxIndex === -1) {
            this.currentLightboxIndex = 0;
        }

        this.updateLightboxContent();
        
        const lightbox = document.getElementById('lightboxModal');
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    updateLightboxContent() {
        const project = this.lightboxImages[this.currentLightboxIndex];
        if (!project) return;

        document.getElementById('lightboxImg').src = project.imageUrl;
        document.getElementById('lightboxImg').alt = project.title;
        document.getElementById('lightboxTitle').textContent = project.title;
        document.getElementById('lightboxDescription').textContent = project.description;
        document.getElementById('lightboxDate').textContent = this.formatDate(project.date);
        document.getElementById('lightboxSchool').textContent = this.getSchoolName(project.school);
        document.getElementById('lightboxCategory').textContent = this.getCategoryName(project.category);
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightboxModal');
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    prevImage() {
        if (this.currentLightboxIndex > 0) {
            this.currentLightboxIndex--;
        } else {
            this.currentLightboxIndex = this.lightboxImages.length - 1;
        }
        this.updateLightboxContent();
    }

    nextImage() {
        if (this.currentLightboxIndex < this.lightboxImages.length - 1) {
            this.currentLightboxIndex++;
        } else {
            this.currentLightboxIndex = 0;
        }
        this.updateLightboxContent();
    }

    async downloadImage(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        try {
            // In production, this would download the actual high-res image
            // For demo, we'll simulate download
            this.showNotification(`Downloading "${project.title}"...`, 'info');
            
            // Simulate download delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Create temporary link for download
            const link = document.createElement('a');
            link.href = project.imageUrl;
            link.download = `safeweather-project-${projectId}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification('Image downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('Download failed:', error);
            this.showNotification('Failed to download image', 'error');
        }
    }

    async downloadCurrentImage() {
        const project = this.lightboxImages[this.currentLightboxIndex];
        if (project) {
            await this.downloadImage(project.id);
        }
    }

    async downloadGallery() {
        if (confirm('Download all gallery images? This may take a while.')) {
            this.showNotification('Preparing gallery download...', 'info');
            
            // In production, this would create a zip file
            // For demo, we'll simulate the process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showNotification('Gallery download complete!', 'success');
        }
    }

    viewProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            // In a full implementation, this would open a detailed project page
            // For now, show in lightbox
            this.openLightbox(projectId);
        }
    }

    viewFullProject() {
        const project = this.lightboxImages[this.currentLightboxIndex];
        if (project) {
            // This would navigate to a detailed project page
            this.showNotification('Opening project details...', 'info');
        }
    }

    async shareProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        const shareData = {
            title: `SafeWeather Project: ${project.title}`,
            text: `${project.description}\n\nSchool: ${this.getSchoolName(project.school)}\nDate: ${this.formatDate(project.date)}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                this.showNotification('Project shared successfully!', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                }
            }
        } else {
            // Fallback: copy to clipboard
            const text = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
            await navigator.clipboard.writeText(text);
            this.showNotification('Project details copied to clipboard!', 'success');
        }
    }

    async shareCurrentImage() {
        const project = this.lightboxImages[this.currentLightboxIndex];
        if (project) {
            await this.shareProject(project.id);
        }
    }

    loadMoreProjects() {
        // Simulate loading more projects
        this.showNotification('Loading more projects...', 'info');
        
        // In production, this would fetch from API
        setTimeout(() => {
            // Add more sample projects
            const newProjects = [
                {
                    id: this.projects.length + 1,
                    title: "Weather App Training",
                    description: "Training session for teachers on using the SafeWeather mobile application.",
                    category: "training",
                    school: "all",
                    date: "2026-06",
                    images: 15,
                    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                },
                {
                    id: this.projects.length + 2,
                    title: "Road Safety Audit",
                    description: "Comprehensive safety audit of school bus routes in Batu Pahat district.",
                    category: "hazard",
                    school: "all",
                    date: "2026-05",
                    images: 20,
                    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                }
            ];

            this.projects.push(...newProjects);
            this.renderGallery();
            this.showNotification('More projects loaded!', 'success');
            
            // Update load more button
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (this.projects.length >= 48) { // Assuming 48 is the total
                loadMoreBtn.style.display = 'none';
            }
            
        }, 1500);
    }

    clearFilters() {
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('dateFilter').value = 'all';
        document.getElementById('schoolFilter').value = 'all';
        document.getElementById('gallerySearch').value = '';
        
        this.filters = {
            category: 'all',
            date: 'all',
            school: 'all',
            search: ''
        };
        
        this.renderGallery();
        this.showNotification('Filters cleared', 'info');
    }

    applyFilters() {
        this.filters.category = document.getElementById('categoryFilter').value;
        this.filters.date = document.getElementById('dateFilter').value;
        this.filters.school = document.getElementById('schoolFilter').value;
        this.renderGallery();
    }

    searchGallery() {
        const searchInput = document.getElementById('gallerySearch');
        this.filters.search = searchInput.value.toLowerCase();
        this.renderGallery();
    }

    showNotification(message, type) {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Global functions for HTML onclick handlers
function changeView(viewType) {
    gallery.changeView(viewType);
}

function openLightbox(projectId) {
    gallery.openLightbox(projectId);
}

function closeLightbox() {
    gallery.closeLightbox();
}

function prevImage() {
    gallery.prevImage();
}

function nextImage() {
    gallery.nextImage();
}

function downloadImage(projectId) {
    gallery.downloadImage(projectId);
}

function downloadCurrentImage() {
    gallery.downloadCurrentImage();
}

function downloadGallery() {
    gallery.downloadGallery();
}

function viewProject(projectId) {
    gallery.viewProject(projectId);
}

function viewFullProject() {
    gallery.viewFullProject();
}

function shareProject(projectId) {
    gallery.shareProject(projectId);
}

function shareCurrentImage() {
    gallery.shareCurrentImage();
}

function loadMoreProjects() {
    gallery.loadMoreProjects();
}

function clearFilters() {
    gallery.clearFilters();
}

function applyFilters() {
    gallery.applyFilters();
}

function searchGallery() {
    gallery.searchGallery();
}

// Initialize gallery
const gallery = new ProjectGallery();
window.gallery = gallery;