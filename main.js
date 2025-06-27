/**
 * ArtisanAI - Professional AI Image Generator
 * Main JavaScript functionality
 */

class ArtisanAI {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.generationCount = 0;
    this.isGenerating = false;
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    // Main elements
    this.promptInput = document.getElementById("promptInput");
    this.generateBtn = document.getElementById("generateBtn");
    this.btnText = document.getElementById("btnText");
    this.galleryGrid = document.getElementById("galleryGrid");
    this.notification = document.getElementById("notification");

    // Range inputs and their value displays
    this.qualityRange = document.getElementById("qualityRange");
    this.qualityValue = document.getElementById("qualityValue");
    this.creativityRange = document.getElementById("creativityRange");
    this.creativityValue = document.getElementById("creativityValue");

    // Select inputs
    this.styleSelect = document.getElementById("styleSelect");
    this.aspectRatio = document.getElementById("aspectRatio");
    this.seedInput = document.getElementById("seedInput");
  }

  // Update prompt suggestion
  updatePromptSuggestion() {
    const selectedStyle = this.styleSelect.value;

    const suggestions = {
      realistic: "A hyper-realistic portrait of an old man with deep wrinkles.",
      "digital-art": "A cyberpunk city skyline at night, glowing neon lights.",
      "oil-painting": "A Renaissance-style oil painting of a noblewoman.",
      watercolor: "A soft watercolor of cherry blossoms in spring.",
      anime: "A fantasy anime warrior standing on a cliff at sunset.",
      "concept-art": "A spaceship interior with sci-fi elements, concept art.",
      abstract: "An abstract geometric composition with vibrant colors.",
      cyberpunk: "A futuristic street scene in Tokyo with cyberpunk elements.",
    };

    if (suggestions[selectedStyle]) {
      this.promptInput.value = suggestions[selectedStyle];
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Generate button click
    this.generateBtn.addEventListener("click", () => this.generateImage());

    // Keyboard shortcuts
    this.promptInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && e.ctrlKey && !this.isGenerating) {
        this.generateImage();
      }
    });

    // Range value updates
    this.qualityRange.addEventListener("input", (e) => {
      this.qualityValue.textContent = e.target.value;
    });

    this.creativityRange.addEventListener("input", (e) => {
      this.creativityValue.textContent = e.target.value;
    });

    // Style selection change
    this.styleSelect.addEventListener("change", () => {
      this.updatePromptSuggestion();
    });
  }

  // show notification function
  /**
   * Show notification to the user
   */
  showNotification(message, type = "success") {
    if (!this.notification) return;

    this.notification.textContent = message;
    this.notification.className = `notification ${type}`;

    // Show for 3 seconds
    this.notification.style.opacity = 1;
    setTimeout(() => {
      this.notification.style.opacity = 0;
    }, 3000);
  }

  /**
   * Main image generation function
   */
  async generateImage() {
    const prompt = this.promptInput.value.trim();

    if (!prompt) {
      this.showNotification(
        "Please enter a prompt to generate an image!",
        "error"
      );
      return;
    }

    if (this.isGenerating) return;

    this.setGenerating(true);

    try {
      const response = await fetch(
        "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer sk-6GUf8iNyvHAsRkppBKEmiQjcjhCm5ZjnqJZM47OZidFxaM0Z",
          },
          body: JSON.stringify({
            text_prompts: [{ text: prompt }],
            cfg_scale: parseInt(this.qualityRange.value),
            height: 512,
            width: 512,
            steps: 30,
            seed: this.seedInput.value
              ? parseInt(this.seedInput.value)
              : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.message || "API call failed");
      }

      const result = await response.json();
      const base64Image = result.artifacts[0].base64;

      // Create gallery item
      const generationData = this.collectGenerationData(prompt);
      const placeholderItem = this.createGalleryItem(generationData, true);
      this.galleryGrid.insertBefore(
        placeholderItem,
        this.galleryGrid.firstChild
      );

      // Replace placeholder with real image
      const imageUrl = `data:image/png;base64,${base64Image}`;
      this.completeGeneration(placeholderItem, imageUrl);

      this.generationCount++;
      this.showNotification("Image generated successfully! 🎨");

      this.promptInput.value = "";
    } catch (error) {
      this.showNotification("Generation failed. Please try again.", "error");
      console.error("Generation error:", error);
    } finally {
      this.setGenerating(false);
    }
  }

  /**
   * Collect all generation parameters
   */
  collectGenerationData(prompt) {
    return {
      prompt: prompt,
      style: this.styleSelect.value,
      aspectRatio: this.aspectRatio.value,
      quality: parseInt(this.qualityRange.value),
      creativity: parseInt(this.creativityRange.value),
      seed: this.seedInput.value || Math.floor(Math.random() * 1000000),
      status: "processing",
      timestamp: new Date().toLocaleString(),
    };
  }

  /**
   * Simulate realistic AI generation process
   */
  async simulateGeneration() {
    // Simulate realistic generation time based on quality
    const quality = parseInt(this.qualityRange.value);
    const baseTime = 2000; // 2 seconds minimum
    const qualityMultiplier = quality * 300; // Add time based on quality
    const randomVariation = Math.random() * 2000; // Random 0-2 seconds

    const generationTime = baseTime + qualityMultiplier + randomVariation;

    return new Promise((resolve) => {
      // Update button text during generation
      let dots = "";
      const interval = setInterval(() => {
        dots = dots.length >= 3 ? "" : dots + ".";
        this.btnText.textContent = `Creating Magic${dots}`;
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, generationTime);
    });
  }

  /**
   * Complete the generation process
   */
  completeGeneration(placeholderItem, imageUrl) {
    const img = placeholderItem.querySelector("img");
    img.src = imageUrl;
    img.classList.remove("loading-placeholder");

    placeholderItem.dataset.imageUrl = imageUrl;

    const statusIndicator = placeholderItem.querySelector(".status-indicator");
    const statusText = placeholderItem.querySelector(".gallery-item-meta span");

    if (statusIndicator && statusText) {
      statusIndicator.classList.remove("status-processing");
      statusIndicator.classList.add("status-completed");
      statusText.innerHTML =
        '<span class="status-indicator status-completed"></span>Completed';
    }
  }

  /**
   * Set generating state
   */
  setGenerating(isGenerating) {
    this.isGenerating = isGenerating;

    if (isGenerating) {
      this.generateBtn.classList.add("loading");
      this.btnText.textContent = "Creating Magic...";
      this.generateBtn.disabled = true;
    } else {
      this.generateBtn.classList.remove("loading");
      this.btnText.textContent = "Generate Masterpiece";
      this.generateBtn.disabled = false;
    }
  }

  /**
   * Create gallery item element
   */
  createGalleryItem(data, isPlaceholder = false) {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.src = isPlaceholder ? "" : data.imageUrl;
    img.alt = data.prompt;
    if (isPlaceholder) img.classList.add("loading-placeholder");

    item.appendChild(img);

    item.dataset.prompt = data.prompt;

    item.addEventListener("click", () => {
      this.showFullImage(item.dataset.imageUrl, {
        prompt: item.dataset.prompt,
      });
    });

    return item;
  }

  /**
   * Get display name for style
   */
  getStyleDisplayName(style) {
    const styleMap = {
      realistic: "Photorealistic",
      "digital-art": "Digital Art",
      "oil-painting": "Oil Painting",
      watercolor: "Watercolor",
      anime: "Anime/Manga",
      "concept-art": "Concept Art",
      abstract: "Abstract",
      cyberpunk: "Cyberpunk",
    };
    return styleMap[style] || style;
  }

  /**
   * Show full-size image (placeholder for modal functionality)
   */
  showFullImage(imageUrl, data) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const modalPrompt = document.getElementById("modalPrompt");

    modalImg.src = imageUrl;
    modalPrompt.textContent = data.prompt;
    modal.style.display = "flex";

    const closeBtn = document.getElementById("modalClose");
    closeBtn.onclick = () => {
      modal.style.display = "none";
      modalImg.src = "";
      modalPrompt.textContent = "";
    };

    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
        modalImg.src = "";
        modalPrompt.textContent = "";
      }
    };
  }
}

// Instantiate the ArtisanAI app when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  new ArtisanAI();
});
