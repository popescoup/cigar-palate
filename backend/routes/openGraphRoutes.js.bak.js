// routes/openGraphRoutes.js


// Renamed because not in use - feel free to revert to normal naming if put into use.
// Multer configuration changed after creation of this - may affect functionality


const express = require('express');
const router = express.Router();
const { createCanvas, loadImage } = require('canvas');
const { Cigar, Brand } = require('../models');
const path = require('path');

router.get('/cigars/:id/og-image', async (req, res) => {
    try {
        console.log('OpenGraph request received for cigar:', req.params.id);
        
        const cigar = await Cigar.findOne({
            where: { id: req.params.id },
            include: [{ model: Brand, as: 'brand' }]
        });

        if (!cigar) {
            return res.status(404).send('Cigar not found');
        }

        const canvas = createCanvas(1200, 630);
        const ctx = canvas.getContext('2d');

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1200, 630);

        // Load and draw cigar image
        if (cigar.image_path) {
            try {
                const imagePath = path.join(process.cwd(), cigar.image_path);
                const image = await loadImage(imagePath);
                
                // Calculate dimensions to center the image
                const aspectRatio = image.width / image.height;
                let drawWidth = 1200;
                let drawHeight = drawWidth / aspectRatio;
                
                if (drawHeight > 630) {
                    drawHeight = 630;
                    drawWidth = drawHeight * aspectRatio;
                }

                // Center the image
                const xOffset = (1200 - drawWidth) / 2;
                const yOffset = (630 - drawHeight) / 2;
                
                ctx.drawImage(image, xOffset, yOffset, drawWidth, drawHeight);

                // Add rating badge (larger size)
                if (cigar.averageRating > 0) {
                    const rating = Math.round(cigar.averageRating);
                    // Draw white background with transparency
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    drawRoundedRect(ctx, xOffset + drawWidth - 180, yOffset + 30, 140, 60, 8);
                    ctx.fill();
                    
                    // Draw rating text
                    ctx.fillStyle = getRatingColor(rating);
                    ctx.font = 'bold 36px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(rating.toString(), xOffset + drawWidth - 140, yOffset + 70);
                    
                    // Add "/100" in smaller font
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText('/ 100', xOffset + drawWidth - 80, yOffset + 70);
                }

                // Add price range badge with dynamic width
                if (cigar.price_range) {
                    // Set font first to measure text
                    ctx.font = 'bold 32px Arial';
                    const textWidth = ctx.measureText(cigar.price_range).width;
                    const padding = 40; // Padding on each side of the text
                    const boxWidth = textWidth + (padding * 2); // Total width of the box
                    
                    // Draw white background with transparency
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    drawRoundedRect(ctx, xOffset + 30, yOffset + 30, boxWidth, 60, 8);
                    ctx.fill();
                    
                    // Draw price range text
                    ctx.fillStyle = '#047857'; // emerald-600
                    ctx.textAlign = 'center';
                    ctx.fillText(cigar.price_range, xOffset + 30 + (boxWidth / 2), yOffset + 70);
                }
            } catch (imageError) {
                console.error('Error loading cigar image:', imageError);
            }
        }

        console.log('Image generation complete, sending response...');
        
        // Set headers and send response
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        canvas.createPNGStream().pipe(res);
        
    } catch (error) {
        console.error('Error in OpenGraph generation:', error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message || 'Something went wrong',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Helper functions remain the same
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function getRatingColor(rating) {
    if (rating >= 80) return '#16A34A'; // text-green-600
    if (rating >= 60) return '#CA8A04'; // text-yellow-600
    return '#DC2626'; // text-red-600
}

module.exports = router;