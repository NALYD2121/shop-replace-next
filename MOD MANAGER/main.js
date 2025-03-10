// Initialisation au chargement du document
document.addEventListener('DOMContentLoaded', () => {
    initializeThemeToggle();
    initializeFormHandling();
    initializeUploadHandling();
});

// Gestion du thème
function initializeThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const htmlElement = document.documentElement;
    const currentTheme = localStorage.getItem('theme') || 'dark';

    htmlElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

// Mise à jour de l'icône du thème
function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    icon.className = `fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`;
}

// Gestion du formulaire
function initializeFormHandling() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const categoryInput = document.getElementById('category');
    const typeSelect = document.getElementById('type');
    const typeGroup = document.querySelector('.type-group');
    const publishForm = document.getElementById('publishForm');

    // Gestion des boutons de catégorie
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const category = button.dataset.category;
            categoryInput.value = category;
            
            updateTypeOptions(category);
            typeGroup.style.display = 'block';
        });
    });

    publishForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmission(e.target);
    });
}

// Mise à jour des options de type
function updateTypeOptions(category) {
    const typeSelect = document.getElementById('type');
    typeSelect.innerHTML = '<option value="">Sélectionnez un type</option>';

    if (category && window.CONFIG.CATEGORIES[category]) {
        const types = Object.entries(window.CONFIG.CATEGORIES[category].types);
        types.forEach(([type, channelId]) => {
            const option = document.createElement('option');
            option.value = type;
            option.dataset.channelId = channelId;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    }
}

// Gestion des uploads
function initializeUploadHandling() {
    const fileUploadZone = document.getElementById('fileUpload');
    const urlUploadZone = document.getElementById('urlUpload');
    const uploadOptions = document.querySelectorAll('.upload-option');
    const mediaInput = document.getElementById('media');
    const mediaPreview = document.querySelector('.media-preview');
    const mediaUrlInput = document.getElementById('mediaUrl');
    const addUrlBtn = document.querySelector('.image-upload-btn');

    uploadOptions.forEach(option => {
        option.addEventListener('click', () => {
            const mode = option.dataset.mode;
            uploadOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            fileUploadZone.style.display = mode === 'file' ? 'flex' : 'none';
            urlUploadZone.style.display = mode === 'url' ? 'block' : 'none';
        });
    });

    fileUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadZone.classList.add('dragover');
    });

    fileUploadZone.addEventListener('dragleave', () => {
        fileUploadZone.classList.remove('dragover');
    });

    fileUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadZone.classList.remove('dragover');
        handleFileUpload(e.dataTransfer.files);
    });

    mediaInput.addEventListener('change', (e) => {
        handleFileUpload(e.target.files);
    });

    // Gestion de l'ajout d'URL Discord
    addUrlBtn.addEventListener('click', () => {
        const url = mediaUrlInput.value.trim();
        if (url && url.match(/^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net)\/.+/)) {
            addPreviewImage(url);
            mediaUrlInput.value = '';
        } else {
            alert('Veuillez entrer une URL Discord valide (cdn.discordapp.com ou media.discordapp.net)');
        }
    });

    mediaUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.querySelector('.image-upload-btn').click();
        }
    });
}

// Fonction pour redimensionner l'image
async function resizeImage(imgSrc) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Définir la taille maximale souhaitée
            const maxWidth = 800;
            const maxHeight = 600;
            
            let width = img.width;
            let height = img.height;
            
            // Calculer les nouvelles dimensions
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = imgSrc;
    });
}

// Mise à jour de la fonction handleFileUpload
async function handleFileUpload(files) {
    const maxFiles = 5;
    const existingPreviews = document.querySelectorAll('.preview-item').length;
    const remainingSlots = maxFiles - existingPreviews;
    
    if (remainingSlots <= 0) {
        alert('Vous ne pouvez pas ajouter plus de 5 images');
        return;
    }

    for (const file of Array.from(files).slice(0, remainingSlots)) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const resizedImage = await resizeImage(e.target.result);
                addPreviewImage(resizedImage);
            };
            reader.readAsDataURL(file);
        }
    }
}

// Ajout d'une image à la prévisualisation
function addPreviewImage(src) {
    const mediaPreview = document.querySelector('.media-preview');
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    previewItem.innerHTML = `
        <img src="${src}" alt="Aperçu">
        <button type="button" class="delete-preview">
            <i class="fas fa-times"></i>
        </button>
    `;

    previewItem.querySelector('.delete-preview').addEventListener('click', () => {
        previewItem.remove();
    });

    mediaPreview.appendChild(previewItem);
}

// Mise à jour de la fonction handleFormSubmission
async function handleFormSubmission(form) {
    try {
        const formData = new FormData(form);
        const previews = document.querySelectorAll('.preview-item img');
        
        if (previews.length === 0) {
            alert('Veuillez ajouter au moins une image');
            return;
        }

        const category = formData.get('category');
        const typeSelect = document.getElementById('type');
        const selectedOption = typeSelect.options[typeSelect.selectedIndex];
        
        if (!selectedOption) {
            alert('Veuillez sélectionner un type');
            return;
        }

        const discordChannelId = selectedOption.dataset.channelId;
        if (!discordChannelId) {
            throw new Error('ID du canal Discord non trouvé');
        }

        // Récupération des valeurs du formulaire
        const name = formData.get('name');
        const type = selectedOption.value;
        const description = formData.get('description');
        const mediaFireLink = formData.get('mediaFireLink');

        // Récupération des URLs des images
        const imageUrls = Array.from(previews).map(img => img.src);

        // Création du FormData avec toutes les données
        const data = new FormData();
        data.append('name', name);
        data.append('category', category);
        data.append('type', type);
        data.append('description', description);
        data.append('mediaFireLink', mediaFireLink);
        data.append('discordChannelId', discordChannelId);
        data.append('images', JSON.stringify(imageUrls));

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PUBLICATION EN COURS...';

        const response = await fetch('https://cb4dfe0d-220b-4edd-a87c-0d30661b7aaf-00-23bw0eqpwil9w.picard.replit.dev/api/publish', {
            method: 'POST',
            body: data
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la publication');
        }

        alert('Mod publié avec succès !');
        window.location.reload();

    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la publication');
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> PUBLIER SUR DISCORD';
    }
} 